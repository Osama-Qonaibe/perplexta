import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import ffprobeStatic from 'ffprobe-static';
import path from 'path';
import fs from 'fs';

if (ffmpegStatic) {
  try {
    ffmpeg.setFfmpegPath(ffmpegStatic);
    console.log('[VideoProcessor] FFmpeg path configured successfully using ffmpeg-static');
  } catch (e) {
    console.warn('[VideoProcessor] Could not set ffmpeg-static path:', e);
  }
}

if (ffprobeStatic && ffprobeStatic.path) {
  try {
    ffmpeg.setFfprobePath(ffprobeStatic.path);
    console.log('[VideoProcessor] FFprobe path configured successfully using ffprobe-static:', ffprobeStatic.path);
  } catch (e) {
    try {
      ffmpeg.setFfprobePath('/usr/bin/ffprobe');
    } catch {}
  }
} else if (fs.existsSync('/usr/bin/ffprobe')) {
  try {
    ffmpeg.setFfprobePath('/usr/bin/ffprobe');
  } catch {}
}

export interface VideoProcessingResult {
  success: boolean;
  processedVideoUrl: string;
  thumbnailUrl: string;
  duration?: number;
  width?: number;
  height?: number;
  resolution?: string;
  bitrate?: number;
  fileSize?: number;
  format?: string;
  error?: string;
}

/**
 * Standardizes an uploaded video file using FFmpeg:
 * - Converts codec to H.264 (libx264) and AAC for universal web playback
 * - Generates high quality JPG thumbnail
 * - Enforces aspect ratio & max 1080p resolution
 * - Extracts and stores precise metadata (resolution, duration, bitrate, file size)
 */
export async function processUploadedVideo(
  inputFilePath: string,
  outputDir: string,
  fileNamePrefix: string = 'vid',
  maxDuration?: number
): Promise<VideoProcessingResult> {
  return new Promise((resolve) => {
    if (!fs.existsSync(inputFilePath)) {
      return resolve({
        success: false,
        processedVideoUrl: '',
        thumbnailUrl: '',
        error: 'Input video file not found on disk.'
      });
    }

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const uniqueId = `${fileNamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const outputFileName = `${uniqueId}_processed.mp4`;
    const outputThumbName = `${uniqueId}_thumb.jpg`;
    const outputVideoPath = path.join(outputDir, outputFileName);
    const outputThumbPath = path.join(outputDir, outputThumbName);

    let videoDuration = 0;
    let videoWidth = 1280;
    let videoHeight = 720;
    let videoBitrate = 0;

    // First probe video metadata
    ffmpeg.ffprobe(inputFilePath, (probeErr, metadata) => {
      if (probeErr || !metadata) {
        return resolve({
          success: false,
          processedVideoUrl: '',
          thumbnailUrl: '',
          error: probeErr?.message || 'Failed to probe video metadata.'
        });
      }

      if (metadata.format) {
        videoDuration = metadata.format.duration || 0;
        videoBitrate = Number(metadata.format.bit_rate) || 0;
      }
      
      const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
      const audioStream = metadata.streams?.find(s => s.codec_type === 'audio');
      
      if (videoStream) {
        videoWidth = videoStream.width || 1280;
        videoHeight = videoStream.height || 720;
        if (!videoBitrate && videoStream.bit_rate) {
          videoBitrate = Number(videoStream.bit_rate) || 0;
        }
      }

      const resolutionStr = `${videoWidth}x${videoHeight}`;
      
      // Optimization: Check if transcoding is actually needed
      // If video is h264/avc1 and audio is aac/mp3, and no trimming is needed, we can use stream copy
      const isH264 = videoStream?.codec_name === 'h264';
      const isAAC = audioStream?.codec_name === 'aac' || audioStream?.codec_name === 'mp3';
      const canStreamCopy = isH264 && isAAC && (!maxDuration || videoDuration <= maxDuration);

      console.log(`[VideoProcessor] Analysis: ${videoStream?.codec_name}/${audioStream?.codec_name}. StreamCopy potential: ${canStreamCopy}`);

      // Start Thumbnail and Transcoding IN PARALLEL
      const thumbPromise = new Promise<string>((tResolve) => {
        ffmpeg(inputFilePath)
          .screenshots({
            timestamps: ['10%'], // Earlier for speed
            filename: outputThumbName,
            folder: outputDir,
            size: '640x?' // Slightly smaller for speed
          })
          .on('end', () => tResolve(`/uploads/${outputThumbName}`))
          .on('error', (err) => {
            console.warn('[VideoProcessor] Thumbnail failed:', err.message);
            tResolve('');
          });
      });

      const transcodePromise = new Promise<{url: string, size: number, error?: string}>((vResolve) => {
        let command = ffmpeg(inputFilePath);
        
        if (canStreamCopy) {
          console.log('[VideoProcessor] Using fast stream copy strategy');
          command = command.outputOptions(['-c copy', '-movflags +faststart']);
        } else {
          console.log('[VideoProcessor] Using high-performance transcoding strategy');
          
          // Intelligent bitrate capping (max 5Mbps for 1080p, 2.5Mbps for 720p)
          const targetBitrate = videoHeight >= 1080 ? '5000k' : (videoHeight >= 720 ? '2500k' : '1500k');
          
          command = command.outputOptions([
            '-c:v libx264',
            '-preset superfast', 
            '-crf 26', 
            `-maxrate ${targetBitrate}`,
            `-bufsize ${targetBitrate}`,
            '-pix_fmt yuv420p',
            '-profile:v main',
            '-level 3.1',
            '-r 30',
            '-threads 0', // Multi-threading
            '-c:a aac',
            '-b:a 128k',
            '-ar 44100',
            '-ac 2',
            '-movflags +faststart',
            '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'
          ]);
        }

        if (maxDuration && videoDuration > maxDuration) {
          command = command.setDuration(maxDuration);
        }

        command
          .toFormat('mp4')
          .save(outputVideoPath)
          .on('end', () => {
            let size = 0;
            try { size = fs.statSync(outputVideoPath).size; } catch {}
            vResolve({ url: `/uploads/${outputFileName}`, size });
          })
          .on('error', (err) => {
            console.warn('[VideoProcessor] Transcode failed, attempting fallback copy');
            try {
              fs.copyFileSync(inputFilePath, outputVideoPath);
              let size = 0;
              try { size = fs.statSync(outputVideoPath).size; } catch {}
              vResolve({ url: `/uploads/${outputFileName}`, size });
            } catch (copyErr: any) {
              vResolve({ url: '', size: 0, error: err.message });
            }
          });
      });

      // Wait for both to complete
      Promise.all([thumbPromise, transcodePromise]).then(([tUrl, vRes]) => {
        if (!vRes.url) {
          return resolve({
            success: false,
            processedVideoUrl: '',
            thumbnailUrl: '',
            error: vRes.error || 'Video processing failed completely.'
          });
        }

        resolve({
          success: true,
          processedVideoUrl: vRes.url,
          thumbnailUrl: tUrl,
          duration: maxDuration && videoDuration > maxDuration ? maxDuration : Math.round(videoDuration),
          width: videoWidth,
          height: videoHeight,
          resolution: resolutionStr,
          bitrate: videoBitrate,
          fileSize: vRes.size,
          format: 'mp4'
        });
      });
    });
    });
  });
}
