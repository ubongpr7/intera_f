"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxVisiblePages?: number
}

export function Pagination({ currentPage, totalPages, onPageChange, maxVisiblePages = 5 }: PaginationProps) {
  if (totalPages <= 1) return null

  // Calculate visible page range
  const getVisiblePages = () => {
    if (totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1)
    }

    const halfVisible = Math.floor(maxVisiblePages / 2)
    let startPage = Math.max(currentPage - halfVisible, 1)
    const endPage = Math.min(startPage + maxVisiblePages - 1, totalPages)

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(endPage - maxVisiblePages + 1, 1)
    }

    return Array.from({ length: endPage - startPage + 1 }, (_, i) => startPage + i)
  }

  const visiblePages = getVisiblePages()

  return (
    <div className="flex items-center justify-center space-x-2">
      <Button variant="outline" size="icon" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
        <ChevronLeft className="h-4 w-4" />
        <span className="sr-only">Previous page</span>
      </Button>

      {visiblePages[0] > 1 && (
        <>
          <Button variant={currentPage === 1 ? "default" : "outline"} size="icon" onClick={() => onPageChange(1)}>
            1
          </Button>
          {visiblePages[0] > 2 && (
            <span className="flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
        </>
      )}

      {visiblePages.map((page) => (
        <Button
          key={page}
          variant={currentPage === page ? "default" : "outline"}
          size="icon"
          onClick={() => onPageChange(page)}
        >
          {page}
        </Button>
      ))}

      {visiblePages[visiblePages.length - 1] < totalPages && (
        <>
          {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
            <span className="flex items-center justify-center">
              <MoreHorizontal className="h-4 w-4" />
            </span>
          )}
          <Button
            variant={currentPage === totalPages ? "default" : "outline"}
            size="icon"
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </Button>
        </>
      )}

      <Button
        variant="outline"
        size="icon"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        <ChevronRight className="h-4 w-4" />
        <span className="sr-only">Next page</span>
      </Button>
    </div>
  )
}
