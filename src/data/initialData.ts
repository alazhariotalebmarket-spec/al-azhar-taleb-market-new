import {
  BENGALI_MONTHS,
  BloodGroup,
  Member,
  ORG_NAME,
  OrganizationData,
  Transaction,
  WelfareProject,
} from '../types';

const STORAGE_KEY = 'al_azhar_islami_sangstha_data_v2';
const LEGACY_STORAGE_KEY = 'al_azhar_islami_sangstha_data_v1';
const JULY_2026_BATCH_MERGED_KEY = 'al_azhar_july_2026_eyanot_merged_v1';
const EXPENSES_2026_BATCH_MERGED_KEY = 'al_azhar_2026_expenses_merged_v1';
const MUFTI_AL_AMIN_BATCH_MERGED_KEY = 'al_azhar_mufti_al_amin_merged_v1';
const HOME_NOTICES_UPDATED_KEY = 'al_azhar_home_notices_v1';

const MUFTI_AL_AMIN_SAIFI_SEED: Member = {
  id: 'eyanot-seed-00-mufti-al-amin-saifi',
  memberCode: 'AAIS-001',
  name: 'মুফতী আল আমিন সাইফী',
  fatherName: '',
  designation: 'সাধারণ সদস্য',
  phone: '',
  address: '',
  bloodGroup: '',
  monthlyFee: 200,
  joinDate: '2026-07-01',
  status: 'সক্রিয়',
  eyanotPayments: {
    '2026': { 6: 200, 7: 200, 8: 200 },
  },
};

const FERDAUS_MOLLA_SEED: Member = {
  id: 'm-1794616794570',
  memberCode: 'AAIS-002',
  name: 'মোঃ ফেরদাউস মোল্লা',
  fatherName: '',
  designation: 'সাধারণ সদস্য',
  phone: '',
  address: '',
  bloodGroup: '',
  monthlyFee: 100,
  joinDate: '2026-07-01',
  status: 'সক্রিয়',
  eyanotPayments: {
    '2026': { 6: 100, 7: 100, 8: 100, 9: 100 },
  },
};

const JULY_2026_EYANOT_MEMBERS_SEED: Member[] = [
  FERDAUS_MOLLA_SEED,
  {
    id: 'eyanot-seed-01',
    memberCode: 'AAIS-003',
    name: 'মাওঃ আবু তালহা (শাহিন)',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 150,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 150, 7: 150, 8: 150, 9: 150 },
    },
  },
  {
    id: 'eyanot-seed-02',
    memberCode: 'AAIS-004',
    name: 'মাওঃ ইমরান হোসাইন',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 100,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 100 },
    },
  },
  {
    id: 'eyanot-seed-04',
    memberCode: 'AAIS-005',
    name: 'মাওঃ আহমাদুল্লাহ',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 100,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 100, 7: 100, 8: 100, 9: 100 },
    },
  },
  {
    id: 'eyanot-seed-05',
    memberCode: 'AAIS-006',
    name: 'মাওঃ মুহাম্মদুল্লাহ',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 200,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 200, 7: 200, 8: 200, 9: 200, 10: 200 },
    },
  },
  {
    id: 'eyanot-seed-06',
    memberCode: 'AAIS-007',
    name: 'মোঃ রাকিবুল ইসলাম',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 50,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 50, 7: 50, 8: 50, 9: 50 },
    },
  },
  {
    id: 'eyanot-seed-07',
    memberCode: 'AAIS-008',
    name: 'মোঃ জিহাদ মোল্লা',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 50,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 50, 7: 50, 8: 50, 9: 50, 10: 50 },
    },
  },
  {
    id: 'eyanot-seed-08',
    memberCode: 'AAIS-009',
    name: 'মোঃ খাইরুল ইসলাম',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 100,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 100 },
    },
  },
  {
    id: 'eyanot-seed-09',
    memberCode: 'AAIS-010',
    name: 'মোঃ রিফাত হোসাইন',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 50,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 50, 7: 50, 8: 50, 9: 50 },
    },
  },
  {
    id: 'eyanot-seed-10',
    memberCode: 'AAIS-011',
    name: 'মোঃ শামসুল হক',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 100,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 100, 7: 100, 8: 100 },
    },
  },
  {
    id: 'eyanot-seed-11',
    memberCode: 'AAIS-012',
    name: 'হাফেজ মোঃ জাহিদ হাওঃ',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 100,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 7: 100, 8: 100, 9: 100, 10: 150 },
    },
  },
  {
    id: 'eyanot-seed-12',
    memberCode: 'AAIS-013',
    name: 'মোঃ মেহেদী হাসান মাদঃ',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 50,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': {},
    },
  },
  {
    id: 'eyanot-seed-13',
    memberCode: 'AAIS-014',
    name: 'হাফেজ নাঈমুল ইসলাম',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 50,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 6: 50, 7: 50, 8: 50, 9: 50 },
    },
  },
  {
    id: 'eyanot-seed-14',
    memberCode: 'AAIS-015',
    name: 'মোঃ আল আমিন সিকদার',
    fatherName: '',
    designation: 'সাধারণ সদস্য',
    phone: '',
    address: '',
    bloodGroup: '',
    monthlyFee: 100,
    joinDate: '2026-07-01',
    status: 'সক্রিয়',
    eyanotPayments: {
      '2026': { 10: 100 },
    },
  },
];

const EXPENSES_2026_SEED: Transaction[] = [
  {
    id: 'exp-seed-2026-07-29-tea-bill',
    date: '2026-07-29',
    type: 'expense',
    category: 'অন্যান্য ব্যয়',
    description: 'মিটিংয়ে চা বিল',
    amount: 125,
    receiptNo: 'EXP-202607-001',
  },
  {
    id: 'exp-seed-2026-10-26-register-book',
    date: '2026-10-26',
    type: 'expense',
    category: 'অন্যান্য ব্যয়',
    description: 'রেজিস্টার ও রেজুলেশন বই',
    amount: 100,
    receiptNo: 'EXP-202610-001',
  },
  {
    id: 'exp-seed-2026-10-26-policy-print',
    date: '2026-10-26',
    type: 'expense',
    category: 'অন্যান্য ব্যয়',
    description: 'নীতিমালার কাগজ প্রিন্ট',
    amount: 130,
    receiptNo: 'EXP-202610-002',
  },
  {
    id: 'exp-seed-2026-10-27-tea-snacks',
    date: '2026-10-27',
    type: 'expense',
    category: 'অন্যান্য ব্যয়',
    description: 'মিটিংয়ে চা নাস্তা',
    amount: 330,
    receiptNo: 'EXP-202610-003',
  },
];

const HOME_URGENT_MEETING_NOTICE = {
  id: 'n-online-meeting-2026-11-19',
  title: 'জরুরী নোটিশ - অনলাইন মিটিং',
  date: '2026-11-19',
  displayDate: '১৯-১১-২০২৬ ইং, রোজ বৃহস্পতিবার',
  category: 'জরুরী নোটিশ',
  content:
    'আগামী ১৯-১১-২০২৬ ইং রোজ বৃহস্পতিবার আসর বাদ সংগঠনের অফিসিয়াল হোয়াটসঅ্যাপ গ্রুপে একটি অনলাইন মিটিং অনুষ্ঠিত হবে। সকল সদস্যকে যথাসময়ে উপস্থিত থাকার জন্য অনুরোধ করা হলো।',
  important: true,
};

const HOME_EYANOT_NOTICE = {
  id: 'n-3',
  title: 'মাসিক বিজ্ঞপ্তি - নভেম্বরের মাসের নির্ধারিত মাসিক এয়ানত পরিশোধ সংক্রান্ত',
  date: '2026-11-01',
  category: 'মাসিক বিজ্ঞপ্তি',
  content:
    'সম্মানিত সকল সদস্যকে চলতি মাসের নির্ধারিত এয়ানত আগামী ১৫ তারিখের মধ্যে কোষাধ্যক্ষের নিকট জমা দেওয়ার জন্য বিনীত অনুরোধ জানানো হচ্ছে।',
  important: false,
};

export const CALENDAR_BANNER_PROJECT_ID = 'p-calendar-banner-2026';
export const CALENDAR_BANNER_UPDATE_2026_KEY = 'p-calendar-banner-2026-v2';

export const CALENDAR_BANNER_PROJECT_2026: WelfareProject = {
  id: CALENDAR_BANNER_PROJECT_ID,
  title: 'স্থায়ী ক্যালেন্ডার ও ব্যানার প্রকল্প',
  category: 'দাওয়াহ ও প্রকাশনা',
  description: 'নামাজের স্থায়ী ক্যালেন্ডার ও ব্যানার তৈরি ও বিতরণ সম্পন্ন হয়েছে।',
  targetAmount: 3200,
  raisedAmount: 3200,
  beneficiaries: 0,
  startDate: '2026-11-14',
  status: 'সম্পন্ন',
  incomeList: [
    { name: 'মোঃ ফেরদাউস মোল্লা', amount: 200 },
    { name: 'মাওঃ আহমাদুল্লাহ', amount: 100 },
    { name: 'মোঃ শামসুল হক', amount: 100 },
    { name: 'হাফেজ জাহিদ হাওলাদার', amount: 500 },
    { name: 'হাফেজ নাইমুল ইসলাম', amount: 100 },
    { name: 'মুফতী আল আমিন সাইফী', amount: 500 },
    { name: 'মাওঃ মুহাম্মদুল্লাহ', amount: 500 },
    { name: 'মাওঃ মোঃ আবু তালহা (শাহিন)', amount: 500 },
    { name: 'মাওঃ আরাফাত হোসাইন', amount: 100 },
    { name: 'মোঃ গোলাম রাব্বী', amount: 100 },
    { name: 'আঃ রহিম মেহেদী', amount: 100 },
    { name: 'আঃ রহমান মাদবার', amount: 100 },
    { name: 'মোঃ জাহিদুল ইসলাম', amount: 100 },
    { name: 'মোঃ রাকিবুল ইসলাম', amount: 100 },
    { name: 'হাফেজ মোঃ ইমাম হোসাইন', amount: 100 },
  ],
  expenseList: [
    { name: 'নামাজের স্থায়ী ক্যালেন্ডার প্রিন্ট ও ব্যানার প্রিন্ট', amount: 2600 },
    { name: 'নামাজের স্থায়ী ক্যালেন্ডার বিতরণ গাড়ি ভাড়া', amount: 300 },
    { name: 'যাওয়ার গাড়ী ভাড়া বাবদ মাওঃ আহমাদুল্লাহ ভাইকে দেওয়া হয়েছে', amount: 100 },
    { name: 'যাওয়ার গাড়ী ভাড়া বাবদ মাওঃ আহমাদুল্লাহ ভাইকে আরও দেওয়া হলো', amount: 100 },
  ],
  note: 'যাওয়ার গাড়ী ভাড়া মাওঃ আহমাদুল্লাহ ভাই দিয়েছিলেন, তাকে ভাড়া বাবদ প্রথমে 100/- এবং পরে আরও 100/- (মোট 200/-) দেওয়া হয়েছে।\nআসার গাড়ি ভাড়া দিয়েছেন, জনাব মোঃ হারুন মাদবার।',
};

export const DEFAULT_ORGANIZATION_DATA: OrganizationData = {
  organization: ORG_NAME,
  members: [],
  advisors: [],
  transactions: [],
  notices: [HOME_URGENT_MEETING_NOTICE, HOME_EYANOT_NOTICE],
  projects: [CALENDAR_BANNER_PROJECT_2026],
  donationRequests: [],
  memberApplications: [],
  backupSettings: {
    autoOnMutation: true,
    scheduledEnabled: true,
    frequency: 'daily',
    lastScheduledBackupAt: null,
  },
  backupHistory: [],
  driveDocuments: [],
  seededKeys: [CALENDAR_BANNER_PROJECT_ID, CALENDAR_BANNER_UPDATE_2026_KEY],
};

function mergeJuly2026EyanotSeed(data: OrganizationData): OrganizationData {
  try {
    if (localStorage.getItem(JULY_2026_BATCH_MERGED_KEY) === '1') {
      return data;
    }

    const existingIds = new Set(data.members.map((m) => m.id));
    const existingNames = new Set(data.members.map((m) => m.name.trim()));
    const existingCodes = new Set(data.members.map((m) => m.memberCode.trim()));
    const existingTxIds = new Set(data.transactions.map((t) => t.id));

    let nextCodeNumber = data.members.length + 1;
    const allocateUniqueCode = (preferredCode: string): string => {
      if (!existingCodes.has(preferredCode)) {
        existingCodes.add(preferredCode);
        return preferredCode;
      }
      while (existingCodes.has(`AAIS-${String(nextCodeNumber).padStart(3, '0')}`)) {
        nextCodeNumber += 1;
      }
      const generated = `AAIS-${String(nextCodeNumber).padStart(3, '0')}`;
      existingCodes.add(generated);
      return generated;
    };

    const membersToAdd: Member[] = [];
    const transactionsToAdd: Transaction[] = [];

    JULY_2026_EYANOT_MEMBERS_SEED.forEach((seed) => {
      // Never duplicate existing members (e.g. #3 ফেরদাউস মোল্লা)
      if (existingIds.has(seed.id) || existingNames.has(seed.name.trim())) {
        return;
      }

      const assignedCode = allocateUniqueCode(seed.memberCode);
      const memberRecord: Member = {
        ...seed,
        memberCode: assignedCode,
        eyanotPayments: {
          '2026': { ...(seed.eyanotPayments?.['2026'] || {}) },
        },
      };
      membersToAdd.push(memberRecord);
      existingIds.add(memberRecord.id);
      existingNames.add(memberRecord.name.trim());

      const yearPayments = memberRecord.eyanotPayments?.['2026'] || {};
      Object.entries(yearPayments).forEach(([monthStr, paidAmt]) => {
        const monthIndex = Number(monthStr);
        const amount = Number(paidAmt) || 0;
        if (amount <= 0 || Number.isNaN(monthIndex)) return;

        const txId = `eyanot-${memberRecord.id}-2026-${monthIndex}`;
        if (existingTxIds.has(txId)) return;

        const monthPad = String(monthIndex + 1).padStart(2, '0');
        const monthName = BENGALI_MONTHS[monthIndex] || '';
        transactionsToAdd.push({
          id: txId,
          date: `2026-${monthPad}-01`,
          type: 'income',
          category: 'মাসিক এয়ানত',
          description: `${memberRecord.name} — ${monthName} 2026 এর মাসিক এয়ানত`,
          amount,
          receiptNo: `EYN-2026${monthPad}-${memberRecord.memberCode}`,
        });
        existingTxIds.add(txId);
      });
    });

    const merged: OrganizationData = {
      ...data,
      members: [...data.members, ...membersToAdd],
      transactions: [...transactionsToAdd, ...data.transactions],
    };

    saveOrganizationData(merged);
    localStorage.setItem(JULY_2026_BATCH_MERGED_KEY, '1');
    return merged;
  } catch {
    return data;
  }
}

function normalizeExpenseText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

function mergeExpenses2026Seed(data: OrganizationData): OrganizationData {
  try {
    if (localStorage.getItem(EXPENSES_2026_BATCH_MERGED_KEY) === '1') {
      return data;
    }

    const existingExpenses = data.transactions.filter((t) => t.type === 'expense');
    const existingIds = new Set(data.transactions.map((t) => t.id));
    const transactionsToAdd: Transaction[] = [];

    EXPENSES_2026_SEED.forEach((seed) => {
      if (existingIds.has(seed.id)) return;

      const seedDescNorm = normalizeExpenseText(seed.description);
      const isTeaBillSeed = seed.id === 'exp-seed-2026-07-29-tea-bill';

      const alreadyPresent = existingExpenses.some((tx) => {
        const txDescNorm = normalizeExpenseText(tx.description || '');
        if (isTeaBillSeed) {
          return (
            txDescNorm === seedDescNorm ||
            txDescNorm.includes('মিটিংয়ে চা বিল') ||
            (tx.date === seed.date && Number(tx.amount) === seed.amount)
          );
        }
        return (
          tx.date === seed.date &&
          txDescNorm === seedDescNorm &&
          Number(tx.amount) === seed.amount
        );
      });

      if (alreadyPresent) return;

      transactionsToAdd.push({ ...seed });
      existingIds.add(seed.id);
    });

    const merged: OrganizationData =
      transactionsToAdd.length > 0
        ? {
            ...data,
            transactions: [...data.transactions, ...transactionsToAdd],
          }
        : data;

    if (transactionsToAdd.length > 0) {
      saveOrganizationData(merged);
    }
    localStorage.setItem(EXPENSES_2026_BATCH_MERGED_KEY, '1');
    return merged;
  } catch {
    return data;
  }
}

function mergeMuftiAlAminSaifiSeed(data: OrganizationData): OrganizationData {
  try {
    if (localStorage.getItem(MUFTI_AL_AMIN_BATCH_MERGED_KEY) === '1') {
      return data;
    }

    const existingTxIds = new Set(data.transactions.map((t) => t.id));
    const existingCodes = new Set(data.members.map((m) => m.memberCode.trim()));

    const existingIndex = data.members.findIndex(
      (m) =>
        m.id === MUFTI_AL_AMIN_SAIFI_SEED.id ||
        m.name.trim() === MUFTI_AL_AMIN_SAIFI_SEED.name
    );

    let targetMember: Member;
    let remainingMembers: Member[];

    if (existingIndex >= 0) {
      const existing = data.members[existingIndex];
      targetMember = {
        ...existing,
        name: MUFTI_AL_AMIN_SAIFI_SEED.name,
        monthlyFee: existing.monthlyFee || MUFTI_AL_AMIN_SAIFI_SEED.monthlyFee,
        status: 'সক্রিয়',
        eyanotPayments: {
          ...(existing.eyanotPayments || {}),
          '2026': {
            ...MUFTI_AL_AMIN_SAIFI_SEED.eyanotPayments?.['2026'],
            ...(existing.eyanotPayments?.['2026'] || {}),
          },
        },
      };
      remainingMembers = data.members.filter((_, idx) => idx !== existingIndex);
    } else {
      let assignedCode = MUFTI_AL_AMIN_SAIFI_SEED.memberCode;
      if (existingCodes.has(assignedCode)) {
        let nextCodeNumber = data.members.length + 1;
        while (existingCodes.has(`AAIS-${String(nextCodeNumber).padStart(3, '0')}`)) {
          nextCodeNumber += 1;
        }
        assignedCode = `AAIS-${String(nextCodeNumber).padStart(3, '0')}`;
      }
      targetMember = {
        ...MUFTI_AL_AMIN_SAIFI_SEED,
        memberCode: assignedCode,
        eyanotPayments: {
          '2026': { ...(MUFTI_AL_AMIN_SAIFI_SEED.eyanotPayments?.['2026'] || {}) },
        },
      };
      remainingMembers = data.members;
    }

    const transactionsToAdd: Transaction[] = [];
    const yearPayments = targetMember.eyanotPayments?.['2026'] || {};
    Object.entries(yearPayments).forEach(([monthStr, paidAmt]) => {
      const monthIndex = Number(monthStr);
      const amount = Number(paidAmt) || 0;
      if (amount <= 0 || Number.isNaN(monthIndex)) return;

      const txId = `eyanot-${targetMember.id}-2026-${monthIndex}`;
      if (existingTxIds.has(txId)) return;

      const monthPad = String(monthIndex + 1).padStart(2, '0');
      const monthName = BENGALI_MONTHS[monthIndex] || '';
      transactionsToAdd.push({
        id: txId,
        date: `2026-${monthPad}-01`,
        type: 'income',
        category: 'মাসিক এয়ানত',
        description: `${targetMember.name} — ${monthName} 2026 এর মাসিক এয়ানত`,
        amount,
        receiptNo: `EYN-2026${monthPad}-${targetMember.memberCode}`,
      });
      existingTxIds.add(txId);
    });

    const merged: OrganizationData = {
      ...data,
      members: [targetMember, ...remainingMembers],
      transactions: [...transactionsToAdd, ...data.transactions],
    };

    saveOrganizationData(merged);
    localStorage.setItem(MUFTI_AL_AMIN_BATCH_MERGED_KEY, '1');
    return merged;
  } catch {
    return data;
  }
}

function mergeHomeNoticesUpdate(data: OrganizationData): OrganizationData {
  try {
    if (localStorage.getItem(HOME_NOTICES_UPDATED_KEY) === '1') {
      return data;
    }

    const removedIds = new Set(['n-1', 'n-2']);
    const removedTitles = new Set([
      'শীতবস্ত্র বিতরণ ও এতিম সহায়তা কর্মসূচি ২০২৬',
      'মাসিক সাধারণ সভা ও আর্থিক প্রতিবেদন পর্যালোচনা',
    ]);

    const filteredNotices = data.notices
      .filter((n) => !removedIds.has(n.id) && !removedTitles.has(n.title.trim()))
      .map((n) => {
        if (n.id === 'n-3') {
          return {
            ...n,
            title: HOME_EYANOT_NOTICE.title,
            category: HOME_EYANOT_NOTICE.category,
          };
        }
        return n;
      });

    const hasEyanotNotice = filteredNotices.some((n) => n.id === HOME_EYANOT_NOTICE.id);
    const hasMeetingNotice = filteredNotices.some(
      (n) => n.id === HOME_URGENT_MEETING_NOTICE.id || n.title.trim() === HOME_URGENT_MEETING_NOTICE.title
    );

    const nextNotices = [...filteredNotices];
    if (!hasEyanotNotice) {
      nextNotices.push({ ...HOME_EYANOT_NOTICE });
    }
    if (!hasMeetingNotice) {
      nextNotices.unshift({ ...HOME_URGENT_MEETING_NOTICE });
    }

    const merged: OrganizationData = {
      ...data,
      notices: nextNotices,
    };

    saveOrganizationData(merged);
    localStorage.setItem(HOME_NOTICES_UPDATED_KEY, '1');
    return merged;
  } catch {
    return data;
  }
}

const PROJECTS_CLEARED_KEY = 'al_azhar_projects_cleared_v1';
function mergeProjectsClearedUpdate(data: OrganizationData): OrganizationData {
  try {
    if (localStorage.getItem(PROJECTS_CLEARED_KEY) === '1') {
      return data;
    }

    const initialProjectIds = new Set(['p-1', 'p-2', 'p-3']);
    const initialProjectTitles = new Set([
      'শীতবস্ত্র ও কম্বল বিতরণ প্রকল্প ২০২৬',
      'এতিম ও মেধাবী শিক্ষার্থী মাসিক বৃত্তি',
      'জরুরি খাদ্য ও চিকিৎসা সহায়তা তহবিল',
    ]);

    const remainingProjects = (data.projects || []).filter(
      (p) => !initialProjectIds.has(p.id) && !initialProjectTitles.has(p.title.trim())
    );

    const merged: OrganizationData = {
      ...data,
      projects: remainingProjects,
    };

    saveOrganizationData(merged);
    localStorage.setItem(PROJECTS_CLEARED_KEY, '1');
    return merged;
  } catch {
    return data;
  }
}

export function mergeCalendarBannerProjectSeed(
  data: OrganizationData
): { data: OrganizationData; changed: boolean } {
  try {
    const existingSeededKeys = Array.isArray(data.seededKeys) ? data.seededKeys : [];
    const currentProjects = Array.isArray(data.projects) ? data.projects : [];
    const matchesCalendarProject = (p: WelfareProject) =>
      p.id === CALENDAR_BANNER_PROJECT_ID || p.title.trim() === CALENDAR_BANNER_PROJECT_2026.title;

    const existingProject = currentProjects.find(matchesCalendarProject);
    const alreadyExists = Boolean(existingProject);

    if (existingSeededKeys.includes(CALENDAR_BANNER_PROJECT_ID) && !alreadyExists) {
      // Admin already seeded once and deliberately deleted it
      return { data, changed: false };
    }

    const hasBaseSeed =
      existingSeededKeys.includes(CALENDAR_BANNER_PROJECT_ID) &&
      alreadyExists &&
      Boolean(existingProject?.incomeList?.length) &&
      Boolean(existingProject?.expenseList?.length);

    const hasV2Update = existingSeededKeys.includes(CALENDAR_BANNER_UPDATE_2026_KEY);

    if (hasBaseSeed && hasV2Update) {
      return { data, changed: false };
    }

    const applyV2Entries = (proj: WelfareProject): WelfareProject => {
      const incomeList = Array.isArray(proj.incomeList) ? [...proj.incomeList] : [];
      const expenseList = Array.isArray(proj.expenseList) ? [...proj.expenseList] : [];

      if (!incomeList.some((i) => i.name.includes('রাকিবুল ইসলাম'))) {
        incomeList.push({ name: 'মোঃ রাকিবুল ইসলাম', amount: 100 });
      }
      if (!incomeList.some((i) => i.name.includes('ইমাম হোসাইন'))) {
        incomeList.push({ name: 'হাফেজ মোঃ ইমাম হোসাইন', amount: 100 });
      }
      if (!expenseList.some((e) => e.name.includes('আহমাদুল্লাহ ভাইকে আরও'))) {
        expenseList.push({
          name: 'যাওয়ার গাড়ী ভাড়া বাবদ মাওঃ আহমাদুল্লাহ ভাইকে আরও দেওয়া হলো',
          amount: 100,
        });
      }

      const totalInc = incomeList.reduce((s, i) => s + (Number(i.amount) || 0), 0);
      const updatedNote =
        proj.note && proj.note.includes('তাকে আরো দেওয়া উচিৎ।')
          ? CALENDAR_BANNER_PROJECT_2026.note
          : proj.note || CALENDAR_BANNER_PROJECT_2026.note;

      return {
        ...proj,
        targetAmount: Math.max(proj.targetAmount || 0, totalInc),
        raisedAmount: Math.max(proj.raisedAmount || 0, totalInc),
        incomeList,
        expenseList,
        note: updatedNote,
      };
    };

    const nextProjects = alreadyExists
      ? currentProjects.map((p) => {
          if (!matchesCalendarProject(p)) return p;
          const baseMerged: WelfareProject = {
            ...CALENDAR_BANNER_PROJECT_2026,
            ...p,
            incomeList: p.incomeList?.length ? p.incomeList : CALENDAR_BANNER_PROJECT_2026.incomeList,
            expenseList: p.expenseList?.length
              ? p.expenseList
              : CALENDAR_BANNER_PROJECT_2026.expenseList,
            note: p.note || CALENDAR_BANNER_PROJECT_2026.note,
          };
          return hasV2Update ? baseMerged : applyV2Entries(baseMerged);
        })
      : [CALENDAR_BANNER_PROJECT_2026, ...currentProjects];

    const nextSeededKeys = [...existingSeededKeys];
    if (!nextSeededKeys.includes(CALENDAR_BANNER_PROJECT_ID)) {
      nextSeededKeys.push(CALENDAR_BANNER_PROJECT_ID);
    }
    if (!nextSeededKeys.includes(CALENDAR_BANNER_UPDATE_2026_KEY)) {
      nextSeededKeys.push(CALENDAR_BANNER_UPDATE_2026_KEY);
    }

    return {
      data: {
        ...data,
        projects: nextProjects,
        seededKeys: nextSeededKeys,
      },
      changed: true,
    };
  } catch {
    return { data, changed: false };
  }
}

const FERDAUS_MOLLA_SEED_KEY = 'member-ferdaus-molla-2026-v1';
export function mergeFerdausMollaLocalSeed(data: OrganizationData): OrganizationData {
  try {
    const existingSeededKeys = Array.isArray(data.seededKeys) ? data.seededKeys : [];
    const currentMembers = Array.isArray(data.members) ? data.members : [];
    const currentTransactions = Array.isArray(data.transactions) ? data.transactions : [];

    const alreadyPresent = currentMembers.some(
      (m) =>
        m.id === FERDAUS_MOLLA_SEED.id ||
        m.name.trim() === FERDAUS_MOLLA_SEED.name ||
        m.name.includes('ফেরদাউস মোল্লা')
    );

    if (alreadyPresent || existingSeededKeys.includes(FERDAUS_MOLLA_SEED_KEY)) {
      return data;
    }

    const existingTxIds = new Set(currentTransactions.map((t) => t.id));
    const transactionsToAdd: Transaction[] = [];
    const yearPayments = FERDAUS_MOLLA_SEED.eyanotPayments?.['2026'] || {};
    Object.entries(yearPayments).forEach(([monthStr, paidAmt]) => {
      const monthIndex = Number(monthStr);
      const amount = Number(paidAmt) || 0;
      if (amount <= 0 || Number.isNaN(monthIndex)) return;
      const txId = `eyanot-${FERDAUS_MOLLA_SEED.id}-2026-${monthIndex}`;
      if (existingTxIds.has(txId)) return;
      const monthPad = String(monthIndex + 1).padStart(2, '0');
      const monthName = BENGALI_MONTHS[monthIndex] || '';
      transactionsToAdd.push({
        id: txId,
        date: '2026-11-14',
        type: 'income',
        category: 'মাসিক এয়ানত',
        description: `${FERDAUS_MOLLA_SEED.name} — ${monthName} 2026 এর মাসিক এয়ানত`,
        amount,
        receiptNo: `EYN-2026${monthPad}-${FERDAUS_MOLLA_SEED.memberCode}`,
      });
      existingTxIds.add(txId);
    });

    const seedMember: Member = {
      ...FERDAUS_MOLLA_SEED,
      eyanotPayments: {
        '2026': { ...(FERDAUS_MOLLA_SEED.eyanotPayments?.['2026'] || {}) },
      },
    };

    // Place right after #1 মুফতী আল আমিন সাইফী if present at top, otherwise at index 0
    const nextMembers = [...currentMembers];
    const insertIndex =
      nextMembers.length > 0 && nextMembers[0]?.name.includes('আল আমিন সাইফী') ? 1 : 0;
    nextMembers.splice(insertIndex, 0, seedMember);

    const merged: OrganizationData = {
      ...data,
      members: nextMembers,
      transactions: [...transactionsToAdd, ...currentTransactions],
      seededKeys: [...existingSeededKeys, FERDAUS_MOLLA_SEED_KEY],
    };

    saveOrganizationData(merged);
    return merged;
  } catch {
    return data;
  }
}

const MEMBER_CODES_NORMALIZED_KEY = 'members-aais-serial-2026-v1';

export function getNextMemberCode(members: Member[]): string {
  let maxNum = members.length;
  for (const m of members) {
    const match = /^AAIS-(\d+)$/i.exec((m.memberCode || '').trim());
    if (match) {
      const n = Number(match[1]);
      if (!Number.isNaN(n) && n > maxNum) {
        maxNum = n;
      }
    }
  }
  return `AAIS-${String(maxNum + 1).padStart(3, '0')}`;
}

export function normalizeMemberSerialCodesSeed(
  data: OrganizationData
): { data: OrganizationData; changed: boolean } {
  try {
    const currentMembers = Array.isArray(data.members) ? data.members : [];
    if (currentMembers.length === 0) {
      return { data, changed: false };
    }

    const existingSeededKeys = Array.isArray(data.seededKeys) ? data.seededKeys : [];
    const seenCodes = new Set<string>();
    let hasDuplicateOrMismatch = false;
    for (let i = 0; i < currentMembers.length; i += 1) {
      const expectedCode = `AAIS-${String(i + 1).padStart(3, '0')}`;
      const actualCode = (currentMembers[i].memberCode || '').trim();
      if (seenCodes.has(actualCode) || (!existingSeededKeys.includes(MEMBER_CODES_NORMALIZED_KEY) && actualCode !== expectedCode)) {
        hasDuplicateOrMismatch = true;
        break;
      }
      seenCodes.add(actualCode);
    }

    if (existingSeededKeys.includes(MEMBER_CODES_NORMALIZED_KEY) && !hasDuplicateOrMismatch) {
      return { data, changed: false };
    }

    const codeByMemberId = new Map<string, string>();
    const nextMembers = currentMembers.map((m, idx) => {
      const nextCode = `AAIS-${String(idx + 1).padStart(3, '0')}`;
      codeByMemberId.set(m.id, nextCode);
      return m.memberCode === nextCode ? m : { ...m, memberCode: nextCode };
    });

    const currentTransactions = Array.isArray(data.transactions) ? data.transactions : [];
    const nextTransactions = currentTransactions.map((tx) => {
      if (!tx.id.startsWith('eyanot-') || !tx.receiptNo) return tx;
      for (const [memberId, nextCode] of codeByMemberId.entries()) {
        const prefix = `eyanot-${memberId}-`;
        if (tx.id.startsWith(prefix)) {
          const updatedReceipt = tx.receiptNo.replace(/^(EYN-\d{6}-).*$/, `$1${nextCode}`);
          if (updatedReceipt !== tx.receiptNo) {
            return { ...tx, receiptNo: updatedReceipt };
          }
          break;
        }
      }
      return tx;
    });

    const nextSeededKeys = existingSeededKeys.includes(MEMBER_CODES_NORMALIZED_KEY)
      ? existingSeededKeys
      : [...existingSeededKeys, MEMBER_CODES_NORMALIZED_KEY];

    return {
      data: {
        ...data,
        members: nextMembers,
        transactions: nextTransactions,
        seededKeys: nextSeededKeys,
      },
      changed: true,
    };
  } catch {
    return { data, changed: false };
  }
}

function finalizeSeedPipeline(data: OrganizationData): OrganizationData {
  const afterCleared = mergeProjectsClearedUpdate(
    mergeHomeNoticesUpdate(
      mergeFerdausMollaLocalSeed(
        mergeMuftiAlAminSaifiSeed(mergeExpenses2026Seed(mergeJuly2026EyanotSeed(data)))
      )
    )
  );
  const { data: withCalendarProject, changed: calendarChanged } =
    mergeCalendarBannerProjectSeed(afterCleared);
  const { data: withNormalizedCodes, changed: codesChanged } =
    normalizeMemberSerialCodesSeed(withCalendarProject);
  if (calendarChanged || codesChanged) {
    saveOrganizationData(withNormalizedCodes);
  }
  return withNormalizedCodes;
}

export function loadOrganizationData(): OrganizationData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      if (legacyRaw) {
        try {
          const legacyParsed = JSON.parse(legacyRaw) as Partial<OrganizationData>;
          return finalizeSeedPipeline({
            ...DEFAULT_ORGANIZATION_DATA,
            logoUrl:
              typeof legacyParsed.logoUrl === 'string' && legacyParsed.logoUrl.startsWith('data:image/')
                ? legacyParsed.logoUrl
                : undefined,
            backupSettings: legacyParsed.backupSettings
              ? { ...DEFAULT_ORGANIZATION_DATA.backupSettings, ...legacyParsed.backupSettings }
              : DEFAULT_ORGANIZATION_DATA.backupSettings,
          });
        } catch {
          return finalizeSeedPipeline(DEFAULT_ORGANIZATION_DATA);
        }
      }
      return finalizeSeedPipeline(DEFAULT_ORGANIZATION_DATA);
    }

    const parsed = JSON.parse(raw) as Partial<OrganizationData>;
    const normalizedMembers: Member[] = Array.isArray(parsed.members)
      ? parsed.members.map((m) => ({
          ...m,
          fatherName: m.fatherName || '',
          bloodGroup: (m.bloodGroup as BloodGroup | '') || '',
          eyanotPayments: m.eyanotPayments || {},
        }))
      : DEFAULT_ORGANIZATION_DATA.members;

    return finalizeSeedPipeline({
      organization: ORG_NAME,
      logoUrl:
        typeof parsed.logoUrl === 'string' && parsed.logoUrl.startsWith('data:image/')
          ? parsed.logoUrl
          : undefined,
      members: normalizedMembers,
      advisors: Array.isArray(parsed.advisors) ? parsed.advisors : DEFAULT_ORGANIZATION_DATA.advisors,
      transactions: Array.isArray(parsed.transactions)
        ? parsed.transactions
        : DEFAULT_ORGANIZATION_DATA.transactions,
      notices: Array.isArray(parsed.notices) ? parsed.notices : DEFAULT_ORGANIZATION_DATA.notices,
      projects: Array.isArray(parsed.projects)
        ? parsed.projects
        : DEFAULT_ORGANIZATION_DATA.projects,
      donationRequests: Array.isArray(parsed.donationRequests)
        ? parsed.donationRequests
        : DEFAULT_ORGANIZATION_DATA.donationRequests,
      memberApplications: Array.isArray(parsed.memberApplications)
        ? parsed.memberApplications
        : DEFAULT_ORGANIZATION_DATA.memberApplications,
      backupSettings: parsed.backupSettings
        ? { ...DEFAULT_ORGANIZATION_DATA.backupSettings, ...parsed.backupSettings }
        : DEFAULT_ORGANIZATION_DATA.backupSettings,
      backupHistory: Array.isArray(parsed.backupHistory) ? parsed.backupHistory : [],
      driveDocuments: Array.isArray(parsed.driveDocuments) ? parsed.driveDocuments : [],
      seededKeys: Array.isArray(parsed.seededKeys) ? parsed.seededKeys : [],
    });
  } catch {
    return finalizeSeedPipeline(DEFAULT_ORGANIZATION_DATA);
  }
}

export function saveOrganizationData(data: OrganizationData): void {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        ...data,
        organization: ORG_NAME,
      })
    );
  } catch (err) {
    console.error('Failed to persist organization data:', err);
  }
}
