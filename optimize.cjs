const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const avatarsDir = path.join(__dirname, 'public', 'avatars');
const imagesDir = path.join(__dirname, 'public', 'images');

async function processDirectory(dir, renameFn) {
  if (!fs.existsSync(dir)) return;

  const files = fs.readdirSync(dir);
  for (const file of files) {
    if (file.endsWith('.png') || file.endsWith('.jpg')) {
      const inputPath = path.join(dir, file);
      const parsed = path.parse(file);
      const newName = renameFn ? renameFn(parsed.name) : parsed.name;
      const outputPath = path.join(dir, `${newName}.webp`);

      console.log(`Optimizing ${file} -> ${newName}.webp`);
      await sharp(inputPath).webp({ quality: 85 }).toFile(outputPath);

      // Delete old file
      fs.unlinkSync(inputPath);
    }
  }
}

function toKebabCase(str) {
  return str
    .replace(/_perspective_matte/i, '-perspective')
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

async function run() {
  console.log('Optimizing avatars...');
  await processDirectory(avatarsDir);

  console.log('Optimizing UI images...');
  await processDirectory(imagesDir, toKebabCase);

  console.log('Done!');
}

run().catch(console.error);
