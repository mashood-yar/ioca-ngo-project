import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import QRCode from 'qrcode';

// Helper to convert WebP (or any image) to PNG array buffer with optional circle crop
const fetchImageAsPng = async (url: string, circle: boolean = false): Promise<ArrayBuffer> => {
  const proxyUrl = `/api/misc/proxy-image?url=${encodeURIComponent(url)}${circle ? '&circle=true' : ''}`;
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
    const backPage = pages.length > 1 ? pages[1] : frontPage;
    
    const { width, height } = frontPage.getSize();
    const centerX = width / 2;

    // Profile Pic (Circular PNG)
    if (userData.profileImageUrl) {
      try {
        const pngBytes = await fetchImageAsPng(userData.profileImageUrl, true);
        const img = await pdfDoc.embedPng(pngBytes);
        
        // Exact positioning logic matching Image 2
        const imgSize = width * 0.35;
        frontPage.drawImage(img, {
          x: centerX - (imgSize / 2),
          y: height * 0.55,
          width: imgSize,
          height: imgSize,
        });
      } catch (e) {
        console.error("Error embedding profile image", e);
      }
    }

    // Name (Centered, big, dark blue)
    const nameText = userData.name || 'Unknown';
    const nameFontSize = 14;
    const nameWidth = helveticaBold.widthOfTextAtSize(nameText, nameFontSize);
    frontPage.drawText(nameText, {
      x: centerX - (nameWidth / 2),
      y: height * 0.50,
      size: nameFontSize,
      font: helveticaBold,
      color: rgb(0.12, 0.17, 0.35), // Dark blue (#1E2B59)
    });

    // Sub-title / Main Role (Centered, smaller, light blue)
    const designation = userData.designation || (isVolunteer ? 'Volunteer' : 'Member');
    const desigFontSize = 10;
    const desigWidth = helveticaFont.widthOfTextAtSize(designation, desigFontSize);
    frontPage.drawText(designation, {
      x: centerX - (desigWidth / 2),
      y: height * 0.46,
      size: desigFontSize,
      font: helveticaFont,
      color: rgb(0.35, 0.65, 0.85), // Light blue (#58A5D9)
    });

    // Details List (Two Columns)
    const startY = height * 0.41;
    const lineSpacing = height * 0.035;
    const leftColX = width * 0.18;
    const colonX = width * 0.40;
    const rightColX = width * 0.45;
    const detailSize = 7.5;
    
    const formattedId = userData.id ? (userData.id.startsWith('PAR') ? userData.id : userData.id.split('-')[0].toUpperCase()) : 'N/A';

    const details = [
      { label: 'FATHER NAME', value: userData.fatherName || 'N/A' },
      { label: 'MEMBER ID', value: formattedId },
      { label: 'PHONE NO.', value: userData.phone || 'N/A' },
      { label: 'EMAIL', value: userData.email || 'N/A' },
      { label: 'DESIGNATION', value: designation },
      { label: 'ISSUE DATE', value: userData.issueDate || new Date().toLocaleDateString() },
      { label: 'VALID TILL', value: userData.validUntil || 'N/A' },
    ];

    details.forEach((detail, index) => {
      const y = startY - (index * lineSpacing);
      
      // Label
      frontPage.drawText(detail.label, {
        x: leftColX,
        y,
        size: detailSize,
        font: helveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Colon
      frontPage.drawText(':', {
        x: colonX,
        y,
        size: detailSize,
        font: helveticaBold,
        color: rgb(0.3, 0.3, 0.3),
      });
      
      // Value
      frontPage.drawText(detail.value, {
        x: rightColX,
        y,
        size: detailSize,
        font: helveticaFont,
        color: rgb(0.2, 0.2, 0.2),
      });
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
