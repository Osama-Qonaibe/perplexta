/**
 * High-performance client-side Web Audio API audio trimmer and format transcoder.
 * Trims any input audio (MP3, WAV, AAC, M4A, OGG, WebM, FLAC) from startSec to endSec.
 */

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Encodes an AudioBuffer into standard 16-bit PCM WAV Blob.
 */
export function audioBufferToWavBlob(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;

  let result: Float32Array;
  if (numChannels === 2) {
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    result = new Float32Array(left.length + right.length);
    let index = 0;
    for (let i = 0; i < left.length; i++) {
      result[index++] = left[i];
      result[index++] = right[i];
    }
  } else {
    result = buffer.getChannelData(0);
  }

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const dataLength = result.length * bytesPerSample;
  const bufferLength = 44 + dataLength;

  const arrayBuffer = new ArrayBuffer(bufferLength);
  const view = new DataView(arrayBuffer);

  // RIFF identifier
  writeString(view, 0, 'RIFF');
  // RIFF chunk length
  view.setUint32(4, 36 + dataLength, true);
  // RIFF type
  writeString(view, 8, 'WAVE');
  // format chunk identifier
  writeString(view, 12, 'fmt ');
  // format chunk length
  view.setUint32(16, 16, true);
  // sample format (raw)
  view.setUint16(20, format, true);
  // channel count
  view.setUint16(22, numChannels, true);
  // sample rate
  view.setUint32(24, sampleRate, true);
  // byte rate (sample rate * block align)
  view.setUint32(28, sampleRate * blockAlign, true);
  // block align (channel count * bytes per sample)
  view.setUint16(32, blockAlign, true);
  // bits per sample
  view.setUint16(34, bitDepth, true);
  // data chunk identifier
  writeString(view, 36, 'data');
  // data chunk length
  view.setUint32(40, dataLength, true);

  // Write PCM samples
  let offset = 44;
  for (let i = 0; i < result.length; i++) {
    const s = Math.max(-1, Math.min(1, result[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}

/**
 * Trims an audio file from startSec to endSec.
 */
export async function sliceAudioFile(
  audioSource: string | File | Blob,
  startSec: number,
  endSec: number
): Promise<{ blob: Blob; duration: number }> {
  const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioCtxClass) {
    throw new Error('Web Audio API is not supported in this environment');
  }

  const audioCtx = new AudioCtxClass();

  let arrayBuffer: ArrayBuffer;
  if (typeof audioSource === 'string') {
    const res = await fetch(audioSource);
    if (!res.ok) throw new Error('Failed to fetch audio source');
    arrayBuffer = await res.arrayBuffer();
  } else {
    arrayBuffer = await audioSource.arrayBuffer();
  }

  const decodedBuffer = await audioCtx.decodeAudioData(arrayBuffer);

  const totalDuration = decodedBuffer.duration;
  const start = Math.max(0, Math.min(startSec, totalDuration - 0.5));
  const end = Math.min(totalDuration, Math.max(start + 0.5, endSec));
  const sliceDuration = end - start;

  const sampleRate = decodedBuffer.sampleRate;
  const numChannels = decodedBuffer.numberOfChannels;

  const startFrame = Math.floor(start * sampleRate);
  const endFrame = Math.floor(end * sampleRate);
  const frameCount = Math.max(1, endFrame - startFrame);

  const trimmedBuffer = audioCtx.createBuffer(numChannels, frameCount, sampleRate);

  for (let ch = 0; ch < numChannels; ch++) {
    const srcData = decodedBuffer.getChannelData(ch);
    const destData = trimmedBuffer.getChannelData(ch);
    for (let i = 0; i < frameCount; i++) {
      destData[i] = srcData[startFrame + i] || 0;
    }
  }

  const wavBlob = audioBufferToWavBlob(trimmedBuffer);
  await audioCtx.close();

  return {
    blob: wavBlob,
    duration: Math.round(sliceDuration)
  };
}
