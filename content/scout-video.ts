import limits from '../public/data/scout-media.json';
import { scoutRequest } from './scout';
import type { Locale } from './i18n';
import { scoutCopy } from './scout-i18n';

export { limits as scoutMediaLimits };
export type ScoutVideoInfo = { path: string; name: string; size: number; mime: string };
export type ScoutVideoDraft = { file: File; requestId: string } | ScoutVideoInfo;

/** Bounded chunks work within the existing shared-host request size limits. */
export async function uploadScoutVideo(video: ScoutVideoDraft | null, editToken: string, locale: Locale, onProgress: (percent: number) => void): Promise<string | null> {
  if (!video) return null;
  if (!('file' in video)) return video.path;
  const start = await scoutRequest('video_start', { mediaRequestId: video.requestId, editToken, size: video.file.size, name: video.file.name }, false, locale);
  let offset: number = start.received;
  onProgress(Math.round(offset / video.file.size * 100));
  if (!start.complete) {
    while (offset < video.file.size) {
      const bytes = new Uint8Array(await video.file.slice(offset, offset + limits.videoChunkBytes).arrayBuffer());
      let binary = '';
      for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
      const result = await scoutRequest('video_chunk', { uploadId: start.uploadId, editToken, offset, chunk: btoa(binary) }, false, locale);
      if (result.received <= offset || result.received > video.file.size) throw new Error(scoutCopy[locale].errors.videoUpload);
      offset = result.received; onProgress(Math.round(offset / video.file.size * 100));
    }
    await scoutRequest('video_finish', { uploadId: start.uploadId, editToken }, false, locale);
  }
  return start.uploadId;
}
