import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

const srcPath = path.resolve('./src/assets/images/calista_crm_logo_1782496859804.jpg');
const dest192 = path.resolve('./public/icon-192.png');
const dest512 = path.resolve('./public/icon-512.png');

async function generateIcons() {
  if (!fs.existsSync(srcPath)) {
    console.error('Source image not found');
    process.exit(1);
  }

  try {
    await sharp(srcPath)
      .resize(192, 192)
      .png()
      .toFile(dest192);
    console.log('Successfully generated icon-192.png');

    await sharp(srcPath)
      .resize(512, 512)
      .png()
      .toFile(dest512);
    console.log('Successfully generated icon-512.png');
  } catch (error) {
    console.error('Error generating icons:', error);
  }
}

generateIcons();
