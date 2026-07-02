const sharp = require('sharp');
const path = require('path');

const logoSvg = path.join(__dirname, 'public', 'logo.svg');

async function generate() {
  // Generate 512x512
  await sharp(logoSvg)
    .resize(512, 512)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-512.png'));

  // Generate 192x192
  await sharp(logoSvg)
    .resize(192, 192)
    .png()
    .toFile(path.join(__dirname, 'public', 'icon-192.png'));

  // Generate OG Image (1200x630)
  await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 10, g: 10, b: 15, alpha: 1 },
    },
  })
    .composite([{ input: logoSvg, gravity: 'center' }])
    .jpeg({ quality: 90 })
    .toFile(path.join(__dirname, 'public', 'og-image.jpg'));

  console.log('Icons generated!');
}

generate().catch(console.error);
