"use client"

import { useMemo, useState } from "react"
import { Building2, CheckCircle2, Clock3, Pencil, Save, Search, Trash2, X } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import {
  useDeleteCompanyProfileMutation,
  useListCompanyProfilesQuery,
  useUnverifyCompanyProfileMutation,
  useUpdateCompanyProfileMutation,
  useVerifyCompanyProfileMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import type { CompanyProfileListItem } from "@/redux/features/management/companyProfileTypes"

const formatDate = (value?: string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Unknown"

export default function WorkspaceManagementPage() {
  const { data: workspaces = [], isLoading, isError, refetch } = useListCompanyProfilesQuery()
  const [verifyWorkspace, { isLoading: isVerifying }] = useVerifyCompanyProfileMutation()
  const [unverifyWorkspace, { isLoading: isUnverifying }] = useUnverifyCompanyProfileMutation()
  const [updateWorkspace, { isLoading: isUpdating }] = useUpdateCompanyProfileMutation()
  const [deleteWorkspace, { isLoading: isDeleting }] = useDeleteCompanyProfileMutation()
  const [search, setSearch] = useState("")
  const [status, setStatus] = useState<"all" | "verified" | "unverified">("all")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editIndustry, setEditIndustry] = useState("")

  const filteredWorkspaces = useMemo(() => {
    const query = search.trim().toLowerCase()
    return workspaces.filter((workspace) => {
      const matchesStatus = status === "all" || (status === "verified" ? workspace.is_verified : !workspace.is_verified)
      const matchesSearch = !query || [workspace.name, workspace.industry, workspace.owner_name, workspace.owner_email].filter(Boolean).join(" ").toLowerCase().includes(query)
      return matchesStatus && matchesSearch
    })
  }, [search, status, workspaces])

  const startEdit = (workspace: CompanyProfileListItem) => {
    setEditingId(workspace.id)
    setEditName(workspace.name)
    setEditIndustry(workspace.industry || "")
  }

  const saveEdit = async (workspace: CompanyProfileListItem) => {
    if (!editName.trim()) {
      toast.error("Workspace name is required.")
      return
    }
    try {
      await updateWorkspace({ id: workspace.id, data: { name: editName.trim(), industry: editIndustry.trim() } }).unwrap()
      await refetch()
      setEditingId(null)
      toast.success("Workspace updated.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to update workspace.")
    }
  }

  const toggleVerification = async (workspace: CompanyProfileListItem) => {
    try {
      if (workspace.is_verified) await unverifyWorkspace(workspace.id).unwrap()
      else await verifyWorkspace(workspace.id).unwrap()
      await refetch()
      toast.success(workspace.is_verified ? "Workspace verification revoked." : "Workspace verified.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to update workspace verification.")
    }
  }

  const removeWorkspace = async (workspace: CompanyProfileListItem) => {
    if (!window.confirm(`Delete ${workspace.name}? This cannot be undone.`)) return
    try {
      await deleteWorkspace(workspace.id).unwrap()
      await refetch()
      toast.success("Workspace deleted.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to delete workspace.")
    }
  }

  const verifiedCount = workspaces.filter((workspace) => workspace.is_verified).length

  return (
    <section className="admin-portal-surface mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-700">Platform governance</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Workspace management</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Review every workspace created on Intera IMS, verify new workspaces, and maintain their platform-level details.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5"><Building2 className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-slate-600">Total workspaces</p><p className="text-2xl font-semibold text-slate-950">{workspaces.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><CheckCircle2 className="h-5 w-5 text-emerald-600" /><div><p className="text-sm text-slate-600">Verified</p><p className="text-2xl font-semibold text-slate-950">{verifiedCount}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><Clock3 className="h-5 w-5 text-amber-600" /><div><p className="text-sm text-slate-600">Awaiting verification</p><p className="text-2xl font-semibold text-slate-950">{workspaces.length - verifiedCount}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>All workspaces</CardTitle><CardDescription>Verification is a platform-admin action and is separate from workspace ownership.</CardDescription></div>
          <div className="flex w-full flex-col gap-2 sm:max-w-md sm:flex-row">
            <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search workspace or owner" className="pl-9" aria-label="Search workspaces" /></div>
            <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)} className="h-11 rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-900"><option value="all">All statuses</option><option value="unverified">Awaiting verification</option><option value="verified">Verified</option></select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="py-8 text-sm text-slate-500">Loading workspaces...</p> : null}
          {isError ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load workspaces. Refresh and try again.</p> : null}
          {!isLoading && !isError && filteredWorkspaces.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No workspaces match this filter.</p> : null}
          <div className="space-y-3">
            {filteredWorkspaces.map((workspace) => (
              <div key={workspace.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                {editingId === workspace.id ? <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2"><Input value={editName} onChange={(event) => setEditName(event.target.value)} placeholder="Workspace name" aria-label="Workspace name" /><Input value={editIndustry} onChange={(event) => setEditIndustry(event.target.value)} placeholder="Industry" aria-label="Industry" /></div> : <div className="min-w-0"><p className="font-semibold text-slate-950">{workspace.name}</p><p className="mt-1 text-sm text-slate-600">Owner: {workspace.owner_name || "Unnamed owner"}{workspace.owner_email ? ` · ${workspace.owner_email}` : ""}</p><p className="mt-1 text-xs text-slate-500">{workspace.industry || "Industry not set"} · {workspace.staff_count} active staff · Created {formatDate(workspace.created_at)}</p></div>}
                <div className="flex flex-wrap items-center gap-2">
                  {workspace.is_verified ? <Badge className="bg-emerald-600 text-white">Verified</Badge> : <Badge variant="outline" className="border-amber-300 text-amber-700">Awaiting verification</Badge>}
                  {editingId === workspace.id ? <><Button size="sm" onClick={() => void saveEdit(workspace)} disabled={isUpdating}><Save className="mr-1 h-4 w-4" />Save</Button><Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="mr-1 h-4 w-4" />Cancel</Button></> : <Button size="sm" variant="outline" onClick={() => startEdit(workspace)}><Pencil className="mr-1 h-4 w-4" />Edit</Button>}
                  <Button size="sm" variant="outline" onClick={() => void toggleVerification(workspace)} disabled={isVerifying || isUnverifying}>{workspace.is_verified ? "Revoke verification" : "Verify workspace"}</Button>
                  <Button size="sm" variant="outline" className="text-red-700 hover:text-red-800" onClick={() => void removeWorkspace(workspace)} disabled={isDeleting}><Trash2 className="mr-1 h-4 w-4" />Delete</Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
