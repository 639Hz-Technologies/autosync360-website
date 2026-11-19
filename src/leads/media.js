// Photo/video upload helpers shared by New lead and the "Photos & videos" editor (Pipe, Campaign).
import { api } from "./shared.js";

// Shrink phone photos (often 4–8 MB) to ~300 KB so uploads are quick on cell service.
export async function compressImage(file, maxEdge = 1600) {
  try {
    const bmp = await createImageBitmap(file);
    const s = Math.min(1, maxEdge / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * s);
    canvas.height = Math.round(bmp.height * s);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise(r => canvas.toBlob(r, "image/jpeg", 0.8));
    return blob || file;
  } catch {
    return file; // browser can't decode it (e.g. HEIC on desktop Chrome): upload the original
  }
}

// Videos must be 15 seconds or less. They upload as-is (not shrunk), so there's also a file-size cap:
// Supabase Storage's global per-file limit (Storage → Settings), which stays at 50 MB while the
// project's spend cap is on. Keep MAX_UPLOAD_MB in step with that setting.
export const MAX_VIDEO_SECONDS = 15;
export const MAX_UPLOAD_MB = 50;
export const tooLongMessage = s => `That video is ${Math.round(s)} seconds. Videos need to be ${MAX_VIDEO_SECONDS} seconds or less. Trim it in Photos (tap Edit and drag the ends) or record a shorter clip.`;
export const tooBigMessage = mb => `That video is ${mb ? `${Math.round(mb)} MB` : "too big"}, over the ${MAX_UPLOAD_MB} MB limit. It was probably recorded in 4K. Switch the camera to 1080p (iPhone: Settings → Camera → Record Video → 1080p HD at 30 fps) and record it again.`;

// Length of a video file in seconds, read from its metadata. null if the browser can't tell (then we let it through).
export function videoSeconds(file) {
  return new Promise(resolve => {
    const v = document.createElement("video");
    const url = URL.createObjectURL(file);
    const done = s => { clearTimeout(timer); URL.revokeObjectURL(url); v.removeAttribute("src"); resolve(s); };
    const timer = setTimeout(() => done(null), 8000);
    v.preload = "metadata";
    v.muted = true;
    v.onloadedmetadata = () => done(Number.isFinite(v.duration) ? v.duration : null);
    v.onerror = () => done(null);
    v.src = url;
  });
}

export function guessType(file) {
  if (file.type) return file.type;
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  return { mov: "video/quicktime", mp4: "video/mp4", m4v: "video/x-m4v", webm: "video/webm", heic: "image/heic", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png" }[ext] || "";
}

export function putWithProgress(url, blob, type, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    xhr.setRequestHeader("content-type", type);
    xhr.setRequestHeader("x-upsert", "false");
    xhr.upload.onprogress = e => e.lengthComputable && onProgress(e.loaded / e.total);
    xhr.onload = () => {
      if (xhr.status < 300) return resolve();
      if (xhr.status === 413 || /maximum allowed size|too large/i.test(xhr.responseText)) return reject(new Error(tooBigMessage(blob.size / 1048576)));
      reject(new Error(`Upload failed (${xhr.status}) ${xhr.responseText.slice(0, 120)}`));
    };
    xhr.onerror = () => reject(new Error("Upload failed: check your connection"));
    xhr.send(blob);
  });
}


// Checks a picked batch of videos (15 s max, under the size cap). Returns the ones that pass + an error for the first that didn't.
export async function checkVideos(files) {
  const ok = [];
  let error = "";
  for (const file of files) {
    const s = await videoSeconds(file);
    if (s !== null && s > MAX_VIDEO_SECONDS + 0.5) error = error || tooLongMessage(s);
    else if (file.size > MAX_UPLOAD_MB * 1048576) error = error || tooBigMessage(file.size / 1048576);
    else ok.push(file);
  }
  return { ok, error };
}

// Uploads one picked file (photos are shrunk first). Returns { path, url, type }.
export async function uploadFile(file, kind, token, onProgress) {
  const blob = kind === "image" ? await compressImage(file) : file;
  const type = blob === file ? guessType(file) : "image/jpeg";
  const { path, uploadUrl, url } = await api("upload", { token, body: { type } });
  await putWithProgress(uploadUrl, blob, type, onProgress);
  return { path, url, type: kind };
}
