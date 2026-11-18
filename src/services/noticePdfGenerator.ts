import { Notice, ORG_NAME, ORG_TAGLINE } from '../types';
import { ORG_CONTACT } from './contactConfig';
import {
  canvasToPngBlob,
  drawCenteredLogoWatermark,
  loadCachedLogoImage,
  ORG_WATERMARK_LOGO_FALLBACK,
} from './watermarkUtils';

function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = text.split('\n');
  const allLines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) {
      allLines.push('');
      continue;
    }
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      allLines.push(currentLine);
    }
  }

  return allLines;
}

export function getNoticePdfFileName(notice: Notice): string {
  let datePart = '';
  if (notice.date && notice.date.includes('-')) {
    const parts = notice.date.split('-');
    if (parts.length === 3) {
      datePart = `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
  }
  if (!datePart) {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    datePart = `${pad(now.getDate())}-${pad(now.getMonth() + 1)}-${now.getFullYear()}`;
  }

  const isUrgent =
    Boolean(notice.important) ||
    notice.title.includes('জরুরী') ||
    notice.title.includes('জরুরি') ||
    notice.category.includes('জরুরী') ||
    notice.category.includes('জরুরি');

  const prefix = isUrgent ? 'Joruri-Notice' : 'Notice';
  return `${prefix}-${datePart}.pdf`;
}

export function getNoticeImageFileName(notice: Notice): string {
  return getNoticePdfFileName(notice).replace(/\.pdf$/i, '.png');
}

async function renderNoticeCanvas(
  notice: Notice,
  logoUrl?: string
): Promise<HTMLCanvasElement> {
  // Ensure Bengali web fonts are fully loaded
  if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Continue even if font ready check fails
    }
  }

  // A4 dimensions at ~150 DPI for crisp Bengali font rendering
  const pageWidth = 1240;
  const pageHeight = 1754;
  const marginX = 84;
  const contentWidth = pageWidth - marginX * 2;

  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Pure white page
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  // Pre-compute layout coordinates so card fills and watermark sit strictly BEHIND all text
  const headerY = 56;
  const badgeY = headerY + 165;
  const badgeHeight = 54;
  const badgeWidth = 320;
  const badgeX = (pageWidth - badgeWidth) / 2;
  const metaY = badgeY + 84;
  const titleY = metaY + 82;

  const isUrgent =
    Boolean(notice.important) ||
    notice.title.includes('জরুরী') ||
    notice.title.includes('জরুরি') ||
    notice.category.includes('জরুরী') ||
    notice.category.includes('জরুরি');

  ctx.font = '700 25px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  const titleLines = getWrappedLines(ctx, notice.title, contentWidth - 170);
  const curTitleY = titleY + Math.max(0, titleLines.length - 1) * 34;
  const titleUnderlineY = curTitleY + 22;

  ctx.font = '400 22px "Noto Sans Bengali", sans-serif';
  const bodyLines = getWrappedLines(ctx, notice.content, contentWidth - 60);
  const contentStartY = titleUnderlineY + 40;
  const calculatedHeight = Math.max(340, bodyLines.length * 40 + 70);
  const maxAllowedHeight = pageHeight - contentStartY - 330;
  const contentCardHeight = Math.min(maxAllowedHeight, calculatedHeight);

  // Layer 1: Soft card/badge background fills
  ctx.fillStyle = isUrgent ? '#fef2f2' : '#ecfdf5';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 12);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(marginX, metaY, contentWidth, 48, 8);
  ctx.fill();

  ctx.fillStyle = '#fafaf9';
  ctx.beginPath();
  ctx.roundRect(marginX, contentStartY, contentWidth, contentCardHeight, 12);
  ctx.fill();

  // Layer 2: Mandatory large centered organization logo watermark (strictly BEHIND text)
  const activeLogo = logoUrl || ORG_WATERMARK_LOGO_FALLBACK;
  const loadedLogo = await loadCachedLogoImage(activeLogo);
  drawCenteredLogoWatermark(ctx, pageWidth, pageHeight, loadedLogo, 0.14);

  // Layer 3: All borders, headers, text, signatures, and footer ON TOP of watermark
  // Top emerald accent bar
  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, pageWidth, 20);

  // 1. Institutional Header
  const logoSize = 100;
  const logoX = marginX;
  const logoY = headerY + 6;

  if (loadedLogo) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(loadedLogo, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#ecfdf5';
    ctx.strokeStyle = '#065f46';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(logoX + logoSize / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#065f46';
    ctx.font = '700 24px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('আল আজহার', logoX + logoSize / 2, logoY + logoSize / 2 + 8);
    ctx.textAlign = 'left';
  }

  // Header Title & Address (Aligned to right of logo)
  const textStartX = logoX + logoSize + 26;

  ctx.fillStyle = '#065f46';
  ctx.font = '700 38px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_NAME, textStartX, headerY + 40);

  ctx.fillStyle = '#047857';
  ctx.font = '600 19px "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_TAGLINE || 'শিক্ষা, সেবা, দাওয়াহ, ঐক্য', textStartX, headerY + 70);

  ctx.fillStyle = '#475569';
  ctx.font = '400 16px "Noto Sans Bengali", sans-serif';
  ctx.fillText('তুষখালী, তালেব মার্কেট, ছোট বিঘাই, পটুয়াখালী সদর, পটুয়াখালী।', textStartX, headerY + 98);

  // Decorative double divider line
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, headerY + 130);
  ctx.lineTo(pageWidth - marginX, headerY + 130);
  ctx.stroke();

  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(marginX, headerY + 135);
  ctx.lineTo(marginX + 200, headerY + 135);
  ctx.stroke();

  // 2. Prominent Center Notice Badge border & text
  ctx.strokeStyle = isUrgent ? '#dc2626' : '#059669';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 12);
  ctx.stroke();

  ctx.fillStyle = isUrgent ? '#b91c1c' : '#065f46';
  ctx.font = '700 28px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(isUrgent ? 'জরুরি নোটিশ' : notice.category || 'সাধারণ নোটিশ', pageWidth / 2, badgeY + 37);
  ctx.textAlign = 'left';

  // 3. Date & Institutional Reference Meta Strip border & text
  const displayDate = notice.displayDate || notice.date;
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, metaY, contentWidth, 48, 8);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '600 17px "Noto Sans Bengali", sans-serif';
  ctx.fillText(`স্মারক নং: AAIS/NOTICE/${notice.id}`, marginX + 20, metaY + 31);

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.font = '600 17px "Noto Sans Bengali", sans-serif';
  ctx.fillText(`তারিখ: ${displayDate}`, pageWidth - marginX - 20, metaY + 31);
  ctx.textAlign = 'left';

  // 4. Notice Subject / Title Block
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 21px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('বিষয় / শিরোনাম:', marginX, titleY);

  ctx.fillStyle = isUrgent ? '#991b1b' : '#065f46';
  ctx.font = '700 25px "Hind Siliguri", "Noto Sans Bengali", sans-serif';

  let drawnTitleY = titleY;
  titleLines.forEach((tLine, i) => {
    if (i === 0) {
      ctx.fillText(tLine, marginX + 160, drawnTitleY);
    } else {
      drawnTitleY += 34;
      ctx.fillText(tLine, marginX + 160, drawnTitleY);
    }
  });

  // Divider under Title
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, titleUnderlineY);
  ctx.lineTo(pageWidth - marginX, titleUnderlineY);
  ctx.stroke();

  // 5. Notice Main Content Body border, stripe & text
  ctx.strokeStyle = '#e7e5e4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, contentStartY, contentWidth, contentCardHeight, 12);
  ctx.stroke();

  // Left vertical colored accent stripe on content card
  ctx.fillStyle = isUrgent ? '#dc2626' : '#059669';
  ctx.fillRect(marginX, contentStartY, 8, contentCardHeight);

  // Content Paragraph lines
  ctx.fillStyle = '#1e293b';
  ctx.font = '400 22px "Noto Sans Bengali", sans-serif';

  let textY = contentStartY + 50;
  const lineHeight = 38;

  for (const line of bodyLines) {
    if (textY > contentStartY + contentCardHeight - 30) break;
    ctx.fillText(line, marginX + 34, textY);
    textY += lineHeight;
  }

  // 6. Signatures Area (Secretary & President side-by-side with date)
  const sigAreaY = contentStartY + contentCardHeight + 75;
  const sigColWidth = 340;
  const leftSigX = marginX + 50;
  const rightSigX = pageWidth - marginX - sigColWidth - 50;

  // General Secretary Signature Block
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(leftSigX, sigAreaY);
  ctx.lineTo(leftSigX + sigColWidth, sigAreaY);
  ctx.stroke();

  ctx.textAlign = 'center';
  const leftCenterX = leftSigX + sigColWidth / 2;
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('সাধারণ সম্পাদক', leftCenterX, sigAreaY + 32);

  ctx.fillStyle = '#475569';
  ctx.font = '500 16px "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_NAME, leftCenterX, sigAreaY + 58);
  ctx.fillText(`তারিখ: ${displayDate}`, leftCenterX, sigAreaY + 84);

  // President Signature Block
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(rightSigX, sigAreaY);
  ctx.lineTo(rightSigX + sigColWidth, sigAreaY);
  ctx.stroke();

  const rightCenterX = rightSigX + sigColWidth / 2;
  ctx.fillStyle = '#0f172a';
  ctx.font = '700 20px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText('সভাপতি', rightCenterX, sigAreaY + 32);

  ctx.fillStyle = '#475569';
  ctx.font = '500 16px "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_NAME, rightCenterX, sigAreaY + 58);
  ctx.fillText(`তারিখ: ${displayDate}`, rightCenterX, sigAreaY + 84);
  ctx.textAlign = 'left';

  // 7. Footer Strip
  const footerY = pageHeight - 95;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, footerY);
  ctx.lineTo(pageWidth - marginX, footerY);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 16px "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_NAME, marginX, footerY + 34);

  ctx.textAlign = 'right';
  ctx.font = '500 15px "Noto Sans Bengali", sans-serif';
  ctx.fillText(
    `ফোন: ${ORG_CONTACT.phoneDisplay}  |  ইমেইল: ${ORG_CONTACT.email}`,
    pageWidth - marginX,
    footerY + 34
  );
  ctx.textAlign = 'left';

  // Bottom emerald bar
  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, pageHeight - 16, pageWidth, 16);

  return canvas;
}

export async function generateNoticePdfBlob(
  notice: Notice,
  logoUrl?: string
): Promise<{ blob: Blob; fileName: string }> {
  const [canvas, { jsPDF }] = await Promise.all([
    renderNoticeCanvas(notice, logoUrl),
    import('jspdf'),
  ]);

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    compress: true,
  });

  const imgData = canvas.toDataURL('image/jpeg', 0.95);
  doc.addImage(imgData, 'JPEG', 0, 0, 210, 297);

  const fileName = getNoticePdfFileName(notice);
  const blob = doc.output('blob');

  return { blob, fileName };
}

export async function generateNoticeImageBlob(
  notice: Notice,
  logoUrl?: string
): Promise<{ blob: Blob; fileName: string }> {
  const canvas = await renderNoticeCanvas(notice, logoUrl);
  const blob = await canvasToPngBlob(canvas);
  return {
    blob,
    fileName: getNoticeImageFileName(notice),
  };
}
