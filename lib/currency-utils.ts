import { getCookie } from "cookies-next";

interface CurrencyConfig {
  symbol: string
  decimals: number
  locale: string
}

// Currency configuration mapping
const CURRENCY_CONFIG: Record<string, CurrencyConfig> = {
  USD: { symbol: "$", decimals: 2, locale: "en-US" },
  EUR: { symbol: "€", decimals: 2, locale: "de-DE" },
  GBP: { symbol: "£", decimals: 2, locale: "en-GB" },
  NGN: { symbol: "₦", decimals: 2, locale: "en-NG" },
  CAD: { symbol: "C$", decimals: 2, locale: "en-CA" },
  AUD: { symbol: "A$", decimals: 2, locale: "en-AU" },
  JPY: { symbol: "¥", decimals: 0, locale: "ja-JP" },
  CNY: { symbol: "¥", decimals: 2, locale: "zh-CN" },
  INR: { symbol: "₹", decimals: 2, locale: "en-IN" },
  ZAR: { symbol: "R", decimals: 2, locale: "en-ZA" },
  KES: { symbol: "KSh", decimals: 2, locale: "en-KE" },
  GHS: { symbol: "₵", decimals: 2, locale: "en-GH" },
  XOF: { symbol: "CFA", decimals: 0, locale: "fr-SN" },
  XAF: { symbol: "FCFA", decimals: 0, locale: "fr-CM" },
  BRL: { symbol: "R$", decimals: 2, locale: "pt-BR" },
  MXN: { symbol: "$", decimals: 2, locale: "es-MX" },
  CHF: { symbol: "CHF", decimals: 2, locale: "de-CH" },
  SEK: { symbol: "kr", decimals: 2, locale: "sv-SE" },
  NOK: { symbol: "kr", decimals: 2, locale: "nb-NO" },
  DKK: { symbol: "kr", decimals: 2, locale: "da-DK" },
  RUB: { symbol: "₽", decimals: 2, locale: "ru-RU" },
  KRW: { symbol: "₩", decimals: 0, locale: "ko-KR" },
  SGD: { symbol: "S$", decimals: 2, locale: "en-SG" },
  HKD: { symbol: "HK$", decimals: 2, locale: "zh-HK" },
  MYR: { symbol: "RM", decimals: 2, locale: "ms-MY" },
  THB: { symbol: "฿", decimals: 2, locale: "th-TH" },
  PHP: { symbol: "₱", decimals: 2, locale: "en-PH" },
  IDR: { symbol: "Rp", decimals: 0, locale: "id-ID" },
  TZS: { symbol: "TSh", decimals: 2, locale: "sw-TZ" },
  UGX: { symbol: "USh", decimals: 0, locale: "en-UG" },
  EGP: { symbol: "£", decimals: 2, locale: "ar-EG" },
  MAD: { symbol: "د.م.", decimals: 2, locale: "fr-MA" },
  AED: { symbol: "د.إ", decimals: 2, locale: "ar-AE" },
  SAR: { symbol: "﷼", decimals: 2, locale: "ar-SA" },
  BDT: { symbol: "৳", decimals: 2, locale: "bn-BD" },
  PKR: { symbol: "₨", decimals: 2, locale: "ur-PK" },
};

/**
 * Formats a monetary value with proper currency symbol and formatting
 * @param currencyCode - The currency code (e.g., 'USD', 'NGN', 'EUR')
 * @param value - The monetary value to format
 * @param options - Optional formatting options
 * @returns Formatted currency string
 */
export function formatCurrency(
  currencyCode: string,
  value: number | string | null | undefined,
  options: {
    showSymbol?: boolean
    showCode?: boolean
    minimumFractionDigits?: number
    maximumFractionDigits?: number
    compact?: boolean
  } = {},
): string {
  // Handle null/undefined/empty values
  if (value === null || value === undefined || value === "") {
    return options.showSymbol ? `${getCurrencySymbol(currencyCode)}0.00` : "0.00"
  }

  // Convert to number
  const numericValue = typeof value === "string" ? Number.parseFloat(value) : value

  // Handle invalid numbers
  if (isNaN(numericValue)) {
    return options.showSymbol ? `${getCurrencySymbol(currencyCode)}0.00` : "0.00"
  }

  const { showSymbol = true, showCode = false, compact = false } = options

  // Get currency configuration
  const config = CURRENCY_CONFIG[currencyCode.toUpperCase()] || CURRENCY_CONFIG.USD

  // Determine decimal places
  const minimumFractionDigits = options.minimumFractionDigits ?? config.decimals
  const maximumFractionDigits = options.maximumFractionDigits ?? config.decimals

  // Format the number
  let formattedValue: string

  if (compact && Math.abs(numericValue) >= 1000) {
    // Compact formatting for large numbers
    formattedValue = new Intl.NumberFormat(config.locale, {
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(numericValue)
  } else {
    // Standard formatting
    formattedValue = new Intl.NumberFormat(config.locale, {
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numericValue)
  }

  // Build the final string
  let result = ""

  if (showSymbol) {
    result = `${config.symbol}${formattedValue}`
  } else {
    result = formattedValue
  }

  if (showCode) {
    result = `${result} ${currencyCode.toUpperCase()}`
  }

  return result
}

/**
 * Gets the currency symbol for a given currency code
 * @param currencyCode - The currency code
 * @returns Currency symbol
 */
export function getCurrencySymbol(currencyCode: string): string {
  const config = CURRENCY_CONFIG[currencyCode.toUpperCase()]
  return config?.symbol || currencyCode.toUpperCase()
}
export function getCurrencySymbolForProfile() {
  const currencyCode= `${getCookie('currency')}`
  const config = CURRENCY_CONFIG[currencyCode?.toUpperCase()||'USD']
  return config?.symbol || currencyCode.toUpperCase()
}

/**
 * Formats multiple currency amounts for display
 * @param balances - Array of {currency, amount} objects
 * @param options - Formatting options
 * @returns Array of formatted currency strings
 */
export function formatMultipleCurrencies(
  balances: Array<{ currency: string; amount: number | string }>,
  options: Parameters<typeof formatCurrency>[2] = {},
): Array<{ currency: string; formatted: string; amount: number }> {
  return balances.map(({ currency, amount }) => ({
    currency: currency.toUpperCase(),
    formatted: formatCurrency(currency, amount, options),
    amount: typeof amount === "string" ? Number.parseFloat(amount) : amount,
  }))
}

/**
 * Parses a currency string back to numeric value
 * @param currencyString - Formatted currency string
 * @param currencyCode - The currency code for context
 * @returns Numeric value
 */
export function parseCurrency(currencyString: string, currencyCode?: string): number {
  if (!currencyString) return 0

  // Remove currency symbols and letters, keep numbers, dots, commas, and minus
  const cleanString = currencyString.replace(/[^\d.,-]/g, "")

  // Handle different decimal separators
  const normalizedString = cleanString.replace(/,/g, "")

  return Number.parseFloat(normalizedString) || 0
}

/**
 * Checks if a currency code is supported
 * @param currencyCode - The currency code to check
 * @returns Boolean indicating if currency is supported
 */
export function isSupportedCurrency(currencyCode: string): boolean {
  return currencyCode.toUpperCase() in CURRENCY_CONFIG
}

/**
 * Gets all supported currency codes
 * @returns Array of supported currency codes
 */
export function getSupportedCurrencies(): string[] {
  return Object.keys(CURRENCY_CONFIG)
}

/**
 * Formats currency for input fields (no symbol, proper decimals)
 * @param currencyCode - The currency code
 * @param value - The value to format
 * @returns Formatted string suitable for input fields
 */
export function formatCurrencyForInput(currencyCode: string, value: number | string): string {
  return formatCurrency(currencyCode, value, {
    showSymbol: false,
    showCode: false,
  })
}

/**
 * Formats currency with abbreviated amounts (1K, 1M, etc.)
 * @param currencyCode - The currency code
 * @param value - The value to format
 * @returns Compact formatted currency string
 */
export function formatCurrencyCompact(currencyCode: string, value: number | string): string {
  return formatCurrency(currencyCode, value, {
    compact: true,
  })
}



export function formatPercentage(
  value: number | null | undefined,
  decimals: number = 2
): string {
  // Handle null/undefined and invalid numbers
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A"
  }

  // Handle infinite values
  if (!isFinite(value)) {
    return value > 0 ? "∞%" : "-∞%"
  }

  // Handle negative zero
  if (Object.is(value, -0)) value = 0

  return new Intl.NumberFormat(undefined, {
    style: 'percent',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value / 100)
}