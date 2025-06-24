import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format a date string into a more readable format
 * @param dateString - The date string to format
 * @param options - Intl.DateTimeFormatOptions for customizing the format
 * @returns Formatted date string
 */
export function formatDate(
  dateString?: string,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "long",
    day: "numeric",
  },
): string {
  if (!dateString) return "Not available"

  try {
    const date = new Date(dateString)

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return "Invalid date"
    }

    return new Intl.DateTimeFormat("en-US", options).format(date)
  } catch (error) {
    return "Error formatting date"
  }
}


export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}




export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) {
      return "just now"
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60)
      return `${minutes} minute${minutes > 1 ? "s" : ""} ago`
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600)
      return `${hours} hour${hours > 1 ? "s" : ""} ago`
    } else if (diffInSeconds < 604800) {
      const days = Math.floor(diffInSeconds / 86400)
      return `${days} day${days > 1 ? "s" : ""} ago`
    } else {
      return formatDate(dateString)
    }
  } catch (error) {
    return dateString
  }
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value)
}

export function safeNumber(value: string | number | null | undefined): number {
  if (value === null || value === undefined) return 0
  const num = typeof value === "string" ? Number.parseFloat(value) : value
  return isNaN(num) ? 0 : num
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + "..."
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((word) => word.charAt(0))
    .join("")
    .toUpperCase()
    .substring(0, 2)
}


const extractErrorMessage = (error: any,fields:string[]): string => {
    if (!error) return "An unknown error occurred"

    const errorData = error.data || {}

    // Check for specific field errors
    if (errorData.email && errorData.email?.length > 0) {
      return `Email: ${errorData.email[0]}`
    }

    if (errorData.password && errorData.password?.length > 0) {
      return `Password: ${errorData.password[0]}`
    }

    if (errorData.code && errorData.code?.length > 0) {
      return `Code: ${errorData.code[0]}`
    }

    if (errorData.non_field_errors && errorData.non_field_errors?.length > 0) {
      return errorData.non_field_errors[0]
    }

    if (errorData.detail) {
      return errorData.detail
    }

    // Handle network errors
    if (!navigator.onLine) {
      return "Network error: Please check your internet connection"
    }

    // Default error messages based on status code
    switch (error.status) {
      case 400:
        return "Invalid request: Please check your information"
      case 401:
        return "Authentication failed: Your credentials are incorrect"
      case 403:
        return "Access denied: You don't have permission for this action"
      case 404:
        return "Account not found: No account exists with this email"
      case 429:
        return "Too many attempts: Please wait a moment before trying again"
      case 500:
      case 502:
      case 503:
        return "Server error: We're experiencing technical difficulties"
      default:
        return "An error occurred. Please try again"
    }
  }
