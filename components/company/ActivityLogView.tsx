"use client"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ReactSelectField, type SelectOption } from "@/components/ui/react-select-field"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, Download, Activity, AlertCircle } from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useGetActivityLogsQuery, useExportActivityLogsMutation } from "@/redux/features/management/companyProfileApiSlice"
import type { ActivityLog } from "@/types/company-profile"

interface ActivityLogViewProps {
  profileId: string
  userId: string
}

interface FilterState {
  search: string
  action: string
  model_name: string
  user: string
}

const ACTION_OPTIONS: SelectOption[] = [
  { value: "", label: "All Actions" },
  { value: "CREATE", label: "Creation" },
  { value: "UPDATE", label: "Modification" },
  { value: "DELETE", label: "Deletion" },
  { value: "APPROVE", label: "Approval" },
  { value: "CANCEL", label: "Cancellation" },
]

const MODEL_OPTIONS: SelectOption[] = [
  { value: "", label: "All Models" },
  { value: "CompanyProfile", label: "Company Profile" },
  { value: "StaffRole", label: "Staff Role" },
  { value: "StaffGroup", label: "Staff Group" },
  { value: "StaffRoleAssignment", label: "Role Assignment" },
  { value: "RecallPolicy", label: "Recall Policy" },
  { value: "ReorderStrategy", label: "Reorder Strategy" },
  { value: "InventoryPolicy", label: "Inventory Policy" },
]

export function ActivityLogView({ profileId, userId }: ActivityLogViewProps) {
  const [filters, setFilters] = useState<FilterState>({
    search: "",
    action: "",
    model_name: "",
    user: "",
  })

  const [page, setPage] = useState(1)
  const pageSize = 20

  const {
    data: activityData,
    isLoading,
    error: fetchError,
  } = useGetActivityLogsQuery({
    ...filters,
    page,
    page_size: pageSize,
  })

  const [exportLogs, { isLoading: isExporting, error: exportError }] = useExportActivityLogsMutation()

  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // Handle errors
  useEffect(() => {
    const error = fetchError || exportError
    if (error) {
      setErrorMessage(JSON.stringify(error))
      const timer = setTimeout(() => {
        setErrorMessage(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [fetchError, exportError])

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filters change
  }

  const handleExport = async () => {
    try {
      const blob = await exportLogs({ profileId, ...filters }).unwrap()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `activity-logs-${new Date().toISOString().split("T")[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Failed to export activity logs:", error)
    }
  }

  const getActionBadgeVariant = (action: string) => {
    switch (action) {
      case "CREATE":
        return "default"
      case "UPDATE":
        return "secondary"
      case "DELETE":
        return "destructive"
      case "APPROVE":
        return "default"
      case "CANCEL":
        return "outline"
      default:
        return "outline"
    }
  }

  if (isLoading && page === 1) {
    return (
      <div className="flex justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  const logs = activityData?.results || []
  const totalCount = activityData?.count || 0
  const hasNextPage = !!activityData?.next
  const hasPreviousPage = !!activityData?.previous

  return (
    <div className="space-y-6">
      {errorMessage && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium flex items-center gap-2">
          <Activity className="h-5 w-5" />
          Activity Log
        </h3>
        <Button onClick={handleExport} disabled={isExporting} className="flex items-center gap-2">
          <Download className="h-4 w-4" />
          {isExporting ? "Exporting..." : "Export"}
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search activities..."
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Action Type</Label>
              <ReactSelectField
                options={ACTION_OPTIONS}
                value={ACTION_OPTIONS.find((option) => option.value === filters.action) || null}
                onChange={(option) => {
                  if (option && !Array.isArray(option)) {
                    handleFilterChange("action", option.value)
                  } else {
                    handleFilterChange("action", "")
                  }
                }}
                placeholder="Filter by action"
                isClearable
              />
            </div>

            <div className="space-y-2">
              <Label>Model Type</Label>
              <ReactSelectField
                options={MODEL_OPTIONS}
                value={MODEL_OPTIONS.find((option) => option.value === filters.model_name) || null}
                onChange={(option) => {
                  if (option && !Array.isArray(option)) {
                    handleFilterChange("model_name", option.value)
                  } else {
                    handleFilterChange("model_name", "")
                  }
                }}
                placeholder="Filter by model"
                isClearable
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Input
                id="user"
                value={filters.user}
                onChange={(e) => handleFilterChange("user", e.target.value)}
                placeholder="Filter by user"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Activity Log List */}
      <div className="space-y-4">
        {logs.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-muted-foreground">
              No activity logs found. Try adjusting your filters.
            </CardContent>
          </Card>
        ) : (
          logs.map((log: ActivityLog) => (
            <Card key={`${log.id}-${log.timestamp}`}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant={getActionBadgeVariant(log.action)}>{log.action}</Badge>
                      <span className="text-sm font-medium">{log.model_name}</span>
                      <span className="text-sm text-muted-foreground">#{log.object_id}</span>
                    </div>
                    <p className="text-sm">
                      <span className="font-medium">{log.user || "System"}</span> performed{" "}
                      <span className="lowercase">{log.action}</span> on {log.model_name}
                    </p>
                    {log.details && Object.keys(log.details).length > 0 && (
                      <div className="text-xs text-muted-foreground">
                        <pre className="whitespace-pre-wrap">{JSON.stringify(log.details, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(log.timestamp).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalCount > pageSize && (
        <div className="flex justify-between items-center">
          <div className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} entries
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => Math.max(1, prev - 1))}
              disabled={!hasPreviousPage || isLoading}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((prev) => prev + 1)}
              disabled={!hasNextPage || isLoading}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
