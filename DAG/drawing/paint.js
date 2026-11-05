export function floodFillPixels(data, width, height, startX, startY, replacement) {
  const x = Math.floor(startX);
  const y = Math.floor(startY);
  if (!Number.isInteger(width) || !Number.isInteger(height) || width <= 0 || height <= 0) return 0;
  if (x < 0 || y < 0 || x >= width || y >= height) return 0;
  if (!Array.isArray(replacement) || replacement.length < 3) return 0;
  if (data.length < width * height * 4) return 0;

  const start = (y * width + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  const color = [
    Math.max(0, Math.min(255, Math.round(replacement[0]))),
    Math.max(0, Math.min(255, Math.round(replacement[1]))),
    Math.max(0, Math.min(255, Math.round(replacement[2]))),
    replacement.length > 3 ? Math.max(0, Math.min(255, Math.round(replacement[3]))) : 255
  ];

  if (target.every((value, index) => value === color[index])) return 0;

  const matchesTarget = pixel => {
    const offset = pixel * 4;
    return data[offset] === target[0]
      && data[offset + 1] === target[1]
      && data[offset + 2] === target[2]
      && data[offset + 3] === target[3];
  };

  // White is the canvas, so ink fill only recolors a marked drawing region.
  if (target[0] === 255 && target[1] === 255 && target[2] === 255 && target[3] === 255) {
    return 0;
  }

  const visited = new Uint8Array(width * height);
  const queue = [y * width + x];
  visited[queue[0]] = 1;
  let cursor = 0;
  let changed = 0;

  while (cursor < queue.length) {
    const pixel = queue[cursor];
    cursor += 1;
    if (!matchesTarget(pixel)) continue;

    const offset = pixel * 4;
    data[offset] = color[0];
    data[offset + 1] = color[1];
    data[offset + 2] = color[2];
    data[offset + 3] = color[3];
    changed += 1;

    const px = pixel % width;
    const py = Math.floor(pixel / width);
    const neighbors = [];
    if (px > 0) neighbors.push(pixel - 1);
    if (px + 1 < width) neighbors.push(pixel + 1);
    if (py > 0) neighbors.push(pixel - width);
    if (py + 1 < height) neighbors.push(pixel + width);

    for (const neighbor of neighbors) {
      if (visited[neighbor] || !matchesTarget(neighbor)) continue;
      visited[neighbor] = 1;
      queue.push(neighbor);
    }
  }

  return changed;
}

export function hexToRgba(hex) {
  const value = String(hex || "").trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(value)) {
    throw new TypeError("Color must be a six-digit hexadecimal value.");
  }
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
    255
  ];
}