export async function downloadDocumentPdf(element, filename) {
  if (!element) throw new Error('The document preview is not available.');
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import('html2canvas'),
    import('jspdf'),
  ]);
  const canvas = await html2canvas(element, {
    scale: 2,
    backgroundColor: '#ffffff',
    useCORS: true,
  });
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const image = canvas.toDataURL('image/png');
  const renderedHeight = (canvas.height * pageWidth) / canvas.width;
  let offset = 0;
  while (offset < renderedHeight) {
    if (offset > 0) pdf.addPage();
    pdf.addImage(image, 'PNG', 0, -offset, pageWidth, renderedHeight);
    offset += pageHeight;
  }
  pdf.save(filename);
}
