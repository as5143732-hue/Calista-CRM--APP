import fs from 'fs';
import path from 'path';

const srcPath = path.resolve('./src/assets/images/calista_crm_logo_1782496859804.jpg');
const dest192Png = path.resolve('./public/icon-192.png');
const dest512Png = path.resolve('./public/icon-512.png');
const dest192Jpg = path.resolve('./public/icon-192.jpg');
const dest512Jpg = path.resolve('./public/icon-512.jpg');

if (fs.existsSync(srcPath)) {
  fs.copyFileSync(srcPath, dest192Png);
  fs.copyFileSync(srcPath, dest512Png);
  fs.copyFileSync(srcPath, dest192Jpg);
  fs.copyFileSync(srcPath, dest512Jpg);
  console.log('Successfully copied PWA icons to public directory.');
} else {
  console.error('Source icon file not found at:', srcPath);
}
