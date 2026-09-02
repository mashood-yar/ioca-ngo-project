import QRCode from 'qrcode';
import fs from 'fs';

async function generateCustomQR(url) {
  const qrc = QRCode.create(url, { errorCorrectionLevel: 'H' });
  const size = qrc.modules.size;
  const data = qrc.modules.data;
  
  const cellSize = 10;
  const margin = 4;
  const width = (size + margin * 2) * cellSize;
  
  // Colors
  const bg = '#192b45'; // Dark Navy
  const fg = '#ffffff'; // White
  const eyeOuter = '#578cc0'; // Blue
  const eyeInner = '#d19e34'; // Gold
  
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${width}" viewBox="0 0 ${width} ${width}">
  <rect width="${width}" height="${width}" fill="${bg}" rx="20" />`;
  
  // Center logo hole (size x size)
  // Let's clear a 9x9 space in the center
  const centerStart = Math.floor(size / 2) - 4;
  const centerEnd = Math.floor(size / 2) + 4;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isDark = data[row * size + col];
      if (!isDark) continue;
      
      // Check if inside eyes (top-left, top-right, bottom-left are 7x7)
      const isTopLeftEye = row < 7 && col < 7;
      const isTopRightEye = row < 7 && col >= size - 7;
      const isBottomLeftEye = row >= size - 7 && col < 7;
      
      if (isTopLeftEye || isTopRightEye || isBottomLeftEye) {
        // Skip rendering standard modules here, we'll draw them manually
        continue;
      }
      
      // Skip center area for logo
      if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) {
        continue;
      }
      
      const x = (col + margin) * cellSize;
      const y = (row + margin) * cellSize;
      
      svg += `<rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fg}" rx="2" />`;
    }
  }
  
  // Draw the 3 eyes manually
  const drawEye = (startRow, startCol) => {
    const x = (startCol + margin) * cellSize;
    const y = (startRow + margin) * cellSize;
    const eyeSize = 7 * cellSize;
    
    // Outer blue circle with hole
    let eyeSvg = `<circle cx="${x + eyeSize/2}" cy="${y + eyeSize/2}" r="${eyeSize/2}" fill="${eyeOuter}" />`;
    eyeSvg += `<circle cx="${x + eyeSize/2}" cy="${y + eyeSize/2}" r="${eyeSize/2 - cellSize}" fill="${bg}" />`;
    // Inner gold circle
    eyeSvg += `<circle cx="${x + eyeSize/2}" cy="${y + eyeSize/2}" r="${1.5 * cellSize}" fill="${eyeInner}" />`;
    return eyeSvg;
  };
  
  svg += drawEye(0, 0);
  svg += drawEye(0, size - 7);
  svg += drawEye(size - 7, 0);
  
  // Add logo placeholder
  const centerX = width / 2;
  const centerY = width / 2;
  const logoRadius = 3.5 * cellSize;
  
  // We can embed the logo directly using <image> or draw the IOCA logo using paths.
  // For the script, we'll return the SVG, then Sharp can composite it if needed, or we just embed a base64 image!
  svg += `</svg>`;
  
  fs.writeFileSync('test_qr.svg', svg);
  console.log('Saved test_qr.svg');
}

generateCustomQR('https://iocaworld.org/verify/BOA-S9T0U1V2');
