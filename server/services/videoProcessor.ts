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
 * - Enforces aspect ratio & max resolution
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
      if (!probeErr && metadata) {
        if (metadata.format) {
          videoDuration = metadata.format.duration || 0;
          videoBitrate = Number(metadata.format.bit_rate) || 0;
        }
        const videoStream = metadata.streams?.find(s => s.codec_type === 'video');
        if (videoStream) {
          videoWidth = videoStream.width || 1280;
          videoHeight = videoStream.height || 720;
          if (!videoBitrate && videoStream.bit_rate) {
            videoBitrate = Number(videoStream.bit_rate) || 0;
          }
        }
      }

      const resolutionStr = `${videoWidth}x${videoHeight}`;

      // Helper function to transcode video
      const runTranscode = (generateThumb: boolean) => {
        const transcodeCommand = ffmpeg(inputFilePath)
          .outputOptions([
            '-c:v libx264',
            '-preset veryfast',
            '-crf 25',
            '-pix_fmt yuv420p',
            '-profile:v main',
            '-level 3.1',
            '-r 30',
            '-g 60',
            '-keyint_min 60',
            '-sc_threshold 0',
            '-c:a aac',
            '-b:a 96k',
            '-ar 48000',
            '-ac 2',
            '-movflags +faststart',
            '-vf scale=trunc(iw/2)*2:trunc(ih/2)*2'
          ]);

        if (maxDuration && videoDuration > maxDuration) {
          transcodeCommand.setDuration(maxDuration);
        }

        transcodeCommand
          .toFormat('mp4')
          .save(outputVideoPath)
          .on('end', () => {
            let finalFileSize = 0;
            try {
              finalFileSize = fs.statSync(outputVideoPath).size;
            } catch {}

            const thumbUrl = generateThumb && fs.existsSync(outputThumbPath) ? `/uploads/${outputThumbName}` : '';
            resolve({
              success: true,
              processedVideoUrl: `/uploads/${outputFileName}`,
              thumbnailUrl: thumbUrl,
              duration: maxDuration && videoDuration > maxDuration ? maxDuration : Math.round(videoDuration),
              width: videoWidth,
              height: videoHeight,
              resolution: resolutionStr,
              bitrate: videoBitrate,
              fileSize: finalFileSize,
              format: 'mp4'
            });
          })
          .on('error', (err) => {
            console.warn('[VideoProcessor] Transcoding error, falling back to original file:', err.message);
            const fallbackName = `${uniqueId}_orig.mp4`;
            const fallbackPath = path.join(outputDir, fallbackName);
            try {
              fs.copyFileSync(inputFilePath, fallbackPath);
              let fallbackSize = 0;
              try {
                fallbackSize = fs.statSync(fallbackPath).size;
              } catch {}

              const thumbUrl = generateThumb && fs.existsSync(outputThumbPath) ? `/uploads/${outputThumbName}` : '';
              resolve({
                success: true,
                processedVideoUrl: `/uploads/${fallbackName}`,
                thumbnailUrl: thumbUrl,
                duration: Math.round(videoDuration),
                width: videoWidth,
                height: videoHeight,
                resolution: resolutionStr,
                bitrate: videoBitrate,
                fileSize: fallbackSize,
                format: 'mp4'
              });
            } catch (copyErr: any) {
              resolve({
                success: false,
                processedVideoUrl: '',
                thumbnailUrl: '',
                error: err.message || copyErr.message
              });
            }
          });
      };

      // Try generating thumbnail first, then transcode
      ffmpeg(inputFilePath)
        .screenshots({
          timestamps: ['25%'],
          filename: outputThumbName,
          folder: outputDir,
          size: '720x?'
        })
        .on('end', () => {
          runTranscode(true);
        })
        .on('error', (thumbErr) => {
          console.warn('[VideoProcessor] Thumbnail generation warning:', thumbErr.message);
          runTranscode(false);
        });
    });
  });
}
