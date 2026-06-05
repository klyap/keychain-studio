#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { vl } from "moondream";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const outputDir = path.join(root, "src/assets/beads");
const apiKey = process.env.MOONDREAM_API_KEY;

if (!apiKey) {
  console.error("MOONDREAM_API_KEY is required to segment mixed bead assets.");
  process.exit(1);
}

const sourceConfigs = [
  {
    filename: "assorted-beads.png",
    beads: [
      { name: "round-cream-swirl", crop: "230x230+1165+660", object: "cream striped round ceramic bead" },
      { name: "round-tortoise-cream", crop: "280x280+2250+600", object: "brown striped round ceramic bead" },
      { name: "round-aqua-cloud", crop: "300x300+1750+700", object: "blue green round ceramic bead" },
      { name: "round-pink-milk", crop: "300x300+1150+3350", object: "pink round ceramic bead with hole" },
      { name: "round-teal-caramel", crop: "260x260+520+3430", object: "green striped round ceramic bead" },
      { name: "cube-pink-splash", crop: "200x200+650+2750", object: "pink cube ceramic bead" },
      { name: "cube-ivory-teal-red", crop: "220x220+1190+1750", object: "white cube ceramic bead with teal square" },
      { name: "cube-blue-black", crop: "200x200+1200+2160", object: "blue square ceramic bead with black center" },
      { name: "cube-olive-gloss", crop: "200x200+1080+1160", object: "green cube ceramic bead" },
      { name: "barrel-cream-stripe", crop: "300x300+1150+850", object: "cream striped oval ceramic bead" },
      { name: "barrel-teal-cream", crop: "220x220+950+3180", object: "light blue cylindrical ceramic bead" },
      { name: "diamond-green-cream", crop: "260x260+950+1400", object: "cream diamond ceramic bead" },
      { name: "diamond-sky-cream", crop: "220x220+1900+3000", object: "light blue square ceramic bead" },
    ],
  },
  {
    filename: "mixed-beads.png",
    beads: [
      { name: "round-cream-swirl", crop: "430x430+620+610" },
      { name: "round-tortoise-cream", crop: "430x430+1740+760" },
      { name: "round-aqua-cloud", crop: "430x430+2580+680" },
      { name: "round-pink-milk", crop: "430x430+3360+1580" },
      { name: "round-teal-caramel", crop: "430x430+1570+1560" },
      { name: "cube-pink-splash", crop: "380x380+150+560" },
      { name: "cube-ivory-teal-red", crop: "400x400+2160+1110" },
      { name: "cube-blue-black", crop: "400x400+1700+530" },
      { name: "cube-olive-gloss", crop: "390x390+430+500" },
      { name: "barrel-cream-stripe", crop: "430x430+1080+560" },
      { name: "barrel-teal-cream", crop: "430x430+2960+500" },
      { name: "diamond-green-cream", crop: "390x390+1440+550" },
      { name: "diamond-sky-cream", crop: "390x390+3330+1150" },
    ],
  },
];

const fileExists = async (filePath) => {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
};

const findSourceConfig = async () => {
  for (const config of sourceConfigs) {
    const sourcePath = path.join(root, "src/assets/source", config.filename);
    if (await fileExists(sourcePath)) {
      return { ...config, sourcePath };
    }
  }

  throw new Error("No assorted bead source image found in src/assets/source.");
};

const parseCrop = (crop) => {
  const match = crop.match(/^(\d+)x(\d+)\+(\d+)\+(\d+)$/);
  if (!match) {
    throw new Error(`Invalid crop string: ${crop}`);
  }

  const [, width, height, left, top] = match;
  return {
    width: Number(width),
    height: Number(height),
    left: Number(left),
    top: Number(top),
  };
};

const escapeAttribute = (value) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

const createMaskSvg = ({ width, height, pathData, bbox }) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 1 1" preserveAspectRatio="none">
  <rect width="1" height="1" fill="#000"/>
  <g transform="translate(${bbox.x_min} ${bbox.y_min}) scale(${bbox.x_max - bbox.x_min} ${bbox.y_max - bbox.y_min})">
    <path d="${escapeAttribute(pathData)}" fill="#fff"/>
  </g>
</svg>`;

const model = new vl({ apiKey });

await fs.mkdir(outputDir, { recursive: true });

const { filename, sourcePath, beads } = await findSourceConfig();
console.log(`Using ${filename}`);

for (const bead of beads) {
  const crop = parseCrop(bead.crop);
  const cropBuffer = await sharp(sourcePath)
    .extract(crop)
    .png()
    .toBuffer();

  const result = await model.segment({
    image: cropBuffer,
    object: bead.object || "ceramic bead",
    spatialRefs: [[0.5, 0.5], [0.2, 0.2, 0.8, 0.8]],
  });

  if (!result.path) {
    throw new Error(`Moondream did not return a path for ${bead.name}`);
  }
  if (!result.bbox) {
    throw new Error(`Moondream did not return a bbox for ${bead.name}`);
  }

  const maskBuffer = await sharp(Buffer.from(createMaskSvg({
    width: crop.width,
    height: crop.height,
    pathData: result.path,
    bbox: result.bbox,
  })))
    .resize(crop.width, crop.height, { fit: "fill" })
    .removeAlpha()
    .png()
    .toBuffer();
  const { data: cropPixels, info: cropInfo } = await sharp(cropBuffer)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { data: maskPixels, info: maskInfo } = await sharp(maskBuffer)
    .removeAlpha()
    .extractChannel("red")
    .raw()
    .toBuffer({ resolveWithObject: true });
  if (cropInfo.width !== maskInfo.width || cropInfo.height !== maskInfo.height) {
    throw new Error(
      `Mask size mismatch for ${bead.name}: ${maskInfo.width}x${maskInfo.height}, expected ${cropInfo.width}x${cropInfo.height}`,
    );
  }
  for (let pixelIndex = 0; pixelIndex < maskPixels.length; pixelIndex += 1) {
    cropPixels[pixelIndex * 4 + 3] = maskPixels[pixelIndex];
  }

  const outputPath = path.join(outputDir, `${bead.name}.png`);
  await sharp(cropPixels, {
    raw: {
      width: cropInfo.width,
      height: cropInfo.height,
      channels: 4,
    },
  })
    .trim({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .resize(300, 300, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toFile(outputPath);

  console.log(`Segmented ${bead.name}`);
}
