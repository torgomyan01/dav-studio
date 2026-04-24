/** Մուտքի համար հեռախոսը միասնական տեսքի բերել (միայն թվեր) */
export function normalizePhone(input: string): string {
  return input.replace(/\D/g, '');
}

/** Հեռախոսահամարի input mask (օր. 094 943 389) */
export function maskPhoneInput(input: string): string {
  const digits = normalizePhone(input).slice(0, 9);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
}
