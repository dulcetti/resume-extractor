import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

function isTextItem(item: TextItem | TextMarkedContent): item is TextItem {
  return 'str' in item;
}

export async function extractTextFromPDF(file: File): Promise<string> {
  const pdfjsLib = await import('pdfjs-dist');
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/js/pdf.worker.min.mjs';

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .filter(isTextItem)
      .map((item) => item.str)
      .join(' ')
      .replace(/\s{3,}/g, '\n');
    fullText += `\n--- Página ${i} ---\n${pageText}`;
  }

  return fullText.trim();
}
