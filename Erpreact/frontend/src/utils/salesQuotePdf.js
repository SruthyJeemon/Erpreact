import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

/** Same tiling logic as SalesQuoteApprovalView — returns raw base64 (no data: prefix). */
export async function salesQuoteElementToPdfBase64(element) {
    if (!element) throw new Error('Template element not found');

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('p', 'mm', 'a4');
    const imgProps = pdf.getImageProperties(imgData);
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfPageHeight = pdf.internal.pageSize.getHeight();
    const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

    const marginTopMm = 8;
    const marginBottomMm = 8;
    const overlapMm = 0;
    const continuationTopPadMm = 14;

    const usablePageHeight = Math.max(1, pdfPageHeight - marginTopMm - marginBottomMm);
    const stepHeight = Math.max(1, usablePageHeight - overlapMm);
    const totalPages = Math.max(1, Math.ceil(pdfHeight / stepHeight));

    for (let page = 0; page < totalPages; page++) {
        if (page > 0) pdf.addPage();
        const y = page === 0 ? marginTopMm : continuationTopPadMm - page * stepHeight;
        pdf.addImage(imgData, 'PNG', 0, y, pdfWidth, pdfHeight);
        if (page > 0 && continuationTopPadMm > 0) {
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pdfWidth, continuationTopPadMm, 'F');
        }
    }

    const dataUrl = pdf.output('datauristring');
    const comma = dataUrl.indexOf(',');
    return comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
}
