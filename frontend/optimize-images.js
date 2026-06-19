import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = path.join(process.cwd(), 'public', 'assets');

function getAllFiles(dirPath) {
  const files = fs.readdirSync(dirPath, { recursive: true });
  return files.filter(file => {
    const fullPath = path.join(dirPath, file);
    return fs.statSync(fullPath).isFile();
  }).map(file => path.join(dirPath, file));
}

async function optimizeImages() {
  console.log('Scanning for images to compress...');
  const files = await getAllFiles(assetsDir);
  
  let totalSaved = 0;
  let count = 0;

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    
    if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
      const stats = fs.statSync(file);
      const originalSize = stats.size;
      const buffer = fs.readFileSync(file);
      
      try {
        let pipeline = sharp(buffer);
        
        if (ext === '.jpg' || ext === '.jpeg') {
          pipeline = pipeline.jpeg({ quality: 80, mozjpeg: true });
        } else if (ext === '.png') {
          pipeline = pipeline.png({ quality: 80, compressionLevel: 9, palette: true });
        } else if (ext === '.webp') {
          pipeline = pipeline.webp({ quality: 80, effort: 6 });
        }

        const optimizedBuffer = await pipeline.toBuffer();
        const newSize = optimizedBuffer.length;
        
        // Only overwrite if it actually saved space
        if (newSize < originalSize) {
          fs.writeFileSync(file, optimizedBuffer);
          const saved = originalSize - newSize;
          totalSaved += saved;
          count++;
          console.log(`Optimized: ${path.basename(file)} | Saved: ${(saved / 1024 / 1024).toFixed(2)} MB`);
        }
      } catch (err) {
        console.error(`Error processing ${file}:`, err.message);
      }
    }
  }

  console.log('\n--- Compression Complete ---');
  console.log(`Images optimized: ${count}`);
  console.log(`Total space saved: ${(totalSaved / 1024 / 1024).toFixed(2)} MB`);
}

optimizeImages();
