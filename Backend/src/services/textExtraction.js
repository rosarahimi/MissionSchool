const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const pdfParse = require('pdf-parse');

const execFileAsync = promisify(execFile);

async function extractTextPdfParse(filePath) {
  const buffer = await fs.promises.readFile(filePath);
  const data = await pdfParse(buffer);
  const text = (data.text || '').trim();
  return {
    method: 'pdf-parse',
    text,
    pages: [],
  };
}

async function runPdftoppmToPngs(inputPdfPath, outputDir) {
  const prefix = path.join(outputDir, 'page');
  await execFileAsync('pdftoppm', ['-png', '-r', '200', inputPdfPath, prefix]);
  const files = (await fs.promises.readdir(outputDir))
    .filter(f => /^page-\d+\.png$/.test(f))
    .sort((a, b) => {
      const na = Number(a.match(/page-(\d+)\.png/)[1]);
      const nb = Number(b.match(/page-(\d+)\.png/)[1]);
      return na - nb;
    })
    .map(f => path.join(outputDir, f));
  return files;
}

async function ocrImage(imagePath, lang) {
  const args = [imagePath, 'stdout'];
  if (lang) args.push('-l', lang);
  // Improve layout handling for typical textbook pages
  args.push('--psm', '6');

  const { stdout } = await execFileAsync('tesseract', args, { maxBuffer: 1024 * 1024 * 50 });
  return (stdout || '').trim();
}

async function extractTextOcr(filePath, { ocrLang }) {
  const tmpBase = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'missionschool-ocr-'));
  try {
    const pngs = await runPdftoppmToPngs(filePath, tmpBase);
    const pages = [];
    for (const pngPath of pngs) {
      const m = pngPath.match(/page-(\d+)\.png$/);
      const pageNum = m ? Number(m[1]) : pages.length + 1;
      const text = await ocrImage(pngPath, ocrLang);
      pages.push({ page: pageNum, text });
    }
    const fullText = pages.map(p => p.text).filter(Boolean).join('\n\n').trim();
    return {
      method: 'ocr',
      text: fullText,
      pages,
    };
  } finally {
    await fs.promises.rm(tmpBase, { recursive: true, force: true });
  }
}

async function extractTextFromPdf(filePath, opts = {}) {
  const minChars = typeof opts.minChars === 'number' ? opts.minChars : 800;
  const ocrLang = opts.ocrLang || process.env.OCR_LANG || 'fas';

  const parsed = await extractTextPdfParse(filePath);
  if (parsed.text && parsed.text.length >= minChars) {
    return parsed;
  }

  const ocred = await extractTextOcr(filePath, { ocrLang });
  const method = parsed.text && ocred.text ? 'mixed' : 'ocr';
  const combinedText = [parsed.text, ocred.text].filter(Boolean).join('\n\n').trim();

  return {
    method,
    text: combinedText,
    pages: ocred.pages,
    ocrLang,
  };
}

module.exports = {
  extractTextFromPdf,
};
