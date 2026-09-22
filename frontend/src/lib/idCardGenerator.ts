import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

// Helper to convert WebP (or any image) to JPEG array buffer using Canvas
const fetchImageAsJpeg = async (url: string): Promise<ArrayBuffer> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return reject('No canvas context');
      // Create a circular clipping path if desired, or just draw it
      ctx.beginPath();
      ctx.arc(img.width / 2, img.height / 2, Math.min(img.width, img.height) / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(blob => {
        if (blob) {
          blob.arrayBuffer().then(resolve).catch(reject);
        } else {
          reject('Blob conversion failed');
        }
      }, 'image/jpeg', 0.95);
    };
    img.onerror = reject;
    img.src = url;
  });
};

export const generateIdCard = async (userData: any, isVolunteer: boolean = false) => {
  try {
    const existingPdfBytes = await fetch('/assets/id-template.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Register font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();
    const frontPage = pages[0];
    const backPage = pages.length > 1 ? pages[1] : frontPage; // Use same page if only 1 page

    // Front Page
    // Profile Pic
    if (userData.profileImageUrl) {
      try {
        const jpgBytes = await fetchImageAsJpeg(userData.profileImageUrl);
        const img = await pdfDoc.embedJpg(jpgBytes);
        frontPage.drawImage(img, {
          x: 172,
          y: 457,
          width: 250,
          height: 250,
        });
      } catch (e) {
        console.error("Error embedding profile image", e);
      }
    }

    // Name
    frontPage.drawText(userData.name || 'Unknown', {
      x: 200,
      y: 400,
      size: 18,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Designation
    frontPage.drawText(isVolunteer ? 'Volunteer' : 'Member', {
      x: 200,
      y: 370,
      size: 14,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Father Name
    if (userData.fatherName) {
      frontPage.drawText(`S/O, D/O: ${userData.fatherName}`, {
        x: 200,
        y: 320,
        size: 12,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    // Member ID
    frontPage.drawText(`ID: ${userData.id || 'N/A'}`, {
      x: 200,
      y: 290,
      size: 12,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Issue/Valid Dates
    const issueDate = userData.issueDate || new Date().toLocaleDateString();
    const validUntil = userData.validUntil || 'N/A';
    frontPage.drawText(`Issued: ${issueDate} | Valid Until: ${validUntil}`, {
      x: 200,
      y: 200,
      size: 10,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Back Page (QR Code)
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ id: userData.id, type: isVolunteer ? 'Volunteer' : 'Member' }));
    const qrBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrBytes);
    
    backPage.drawImage(qrImage, {
      x: 200,
      y: 400,
      width: 100,
      height: 100,
    });

    const pdfBytes = await pdfDoc.save();
    
    // Trigger download
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${userData.name?.replace(/\s+/g, '_')}_ID.pdf`;
    link.click();
  } catch (error) {
    console.error("Failed to generate ID Card", error);
  }
}
