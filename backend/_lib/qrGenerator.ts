import QRCode from 'qrcode';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs';

export async function generateCustomQR(url: string, logoPath?: string): Promise<string> {
  const qrc = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const size = qrc.modules.size;
  const data = qrc.modules.data;
  
  const cellSize = 12;
  const margin = 2;
  const width = (size + margin * 2) * cellSize;
  
  // Custom colors matching the design
  const bg = '#162842'; // Dark Navy
  const fg = '#ffffff'; // White
  const eyeOuter = '#5792c3'; // Light Blue
  const eyeInner = '#c9962a'; // Gold
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">
  <rect width="${width}" height="${width}" fill="${bg}" rx="30" />`;
  
  // Hole in the center for the logo (9x9 block)
  const centerStart = Math.floor(size / 2) - 4;
  const centerEnd = Math.floor(size / 2) + 4;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isDark = data[row * size + col];
      if (!isDark) continue;
      
      const isTopLeftEye = row < 7 && col < 7;
      const isTopRightEye = row < 7 && col >= size - 7;
      const isBottomLeftEye = row >= size - 7 && col < 7;
      
      if (isTopLeftEye || isTopRightEye || isBottomLeftEye) continue;
      
      // Clear space for center logo
      if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) {
        continue;
      }
      
      const x = (col + margin) * cellSize;
      const y = (row + margin) * cellSize;
      
      // Slightly rounded modules
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fg}" rx="3" />`;
    }
  }
  
  const drawEye = (startRow: number, startCol: number) => {
    const x = (startCol + margin) * cellSize;
    const y = (startRow + margin) * cellSize;
    const eyeSize = 7 * cellSize;
    const center = eyeSize / 2;
    
    return `
      <!-- Outer circle -->
      <circle cx="${x + center}" cy="${y + center}" r="${center}" fill="${eyeOuter}" />
      <!-- Inner cutout -->
      <circle cx="${x + center}" cy="${y + center}" r="${center - cellSize}" fill="${bg}" />
      <!-- Center dot -->
      <circle cx="${x + center}" cy="${y + center}" r="${1.5 * cellSize}" fill="${eyeInner}" />
    `;
  };
  
  svg += drawEye(0, 0);
  svg += drawEye(0, size - 7);
  svg += drawEye(size - 7, 0);
  
  svg += `</svg>`;
  
  const svgBuffer = Buffer.from(svg);
  
  if (logoPath) {
    try {
      let logoBuffer: Buffer;
      if (logoPath.startsWith('http')) {
        const res = await fetch(logoPath);
        const arrayBuffer = await res.arrayBuffer();
        logoBuffer = Buffer.from(arrayBuffer);
      } else if (fs.existsSync(logoPath)) {
        logoBuffer = fs.readFileSync(logoPath);
      } else {
        throw new Error('Logo not found');
      }

      const logoSize = 9 * cellSize;
      
      const logoBg = Buffer.from(`
        <svg width="${logoSize}" height="${logoSize}">
          <circle cx="${logoSize/2}" cy="${logoSize/2}" r="${logoSize/2}" fill="${bg}" />
        </svg>
      `);
      
      const resizedLogo = await sharp(logoBuffer)
        .resize(logoSize - 20, logoSize - 20, { fit: 'contain', background: { r:0, g:0, b:0, alpha:0 } })
        .toBuffer();
        
      const finalImage = await sharp(svgBuffer)
        .composite([
          { input: logoBg, gravity: 'center' },
          { input: resizedLogo, gravity: 'center' }
        ])
        .png()
        .toBuffer();
        
      return `data:image/png;base64,${finalImage.toString('base64')}`;
    } catch (e) {
      console.error('Failed to load logo, falling back to logo-less QR', e);
    }
  }
  
  const pngBuffer = await sharp(svgBuffer).png().toBuffer();
  return `data:image/png;base64,${pngBuffer.toString('base64')}`;
}
