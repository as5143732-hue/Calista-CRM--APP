import sharp from 'sharp';
import fs from 'fs';

const svg = `
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bg" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#000000" />
    </radialGradient>
    <radialGradient id="glow1" cx="30%" cy="75%" r="50%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="glow2" cx="65%" cy="25%" r="40%">
      <stop offset="0%" stop-color="#0ea5e9" stop-opacity="0.3" />
      <stop offset="100%" stop-color="#0ea5e9" stop-opacity="0" />
    </radialGradient>
  </defs>
  
  <!-- Background squircle -->
  <rect x="40" y="40" width="432" height="432" rx="120" ry="120" fill="url(#bg)" />
  <rect x="40" y="40" width="432" height="432" rx="120" ry="120" fill="url(#glow1)" />
  <rect x="40" y="40" width="432" height="432" rx="120" ry="120" fill="url(#glow2)" />
  
  <!-- The C -->
  <path d="M 336.7 175.3 
           A 110 110 0 1 0 336.7 336.7 
           L 300 300 
           A 60 60 0 1 1 300 212 
           Z" fill="white" />
           
  <!-- The two dots -->
  <circle cx="165" cy="355" r="16" fill="white" />
  <circle cx="360" cy="155" r="16" fill="white" />
</svg>
`;

async function generate() {
  try {
    if (!fs.existsSync('./public')) {
      fs.mkdirSync('./public');
    }
    await sharp(Buffer.from(svg))
      .resize(192, 192)
      .png()
      .toFile('./public/icon-192.png');
      
    await sharp(Buffer.from(svg))
      .resize(512, 512)
      .png()
      .toFile('./public/icon-512.png');
      
    console.log("Icons generated successfully.");
  } catch (err) {
    console.error("Error generating icons:", err);
  }
}

generate();
