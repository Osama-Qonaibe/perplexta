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

export interface VideoProcessingDiagnosticAudit {
  probeTimeMs: number;
  processTimeMs: number;
  thumbTimeMs: number;
  totalTimeMs: number;
  processingPath: 'fast_stream_copy' | 'ultrafast_transcode' | 'fallback_copy';
  inputCodec: { video: string; audio: string; container: string };
  resolution: string;
  bitrateKbps: number;
}

export interface VideoProcessingResult {
  success: boolean;
  processedVideoUrl: string;
  thumbnailUrl: string;
  duration?: number;
  width?: number;
  height?: number;
  resolution?: string;
  aspectRatio?: string;
  isVertical?: boolean;
  bitrate?: number;
  fileSize?: number;
  format?: string;
  error?: string;
  diagnosticAudit?: VideoProcessingDiagnosticAudit;
}

/**
 * High-Performance Video Processing Pipeline:
 * - Supports ALL video formats (.mp4, .mov, .webm, .mkv, .avi, .wmv, .flv, .3gp, .ts, etc.)
 * - Supports ALL aspect ratios and orientations:
 *   * Vertical (9:16 Reels/Stories, 4:5 Portrait)
 *   * Horizontal (16:9 Landscape, 21:9 Ultrawide)
 *   * Square (1:1 Feed)
 * - Zero-Latency Fast Path:
 *   * If the input is already MP4 with H.264/AAC, performs instant stream copy with faststart (+0.3s)
 *   * Bypasses heavy re-encoding while ensuring instant progressive web streaming (moov atom at head)
 * - Optimized Fallback Transcode:
 *   * Converts incompatible codecs to universally supported H.264/AAC with ultrafast multithreading
 * - Parallel Thumbnail Generation:
 *   * Fast input seeking extracts high-res cover frame in parallel with video preparation
 */
export async function processUploadedVideo(
  inputFilePath: string,
  outputDir: string,
  fileNamePrefix: string = 'vid',
  maxDuration?: number
): Promise<VideoProcessingResult> {
  if (!fs.existsSync(inputFilePath)) {
    return {
      success: false,
      processedVideoUrl: '',
      thumbnailUrl: '',
      error: 'Input video file not found on disk.'
    };
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const startTime = Date.now();
  let probeStartTime = Date.now();
  let probeEndTime = Date.now();
  let processStartTime = Date.now();
  let processEndTime = Date.now();
  let thumbStartTime = Date.now();
  let thumbEndTime = Date.now();
  let chosenProcessingPath: 'fast_stream_copy' | 'ultrafast_transcode' | 'fallback_copy' = 'ultrafast_transcode';

  const uniqueId = `${fileNamePrefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const outputFileName = `${uniqueId}_processed.mp4`;
  const outputThumbName = `${uniqueId}_thumb.jpg`;
  const outputVideoPath = path.join(outputDir, outputFileName);
  const outputThumbPath = path.join(outputDir, outputThumbName);

  // 1. Probe video metadata
  probeStartTime = Date.now();
  const probeData = await new Promise<{
    duration: number;
    width: number;
    height: number;
    bitrate: number;
    vCodec: string;
    aCodec: string;
    containerFormat: string;
    isRotated: boolean;
  }>((resolveProbe) => {
    ffmpeg.ffprobe(inputFilePath, (probeErr, metadata) => {
      probeEndTime = Date.now();
      let duration = 0;
      let width = 1280;
      let height = 720;
      let bitrate = 0;
      let vCodec = '';
      let aCodec = '';
      let containerFormat = '';
      let isRotated = false;

      if (!probeErr && metadata) {
        if (metadata.format) {
          duration = metadata.format.duration || 0;
          bitrate = Number(metadata.format.bit_rate) || 0;
          containerFormat = (metadata.format.format_name || '').toLowerCase();
        }

        const videoStream = metadata.streams?.find((s) => s.codec_type === 'video');
        if (videoStream) {
          width = videoStream.width || 1280;
          height = videoStream.height || 720;
          vCodec = (videoStream.codec_name || '').toLowerCase();
          if (!bitrate && videoStream.bit_rate) {
            bitrate = Number(videoStream.bit_rate) || 0;
          }

          // Check rotation metadata (common in phone portrait videos)
          let rotation = 0;
          const sideData = (videoStream as any).side_data_list?.find((s: any) => s.rotation !== undefined);
          if (sideData && sideData.rotation) {
            rotation = Math.abs(parseInt(sideData.rotation, 10));
          } else if (videoStream.tags?.rotate) {
            rotation = Math.abs(parseInt(videoStream.tags.rotate, 10));
          }

          if (rotation === 90 || rotation === 270) {
            isRotated = true;
            // Visually dimensions are swapped
            const temp = width;
            width = height;
            height = temp;
          }
        }

        const audioStream = metadata.streams?.find((s) => s.codec_type === 'audio');
        if (audioStream) {
          aCodec = (audioStream.codec_name || '').toLowerCase();
        }
      }

      resolveProbe({
        duration,
        width,
        height,
        bitrate,
        vCodec,
        aCodec,
        containerFormat,
        isRotated
      });
    });
  });

  const {
    duration: videoDuration,
    width: videoWidth,
    height: videoHeight,
    bitrate: videoBitrate,
    vCodec,
    aCodec,
    containerFormat,
    isRotated
  } = probeData;

  // Determine exact aspect ratio category and orientation
  const ratioNum = videoHeight > 0 ? videoWidth / videoHeight : 1.777;
  let calculatedRatio = '16:9';
  if (ratioNum <= 0.68) {
    calculatedRatio = '9:16';
  } else if (ratioNum > 0.68 && ratioNum < 0.92) {
    calculatedRatio = '4:5';
  } else if (ratioNum >= 0.92 && ratioNum <= 1.15) {
    calculatedRatio = '1:1';
  } else if (ratioNum > 1.15 && ratioNum < 1.9) {
    calculatedRatio = '16:9';
  } else {
    calculatedRatio = '21:9';
  }
  const isVertical = ratioNum < 1.0;
  const resolutionStr = `${videoWidth}x${videoHeight}`;

  // Check if we can perform instant stream copy (Fast Path)
  // Input has H.264 video, AAC audio (or none), no rotation conflict, no duration trim needed,
  // and is in an MP4 / MOV / M4V container.
  const isH264 = vCodec === 'h264' || vCodec === 'avc1';
  const isAacOrSilent = !aCodec || aCodec === 'aac' || aCodec === 'mp4a-40-2';
  const isMp4CompatibleContainer = containerFormat.includes('mp4') || containerFormat.includes('mov') || containerFormat.includes('m4v');
  const needsDurationTrim = !!(maxDuration && videoDuration > maxDuration);
  const canFastCopy = isH264 && isAacOrSilent && isMp4CompatibleContainer && !needsDurationTrim && !isRotated;

  // 2. Parallel Thumbnail Generation Promise
  thumbStartTime = Date.now();
  const generateThumbnailPromise = new Promise<string>((resolveThumb) => {
    try {
      const seekTime = Math.min(1.0, videoDuration > 1 ? videoDuration * 0.15 : 0.1);
      ffmpeg(inputFilePath)
        .seekInput(seekTime)
        .frames(1)
        .output(outputThumbPath)
        .outputOptions([
          '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2',
          '-q:v', '2'
        ])
        .on('end', () => {
          thumbEndTime = Date.now();
          if (fs.existsSync(outputThumbPath)) {
            resolveThumb(`/uploads/${outputThumbName}`);
          } else {
            resolveThumb('');
          }
        })
        .on('error', (thumbErr) => {
          thumbEndTime = Date.now();
          console.warn('[VideoProcessor] Fast thumbnail generation error:', thumbErr.message);
          resolveThumb('');
        })
        .run();
    } catch {
      thumbEndTime = Date.now();
      resolveThumb('');
    }
  });

  // 3. Video Transcode or Fast Copy Promise
  processStartTime = Date.now();
  const processVideoPromise = new Promise<{
    success: boolean;
    outputUrl: string;
    fileSize: number;
    error?: string;
  }>((resolveVideo) => {
    if (canFastCopy) {
      chosenProcessingPath = 'fast_stream_copy';
      console.log(`[VideoProcessor] FAST PATH: Instant copy with faststart for ${inputFilePath}`);
      ffmpeg(inputFilePath)
        .outputOptions([
          '-c', 'copy',
          '-movflags', '+faststart'
        ])
        .save(outputVideoPath)
        .on('end', () => {
          processEndTime = Date.now();
          let sz = 0;
          try {
            sz = fs.statSync(outputVideoPath).size;
          } catch {}
          resolveVideo({
            success: true,
            outputUrl: `/uploads/${outputFileName}`,
            fileSize: sz
          });
        })
        .on('error', (copyErr) => {
          console.warn('[VideoProcessor] Fast copy failed, falling back to transcode:', copyErr.message);
          runFullTranscode();
        });
    } else {
      chosenProcessingPath = 'ultrafast_transcode';
      runFullTranscode();
    }

    function runFullTranscode() {
      console.log(`[VideoProcessor] TRANSCODE: Converting to universal H.264/AAC for ${inputFilePath}`);
      
      // Smart scaling: Cap excessive 4K resolutions to max 1080p for instant web playback
      const needsDownscale = videoWidth > 1920 || videoHeight > 1080;
      const vfFilter = needsDownscale
        ? 'scale=w=1920:h=1080:force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2'
        : 'scale=trunc(iw/2)*2:trunc(ih/2)*2';

      // Use ultrafast preset and threads 0 to maximize CPU parallelism and minimize user wait
      const cmd = ffmpeg(inputFilePath)
        .outputOptions([
          '-c:v', 'libx264',
          '-preset', 'ultrafast',
          '-tune', 'fastdecode',
          '-crf', '25',
          '-pix_fmt', 'yuv420p',
          '-threads', '0',
          '-c:a', 'aac',
          '-b:a', '128k',
          '-ar', '44100',
          '-ac', '2',
          '-movflags', '+faststart',
          '-vf', vfFilter
        ]);

      if (needsDurationTrim && maxDuration) {
        cmd.setDuration(maxDuration);
      }

      let isFinished = false;
      // 35-second safety timer to ensure video processing NEVER hangs the request
      const safetyTimer = setTimeout(() => {
        if (!isFinished) {
          isFinished = true;
          chosenProcessingPath = 'fallback_copy';
          console.warn('[VideoProcessor] Transcoding exceeded safety limit (35s), applying instant disk fallback');
          try {
            cmd.kill('SIGKILL');
          } catch (_) {}
          doFallbackDiskCopy();
        }
      }, 35000);

      const doFallbackDiskCopy = () => {
        clearTimeout(safetyTimer);
        processEndTime = Date.now();
        const originalExt = path.extname(inputFilePath).toLowerCase() || '.mp4';
        const fallbackName = `${uniqueId}_fallback${originalExt}`;
        const fallbackPath = path.join(outputDir, fallbackName);
        try {
          fs.copyFileSync(inputFilePath, fallbackPath);
          let fallbackSize = 0;
          try {
            fallbackSize = fs.statSync(fallbackPath).size;
          } catch {}
          resolveVideo({
            success: true,
            outputUrl: `/uploads/${fallbackName}`,
            fileSize: fallbackSize
          });
        } catch (copyErr: any) {
          resolveVideo({
            success: false,
            outputUrl: '',
            fileSize: 0,
            error: copyErr.message
          });
        }
      };

      cmd
        .toFormat('mp4')
        .save(outputVideoPath)
        .on('end', () => {
          if (isFinished) return;
          isFinished = true;
          clearTimeout(safetyTimer);
          processEndTime = Date.now();
          let sz = 0;
          try {
            sz = fs.statSync(outputVideoPath).size;
          } catch {}
          resolveVideo({
            success: true,
            outputUrl: `/uploads/${outputFileName}`,
            fileSize: sz
          });
        })
        .on('error', (err) => {
          if (isFinished) return;
          isFinished = true;
          clearTimeout(safetyTimer);
          chosenProcessingPath = 'fallback_copy';
          console.warn('[VideoProcessor] Transcoding error, falling back to disk copy:', err.message);
          doFallbackDiskCopy();
        });
    }
  });

  // Execute thumbnail and video tasks concurrently for maximum speed
  const [thumbUrl, videoResult] = await Promise.all([
    generateThumbnailPromise,
    processVideoPromise
  ]);

  const totalTimeMs = Date.now() - startTime;
  const probeTimeMs = probeEndTime - probeStartTime;
  const processTimeMs = processEndTime - processStartTime;
  const thumbTimeMs = thumbEndTime - thumbStartTime;

  const diagnosticAudit: VideoProcessingDiagnosticAudit = {
    probeTimeMs: Math.max(0, probeTimeMs),
    processTimeMs: Math.max(0, processTimeMs),
    thumbTimeMs: Math.max(0, thumbTimeMs),
    totalTimeMs: Math.max(0, totalTimeMs),
    processingPath: chosenProcessingPath,
    inputCodec: { video: vCodec, audio: aCodec, container: containerFormat },
    resolution: resolutionStr,
    bitrateKbps: Math.round(videoBitrate / 1000)
  };

  console.log(`[Video Processing Audit] Total: ${totalTimeMs}ms | Path: ${chosenProcessingPath} | Input: ${vCodec}/${aCodec} (${resolutionStr}) | Probe: ${probeTimeMs}ms | Process: ${processTimeMs}ms | Thumb: ${thumbTimeMs}ms`);

  if (!videoResult.success) {
    return {
      success: false,
      processedVideoUrl: '',
      thumbnailUrl: '',
      error: videoResult.error || 'Video processing failed',
      diagnosticAudit
    };
  }

  const finalDuration = needsDurationTrim && maxDuration && videoDuration > maxDuration
    ? maxDuration
    : Math.round(videoDuration);

  return {
    success: true,
    processedVideoUrl: videoResult.outputUrl,
    thumbnailUrl: thumbUrl,
    duration: finalDuration,
    width: videoWidth,
    height: videoHeight,
    resolution: resolutionStr,
    aspectRatio: calculatedRatio,
    isVertical,
    bitrate: videoBitrate,
    fileSize: videoResult.fileSize,
    format: 'mp4',
    diagnosticAudit
  };
}

/**
 * Helper to safely sanitize input file paths by stripping query parameters, hashes, and upload prefixes
 */
export function resolveDiskFilePath(rawPathOrUrl: string): string {
  if (!rawPathOrUrl) return '';
  const cleanUrl = rawPathOrUrl.split('?')[0].split('#')[0].trim();
  const uploadsDir = path.resolve(process.cwd(), 'uploads');
  const baseName = path.basename(cleanUrl.replace(/^\/?uploads\//, ''));
  return path.resolve(uploadsDir, baseName);
}

/**
 * Standard Media Timeline Processing Schema
 */
export interface MediaTimelineOptions {
  type: 'image_to_video' | 'video_with_audio' | 'video_only';
  duration?: number;
  visual: {
    sourceFilePath: string;
    cropMode?: '9:16' | '1:1' | '16:9';
    animation?: 'ken_burns_zoom_in' | 'static';
  };
  audio?: {
    sourceFilePath: string;
    startTime?: number;
    volume?: number;
    originalAudioVolume?: number;
    audioDuration?: number;
  };
  outputDir?: string;
}

/**
 * High-performance Timeline Renderer (Node + FFmpeg)
 * Transforms image+audio or video+audio into native MP4 stream with zero browser overhead.
 */
export async function processMediaTimeline(
  options: MediaTimelineOptions
): Promise<VideoProcessingResult> {
  const outputDir = options.outputDir || path.resolve(process.cwd(), 'uploads');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const visualFilePath = resolveDiskFilePath(options.visual.sourceFilePath);
  if (!fs.existsSync(visualFilePath)) {
    console.warn('[VideoProcessor] Visual input file not found on disk:', visualFilePath);
    return {
      success: false,
      processedVideoUrl: '',
      thumbnailUrl: '',
      error: `Visual source file not found: ${path.basename(visualFilePath)}`
    };
  }

  const audioFilePath = options.audio?.sourceFilePath ? resolveDiskFilePath(options.audio.sourceFilePath) : '';
  const hasValidAudio = audioFilePath && fs.existsSync(audioFilePath);

  const outputFileName = `timeline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.mp4`;
  const outputFilePath = path.join(outputDir, outputFileName);
  const duration = Math.min(60, Math.max(5, options.duration || 15));

  return new Promise((resolve) => {
    let cmd = ffmpeg();

    if (options.type === 'image_to_video' && hasValidAudio) {
      const audioStart = options.audio?.startTime || 0;
      const audioVol = options.audio?.volume ?? 1.0;

      cmd
        .input(visualFilePath)
        .loop(duration)
        .input(audioFilePath)
        .seekInput(audioStart)
        .complexFilter([
          `scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,zoompan=z='min(zoom+0.0012,1.25)':d=${duration * 25}:x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':s=1080x1920:fps=25[v]`,
          `[1:a]volume=${audioVol}[a]`
        ])
        .outputOptions([
          '-map [v]',
          '-map [a]',
          '-c:v libx264',
          '-pix_fmt yuv420p',
          '-preset veryfast',
          '-c:a aac',
          '-b:a 192k',
          `-t ${duration}`,
          '-movflags +faststart'
        ]);
    } else if (options.type === 'video_with_audio' && hasValidAudio) {
      const origVol = options.audio?.originalAudioVolume ?? 0.4;
      const musicVol = options.audio?.volume ?? 0.8;
      const audioStart = options.audio?.startTime || 0;

      cmd
        .input(visualFilePath)
        .input(audioFilePath);

      if (audioStart > 0) {
        cmd.inputOptions([`-ss ${audioStart}`]);
      }

      if (options.audio?.originalAudioVolume !== undefined && options.audio.originalAudioVolume > 0) {
        cmd
          .complexFilter([
            `[0:a]volume=${origVol}[orig]`,
            `[1:a]volume=${musicVol}[music]`,
            `[orig][music]amix=inputs=2:duration=first[aout]`
          ])
          .outputOptions([
            '-map 0:v:0',
            '-map [aout]',
            '-c:v copy',
            '-c:a aac',
            '-b:a 192k',
            '-shortest',
            '-movflags +faststart'
          ]);
      } else {
        cmd
          .outputOptions([
            '-map 0:v:0',
            '-map 1:a:0',
            '-c:v copy',
            '-c:a aac',
            '-b:a 192k',
            '-shortest',
            '-movflags +faststart'
          ]);
      }
    } else {
      // Fallback normal video processing
      cmd
        .input(visualFilePath)
        .outputOptions([
          '-c:v copy',
          '-c:a aac',
          '-movflags +faststart'
        ]);
    }

    cmd
      .toFormat('mp4')
      .save(outputFilePath)
      .on('end', () => {
        let sz = 0;
        try {
          sz = fs.statSync(outputFilePath).size;
        } catch {}
        resolve({
          success: true,
          processedVideoUrl: `/uploads/${outputFileName}`,
          thumbnailUrl: '',
          duration,
          fileSize: sz,
          format: 'mp4'
        });
      })
      .on('error', (err) => {
        console.error('[VideoProcessor] processMediaTimeline error:', err.message);
        resolve({
          success: false,
          processedVideoUrl: '',
          thumbnailUrl: '',
          error: err.message
        });
      });
  });
}

/**
 * Merges or replaces video audio with chosen music track.
 * Perfect for reels without sound or combining ambient audio with background tracks.
 */
export async function mergeAudioIntoVideo(
  videoFilePath: string,
  audioFilePath: string,
  options: {
    audioStartTime?: number;
    audioDuration?: number;
    keepOriginalAudio?: boolean;
    outputDir?: string;
  } = {}
): Promise<VideoProcessingResult> {
  return processMediaTimeline({
    type: 'video_with_audio',
    visual: {
      sourceFilePath: videoFilePath
    },
    audio: {
      sourceFilePath: audioFilePath,
      startTime: options.audioStartTime || 0,
      originalAudioVolume: options.keepOriginalAudio ? 0.5 : 0
    },
    outputDir: options.outputDir
  });
}



