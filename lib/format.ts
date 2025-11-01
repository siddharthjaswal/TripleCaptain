const DEFAULT_LOCALE = "en-GB";
const defaultFormatter = new Intl.NumberFormat(DEFAULT_LOCALE);

export function formatNumber(
  value: number,
  options?: Intl.NumberFormatOptions,
  locale: string = DEFAULT_LOCALE,
): string {
  if (!Number.isFinite(value)) {
    return String(value);
  }

  if (!options && locale === DEFAULT_LOCALE) {
    return defaultFormatter.format(value);
  }

  return new Intl.NumberFormat(locale, options).format(value);
}
