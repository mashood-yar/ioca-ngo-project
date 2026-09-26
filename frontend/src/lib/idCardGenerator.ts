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
        
        // Exact positioning logic to fit perfectly inside the template's blue ring
        const imgSize = width * 0.385; // Slightly larger to fill the white circle
        frontPage.drawImage(img, {
          x: centerX - (imgSize / 2),
          y: height * 0.565, // Nudged up slightly
          width: imgSize,
          height: imgSize,
        });
      } catch (e) {
        console.error("Error embedding profile image", e);
      }
    }

    // Name (Centered, big, dark blue)
    const nameText = userData.name || 'Unknown';
    const nameFontSize = width * 0.065; // Dynamically scaled
    const nameWidth = helveticaBold.widthOfTextAtSize(nameText, nameFontSize);
    frontPage.drawText(nameText, {
      x: centerX - (nameWidth / 2),
      y: height * 0.49,
      size: nameFontSize,
      font: helveticaBold,
      color: rgb(0.12, 0.17, 0.35),
    });

    // Sub-title / Main Role (Centered, smaller, light blue)
    const roleTitle = isVolunteer ? 'Volunteer' : 'Member';
    const desigFontSize = width * 0.045; // Dynamically scaled
    const desigWidth = helveticaFont.widthOfTextAtSize(roleTitle, desigFontSize);
    frontPage.drawText(roleTitle, {
      x: centerX - (desigWidth / 2),
      y: height * 0.45,
      size: desigFontSize,
      font: helveticaFont,
      color: rgb(0.35, 0.65, 0.85),
    });

    // Wipe out the tiny baked-in labels from the original template
    frontPage.drawRectangle({
      x: width * 0.1,
      y: height * 0.15,
      width: width * 0.8,
      height: height * 0.28, // covers up to 0.43
      color: rgb(1, 1, 1),
    });

    // Details List (Two Columns)
    const startY = height * 0.385; // Lowered slightly to center the block
    const lineSpacing = height * 0.040; // Increased line spacing for breathability
    const leftColX = width * 0.15;
    const colonX = width * 0.42;
    const rightColX = width * 0.46;
    const detailSize = width * 0.032; // Dynamically scaled to prevent overlap
    
    // Format ID to be extremely short and readable (e.g., MEM-6537 or VOL-A1B2)
    let formattedId = 'N/A';
    if (userData.id) {
      if (userData.id.startsWith('PAR')) {
        formattedId = userData.id;
      } else {
        const shortHex = userData.id.split('-')[0].substring(0, 4).toUpperCase();
        formattedId = isVolunteer ? `VOL-${shortHex}` : `MEM-${shortHex}`;
      }
    }

    const details = [
      { label: 'FATHER NAME', value: userData.fatherName || 'N/A' },
      { label: 'MEMBER ID', value: formattedId },
      { label: 'PHONE NO.', value: userData.phone || 'N/A' },
      { label: 'EMAIL', value: userData.email || 'N/A' },
      { label: 'DESIGNATION', value: userData.occupation || 'N/A' }, // Real life occupation
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
