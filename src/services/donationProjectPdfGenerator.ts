import {
  DonationRequest,
  ORG_NAME,
  ORG_TAGLINE,
  ProjectLedgerItem,
  Transaction,
  WelfareProject,
} from '../types';
import { ORG_CONTACT } from './contactConfig';
import {
  canvasToPngBlob,
  drawCenteredLogoWatermark,
  loadCachedLogoImage,
  ORG_WATERMARK_LOGO_FALLBACK,
} from './watermarkUtils';

export interface OrgFinanceSummary {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
}

export interface PdfPrintPayload {
  kind: 'project' | 'donor' | 'donation';
  documentTitle: string;
  referenceNo?: string;
  projectName: string;
  donorName: string;
  amount: number;
  date: string;
  totalIncome: number;
  totalExpense: number;
  currentBalance: number;
  orgSummary?: OrgFinanceSummary;
  incomeList?: ProjectLedgerItem[];
  expenseList?: ProjectLedgerItem[];
  paymentInfo?: string;
  statusLabel?: string;
  note?: string;
}

export function buildProjectPdfPayload(
  project: WelfareProject,
  orgSummary: OrgFinanceSummary
): PdfPrintPayload {
  const hasIncomeList = Boolean(project.incomeList && project.incomeList.length > 0);
  const hasExpenseList = Boolean(project.expenseList && project.expenseList.length > 0);

  const projectIncome = hasIncomeList
    ? project.incomeList!.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : Number(project.raisedAmount) || 0;

  const projectExpense = hasExpenseList
    ? project.expenseList!.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : 0;

  const useProjectTotals = hasIncomeList || hasExpenseList;

  const totalIncome = useProjectTotals ? projectIncome : orgSummary.totalIncome;
  const totalExpense = useProjectTotals ? projectExpense : orgSummary.totalExpense;
  const currentBalance = useProjectTotals
    ? projectIncome - projectExpense
    : orgSummary.netBalance;

  const donorCount = project.incomeList?.length || 0;

  return {
    kind: 'project',
    documentTitle: 'প্রকল্প আর্থিক প্রতিবেদন',
    referenceNo: `PRJ-${project.id.toUpperCase()}`,
    projectName: project.title,
    donorName:
      donorCount > 0
        ? `সকল দাতাবৃন্দ (${donorCount} জন)`
        : 'প্রকল্প তহবিল (সকল দাতা)',
    amount: projectIncome,
    date: project.startDate || new Date().toISOString().slice(0, 10),
    totalIncome,
    totalExpense,
    currentBalance,
    orgSummary: useProjectTotals ? orgSummary : undefined,
    incomeList: project.incomeList,
    expenseList: project.expenseList,
    statusLabel: project.status,
    note: project.note || project.description,
  };
}

export function buildDonorPdfPayload(
  project: WelfareProject,
  donor: ProjectLedgerItem,
  donorIndex: number,
  orgSummary: OrgFinanceSummary
): PdfPrintPayload {
  const hasIncomeList = Boolean(project.incomeList && project.incomeList.length > 0);
  const hasExpenseList = Boolean(project.expenseList && project.expenseList.length > 0);

  const projectIncome = hasIncomeList
    ? project.incomeList!.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : Number(project.raisedAmount) || 0;

  const projectExpense = hasExpenseList
    ? project.expenseList!.reduce((sum, item) => sum + (Number(item.amount) || 0), 0)
    : 0;

  const useProjectTotals = hasIncomeList || hasExpenseList;

  return {
    kind: 'donor',
    documentTitle: 'দাতার অনুদান রসিদ',
    referenceNo: `DON-${project.id.toUpperCase()}-${String(donorIndex + 1).padStart(2, '0')}`,
    projectName: project.title,
    donorName: donor.name,
    amount: Number(donor.amount) || 0,
    date: project.startDate || new Date().toISOString().slice(0, 10),
    totalIncome: useProjectTotals ? projectIncome : orgSummary.totalIncome,
    totalExpense: useProjectTotals ? projectExpense : orgSummary.totalExpense,
    currentBalance: useProjectTotals
      ? projectIncome - projectExpense
      : orgSummary.netBalance,
    orgSummary: useProjectTotals ? orgSummary : undefined,
    statusLabel: project.status,
    note: project.description,
  };
}

const REQ_STATUS_LABEL: Record<'pending' | 'approved' | 'rejected', string> = {
  pending: 'অপেক্ষমাণ',
  approved: 'অনুমোদিত',
  rejected: 'বাতিল',
};

export function buildDonationRequestPdfPayload(
  req: DonationRequest,
  orgSummary: OrgFinanceSummary
): PdfPrintPayload {
  return {
    kind: 'donation',
    documentTitle: 'অনুদান রসিদ ও হিসাব বিবরণী',
    referenceNo: req.trxId ? `TRX-${req.trxId}` : `REQ-${req.id.slice(-6).toUpperCase()}`,
    projectName: req.category || 'সাধারণ অনুদান',
    donorName: req.phone ? `${req.donorName} (${req.phone})` : req.donorName,
    amount: Number(req.amount) || 0,
    date: req.submittedAt ? req.submittedAt.slice(0, 10) : new Date().toISOString().slice(0, 10),
    totalIncome: orgSummary.totalIncome,
    totalExpense: orgSummary.totalExpense,
    currentBalance: orgSummary.netBalance,
    paymentInfo: `${req.paymentMethod}${req.trxId ? ` · TrxID: ${req.trxId}` : ''}`,
    statusLabel: REQ_STATUS_LABEL[req.status],
    note: req.note,
  };
}

function extractDonorNameFromTransaction(tx: Transaction): string {
  const desc = (tx.description || '').trim();
  if (!desc) return tx.type === 'income' ? 'দাতা / সদস্য' : 'ব্যয় খাত';
  const beforeDash = desc.split('—')[0]?.trim() || desc;
  return beforeDash;
}

export function buildTransactionDonationPdfPayload(
  tx: Transaction,
  orgSummary: OrgFinanceSummary
): PdfPrintPayload {
  return {
    kind: 'donation',
    documentTitle: tx.type === 'income' ? 'অনুদান / আয় রসিদ' : 'আর্থিক লেনদেন বিবরণী',
    referenceNo: tx.receiptNo || tx.id,
    projectName: tx.category || 'সাধারণ তহবিল',
    donorName: extractDonorNameFromTransaction(tx),
    amount: Number(tx.amount) || 0,
    date: tx.date || new Date().toISOString().slice(0, 10),
    totalIncome: orgSummary.totalIncome,
    totalExpense: orgSummary.totalExpense,
    currentBalance: orgSummary.netBalance,
    statusLabel: tx.type === 'income' ? 'আয় (জমা)' : 'ব্যয় (খরচ)',
    note: tx.description,
  };
}



function getWrappedLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const paragraphs = String(text || '').split('\n');
  const allLines: string[] = [];

  for (const para of paragraphs) {
    if (!para.trim()) continue;
    const words = para.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      if (ctx.measureText(testLine).width > maxWidth && currentLine) {
        allLines.push(currentLine);
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) allLines.push(currentLine);
  }
  return allLines;
}

function formatTaka(amount: number): string {
  return `৳ ${Number(amount || 0).toLocaleString('en-US')}/-`;
}

export function getPdfFileName(payload: PdfPrintPayload): string {
  const safeDate = (payload.date || new Date().toISOString().slice(0, 10)).replace(/[^0-9-]/g, '');
  const prefix =
    payload.kind === 'project'
      ? 'Project-Report'
      : payload.kind === 'donor'
        ? 'Donor-Receipt'
        : 'Donation-Receipt';
  return `${prefix}-${safeDate}.pdf`;
}

export function getImageFileName(payload: PdfPrintPayload): string {
  return getPdfFileName(payload).replace(/\.pdf$/i, '.png');
}

async function renderDonationProjectCanvas(
  payload: PdfPrintPayload,
  logoUrl?: string
): Promise<HTMLCanvasElement> {
  if (typeof document !== 'undefined' && 'fonts' in document && document.fonts?.ready) {
    try {
      await document.fonts.ready;
    } catch {
      // Ignore font readiness fallback
    }
  }

  const pageWidth = 1240;
  const pageHeight = 1754;
  const marginX = 76;
  const contentWidth = pageWidth - marginX * 2;

  const canvas = document.createElement('canvas');
  canvas.width = pageWidth;
  canvas.height = pageHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context not available');

  // White background
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, pageWidth, pageHeight);

  // Pre-compute layout coordinates
  const headerY = 48;
  const badgeY = headerY + 148;
  const badgeW = 420;
  const badgeH = 50;
  const badgeX = (pageWidth - badgeW) / 2;
  const metaY = badgeY + 70;
  const tableStartY = metaY + 66;

  const detailRows: { label: string; value: string; highlight?: boolean }[] = [
    { label: 'প্রকল্পের নাম', value: payload.projectName },
    { label: 'দাতার নাম', value: payload.donorName },
    { label: 'টাকার পরিমাণ', value: formatTaka(payload.amount), highlight: true },
    { label: 'তারিখ', value: payload.date },
  ];
  if (payload.paymentInfo) {
    detailRows.push({ label: 'পেমেন্ট মাধ্যম', value: payload.paymentInfo });
  }
  if (payload.statusLabel) {
    detailRows.push({ label: 'অবস্থা / স্ট্যাটাস', value: payload.statusLabel });
  }

  const rowH = 50;
  const tableH = detailRows.length * rowH;
  const cardsY = tableStartY + tableH + 22;
  const cardGap = 18;
  const cardW = (contentWidth - cardGap * 2) / 3;
  const cardH = 88;
  let afterCardsY = cardsY + cardH + 16;

  const orgSummaryY = afterCardsY;
  if (payload.orgSummary) {
    afterCardsY += 54;
  }

  const hasIncomeItems = Boolean(payload.incomeList && payload.incomeList.length > 0);
  const hasExpenseItems = Boolean(payload.expenseList && payload.expenseList.length > 0);
  const colGap = 20;
  const colW = hasIncomeItems && hasExpenseItems ? (contentWidth - colGap) / 2 : contentWidth;
  const maxListBottom = pageHeight - 270;
  const availableH = Math.max(180, maxListBottom - afterCardsY);
  const maxItems = Math.max(
    payload.incomeList?.length || 0,
    payload.expenseList?.length || 0
  );
  const itemRowH =
    maxItems > 0 ? Math.min(36, Math.max(24, Math.floor((availableH - 76) / maxItems))) : 32;

  const summaryCards = [
    {
      label: 'মোট আয়',
      value: formatTaka(payload.totalIncome),
      bg: '#ecfdf5',
      border: '#a7f3d0',
      labelColor: '#047857',
      valColor: '#065f46',
    },
    {
      label: 'মোট ব্যয়',
      value: formatTaka(payload.totalExpense),
      bg: '#fef2f2',
      border: '#fecaca',
      labelColor: '#b91c1c',
      valColor: '#991b1b',
    },
    {
      label: 'বর্তমান ব্যালেন্স',
      value: formatTaka(payload.currentBalance),
      bg: '#eff6ff',
      border: '#bfdbfe',
      labelColor: '#1d4ed8',
      valColor: '#1e3a8a',
    },
  ];

  // Layer 1: Background fills for badges, strips, table label column, cards & notes
  ctx.fillStyle = '#ecfdf5';
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
  ctx.fill();

  ctx.fillStyle = '#f8fafc';
  ctx.beginPath();
  ctx.roundRect(marginX, metaY, contentWidth, 44, 8);
  ctx.fill();

  detailRows.forEach((_, idx) => {
    const ry = tableStartY + idx * rowH;
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(marginX + 1, ry + 1, 250, rowH - 2);
  });

  summaryCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + cardGap);
    ctx.fillStyle = c.bg;
    ctx.beginPath();
    ctx.roundRect(cx, cardsY, cardW, cardH, 10);
    ctx.fill();
  });

  if (payload.orgSummary) {
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.roundRect(marginX, orgSummaryY, contentWidth, 38, 8);
    ctx.fill();
  }

  if (hasIncomeItems && payload.incomeList) {
    const totY = afterCardsY + 38 + payload.incomeList.length * itemRowH;
    ctx.fillStyle = '#ecfdf5';
    ctx.beginPath();
    ctx.roundRect(marginX + 1, totY, colW - 2, 37, [0, 0, 9, 9]);
    ctx.fill();
  }

  if (hasExpenseItems && payload.expenseList) {
    const expX = hasIncomeItems ? marginX + colW + colGap : marginX;
    const totY = afterCardsY + 38 + payload.expenseList.length * itemRowH;
    ctx.fillStyle = '#fef2f2';
    ctx.beginPath();
    ctx.roundRect(expX + 1, totY, colW - 2, 37, [0, 0, 9, 9]);
    ctx.fill();
  } else if (!hasIncomeItems && payload.note) {
    ctx.fillStyle = '#fafaf9';
    ctx.beginPath();
    ctx.roundRect(marginX, afterCardsY, contentWidth, 120, 10);
    ctx.fill();
  }

  // Layer 2: Mandatory large centered organization logo watermark (strictly BEHIND all text)
  const activeLogo = logoUrl || ORG_WATERMARK_LOGO_FALLBACK;
  const loadedLogo = await loadCachedLogoImage(activeLogo);
  drawCenteredLogoWatermark(ctx, pageWidth, pageHeight, loadedLogo, 0.14);

  // Layer 3: All borders, accent bars, headers, text, tables, and signatures ON TOP
  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, 0, pageWidth, 18);

  // 1. Org Header (Logo + Name + Tagline + Address)
  const logoSize = 96;
  const logoX = marginX;
  const logoY = headerY + 4;

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
    ctx.font = '700 22px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('আল আজহার', logoX + logoSize / 2, logoY + logoSize / 2 + 8);
    ctx.textAlign = 'left';
  }

  const textStartX = logoX + logoSize + 24;
  ctx.fillStyle = '#065f46';
  ctx.font = '700 36px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_NAME, textStartX, headerY + 38);

  ctx.fillStyle = '#047857';
  ctx.font = '600 18px "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_TAGLINE, textStartX, headerY + 66);

  ctx.fillStyle = '#475569';
  ctx.font = '400 15px "Noto Sans Bengali", sans-serif';
  ctx.fillText(
    `${ORG_CONTACT.addressLine1}, ${ORG_CONTACT.addressLine2}  |  মোবাইল: ${ORG_CONTACT.phoneDisplay}`,
    textStartX,
    headerY + 94
  );

  // Header divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(marginX, headerY + 120);
  ctx.lineTo(pageWidth - marginX, headerY + 120);
  ctx.stroke();

  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(marginX, headerY + 125);
  ctx.lineTo(marginX + 210, headerY + 125);
  ctx.stroke();

  // 2. Document Title Badge border & text
  ctx.strokeStyle = '#059669';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 10);
  ctx.stroke();

  ctx.fillStyle = '#065f46';
  ctx.font = '700 24px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(payload.documentTitle, pageWidth / 2, badgeY + 34);
  ctx.textAlign = 'left';

  // 3. Meta Strip border & text
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, metaY, contentWidth, 44, 8);
  ctx.stroke();

  ctx.fillStyle = '#334155';
  ctx.font = '600 16px "Noto Sans Bengali", sans-serif';
  ctx.fillText(
    `রসিদ / রেফারেন্স নং: ${payload.referenceNo || 'AAIS-DOC'}`,
    marginX + 18,
    metaY + 28
  );

  ctx.textAlign = 'right';
  ctx.fillStyle = '#0f172a';
  ctx.fillText(`তারিখ: ${payload.date}`, pageWidth - marginX - 18, metaY + 28);
  ctx.textAlign = 'left';

  // 4. Core Required Fields Box borders & text
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.roundRect(marginX, tableStartY, contentWidth, tableH, 10);
  ctx.stroke();

  detailRows.forEach((row, idx) => {
    const ry = tableStartY + idx * rowH;
    if (idx > 0) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(marginX, ry);
      ctx.lineTo(marginX + contentWidth, ry);
      ctx.stroke();
    }

    ctx.strokeStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(marginX + 252, ry);
    ctx.lineTo(marginX + 252, ry + rowH);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '700 18px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(row.label, marginX + 18, ry + 32);

    ctx.fillStyle = row.highlight ? '#065f46' : '#0f172a';
    ctx.font = row.highlight
      ? '700 22px "Hind Siliguri", "Noto Sans Bengali", sans-serif'
      : '600 18px "Noto Sans Bengali", sans-serif';

    const valueLines = getWrappedLines(ctx, row.value, contentWidth - 285);
    ctx.fillText(valueLines[0] || row.value, marginX + 272, ry + 32);
  });

  // 5. Financial Totals Cards borders & text
  summaryCards.forEach((c, idx) => {
    const cx = marginX + idx * (cardW + cardGap);
    ctx.strokeStyle = c.border;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(cx, cardsY, cardW, cardH, 10);
    ctx.stroke();

    ctx.fillStyle = c.labelColor;
    ctx.font = '700 17px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(c.label, cx + 18, cardsY + 32);

    ctx.fillStyle = c.valColor;
    ctx.font = '700 26px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(c.value, cx + 18, cardsY + 68);
  });

  // Optional Org Overall Summary Strip border & text
  if (payload.orgSummary) {
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(marginX, orgSummaryY, contentWidth, 38, 8);
    ctx.stroke();

    ctx.fillStyle = '#334155';
    ctx.font = '600 14px "Noto Sans Bengali", sans-serif';
    ctx.fillText(
      `সংস্থার সার্বিক তহবিল — মোট আয়: ${formatTaka(payload.orgSummary.totalIncome)}   |   মোট ব্যয়: ${formatTaka(payload.orgSummary.totalExpense)}   |   বর্তমান ব্যালেন্স: ${formatTaka(payload.orgSummary.netBalance)}`,
      marginX + 16,
      orgSummaryY + 24
    );
  }

  // 6. Project Donor & Expense Breakdown borders & text
  if (hasIncomeItems || hasExpenseItems) {
    const drawLedgerForeground = (
      x: number,
      w: number,
      title: string,
      headerBg: string,
      borderColor: string,
      totalText: string,
      items: ProjectLedgerItem[]
    ) => {
      const boxH = 38 + items.length * itemRowH + 38;
      ctx.strokeStyle = borderColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(x, afterCardsY, w, boxH, 10);
      ctx.stroke();

      ctx.fillStyle = headerBg;
      ctx.beginPath();
      ctx.roundRect(x, afterCardsY, w, 38, [10, 10, 0, 0]);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = '700 16px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText(title, x + 14, afterCardsY + 25);

      ctx.font = '500 14px "Noto Sans Bengali", sans-serif';
      items.forEach((item, i) => {
        const iy = afterCardsY + 38 + i * itemRowH;
        if (i > 0) {
          ctx.strokeStyle = '#f1f5f9';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(x, iy);
          ctx.lineTo(x + w, iy);
          ctx.stroke();
        }
        ctx.fillStyle = '#1e293b';
        ctx.textAlign = 'left';
        ctx.fillText(`${i + 1}. ${item.name}`, x + 12, iy + Math.round(itemRowH * 0.66));

        ctx.fillStyle = '#0f172a';
        ctx.font = '700 14px "Noto Sans Bengali", sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`${item.amount}/-`, x + w - 12, iy + Math.round(itemRowH * 0.66));
        ctx.font = '500 14px "Noto Sans Bengali", sans-serif';
        ctx.textAlign = 'left';
      });

      const totY = afterCardsY + 38 + items.length * itemRowH;
      ctx.fillStyle = '#0f172a';
      ctx.font = '700 15px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
      ctx.fillText('সর্বমোট', x + 14, totY + 24);
      ctx.textAlign = 'right';
      ctx.fillText(totalText, x + w - 14, totY + 24);
      ctx.textAlign = 'left';
    };

    if (hasIncomeItems && payload.incomeList) {
      const incTotal = payload.incomeList.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      drawLedgerForeground(
        marginX,
        colW,
        `আয় / দাতাবৃন্দের তালিকা (${payload.incomeList.length} জন)`,
        '#065f46',
        '#a7f3d0',
        `${incTotal}/- টাকা`,
        payload.incomeList
      );
    }
    if (hasExpenseItems && payload.expenseList) {
      const expTotal = payload.expenseList.reduce((s, x) => s + (Number(x.amount) || 0), 0);
      const expX = hasIncomeItems ? marginX + colW + colGap : marginX;
      drawLedgerForeground(
        expX,
        colW,
        `ব্যয়ের খাতসমূহ (${payload.expenseList.length}টি)`,
        '#1e293b',
        '#fecaca',
        `${expTotal}/- টাকা`,
        payload.expenseList
      );
    }
  } else if (payload.note) {
    ctx.strokeStyle = '#e7e5e4';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(marginX, afterCardsY, contentWidth, 120, 10);
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '700 16px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText('বিবরণ / নোট:', marginX + 18, afterCardsY + 30);

    ctx.fillStyle = '#1e293b';
    ctx.font = '400 16px "Noto Sans Bengali", sans-serif';
    const noteLines = getWrappedLines(ctx, payload.note, contentWidth - 36);
    noteLines.slice(0, 3).forEach((line, idx) => {
      ctx.fillText(line, marginX + 18, afterCardsY + 60 + idx * 24);
    });
  }

  // 7. Signatures Area
  const sigY = pageHeight - 195;
  const sigLabels = ['হিসাবরক্ষক / কোষাধ্যক্ষ', 'সাধারণ সম্পাদক', 'সভাপতি'];
  const sigW = 280;
  const sigSpacing = (contentWidth - sigW * 3) / 2;

  sigLabels.forEach((label, idx) => {
    const sx = marginX + idx * (sigW + sigSpacing);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(sx, sigY);
    ctx.lineTo(sx + sigW, sigY);
    ctx.stroke();

    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.font = '700 17px "Hind Siliguri", "Noto Sans Bengali", sans-serif';
    ctx.fillText(label, sx + sigW / 2, sigY + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '500 14px "Noto Sans Bengali", sans-serif';
    ctx.fillText(ORG_NAME, sx + sigW / 2, sigY + 50);
  });
  ctx.textAlign = 'left';

  // 8. Footer Strip
  const footerY = pageHeight - 86;
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(marginX, footerY);
  ctx.lineTo(pageWidth - marginX, footerY);
  ctx.stroke();

  ctx.fillStyle = '#475569';
  ctx.font = '600 15px "Noto Sans Bengali", sans-serif';
  ctx.fillText(ORG_NAME, marginX, footerY + 32);

  ctx.textAlign = 'right';
  ctx.font = '500 14px "Noto Sans Bengali", sans-serif';
  ctx.fillText(
    `ফোন: ${ORG_CONTACT.phoneDisplay}  |  ইমেইল: ${ORG_CONTACT.email}`,
    pageWidth - marginX,
    footerY + 32
  );
  ctx.textAlign = 'left';

  ctx.fillStyle = '#065f46';
  ctx.fillRect(0, pageHeight - 14, pageWidth, 14);

  return canvas;
}

export async function generateDonationProjectPdfBlob(
  payload: PdfPrintPayload,
  logoUrl?: string
): Promise<{ blob: Blob; fileName: string }> {
  const [canvas, { jsPDF }] = await Promise.all([
    renderDonationProjectCanvas(payload, logoUrl),
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

  const fileName = getPdfFileName(payload);
  const blob = doc.output('blob');
  return { blob, fileName };
}

export async function generateDonationProjectImageBlob(
  payload: PdfPrintPayload,
  logoUrl?: string
): Promise<{ blob: Blob; fileName: string }> {
  const canvas = await renderDonationProjectCanvas(payload, logoUrl);
  const blob = await canvasToPngBlob(canvas);
  return {
    blob,
    fileName: getImageFileName(payload),
  };
}
