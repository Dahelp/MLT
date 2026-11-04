/** A movable 3:4 source rectangle; positions are normalized to the available pan. */
export function scoutCrop(width: number, height: number, zoom = 1, x = .5, y = .5) {
  const scale = Math.max(1, Math.min(3, zoom));
  const cropWidth = Math.min(width, height * 3 / 4) / scale;
  const cropHeight = cropWidth * 4 / 3;
  const clamp = (value: number) => Math.max(0, Math.min(1, value));
  return { x: (width - cropWidth) * clamp(x), y: (height - cropHeight) * clamp(y), width: cropWidth, height: cropHeight };
}
