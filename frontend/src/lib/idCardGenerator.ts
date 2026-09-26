import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

// Helper to convert WebP (or any image) to JPEG array buffer using our proxy API
const fetchImageAsJpeg = async (url: string): Promise<ArrayBuffer> => {
  // Pass the URL to our backend proxy which converts it to a JPEG buffer using sharp
  const proxyUrl = `/api/misc/proxy-image?url=${encodeURIComponent(url)}`;
  const response = await fetch(proxyUrl);
  if (!response.ok) throw new Error('Failed to fetch proxy image');
  return response.arrayBuffer();
};

export const generateIdCard = async (userData: any, isVolunteer: boolean = false) => {
  try {
    const existingPdfBytes = await fetch('/assets/id-template.pdf').then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Register fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const pages = pdfDoc.getPages();
    const frontPage = pages[0];
    const backPage = pages.length > 1 ? pages[1] : frontPage; // Use same page if only 1 page
    
    const { width, height } = frontPage.getSize();
    const centerX = width / 2;

    // Front Page
    // Profile Pic
    if (userData.profileImageUrl) {
      try {
        const jpgBytes = await fetchImageAsJpeg(userData.profileImageUrl);
        const img = await pdfDoc.embedJpg(jpgBytes);
        
        // Template design assumption: Avatar is centered horizontally, about 60% up the page
        const imgSize = width * 0.4; // Avatar is 40% of card width
        
        frontPage.drawImage(img, {
          x: centerX - (imgSize / 2),
          y: height * 0.52, // Nudged down slightly to fit the template box
          width: imgSize,
          height: imgSize,
        });
      } catch (e) {
        console.error("Error embedding profile image", e);
      }
    }

    // Name
    const nameText = userData.name || 'Unknown';
    const nameFontSize = 15;
    const nameWidth = helveticaBold.widthOfTextAtSize(nameText, nameFontSize);
    frontPage.drawText(nameText, {
      x: centerX - (nameWidth / 2),
      y: height * 0.41,
      size: nameFontSize,
      font: helveticaBold,
      color: rgb(0, 0, 0),
    });

    // Designation
    const designation = isVolunteer ? 'Volunteer' : 'Member';
    const desigFontSize = 12;
    const desigWidth = helveticaFont.widthOfTextAtSize(designation, desigFontSize);
    frontPage.drawText(designation, {
      x: centerX - (desigWidth / 2),
      y: height * 0.36,
      size: desigFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Father Name
    if (userData.fatherName) {
      const fnText = `S/O, D/O: ${userData.fatherName}`;
      const fnFontSize = 10;
      const fnWidth = helveticaFont.widthOfTextAtSize(fnText, fnFontSize);
      frontPage.drawText(fnText, {
        x: centerX - (fnWidth / 2),
        y: height * 0.32,
        size: fnFontSize,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
    }

    // Member ID (Sliced)
    const formattedId = userData.id ? userData.id.split('-')[0].toUpperCase() : 'N/A';
    const idText = `ID: ${formattedId}`;
    const idFontSize = 9;
    const idWidth = helveticaFont.widthOfTextAtSize(idText, idFontSize);
    frontPage.drawText(idText, {
      x: centerX - (idWidth / 2),
      y: height * 0.29,
      size: idFontSize,
      font: helveticaFont,
      color: rgb(0, 0, 0),
    });

    // Issue/Valid Dates
    const issueDate = userData.issueDate || new Date().toLocaleDateString();
    const validUntil = userData.validUntil || 'N/A';
    const datesText = `Issued: ${issueDate} | Valid: ${validUntil}`;
    const datesFontSize = 8;
    const datesWidth = helveticaFont.widthOfTextAtSize(datesText, datesFontSize);
    frontPage.drawText(datesText, {
      x: centerX - (datesWidth / 2),
      y: height * 0.26,
      size: datesFontSize,
      font: helveticaFont,
      color: rgb(0.4, 0.4, 0.4),
    });

    // Back Page (QR Code)
    const qrDataUrl = await QRCode.toDataURL(JSON.stringify({ id: userData.id, type: isVolunteer ? 'Volunteer' : 'Member' }));
    const qrBytes = await fetch(qrDataUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrBytes);
    
    const { width: backWidth, height: backHeight } = backPage.getSize();
    const qrSize = backWidth * 0.3; // QR is 30% of back page width
    
    backPage.drawImage(qrImage, {
      x: (backWidth / 2) - (qrSize / 2),
      y: backHeight * 0.4,
      width: qrSize,
      height: qrSize,
    });

    const pdfBytes = await pdfDoc.save();
    
    // Trigger download
    const blob = new Blob([pdfBytes as any], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${(userData.name || 'ID').replace(/\s+/g, '_')}_ID.pdf`;
    link.click();
  } catch (error) {
    console.error("Failed to generate ID Card", error);
  }
}
