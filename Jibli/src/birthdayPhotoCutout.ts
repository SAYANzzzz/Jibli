import type { ImageSegmenter } from "@mediapipe/tasks-vision";

let segmenter: Promise<ImageSegmenter> | undefined;
const preparedPhotos = new Map<string, Promise<Blob>>();

export function prepareBirthdayPhoto(url: string): Promise<Blob> {
  let prepared = preparedPhotos.get(url);
  if (!prepared) {
    prepared = fetch(url).then(response => {
      if (!response.ok) throw new Error("Could not load birthday portrait.");
      return response.blob();
    }).then(birthdayPhotoCutout).catch(error => { preparedPhotos.delete(url); throw error; });
    if (preparedPhotos.size >= 8) preparedPhotos.delete(preparedPhotos.keys().next().value!);
    preparedPhotos.set(url, prepared);
  }
  return prepared;
}

async function getSegmenter() {
  if (!segmenter) {
    segmenter = (async () => {
      const { FilesetResolver, ImageSegmenter } = await import("@mediapipe/tasks-vision");
      const files = await FilesetResolver.forVisionTasks("/photo-cutout/wasm");
      return ImageSegmenter.createFromOptions(files, {
        baseOptions: { modelAssetPath: "/photo-cutout/selfie_segmenter.tflite" },
        runningMode: "IMAGE", outputConfidenceMasks: true, outputCategoryMask: false,
      });
    })().catch(error => { segmenter = undefined; throw error; });
  }
  return segmenter;
}

/** Keep the actual person's outline, then trim transparent margins for predictable placement. */
export async function birthdayPhotoCutout(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * scale);
    canvas.height = Math.round(bitmap.height * scale);
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) throw new Error("Photo processing is unavailable in this browser.");
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
    // Respect professionally prepared transparent portraits without re-segmenting hair.
    let transparent = 0;
    for (let i = 3; i < pixels.data.length; i += 4) if (pixels.data[i] < 16) transparent++;
    if (transparent < canvas.width * canvas.height * .02) {
      const engine = await getSegmenter();
      engine.segment(canvas, result => {
        const foreground = result.confidenceMasks?.[0];
        if (!foreground) throw new Error("Could not isolate the person in this photo.");
        const values = foreground.getAsFloat32Array();
        const mask = document.createElement("canvas");
        mask.width = foreground.width; mask.height = foreground.height;
        const maskCtx = mask.getContext("2d")!;
        const alpha = maskCtx.createImageData(mask.width, mask.height);
        for (let i = 0; i < values.length; i++) {
          // Soft matte retains hair while removing low-confidence background spill.
          const t = Math.max(0, Math.min(1, (values[i] - .15) / .75));
          alpha.data[i * 4 + 3] = Math.round(t * t * (3 - 2 * t) * 255);
        }
        maskCtx.putImageData(alpha, 0, 0);
        ctx.globalCompositeOperation = "destination-in";
        ctx.drawImage(mask, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "source-over";
      });
    }
    const matte = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let left = canvas.width, top = canvas.height, right = -1, bottom = -1;
    for (let y = 0; y < canvas.height; y++) for (let x = 0; x < canvas.width; x++) {
      if (matte[(y * canvas.width + x) * 4 + 3] > 32) {
        left = Math.min(left, x); top = Math.min(top, y);
        right = Math.max(right, x); bottom = Math.max(bottom, y);
      }
    }
    if (right - left < 20 || bottom - top < 20) throw new Error("Choose a clear portrait with one person visible.");
    const padding = Math.ceil(Math.max(canvas.width, canvas.height) * .015);
    left = Math.max(0, left - padding); top = Math.max(0, top - padding);
    right = Math.min(canvas.width - 1, right + padding); bottom = Math.min(canvas.height - 1, bottom + padding);
    const cropped = document.createElement("canvas");
    cropped.width = right - left + 1; cropped.height = bottom - top + 1;
    cropped.getContext("2d")!.drawImage(canvas, left, top, cropped.width, cropped.height, 0, 0, cropped.width, cropped.height);
    return await new Promise<Blob>((resolve, reject) => cropped.toBlob(blob => blob ? resolve(blob) : reject(new Error("Could not prepare photo.")), "image/png"));
  } finally { bitmap.close(); }
}
