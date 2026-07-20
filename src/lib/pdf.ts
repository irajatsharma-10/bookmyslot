import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import { Prisma } from '@prisma/client';

type TicketBooking = Prisma.BookingGetPayload<{
  include: {
    user: true,
    slot: {
      include: { venue: true }
    }
  }
}>;

export async function generateTicketPdf(booking: TicketBooking): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: true,
    });

    const buffers: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => buffers.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // --------------------------------------------------
    // Constants & Colors (Modern Canva Vibe)
    // --------------------------------------------------
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const margin = 40;

    const bgLight = '#f9fafb';
    const cardBg = '#ffffff';
    const brandGreen = '#10b981';
    const darkText = '#111827';
    const grayText = '#6b7280';
    const lightBorder = '#e5e7eb';

    // Safe booking data
    const attendee = booking?.user?.name || booking?.user?.email || 'Guest';
    const bookingId = booking?.id ? String(booking.id).toUpperCase().substring(0, 12) : 'N/A';
    const venueName = booking?.slot?.venue?.name || 'TBD Venue';
    const venueLocation = booking?.slot?.venue?.location || 'TBD Location';
    
    const startTime = booking?.slot?.startTime ? new Date(booking.slot.startTime) : null;
    const endTime = booking?.slot?.endTime ? new Date(booking.slot.endTime) : null;

    const dateText = startTime
      ? startTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
      : 'Date TBD';

    const timeText = startTime && endTime
      ? `${startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })} - ${endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`
      : 'Time TBD';

    // Generate QR Code Buffer
    const qrBuffer = await QRCode.toBuffer(`BOOKING:${bookingId}`, {
      type: 'png',
      margin: 0,
      color: {
        dark: '#111827',
        light: '#ffffff'
      }
    });

    // --------------------------------------------------
    // Page Background
    // --------------------------------------------------
    doc.rect(0, 0, pageWidth, pageHeight).fill(bgLight);

    // --------------------------------------------------
    // Main Ticket Card (Rounded with border)
    // --------------------------------------------------
    const cardX = margin;
    const cardY = 80;
    const cardW = pageWidth - margin * 2;
    const cardH = 500;
    const splitY = cardY + 340; // Where the stub separates

    doc.roundedRect(cardX, cardY, cardW, cardH, 20).fillAndStroke(cardBg, lightBorder);

    // Dark Header inside the card
    doc.save()
       .roundedRect(cardX, cardY, cardW, 100, 20)
       .clip()
       .rect(cardX, cardY, cardW, 100).fill(darkText)
       .restore();

    // Brand and Pass Type in Header
    doc.fillColor(brandGreen).font('Helvetica-Bold').fontSize(28)
       .text('BOOKMYSLOT', cardX + 30, cardY + 30, { characterSpacing: 1 });
       
    doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(10)
       .text('PREMIUM ENTRY PASS', cardX + 32, cardY + 65, { characterSpacing: 2 });

    // --------------------------------------------------
    // Event Details (Middle Section)
    // --------------------------------------------------
    const detailsY = cardY + 130;
    
    // Attendee
    doc.fillColor(grayText).font('Helvetica-Bold').fontSize(10)
       .text('ATTENDEE / GUEST', cardX + 30, detailsY, { characterSpacing: 1 });
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(18)
       .text(attendee, cardX + 30, detailsY + 15, { width: 250, ellipsis: true });

    // Venue
    doc.fillColor(grayText).font('Helvetica-Bold').fontSize(10)
       .text('VENUE DETAILS', cardX + 30, detailsY + 60, { characterSpacing: 1 });
    doc.fillColor(brandGreen).font('Helvetica-Bold').fontSize(18)
       .text(venueName, cardX + 30, detailsY + 75, { width: 250, ellipsis: true });
    doc.fillColor(grayText).font('Helvetica').fontSize(12)
       .text(venueLocation, cardX + 30, detailsY + 98, { width: 250, ellipsis: true });

    // Date & Time
    doc.fillColor(grayText).font('Helvetica-Bold').fontSize(10)
       .text('SCHEDULE', cardX + 30, detailsY + 140, { characterSpacing: 1 });
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(14)
       .text(dateText, cardX + 30, detailsY + 155);
    doc.fillColor(darkText).font('Helvetica').fontSize(12)
       .text(timeText, cardX + 30, detailsY + 175);

    // --------------------------------------------------
    // QR Code Section (Right side)
    // --------------------------------------------------
    const qrSize = 120;
    const qrX = cardX + cardW - qrSize - 40;
    const qrY = detailsY + 10;
    
    doc.image(qrBuffer, qrX, qrY, { width: qrSize });
    
    doc.fillColor(grayText).font('Helvetica-Bold').fontSize(10)
       .text('BOOKING ID', qrX, qrY + qrSize + 20, { align: 'center', width: qrSize, characterSpacing: 1 });
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(12)
       .text(bookingId, qrX, qrY + qrSize + 35, { align: 'center', width: qrSize });

    // --------------------------------------------------
    // Perforated Stub Line
    // --------------------------------------------------
    const cutoutRadius = 15;
    
    // Left Cutout
    doc.circle(cardX, splitY, cutoutRadius).fillAndStroke(bgLight, lightBorder);
    doc.circle(cardX, splitY, cutoutRadius - 1).fill(bgLight); // Erase inner border

    // Right Cutout
    doc.circle(cardX + cardW, splitY, cutoutRadius).fillAndStroke(bgLight, lightBorder);
    doc.circle(cardX + cardW, splitY, cutoutRadius - 1).fill(bgLight);

    // Dashed line
    doc.moveTo(cardX + cutoutRadius + 5, splitY)
       .lineTo(cardX + cardW - cutoutRadius - 5, splitY)
       .dash(5, { space: 5 }).lineWidth(2).strokeColor(lightBorder).stroke();
    doc.undash();

    // --------------------------------------------------
    // Instructions (Bottom Stub)
    // --------------------------------------------------
    const instructionsY = splitY + 30;
    
    doc.fillColor(darkText).font('Helvetica-Bold').fontSize(12)
       .text('Important Instructions', cardX + 30, instructionsY);
       
    doc.fillColor(grayText).font('Helvetica').fontSize(10);
    const rules = [
      'Please arrive at least 15 minutes before your scheduled slot.',
      'This ticket is non-transferable and valid only for the specified date and time.',
      'Carry a valid photo ID matching the attendee name for verification.'
    ];
    
    rules.forEach((rule, index) => {
      doc.text(`${index + 1}. ${rule}`, cardX + 30, instructionsY + 25 + (index * 20), { width: cardW - 60 });
    });

    // --------------------------------------------------
    // Footer
    // --------------------------------------------------
    const footerY = pageHeight - 50;
    doc.fillColor(grayText).font('Helvetica').fontSize(10)
       .text('Powered by BookMySlot', 0, footerY, { align: 'center', width: pageWidth });

    doc.end();
  });
}