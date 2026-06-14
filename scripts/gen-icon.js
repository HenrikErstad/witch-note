// Generates the app icon set from assets/logo-source.png.
// Run: node scripts/gen-icon.js
const path = require('path');
const sharp = require('sharp');

const assets = path.join(__dirname, '..', 'assets');
const source = path.join(assets, 'logo-source.png');
const homeSource = path.join(assets, 'logo-home-source.png');
const darkPurple = '#12051f';
const transparent = { r: 0, g: 0, b: 0, alpha: 0 };

function backgroundSvg() {
  return Buffer.from(`
    <svg width="1024" height="1024" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="bg" cx="50%" cy="42%" r="78%">
          <stop offset="0%" stop-color="#32104a" />
          <stop offset="58%" stop-color="#17072d" />
          <stop offset="100%" stop-color="#080419" />
        </radialGradient>
      </defs>
      <rect width="1024" height="1024" fill="url(#bg)" />
    </svg>`);
}

async function renderSquare(size, file) {
  await sharp(source)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .flatten({ background: darkPurple })
    .png()
    .toFile(path.join(assets, file));
  console.log('wrote', file);
}

async function containedBuffer(size, innerSize) {
  const image = await sharp(source)
    .resize(innerSize, innerSize, { fit: 'contain', position: 'center' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: transparent,
    },
  })
    .composite([
      {
        input: image,
        left: Math.round((size - innerSize) / 2),
        top: Math.round((size - innerSize) / 2),
      },
    ])
    .png()
    .toBuffer();
}

async function renderContained(size, innerSize, file) {
  await sharp(await containedBuffer(size, innerSize))
    .png()
    .toFile(path.join(assets, file));
  console.log('wrote', file);
}

async function monochromeMask() {
  const padded = await containedBuffer(1024, 850);
  return sharp(padded)
    .flatten({ background: '#000000' })
    .greyscale()
    .threshold(96)
    .png()
    .toBuffer();
}

async function renderMonochrome(file, fill = '#ffffff') {
  const mask = await monochromeMask();
  await sharp({
    create: {
      width: 1024,
      height: 1024,
      channels: 3,
      background: fill,
    },
  })
    .joinChannel(mask)
    .png()
    .toFile(path.join(assets, file));
  console.log('wrote', file);
}

async function renderHomeLogo(file) {
  const size = 1024;
  const { data, info } = await sharp(homeSource)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const output = Buffer.alloc(size * size * 4);

  for (let pixel = 0; pixel < info.width * info.height; pixel += 1) {
    const inputOffset = pixel * info.channels;
    const outputOffset = pixel * 4;
    const r = data[inputOffset];
    const g = data[inputOffset + 1];
    const b = data[inputOffset + 2];
    const a = data[inputOffset + 3];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
    const isNeutralBackground = max > 205 && max - min < 28;
    const isMoon = a > 0 && r > 175 && g > 125 && b < 230 && r - b > 22;

    if (a < 16 || isNeutralBackground) {
      continue;
    }

    if (isMoon) {
      output[outputOffset] = r;
      output[outputOffset + 1] = g;
      output[outputOffset + 2] = b;
      output[outputOffset + 3] = a;
    } else {
      const alpha = Math.max(0, Math.min(255, Math.round((235 - luminance) * 1.45)));
      if (alpha === 0) continue;
      output[outputOffset] = 18;
      output[outputOffset + 1] = 5;
      output[outputOffset + 2] = 31;
      output[outputOffset + 3] = alpha;
    }
  }

  await sharp(output, {
    raw: {
      width: size,
      height: size,
      channels: 4,
    },
  })
    .png()
    .toFile(path.join(assets, file));
  console.log('wrote', file);
}

(async () => {
  // Main app icon, web favicon, and in-app logo use the final supplied design.
  await renderSquare(1024, 'icon.png');
  await renderSquare(1024, 'logo.png');
  await renderSquare(1024, 'splash-icon.png');
  await renderSquare(196, 'favicon.png');

  // Adaptive icon: dark field behind a safe-zone foreground.
  await sharp(backgroundSvg())
    .png()
    .toFile(path.join(assets, 'android-icon-background.png'));
  console.log('wrote', 'android-icon-background.png');
  await renderContained(1024, 850, 'android-icon-foreground.png');

  // Android themed icon: alpha mask from the bright moon and music trail.
  await renderMonochrome('android-icon-monochrome.png');
  // Home screen version: gold moon with black silhouette and music trail.
  await renderHomeLogo('logo-monochrome-inverted.png');
})();
