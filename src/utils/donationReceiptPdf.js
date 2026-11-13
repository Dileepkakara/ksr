import { jsPDF } from 'jspdf';
import logoUrl from '../assets/logo/ksr-logo.png';
import regularFontUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans.ttf?url';
import boldFontUrl from 'dejavu-fonts-ttf/ttf/DejaVuSans-Bold.ttf?url';

function formatReceiptDate(value) {
  if (!value) return '[DD/MM/YYYY]';
  const [year, month, day] = value.split('-');
  return `${day}/${month}/${year}`;
}

function addWrappedText(pdf, text, x, y, width, fontSize, color, options = {}) {
  pdf.setFontSize(fontSize);
  pdf.setTextColor(...color);
  const lines = pdf.splitTextToSize(String(text || ''), width);
  pdf.text(lines, x, y, options);
  return lines.length;
}

function addLabel(pdf, text, x, y) {
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(9.5);
  pdf.setTextColor(83, 102, 114);
  pdf.text(text, x, y);
}

async function imageAsDataUrl(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('The trust logo could not be loaded for the PDF.');
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('The trust logo could not be prepared for the PDF.'));
    reader.readAsDataURL(blob);
  });
}

async function fontAsBase64(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error('The Unicode font could not be loaded for the PDF.');
  const bytes = new Uint8Array(await response.arrayBuffer());
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, Math.min(offset + 0x8000, bytes.length)));
  }
  return btoa(binary);
}

export async function downloadDonationReceiptPdf({ document, settings, filename }) {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true });
  const data = document?.data || {};
  const navy = [24, 53, 75];
  const gold = [213, 163, 40];
  const border = [216, 224, 229];
  const text = [38, 61, 76];
  const [logo, regularFont, boldFont] = await Promise.all([
    imageAsDataUrl(logoUrl),
    fontAsBase64(regularFontUrl),
    fontAsBase64(boldFontUrl),
  ]);
  pdf.addFileToVFS('DejaVuSans.ttf', regularFont);
  pdf.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  pdf.addFileToVFS('DejaVuSans-Bold.ttf', boldFont);
  pdf.addFont('DejaVuSans-Bold.ttf', 'DejaVuSans', 'bold');

  pdf.setFillColor(...navy);
  pdf.rect(0, 0, 210, 1.2, 'F');
  pdf.setFillColor(...gold);
  pdf.rect(0, 1.2, 210, 0.6, 'F');
  pdf.addImage(logo, 'PNG', 14, 19.5, 30, 30, undefined, 'FAST');

  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...navy);
  pdf.text(settings.trustName || 'KSR APADBANDHU CHARITABLE TRUST', 49, 32, { maxWidth: 147 });
  pdf.setFont('DejaVuSans', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...text);
  pdf.text(settings.address || '[TRUST ADDRESS]', 49, 38, { maxWidth: 147 });
  pdf.text([settings.phone || '[PHONE NUMBER]', settings.email || '[EMAIL ADDRESS]', settings.website || '[WEBSITE]'].join('  |  '), 49, 42, { maxWidth: 147 });
  if (settings.registrationDetails) pdf.text(settings.registrationDetails, 49, 46, { maxWidth: 147 });

  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.45);
  pdf.line(14, 53, 196, 53);
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(...navy);
  pdf.text('DONATION RECEIPT', 105, 63, { align: 'center' });
  pdf.setDrawColor(...gold);
  pdf.setLineWidth(0.6);
  pdf.line(14, 67, 196, 67);

  pdf.setFillColor(247, 249, 250);
  pdf.setDrawColor(...border);
  pdf.roundedRect(14, 71, 182, 15, 1.5, 1.5, 'FD');
  addLabel(pdf, 'Receipt No.', 19, 80);
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...navy);
  pdf.text(document?.number || 'DR-000001', 43, 80);
  pdf.setDrawColor(...border);
  pdf.line(110, 73, 110, 84);
  addLabel(pdf, 'Date', 116, 80);
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(...navy);
  pdf.text(formatReceiptDate(data.Date), 132, 80);

  addLabel(pdf, 'RECEIVED WITH THANKS FROM', 15, 94);
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(...text);
  const donorLines = pdf.splitTextToSize(data['Donor Name'] || '[DONOR NAME]', 178);
  pdf.text(donorLines, 15, 104);
  const donorY = 104 + (donorLines.length - 1) * 5;
  addLabel(pdf, 'Address', 15, donorY + 7);
  const addressLines = pdf.splitTextToSize(data['Donor Address / Contact'] || '[DONOR ADDRESS]', 178);
  pdf.setFont('DejaVuSans', 'normal');
  pdf.setFontSize(10.5);
  pdf.setTextColor(...text);
  pdf.text(addressLines, 15, donorY + 13);
  const donorDivider = Math.max(126, donorY + 13 + (addressLines.length - 1) * 4.5 + 6);
  const amountTop = donorDivider + 2;
  const paymentTop = amountTop + 36;
  const purposeTop = paymentTop + 26;
  const contentShift = amountTop - 128;
  pdf.setDrawColor(...border);
  pdf.line(15, donorDivider, 195, donorDivider);

  pdf.setFillColor(255, 253, 247);
  pdf.setDrawColor(...gold);
  pdf.roundedRect(14, amountTop, 182, 32, 1.5, 1.5, 'FD');
  addLabel(pdf, 'DONATION AMOUNT', 19, amountTop + 12);
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setFontSize(18);
  pdf.setTextColor(164, 43, 43);
  const amount = Number(data['Donation Amount'] || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  pdf.text(data['Donation Amount'] ? `₹ ${amount}` : '[AMOUNT]', 19, amountTop + 23);
  pdf.setDrawColor(232, 221, 185);
  pdf.line(95, amountTop + 3, 95, amountTop + 29);
  addLabel(pdf, 'AMOUNT IN WORDS', 101, amountTop + 12);
  addWrappedText(pdf, data['Amount in Words'] || '[AMOUNT IN WORDS]', 101, amountTop + 20, 87, 11, text);

  pdf.setDrawColor(...border);
  pdf.roundedRect(14, paymentTop, 182, 22, 1.5, 1.5, 'S');
  addLabel(pdf, 'PAYMENT MODE', 19, paymentTop + 10);
  addWrappedText(pdf, data['Payment Mode'] || '[PAYMENT MODE]', 19, paymentTop + 16, 71, 11, text);
  pdf.line(99, paymentTop + 2, 99, paymentTop + 20);
  addLabel(pdf, 'TRANSACTION / REFERENCE NO.', 105, paymentTop + 10);
  addWrappedText(pdf, data['Transaction / Reference Number'] || '[TRANSACTION REFERENCE]', 105, paymentTop + 16, 85, 11, text);

  addLabel(pdf, 'PURPOSE OF DONATION', 15, purposeTop + 4);
  const purposeLines = addWrappedText(pdf, data.Purpose || '[DONATION PURPOSE]', 15, purposeTop + 12, 178, 11, text);
  if (data.Notes) addWrappedText(pdf, `Notes: ${data.Notes}`, 15, purposeTop + 12 + purposeLines * 4.5, 178, 9.5, text);
  pdf.setDrawColor(...border);
  pdf.line(15, purposeTop + 26, 195, purposeTop + 26);

  pdf.setFont('DejaVuSans', 'normal');
  pdf.setFontSize(10);
  pdf.setTextColor(...text);
  pdf.text('We sincerely thank you for your generous contribution', 105, 223 + contentShift, { align: 'center' });
  pdf.text('towards the charitable activities of', 105, 227 + contentShift, { align: 'center' });
  pdf.setFont('DejaVuSans', 'bold');
  pdf.setTextColor(...navy);
  pdf.text('KSR Apadbandhu Charitable Trust.', 105, 231 + contentShift, { align: 'center' });

  const signature = data['Authorised Signature'];
  if (signature) {
    pdf.setFont('DejaVuSans', 'normal');
    pdf.setFontSize(9);
    pdf.setTextColor(...text);
    pdf.text(signature, 17, 246 + contentShift);
  }
  pdf.setDrawColor(83, 102, 114);
  pdf.setLineWidth(0.3);
  pdf.line(17, 248 + contentShift, 79, 248 + contentShift);
  pdf.setFont('DejaVuSans', 'normal');
  pdf.setFontSize(9);
  pdf.setTextColor(...text);
  pdf.text('Authorised Signatory', 17, 253 + contentShift);
  pdf.text('KSR Apadbandhu Charitable Trust', 17, 258 + contentShift);
  pdf.setDrawColor(154, 168, 176);
  pdf.setLineDashPattern([1, 1], 0);
  pdf.circle(177, 248 + contentShift, 11, 'S');
  pdf.setLineDashPattern([], 0);
  pdf.setFontSize(7);
  pdf.setTextColor(130, 145, 154);
  pdf.text(['OFFICIAL', 'SEAL'].join('\n'), 177, 247 + contentShift, { align: 'center' });

  pdf.setDrawColor(...navy);
  pdf.setLineWidth(0.45);
  pdf.line(14, 269, 196, 269);
  pdf.setFont('DejaVuSans', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(...text);
  pdf.text(settings.address || '[TRUST ADDRESS]', 105, 276, { align: 'center', maxWidth: 180 });
  pdf.text([settings.phone || '[PHONE NUMBER]', settings.email || '[EMAIL ADDRESS]', settings.website || '[WEBSITE]'].join('  |  '), 105, 281, { align: 'center', maxWidth: 180 });
  const pageCount = pdf.internal.getNumberOfPages();
  if (pageCount !== 1) {
    throw new Error('The donation receipt PDF must fit on exactly one A4 page.');
  }
  pdf.save(filename);
  return {
    pageCount,
    pageWidth: pdf.internal.pageSize.getWidth(),
    pageHeight: pdf.internal.pageSize.getHeight(),
  };
}
