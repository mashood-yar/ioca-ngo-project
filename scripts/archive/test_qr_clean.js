import QRCode from 'qrcode';
import fs from 'fs';

function generateCleanQR(url) {
  const qrc = QRCode.create(url, { errorCorrectionLevel: 'Q' });
  const size = qrc.modules.size;
  const data = qrc.modules.data;
  
  const cellSize = 12;
  const margin = 2;
  const width = (size + margin * 2) * cellSize;
  
  const bg = '#162842';
  const fg = '#ffffff';
  const eyeOuter = '#5792c3';
  const eyeInner = '#c9962a';
  
  // Outer white wrapper like the mockup
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width + 40}" height="${width + 40}" viewBox="0 0 ${width + 40} ${width + 40}">
  <rect width="${width + 40}" height="${width + 40}" fill="#ffffff" rx="10" />
  <rect x="20" y="20" width="${width}" height="${width}" fill="${bg}" rx="15" />`;
  
  const centerStart = Math.floor(size / 2) - 3;
  const centerEnd = Math.floor(size / 2) + 3;
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      const isDark = data[row * size + col];
      if (!isDark) continue;
      
      const isTopLeftEye = row < 7 && col < 7;
      const isTopRightEye = row < 7 && col >= size - 7;
      const isBottomLeftEye = row >= size - 7 && col < 7;
      
      if (isTopLeftEye || isTopRightEye || isBottomLeftEye) continue;
      
      // Clear 7x7 for logo
      if (row >= centerStart && row <= centerEnd && col >= centerStart && col <= centerEnd) continue;
      
      const x = 20 + (col + margin) * cellSize;
      const y = 20 + (row + margin) * cellSize;
      
      // Add 0.5 to width/height to prevent faint subpixel gaps between adjacent blocks
      svg += `<rect x="${x}" y="${y}" width="${cellSize + 0.5}" height="${cellSize + 0.5}" fill="${fg}" />`;
    }
  }
  
  const drawEye = (startRow, startCol) => {
    const x = 20 + (startCol + margin) * cellSize;
    const y = 20 + (startRow + margin) * cellSize;
    const eyeSize = 7 * cellSize;
    const center = eyeSize / 2;
    
    return `
      <!-- Outer circle -->
      <circle cx="${x + center}" cy="${y + center}" r="${center}" fill="${eyeOuter}" />
      <!-- Inner cutout -->
      <circle cx="${x + center}" cy="${y + center}" r="${center - 1.2*cellSize}" fill="${bg}" />
      <!-- Center dot -->
      <circle cx="${x + center}" cy="${y + center}" r="${1.8 * cellSize}" fill="${eyeInner}" />
    `;
  };
  
  svg += drawEye(0, 0);
  svg += drawEye(0, size - 7);
  svg += drawEye(size - 7, 0);
  
  svg += `</svg>`;
  
  fs.writeFileSync('test_qr_clean.svg', svg);
}

generateCleanQR('https://iocaworld.org/verify/BOA-S9T0U1V2');
