import test from "node:test";
import assert from "node:assert/strict";
import { floodFillPixels, hexToRgba } from "../drawing/paint.js";

function makePixels(width, height, colors) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let i = 0; i < colors.length; i += 1) {
    data.set(colors[i], i * 4);
  }
  return data;
}

function colorAt(data, width, x, y) {
  const offset = (y * width + x) * 4;
  return Array.from(data.slice(offset, offset + 4));
}

const white = [255, 255, 255, 255];
const gray = [146, 155, 161, 255];
const red = [255, 85, 93, 255];
const blue = [77, 141, 255, 255];

test("ink fill recolors only the connected region with the same shade", () => {
  const pixels = makePixels(4, 2, [
    gray, gray, white, blue,
    gray, gray, white, blue
  ]);

  const changed = floodFillPixels(pixels, 4, 2, 0, 0, red);

  assert.equal(changed, 4);
  assert.deepEqual(colorAt(pixels, 4, 0, 0), red);
  assert.deepEqual(colorAt(pixels, 4, 1, 1), red);
  assert.deepEqual(colorAt(pixels, 4, 2, 0), white);
  assert.deepEqual(colorAt(pixels, 4, 3, 0), blue);
});

test("ink fill does not jump across a white gap to a separate shape", () => {
  const pixels = makePixels(5, 1, [gray, gray, white, gray, gray]);

  assert.equal(floodFillPixels(pixels, 5, 1, 0, 0, red), 2);
  assert.deepEqual(colorAt(pixels, 5, 3, 0), gray);
});

test("white canvas pixels cannot be recolored with ink fill", () => {
  const pixels = makePixels(2, 2, [white, white, gray, gray]);

  assert.equal(floodFillPixels(pixels, 2, 2, 0, 0, red), 0);
  assert.deepEqual(colorAt(pixels, 2, 1, 1), gray);
});

test("filling with the existing color is a no-op", () => {
  const pixels = makePixels(2, 1, [gray, gray]);
  assert.equal(floodFillPixels(pixels, 2, 1, 0, 0, gray), 0);
});

test("flood fill safely ignores out-of-range starting points", () => {
  const pixels = makePixels(2, 2, [gray, gray, gray, gray]);
  assert.equal(floodFillPixels(pixels, 2, 2, -1, 0, red), 0);
  assert.equal(floodFillPixels(pixels, 2, 2, 2, 0, red), 0);
});

test("hex colors are converted to opaque RGBA values", () => {
  assert.deepEqual(hexToRgba("#00ffc8"), [0, 255, 200, 255]);
  assert.throws(() => hexToRgba("#fff"), TypeError);
});