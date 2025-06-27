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

export const extractErrorMessage = (error: any, listOfKeys: string[]): string => {
    if (!error) return "An unknown error occurred";

    const errorData = error.data || {};

    // Check for field-specific errors
    for (const key of listOfKeys) {
        if (errorData[key] && Array.isArray(errorData[key]) && errorData[key].length > 0) {
            return `${key}: ${errorData[key][0]}`;
        }
    }

    // Check for non_field_errors
    if (errorData.non_field_errors && Array.isArray(errorData.non_field_errors) && errorData.non_field_errors.length > 0) {
        return errorData.non_field_errors[0];
    }

    // Check for detail
    if (errorData.detail) {
        return errorData.detail;
    }

    // Check for network errors
    if (!navigator.onLine) {
        return "Network error: Please check your internet connection";
    }

    // Default error messages based on status code
    switch (error.status) {
        case 400:
            return "Invalid request: Please check your information";
        case 401:
            return "Authentication failed: Your credentials are incorrect";
        case 403:
            return "Access denied: You don't have permission for this action";
        case 404:
            return "Account not found: No account exists with this email";
        case 429:
            return "Too many attempts: Please wait a moment before trying again";
        case 500:
          return 'Check your data entry and try again, ensure you abide by the unique constraint' 
        case 'PARSING_ERROR':
          return 'Check your data entry and try again, ensure you abide by the unique constraint, item with same name or data already exist' 
        case 502:
        case 503:
            return "Server error: We're experiencing technical difficulties";
        default:
            return "An error occurred. Please try again";
    }
};

import {jwtDecode} from 'jwt-decode'
import {getCookie} from 'cookies-next'
export function getDecodedToken(){
  const token= getCookie('accessToken')
  try{
    return jwtDecode(`${token}`)
  } catch{
    return null
  }
}

