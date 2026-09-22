import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
}

export const processImage = async (
  file: File,
  options: ImageCompressionOptions = { maxSizeMB: 1, maxWidthOrHeight: 1920 }
): Promise<File> => {
  try {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: options.maxSizeMB || 1,
      maxWidthOrHeight: options.maxWidthOrHeight || 1920,
      useWebWorker: true,
    });
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

/**
 * Generates an instant video thumbnail (poster) from a video File object
 * to eliminate preview delay in upload composer cards.
 */
export const generateVideoThumbnail = async (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const objectUrl = URL.createObjectURL(file);
    video.src = objectUrl;

    video.onloadedmetadata = () => {
      // Seek to 1 second or 10% into video
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
          URL.revokeObjectURL(objectUrl);
          resolve(dataUrl);
        } else {
          URL.revokeObjectURL(objectUrl);
          reject(new Error('Failed to get 2d context for video thumbnail'));
        }
      } catch (err) {
        URL.revokeObjectURL(objectUrl);
        reject(err);
      }
    };

    video.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(err);
    };
  });
};

/**
 * Optimizes video file or validates constraints for instant streaming preview.
 */
export const processVideoForUpload = async (file: File): Promise<{ file: File; thumbnailDataUrl: string }> => {
  try {
    const thumbnailDataUrl = await generateVideoThumbnail(file);
    return {
      file,
      thumbnailDataUrl,
    };
  } catch (err) {
    console.warn('Video thumbnail generation fallback:', err);
    return {
      file,
      thumbnailDataUrl: '',
    };
  }
};

