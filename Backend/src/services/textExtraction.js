const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFile } = require('child_process');
const { promisify } = require('util');
const pdfParseModule = require('pdf-parse');
const pdfParseFn = typeof pdfParseModule === 'function'
  ? pdfParseModule
  : pdfParseModule && typeof pdfParseModule.default === 'function'
    ? pdfParseModule.default
    : null;
const PDFParseClass = pdfParseModule && typeof pdfParseModule.PDFParse === 'function'
  ? pdfParseModule.PDFParse
  : null;

const execFileAsync = promisify(execFile);

async function extractTextPdfParse(filePath) {
  const buffer = await fs.promises.readFile(filePath);

  let text = '';
  if (pdfParseFn) {
    const data = await pdfParseFn(buffer);
    text = (data.text || '').trim();
  } else if (PDFParseClass) {
    const parser = new PDFParseClass({});
    await parser.load(buffer);
    const extracted = await parser.getText();
    text = (typeof extracted === 'string' ? extracted : (extracted?.text || '')).trim();
  } else {
    throw new Error('pdf-parse is not a function');
  }

  return {
    method: 'pdf-parse',
    text,
    pages: [],
  };
}

async function runPdftoppmToPngs(inputPdfPath, outputDir) {
  const prefix = path.join(outputDir, 'page');
  try {
    await execFileAsync('pdftoppm', ['-png', '-r', '200', inputPdfPath, prefix]);
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw new Error('pdftoppm not found. Install poppler-utils (macOS: brew install poppler)');
    }
    throw err;
  }
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

  let stdout;
  try {
    ({ stdout } = await execFileAsync('tesseract', args, { maxBuffer: 1024 * 1024 * 50 }));
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      throw new Error('tesseract not found. Install tesseract (macOS: brew install tesseract tesseract-lang)');
    }
    throw err;
  }
  return (stdout || '').trim();
}

async function extractTextOcr(filePath, { ocrLang, onProgress }) {
  const tmpBase = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'missionschool-ocr-'));
  try {
    const pngs = await runPdftoppmToPngs(filePath, tmpBase);
    const pages = [];
    if (typeof onProgress === 'function') {
      onProgress({ phase: 'ocr', current: 0, total: pngs.length });
    }
    for (const pngPath of pngs) {
      const m = pngPath.match(/page-(\d+)\.png$/);
      const pageNum = m ? Number(m[1]) : pages.length + 1;
      const text = await ocrImage(pngPath, ocrLang);
      pages.push({ page: pageNum, text });
      if (typeof onProgress === 'function') {
        onProgress({ phase: 'ocr', current: pages.length, total: pngs.length, page: pageNum });
      }
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
  const onProgress = typeof opts.onProgress === 'function' ? opts.onProgress : undefined;

  let parsed;
  try {
    parsed = await extractTextPdfParse(filePath);
  } catch {
    parsed = { method: 'pdf-parse', text: '', pages: [] };
  }
  if (parsed.text && parsed.text.length >= minChars) {
    return parsed;
  }

  const ocred = await extractTextOcr(filePath, { ocrLang, onProgress });
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
