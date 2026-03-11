export type AreaResult = {
  pixelArea: number;
  calibratedArea: number | null;
};

export function estimateAreaFromImage(
  image: HTMLImageElement,
  threshold: number,
  cmPerPixel: number | null
): AreaResult {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    return { pixelArea: 0, calibratedArea: null };
  }

  ctx.drawImage(image, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const { data } = imageData;

  let pixelArea = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];

    const intensity = (r + g + b) / 3;
    if (intensity < threshold) {
      pixelArea += 1;
    }
  }

  if (cmPerPixel && cmPerPixel > 0) {
    const calibratedArea = pixelArea * cmPerPixel * cmPerPixel;
    return { pixelArea, calibratedArea };
  }

  return { pixelArea, calibratedArea: null };
}
