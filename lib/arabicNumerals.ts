const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

/** Renders a number/numeric string using Arabic-Indic digits (٠-٩). Ported from the old MVP's per-screen `arabicNumber()` helper. */
export function arabicNumber(n: number | string): string {
  return String(n).replace(/\d/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]);
}

export interface ArabicPluralForms {
  zero?: string;
  one: string;
  two?: string;
  /** 3–10 */
  few: string;
  /** 11+ (falls back to `few` if not given) */
  many?: string;
}

/**
 * Picks the grammatically correct Arabic plural form for a count.
 * Arabic agreement: 0 own form, 1 singular, 2 dual, 3–10 plural, 11+ singular-ish "many" form.
 */
export function arabicPlural(n: number, forms: ArabicPluralForms): string {
  if (n === 0 && forms.zero !== undefined) return forms.zero;
  if (n === 1) return forms.one;
  if (n === 2 && forms.two !== undefined) return forms.two;
  if (n >= 3 && n <= 10) return forms.few;
  return forms.many ?? forms.few;
}

/** Formats a count + Arabic plural label, digits rendered as Arabic-Indic. e.g. arabicCount(3, {...}) -> "٣ دقائق" */
export function arabicCount(n: number, forms: ArabicPluralForms): string {
  return `${arabicNumber(n)} ${arabicPlural(n, forms)}`;
}
