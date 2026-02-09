import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';

const execAsync = promisify(exec);

async function generateIcons() {
  const svgPath = './public/favicon.svg';
  const sizes = [192, 512];

  console.log('📦 Installing sharp...');
  await execAsync('pnpm add -D sharp');

  console.log('🎨 Generating PWA icons...');
  
  // Import sharp dynamically after install
  const sharp = (await import('sharp')).default;
  
  const svgBuffer = await fs.readFile(svgPath);
  
  for (const size of sizes) {
    const outputPath = `./public/icon-${size}.png`;
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Created ${outputPath}`);
  }
  
  console.log('🎉 Icons generated successfully!');
}

generateIcons().catch(console.error);
