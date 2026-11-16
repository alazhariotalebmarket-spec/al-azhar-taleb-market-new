import React from 'react';
import {
  BookOpen,
  Building2,
  Compass,
  ExternalLink,
  Facebook,
  HandHeart,
  HeartHandshake,
  Mail,
  MapPin,
  ScrollText,
  Sparkles,
  Target,
  Youtube,
} from 'lucide-react';
import { DEFAULT_LOGO_URL, ORG_NAME, ORG_TAGLINE } from '../types';
import { ORG_CONTACT } from '../services/contactConfig';
import { OrgLogo } from './OrgLogo';

interface AboutSectionProps {
  logoUrl?: string;
  onNavigateHome: () => void;
}

interface ConstitutionArticle {
  number: string;
  title: string;
  body?: string;
  clauses?: string[];
}

const ABOUT_ADDRESS = 'তুষখালী, তালেব মার্কেট, ছোট বিঘাই, পটুয়াখালী সদর, পটুয়াখালী।';
const MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'তুষখালী, তালেব মার্কেট, ছোট বিঘাই, পটুয়াখালী সদর, পটুয়াখালী'
)}`;
const FACEBOOK_URL = 'https://www.facebook.com/Alazhar.talebmarket';
const YOUTUBE_URL = 'https://www.youtube.com/@Alazhar.talebmarket';

const CORE_PILLARS = [
  {
    id: 'education',
    title: 'দ্বীনি শিক্ষা',
    description: 'সমাজের সর্বস্তরে বিশুদ্ধ দ্বীনি শিক্ষার বিস্তার ও বাস্তবায়ন করা।',
    icon: BookOpen,
  },
  {
    id: 'dawah',
    title: 'দাওয়াতি কার্যক্রম',
    description: 'নৈতিক চরিত্র গঠন এবং আখিরাতে মুক্তির লক্ষ্য নিয়ে সার্বিক দাওয়াহ পরিচালনা করা।',
    icon: Compass,
  },
  {
    id: 'service',
    title: 'মানবসেবা',
    description: 'সামাজিক কল্যাণমূলক ও মানবিক সহায়তা কার্যক্রম পরিচালনা করা।',
    icon: HandHeart,
  },
];

const CONSTITUTION_ARTICLES: ConstitutionArticle[] = [
  {
    number: 'ধারা-১',
    title: 'সংগঠনের নাম',
    body: 'সংগঠনের পূর্ণ নাম "আল-আজহার ইসলামী সংস্থা"।',
  },
  {
    number: 'ধারা-২',
    title: 'প্রতিষ্ঠাকাল',
    body: '[২৯ জুলাই ২০২৬ খ্রি.]।',
  },
  {
    number: 'ধারা-৩',
    title: 'সংগঠনের প্রকৃতি',
    body: 'এই সংগঠনটি সম্পূর্ণ অরাজনৈতিক, স্বেচ্ছাসেবী, মানবিক, শিক্ষা ও দাওয়াহভিত্তিক একটি দ্বীনি প্রতিষ্ঠান।',
  },
  {
    number: 'ধারা-৪',
    title: 'মূল কার্যপদ্ধতি',
    clauses: [
      'ক) সমাজের সর্বস্তরে দ্বীনি শিক্ষা বাস্তবায়ন করা।',
      'খ) নৈতিক চরিত্র গঠনে এবং আখিরাতে মুক্তির আশায় দাওয়াতি কার্যক্রম পরিচালনা করা।',
      'গ) মানবসেবা ও সামাজিক কল্যাণমূলক কার্যক্রম পরিচালনা করা।',
    ],
  },
  {
    number: 'ধারা-৫',
    title: 'অর্থায়ন ও চাঁদা',
    body: "সামাজিক ও মানবিক কল্যাণমূলক কাজ সুষ্ঠুভাবে বাস্তবায়নের লক্ষ্যে সকল সদস্যকে সামর্থ্য অনুযায়ী নিয়মিত মাসিক 'এয়ানত' বা চাঁদা প্রদান করতে হবে।",
  },
  {
    number: 'ধারা-৬',
    title: 'সিদ্ধান্ত গ্রহণ প্রক্রিয়া (শূরা ব্যবস্থা)',
    body: 'সংগঠনের যেকোনো গুরুত্বপূর্ণ সিদ্ধান্ত কার্যনির্বাহী কমিটির পরামর্শের (শূরা) ভিত্তিতে গৃহীত হবে। ব্যক্তিগতভাবে সংগঠনের নামে কোনো একক সিদ্ধান্ত নেওয়া সাংগঠনিক অপরাধ হিসেবে গণ্য হবে।',
  },
  {
    number: 'ধারা-৭',
    title: 'মালিকানা ও জবাবদিহিতা',
    body: 'এই সংগঠনকে কেউ ব্যক্তিগত বা পারিবারিক সম্পদ মনে করতে পারবে না। ইসলাম, সমাজ ও মানবতার কল্যাণে কাজ করতে প্রতিশ্রুতিবদ্ধ থাকায় সংগঠনটি সাধারণ জনগণ ও সংশ্লিষ্ট সরকারি কর্তৃপক্ষের নিকট সাংগঠনিকভাবে জবাবদিহি করতে বাধ্য থাকবে।',
  },
  {
    number: 'ধারা-৮',
    title: 'সদস্যপদের যোগ্যতা',
    clauses: [
      'ক) আহলে সুন্নাত ওয়াল জামাআতের আকিদায় বিশ্বাসী হওয়া।',
      'খ) সংগঠনের লক্ষ্য, উদ্দেশ্য, গঠনতন্ত্র ও সকল শর্তাবলী মেনে চলার মানসিকতা থাকা।',
    ],
  },
  {
    number: 'ধারা-৯',
    title: 'নতুন সদস্য ভর্তির নিয়ম',
    clauses: [
      'ক) সংগঠনের নির্ধারিত আবেদন/রেজিস্ট্রেশন ফরম পূরণ করতে হবে।',
      "খ) সদস্যপদ গ্রহণের সময় সংগঠনের 'কল্যাণ ফান্ডে' সামর্থ্য অনুযায়ী স্বেচ্ছায় এককালীন অনুদান প্রদান করতে হবে।",
    ],
  },
  {
    number: 'ধারা-১০',
    title: 'পদত্যাগ ও সদস্যপদ বাতিল প্রক্রিয়া',
    clauses: [
      'ক) স্বেচ্ছায় পদত্যাগ: লিখিত আবেদনে কারণ দর্শিয়ে, কার্যনির্বাহী প্যানেলের ৩ জন কর্মকর্তার স্বাক্ষরসহ সভাপতি ও সাধারণ সম্পাদক (সেক্রেটারি) বরাবর আবেদন জমা দিতে হবে।',
      'খ) সদস্যপদ বাতিল: সংগঠনবিরোধী কর্মকাণ্ড, অনৈতিক চরিত্র বা শৃঙ্খলা ভঙ্গের মাধ্যমে সংগঠনের ভাবমূর্তি ক্ষুণ্ণ করলে কার্যনির্বাহী কমিটির শূরার ভিত্তিতে লিখিতভাবে সাময়িকভাবে স্থগিত বা বাতিল করা হবে। এতে উক্ত সদস্যের কোনো আপত্তি থাকবে না।',
    ],
  },
  {
    number: 'ধারা-১১',
    title: 'কার্যনির্বাহী কমিটি গঠন',
    clauses: [
      'ক) কমিটির আকার: কার্যনির্বাহী কমিটি মোট [১৫ জন সর্বোচ্চ] সদস্য সমন্বয়ে গঠিত হবে।',
      'খ) কমিটির মেয়াদ: কার্যনির্বাহী কমিটির মেয়াদকাল হবে [১ বছর (কমিটি গঠনের তারিখ থেকে)]।',
      'গ) কমিটি গঠনের পদ্ধতি: সাধারণ পরিষদের প্রত্যক্ষ ভোট অথবা শূরার পরামর্শের (সর্বসম্মত সিদ্ধান্ত) ভিত্তিতে কার্যনির্বাহী কমিটি গঠিত হবে।',
    ],
  },
  {
    number: 'ধারা-১২',
    title: 'সাধারণ ও জরুরি সভা',
    clauses: [
      'ক) সাধারণ সভা: প্রতি [১ মাস] পর পর অনলাইনে এবং প্রতি: [৩ মাস] পর পর অফলাইন বা সরাসরি সাধারণ সভা অনুষ্ঠিত হবে।',
      'খ) কোরাম ও উপস্থিতি: যেকোনো নীতিগত সিদ্ধান্ত গ্রহণের জন্য কার্যনির্বাহী কমিটির অন্তত [দুই-তৃতীয়াংশ (২/৩)] সদস্যের উপস্থিতি বাধ্যতামূলক।',
    ],
  },
  {
    number: 'ধারা-১৩',
    title: 'অর্থ ও তহবিল পরিচালনা',
    clauses: [
      'ক) অর্থ সংগ্রহ: নির্ধারিত রসিদ বইয়ের মাধ্যমে চাঁদা ও অনুদান আদায় করা হবে।',
      'খ) ব্যাংক অ্যাকাউন্ট: সংগঠনের নামে একটি যৌথ ব্যাংক অ্যাকাউন্ট থাকবে, যা সভাপতি, সাধারণ সম্পাদক ও কোষাধ্যক্ষের যৌথ স্বাক্ষরে পরিচালিত হবে (যেকোনো ২ জনের স্বাক্ষর বাধ্যতামূলক)।',
      'গ) হিসাবরক্ষণ: কোষাধ্যক্ষ আয়-ব্যয়ের হিসাব সংরক্ষণ করবেন এবং প্রতি [৬ মাস] পর পর অডিট রিপোর্ট পেশ করবেন। (তবে, সম্পাদকীয় দায়িত্বশীলগণ যে কোনো মুহূর্তে হিসাব চাইলে, কোষাধ্যক্ষ হিসাব দিতে বাধ্য থাকিবে।)',
    ],
  },
  {
    number: 'ধারা-১৪',
    title: 'অনুদান গ্রহণ ও দান প্রক্রিয়া',
    clauses: [
      'ক) আল আজহার ইসলামী সংস্থার কার্যক্রমে সন্তুষ্ট হয়ে সরকারি ফান্ড, বিদেশী সংস্থা অথবা কোন দানবীর ব্যক্তির পক্ষ থেকে সংগঠনের কল্যাণ ফান্ডে অর্থ দিলে তা গ্রহণ করা যাবে।',
      'খ) সংগঠনের কল্যাণ ফান্ড থেকে শিক্ষা, দাওয়াহ ও সেবামূলক কাজে ব্যয় করা যাবে, তবে অবশ্যই কার্যনির্বাহী কমিটির পরামর্শ ক্রমে খরচ করতে হবে। ব্যক্তিগত সিদ্ধান্তে এক টাকাও খরচ করা যাবে না।',
    ],
  },
  {
    number: 'ধারা-১৫',
    title: 'গঠনতন্ত্র সংশোধন',
    clauses: [
      'ক) সংগঠনের স্বার্থে গঠনতন্ত্রের যেকোনো ধারা পরিবর্তন, পরিবর্ধন বা সংশোধন করা যাবে।',
      'খ) গঠনতন্ত্র সংশোধনের জন্য কার্যনির্বাহী কমিটির দুই-তৃতীয়াংশ (২/৩) সদস্যের লিখিত অনুমোদন প্রয়োজন হবে এবং এটি প্রতি [১ বছর] পর পর্যালোচনার সুযোগ থাকবে।',
    ],
  },
];

export const AboutSection: React.FC<AboutSectionProps> = ({ logoUrl, onNavigateHome }) => {
  const activeLogoSrc = logoUrl || DEFAULT_LOGO_URL;

  const handleOpenHome = () => {
    onNavigateHome();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10 space-y-8">
      {/* Page Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <OrgLogo src={activeLogoSrc} alt={ORG_NAME} variant="standard" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                আমাদের সম্পর্কে / About Us
              </p>
              <h1 className="mt-1 font-display text-2xl font-bold text-slate-900 sm:text-3xl">
                <button
                  type="button"
                  onClick={handleOpenHome}
                  className="text-left transition-colors hover:text-emerald-800 hover:underline"
                >
                  {ORG_NAME}
                </button>
              </h1>
              <p className="mt-1 text-sm font-medium text-emerald-800">
                {ORG_TAGLINE}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ১. সংগঠনের পরিচয় */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Building2 className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
            ১. সংগঠনের পরিচয়
          </h2>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {/* নাম */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold text-slate-500">নাম</p>
            <button
              type="button"
              onClick={handleOpenHome}
              className="mt-1.5 inline-flex items-center gap-1.5 text-left text-sm font-bold text-emerald-900 hover:text-emerald-700 hover:underline sm:text-base"
            >
              <span>{ORG_NAME}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </button>
          </div>

          {/* ইমেইল */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 min-w-0">
            <p className="text-xs font-semibold text-slate-500">ইমেইল</p>
            <a
              href={ORG_CONTACT.gmailComposeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-1.5 break-all font-mono-num text-sm font-semibold text-emerald-800 hover:underline"
            >
              <Mail className="h-4 w-4 shrink-0" />
              <span>{ORG_CONTACT.email}</span>
            </a>
          </div>

          {/* ঠিকানা */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold text-slate-500">ঠিকানা</p>
            <a
              href={MAPS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-start gap-2 text-sm font-medium leading-relaxed text-slate-800 hover:text-emerald-800 hover:underline"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>{ABOUT_ADDRESS}</span>
            </a>
          </div>

          {/* যোগাযোগ ও কার্যালয় */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="text-xs font-semibold text-slate-500">যোগাযোগ ও কার্যালয়</p>
            <a
              href={MAPS_SEARCH_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex items-start gap-2 text-sm font-medium leading-relaxed text-slate-800 hover:text-emerald-800 hover:underline"
            >
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-700" />
              <span>{ABOUT_ADDRESS}</span>
            </a>
          </div>

          {/* ফেসবুক পেজ লিংক */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 min-w-0">
            <p className="text-xs font-semibold text-slate-500">ফেসবুক পেজ লিংক</p>
            <a
              href={FACEBOOK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-2 break-all font-mono-num text-xs font-semibold text-blue-700 hover:underline sm:text-sm"
            >
              <Facebook className="h-4 w-4 shrink-0" />
              <span>{FACEBOOK_URL}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>

          {/* ইউটিউব চ্যানেল লিংক */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 min-w-0">
            <p className="text-xs font-semibold text-slate-500">ইউটিউব চ্যানেল লিংক</p>
            <a
              href={YOUTUBE_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-flex max-w-full items-center gap-2 break-all font-mono-num text-xs font-semibold text-red-700 hover:underline sm:text-sm"
            >
              <Youtube className="h-4 w-4 shrink-0" />
              <span>{YOUTUBE_URL}</span>
              <ExternalLink className="h-3.5 w-3.5 shrink-0" />
            </a>
          </div>
        </div>
      </div>

      {/* ২. সংগঠনের মূল উদ্দেশ্য এবং ৩. স্লোগান */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 text-emerald-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-800 text-white">
              <HeartHandshake className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-bold">২. সংগঠনের মূল উদ্দেশ্য</h2>
          </div>
          <p className="mt-4 font-display text-xl font-bold leading-relaxed text-emerald-950 sm:text-2xl">
            মহান আল্লাহ তাআলার সন্তুষ্টি অর্জন।
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-900">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
              <Sparkles className="h-5 w-5" />
            </span>
            <h2 className="font-display text-lg font-bold">৩. স্লোগান</h2>
          </div>
          <p className="mt-4 font-display text-xl font-bold tracking-wide text-emerald-800 sm:text-2xl">
            {ORG_TAGLINE}
          </p>
        </div>
      </div>

      {/* ৪. সংগঠনের রূপরেখা ও মূল লক্ষ্য */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <Target className="h-5 w-5" />
          </span>
          <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
            ৪. সংগঠনের রূপরেখা ও মূল লক্ষ্য
          </h2>
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {CORE_PILLARS.map((pillar) => {
            const Icon = pillar.icon;
            return (
              <div
                key={pillar.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-5"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="font-display text-base font-bold text-slate-900">
                    {pillar.title}
                  </h3>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-700">
                  {pillar.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* ৫. মূল নীতিমালা ও গঠনতন্ত্র */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-800">
            <ScrollText className="h-5 w-5" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-900 sm:text-xl">
              ৫. মূল নীতিমালা ও গঠনতন্ত্র
            </h2>
            <p className="mt-0.5 text-xs text-slate-500">
              ধারা-১ থেকে ধারা-১৫ পর্যন্ত সংগঠনের পূর্ণাঙ্গ নীতিমালা
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {CONSTITUTION_ARTICLES.map((article) => (
            <article
              key={article.number}
              className="rounded-xl border border-slate-200 bg-slate-50/50 p-5 transition-colors hover:border-emerald-200 hover:bg-emerald-50/20"
            >
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="inline-flex items-center rounded-md bg-emerald-800 px-2.5 py-1 text-xs font-bold text-white">
                  {article.number}
                </span>
                <h3 className="font-display text-base font-bold text-slate-900">
                  {article.title}:
                </h3>
              </div>

              {article.body && (
                <p className="mt-3 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  {article.body}
                </p>
              )}

              {article.clauses && (
                <ul className="mt-3 space-y-2 text-sm leading-relaxed text-slate-700 sm:text-[15px]">
                  {article.clauses.map((clause, idx) => (
                    <li key={idx}>{clause}</li>
                  ))}
                </ul>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};
