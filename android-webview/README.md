# আল আজহার ইসলামী সংস্থা — Android WebView APK

এই ফোল্ডারে আপনার অ্যাপের (`https://alazhar-app.vercel.app`) জন্য সম্পূর্ণ **Android WebView APK** প্রজেক্ট রয়েছে।

## অটো-আপডেট কীভাবে কাজ করে?
- APK টি সরাসরি লাইভ লিংক `https://alazhar-app.vercel.app` লোড করে।
- অ্যাপ চালু হওয়ার সময় পুরনো HTTP ক্যাশ পরিষ্কার করে সর্বশেষ ভার্সন লোড করে (এবং উপরে টেনে Pull-to-Refresh করা যায়)।
- তাই আপনি **AI Studio থেকে আপডেট করে Vercel-এ ডিপ্লয় করলেই** ব্যবহারকারীর ফোনের APK-তে **স্বয়ংক্রিয়ভাবে নতুন আপডেট চলে আসবে** — বারবার নতুন APK বানানো লাগবে না।

## মোবাইল বা পিসি থেকে APK ফাইল তৈরি করার সবচেয়ে সহজ উপায় (GitHub Actions):
1. AI Studio থেকে প্রজেক্টটি **GitHub**-এ পুশ করুন।
2. GitHub রিপোজিটরির **Actions** ট্যাবে যান → **Build Al Azhar WebView APK** সিলেক্ট করে **Run workflow** বাটনে ক্লিক করুন (প্রথম পুশেই অটো রান হবে)।
3. ২ মিনিটের মধ্যে বিল্ড শেষ হলে **Artifacts** থেকে **`Al-Azhar-WebView-APK`** ডাউনলোড করে আনজিপ করলেই `app-debug.apk` ফাইল পাবেন।

## Android Studio দিয়ে (পিসিতে) APK তৈরি করতে চাইলে:
1. Android Studio-তে `android-webview` ফোল্ডারটি ওপেন করুন।
2. **Build → Build Bundle(s) / APK(s) → Build APK(s)** ক্লিক করুন।
3. তৈরি হওয়া `.apk` ফাইলটি ফোনে ইনস্টল করুন।
