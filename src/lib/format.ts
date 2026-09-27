export function paiseToRupees(paise: number) {
  return paise / 100;
}

export function rupeesToPaise(rupees: number) {
  return Math.round(rupees * 100);
}

export function formatINR(paise: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(paiseToRupees(paise));
}

export function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}

export const INDIAN_MOBILE_REGEX = /^[6-9][0-9]{9}$/;

export function isValidIndianMobile(value: string) {
  return INDIAN_MOBILE_REGEX.test(value.replace(/\s+/g, ""));
}

export function normalizeMobile(value: string) {
  return value.replace(/\D/g, "").slice(-10);
}
