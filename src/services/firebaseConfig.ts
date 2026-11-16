/**
 * Firebase কনফিগারেশন ফাইল (Al Azhar Islamic Organization)
 * 
 * আপনি যদি Vercel, Netlify বা নিজস্ব হোস্টিংয়ে ডিপ্লয় করার সময়
 * নিজের Firebase Project ব্যবহার করতে চান:
 * ১. নিচের ভ্যালুগুলোতে সরাসরি আপনার Firebase Console থেকে পাওয়া তথ্য বসাতে পারেন।
 * ২. অথবা Vercel Environment Variables এ VITE_FIREBASE_* ভেরিয়েবলগুলো সেট করতে পারেন।
 * 
 * বাই-ডিফল্ট এটি AI Studio এর অটো-প্রভিশন করা firebase-applet-config.json থেকে তথ্য গ্রহণ করে।
 */
import localConfig from '../../firebase-applet-config.json';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  firestoreDatabaseId?: string;
  oAuthClientId?: string;
}

export const firebaseConfig: FirebaseClientConfig = {
  // আপনার Firebase Console > Project Settings > General > Your apps থেকে পাওয়া API Key
  apiKey:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_API_KEY) ||
    localConfig.apiKey ||
    '',

  // আপনার Firebase Auth Domain (যেমন: your-project.firebaseapp.com)
  authDomain:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN) ||
    localConfig.authDomain ||
    '',

  // আপনার Firebase Project ID (যেমন: your-project-id)
  projectId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_PROJECT_ID) ||
    localConfig.projectId ||
    '',

  // Storage Bucket
  storageBucket:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET) ||
    localConfig.storageBucket ||
    '',

  // Messaging Sender ID
  messagingSenderId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID) ||
    localConfig.messagingSenderId ||
    '',

  // App ID
  appId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_APP_ID) ||
    localConfig.appId ||
    '',

  // Firestore Database ID (ডিফল্ট ডাটাবেস হলে ফাঁকা রাখতে পারেন বা (default) দিতে পারেন)
  firestoreDatabaseId:
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_FIREBASE_DATABASE_ID) ||
    localConfig.firestoreDatabaseId ||
    '',

  // Google OAuth Client ID (Google Drive GIS OAuth 2.0 এর জন্য)
  oAuthClientId:
    (typeof import.meta !== 'undefined' &&
      (import.meta.env?.VITE_GOOGLE_OAUTH_CLIENT_ID ||
        import.meta.env?.VITE_GOOGLE_CLIENT_ID)) ||
    '416264873628-gnh2isn0nk4qop6dc68t9c7h2j6jh145.apps.googleusercontent.com' ||
    localConfig.oAuthClientId ||
    '',
};
