export function buildEyanotSmsMessage(
  memberName: string,
  monthName: string,
  amount: number
): string {
  return `আল আজহার ইসলামী সংস্থা: ধন্যবাদ ${memberName}। আপনার ${monthName} মাসের এয়ানত ${amount} টাকা গ্রহণ করা হয়েছে।`;
}

export function buildEyanotSmsHref(
  phone: string,
  memberName: string,
  monthName: string,
  amount: number
): string {
  const cleanPhone = (phone || '').replace(/[^\d+]/g, '');
  const message = buildEyanotSmsMessage(memberName, monthName, amount);
  return `sms:${cleanPhone}?body=${encodeURIComponent(message)}`;
}
