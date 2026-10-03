import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, pixelFn) {
  // 8-byte PNG signature
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData.writeUInt8(8, 8); // 8-bit depth
  ihdrData.writeUInt8(6, 9); // RGBA (color type 6)
  ihdrData.writeUInt8(0, 10); // compression method 0
  ihdrData.writeUInt8(0, 11); // filter method 0
  ihdrData.writeUInt8(0, 12); // interlace method 0
  const ihdrChunk = createChunk('IHDR', ihdrData);

  // Raw image data with filter byte (0) per scanline
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(height * rowSize);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = createChunk('IDAT', compressedData);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  // CRC32 calculation
  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Drawing function for Rahel Stationery Gold Emblem
function drawEmblem(x, y, w, h) {
  const nx = x / w;
  const ny = y / h;
  const cx = 0.5;
  const cy = 0.5;
  const dx = Math.abs(nx - cx);
  const dy = Math.abs(ny - cy);

  // Rounded squircle border
  const cornerR = 0.38;
  const inBorder = dx < 0.46 && dy < 0.46;
  const cornerDist = Math.hypot(Math.max(0, dx - 0.28), Math.max(0, dy - 0.28));
  if (cornerDist > 0.2) {
    return [0, 0, 0, 0]; // Transparent
  }

  // Border edge detection
  const isBorder = (cornerDist > 0.17 && cornerDist <= 0.2) || 
                   (dx >= 0.42 && dx < 0.46 && dy < 0.3) || 
                   (dy >= 0.42 && dy < 0.46 && dx < 0.3);

  if (isBorder) {
    // Gold gradient border
    const t = (nx + ny) / 2;
    return [
      Math.round(212 + 40 * (1 - t)),
      Math.round(175 + 40 * (1 - t)),
      Math.round(55 + 40 * (1 - t)),
      255
    ];
  }

  // Fountain Pen Nib in center
  // Tip at (0.5, 0.22), shoulders at (0.35, 0.48) and (0.65, 0.48), base at (0.5, 0.72)
  const tipX = 0.5;
  const tipY = 0.22;
  const shoulderY = 0.48;
  const baseY = 0.70;

  // Upper triangle of nib
  let inNib = false;
  if (ny >= tipY && ny <= shoulderY) {
    const widthAtY = (ny - tipY) / (shoulderY - tipY) * 0.16;
    if (Math.abs(nx - tipX) <= widthAtY) {
      inNib = true;
    }
  } else if (ny > shoulderY && ny <= baseY) {
    const widthAtY = 0.16 * (1 - 0.6 * ((ny - shoulderY) / (baseY - shoulderY)));
    if (Math.abs(nx - tipX) <= widthAtY) {
      inNib = true;
    }
  }

  // Nib central slit & breather hole
  const distBreather = Math.hypot(nx - 0.5, ny - 0.44);
  if (distBreather < 0.035) {
    return [13, 13, 16, 255]; // Dark hole
  }
  if (ny >= tipY && ny <= 0.44 && Math.abs(nx - 0.5) < 0.015) {
    return [13, 13, 16, 255]; // Slit
  }

  if (inNib) {
    // Rich radiant gold gradient
    const t = 1 - ny;
    const r = Math.round(245 * t + 180 * (1 - t));
    const g = Math.round(215 * t + 140 * (1 - t));
    const b = Math.round(127 * t + 32 * (1 - t));
    return [r, g, b, 255];
  }

  // Background dark obsidian with soft gold radial sheen
  const distCenter = Math.hypot(nx - 0.5, ny - 0.45);
  const glow = Math.max(0, 1 - distCenter * 2.5);
  const bgR = Math.round(14 + 40 * glow);
  const bgG = Math.round(14 + 32 * glow);
  const bgB = Math.round(17 + 10 * glow);

  return [bgR, bgG, bgB, 255];
}

// Generate PNG files
const png16 = createPNG(16, 16, drawEmblem);
const png32 = createPNG(32, 32, drawEmblem);
const png180 = createPNG(180, 180, drawEmblem);

if (!fs.existsSync('public')) {
  fs.mkdirSync('public');
}

fs.writeFileSync('public/favicon-16x16.png', png16);
fs.writeFileSync('public/favicon-32x32.png', png32);
fs.writeFileSync('public/apple-touch-icon.png', png180);

// Generate valid multi-size ICO file containing 16x16 and 32x32 PNGs
// ICO Header: 2 bytes reserved (0), 2 bytes type (1 = ICO), 2 bytes image count (2)
const icoHeader = Buffer.alloc(6);
icoHeader.writeUInt16LE(0, 0);
icoHeader.writeUInt16LE(1, 2);
icoHeader.writeUInt16LE(2, 4);

// Entry 1: 16x16
const entry1 = Buffer.alloc(16);
entry1.writeUInt8(16, 0); // width
entry1.writeUInt8(16, 1); // height
entry1.writeUInt8(0, 2);  // color palette (0 = no palette)
entry1.writeUInt8(0, 3);  // reserved
entry1.writeUInt16LE(1, 4); // color planes
entry1.writeUInt16LE(32, 6); // bits per pixel
entry1.writeUInt32LE(png16.length, 8); // size
const offset1 = 6 + 16 * 2;
entry1.writeUInt32LE(offset1, 12);

// Entry 2: 32x32
const entry2 = Buffer.alloc(16);
entry2.writeUInt8(32, 0);
entry2.writeUInt8(32, 1);
entry2.writeUInt8(0, 2);
entry2.writeUInt8(0, 3);
entry2.writeUInt16LE(1, 4);
entry2.writeUInt16LE(32, 6);
entry2.writeUInt32LE(png32.length, 8);
const offset2 = offset1 + png16.length;
entry2.writeUInt32LE(offset2, 12);

const icoBuffer = Buffer.concat([icoHeader, entry1, entry2, png16, png32]);
fs.writeFileSync('public/favicon.ico', icoBuffer);

console.log('Favicons generated successfully!');
