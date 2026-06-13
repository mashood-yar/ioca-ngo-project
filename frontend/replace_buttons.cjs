const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function replaceInFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;

  // Global button replacements
  content = content.replace(/bg-brand-gold text-brand-navy/g, 'bg-brand-teal text-brand-white');
  content = content.replace(/shadow-brand-gold\/20/g, 'shadow-brand-teal/20');
  
  // Specific for Footer social links
  content = content.replace(/hover:bg-brand-gold hover:border-brand-gold hover:text-brand-navy/g, 'hover:bg-brand-teal hover:border-brand-teal hover:text-brand-white');

  // Specific for Navbar skip link
  content = content.replace(/focus:bg-brand-gold focus:text-brand-navy/g, 'focus:bg-brand-teal focus:text-brand-white');

  // Specific for DonationModal presets and payment methods
  if (filePath.endsWith('DonationModal.tsx')) {
    content = content.replace(/border-brand-gold bg-brand-gold\/5 text-brand-gold/g, 'border-brand-teal bg-brand-teal/5 text-brand-teal');
    content = content.replace(/hover:border-brand-gold/g, 'hover:border-brand-teal');
    content = content.replace(/hover:bg-brand-gold\/5/g, 'hover:bg-brand-teal/5');
    content = content.replace(/border-brand-gold bg-brand-gold\/5/g, 'border-brand-teal bg-brand-teal/5');
    content = content.replace(/focus:ring-brand-gold/g, 'focus:ring-brand-teal');
  }

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated ${filePath}`);
  }
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walkDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      replaceInFile(fullPath);
    }
  }
}

walkDir(srcDir);
console.log('Done!');
