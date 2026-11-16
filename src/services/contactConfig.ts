export const ORG_CONTACT = {
  addressLine1: 'তুষখালী, তালেব মার্কেট, ছোটবিঘাই',
  addressLine2: 'পটুয়াখালী সদর, পটুয়াখালী',
  phoneDisplay: '+8801810893388',
  phoneTelHref: 'tel:+8801810893388',
  bkashNumber: '01810893388',
  bkashPlayStoreUrl: 'https://play.google.com/store/apps/details?id=com.bKash.customerapp',
  bkashAppIntentUrl:
    'intent://launch#Intent;package=com.bKash.customerapp;S.browser_fallback_url=https%3A%2F%2Fplay.google.com%2Fstore%2Fapps%2Fdetails%3Fid%3Dcom.bKash.customerapp;end',
  email: 'Al.azhar.io.taleb.market@gmail.com',
  gmailComposeUrl:
    'https://mail.google.com/mail/?view=cm&fs=1&to=Al.azhar.io.taleb.market@gmail.com',
} as const;

export async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback to execCommand below
  }
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function triggerBkashSendMoney(
  appIntentAnchor: HTMLAnchorElement | null,
  playStoreAnchor: HTMLAnchorElement | null
): () => void {
  const isAndroid = /android/i.test(navigator.userAgent || '');

  if (!isAndroid) {
    playStoreAnchor?.click();
    return () => {};
  }

  let appOpened = false;
  const handleVisibilityOrBlur = () => {
    if (document.visibilityState === 'hidden' || !document.hasFocus()) {
      appOpened = true;
    }
  };

  document.addEventListener('visibilitychange', handleVisibilityOrBlur);
  window.addEventListener('blur', handleVisibilityOrBlur);

  appIntentAnchor?.click();

  const timerId = window.setTimeout(() => {
    document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
    window.removeEventListener('blur', handleVisibilityOrBlur);

    if (!appOpened && document.visibilityState === 'visible') {
      playStoreAnchor?.click();
    }
  }, 1500);

  return () => {
    window.clearTimeout(timerId);
    document.removeEventListener('visibilitychange', handleVisibilityOrBlur);
    window.removeEventListener('blur', handleVisibilityOrBlur);
  };
}
