"use client"

import { useMemo, useState } from "react"
import { Pencil, Save, Search, ShieldCheck, Trash2, UserRound, Users, X } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useDeleteUserMutation, useListUsersQuery, useUpdateUserMutation } from "@/redux/features/users/userApiSlice"
import type { UserSummary } from "@/redux/features/users/userTypes"
import { isSuperuserFromToken } from "@/lib/adminAccess"

const formatDate = (value?: Date | string | null) => {
  if (!value) return "Never"
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? "Unknown" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date)
}

export default function PlatformUsersPage() {
  const isSuperuser = isSuperuserFromToken()
  const { data: users = [], isLoading, isError, refetch } = useListUsersQuery()
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation()
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation()
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<UserSummary["id"] | null>(null)
  const [editFirstName, setEditFirstName] = useState("")
  const [editLastName, setEditLastName] = useState("")
  const [editReferralCode, setEditReferralCode] = useState("")
  const [editCommission, setEditCommission] = useState("5")
  const [editIsStaff, setEditIsStaff] = useState(false)
  const [editIsAffiliate, setEditIsAffiliate] = useState(false)
  const [editIsVerified, setEditIsVerified] = useState(false)

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => [user.email, user.first_name, user.last_name, user.get_full_name, user.role].filter(Boolean).join(" ").toLowerCase().includes(query))
  }, [search, users])

  const staffCount = users.filter((user) => user.is_staff || user.is_superuser).length
  const verifiedCount = users.filter((user) => user.is_verified).length
  const editingUser = users.find((user) => user.id === editingId) ?? null

  const startEdit = (user: UserSummary) => {
    setEditingId(user.id)
    setEditFirstName(user.first_name || "")
    setEditLastName(user.last_name || "")
    setEditReferralCode(user.referral_code || "")
    setEditCommission(String(Number(user.referral_commission_rate ?? 0.05) * 100))
    setEditIsStaff(Boolean(user.is_staff))
    setEditIsAffiliate(Boolean(user.is_affiliate_marketer))
    setEditIsVerified(Boolean(user.is_verified))
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (user: UserSummary) => {
    const commission = Number(editCommission)
    const code = editReferralCode.trim().toUpperCase()
    if (!code || !/^[A-Z0-9_-]{3,16}$/.test(code) || !Number.isFinite(commission) || commission < 0 || commission > 100) {
      toast.error("Enter a valid referral code and a commission between 0 and 100%.")
      return
    }
    try {
      await updateUser({
        id: user.id,
        data: {
          first_name: editFirstName.trim(),
          last_name: editLastName.trim(),
          referral_code: code,
          referral_commission_rate: (commission / 100).toFixed(5),
          is_staff: editIsStaff,
          is_affiliate_marketer: editIsAffiliate,
          is_verified: editIsVerified,
        },
      }).unwrap()
      await refetch()
      setEditingId(null)
      toast.success("User updated.")
    } catch (error: any) {
      toast.error(error?.data?.referral_code?.[0] || error?.data?.detail || "Unable to update user.")
    }
  }

  const removeUser = async (user: UserSummary) => {
    if (!window.confirm(`Delete ${user.email}? This cannot be undone.`)) return
    try {
      await deleteUser(user.id).unwrap()
      await refetch()
      toast.success("User deleted.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to delete user.")
    }
  }

  return (
    <section className="admin-portal-surface mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-700">People and access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Platform users</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Review every account on Intera IMS separately from staff invitations and workspace membership.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5"><Users className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-slate-600">Total users</p><p className="text-2xl font-semibold text-slate-950">{users.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><div><p className="text-sm text-slate-600">Platform staff</p><p className="text-2xl font-semibold text-slate-950">{staffCount}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><UserRound className="h-5 w-5 text-cyan-600" /><div><p className="text-sm text-slate-600">Verified accounts</p><p className="text-2xl font-semibold text-slate-950">{verifiedCount}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>All users</CardTitle><CardDescription>Search accounts and inspect their platform-level status.</CardDescription></div>
          <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or role" className="pl-9" aria-label="Search platform users" /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="py-8 text-sm text-slate-500">Loading platform users...</p> : null}
          {isError ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load platform users. Refresh and try again.</p> : null}
          {!isLoading && !isError && filteredUsers.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No users match this search.</p> : null}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><p className="font-semibold text-slate-950">{user.get_full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}</p><p className="mt-1 text-sm text-slate-600">{user.email} · Joined {formatDate(user.date_joined)} · Last login {formatDate(user.last_login)}</p><p className="mt-1 text-xs text-slate-500">Referral code: {user.referral_code || "Not set"} · Commission: {Number(user.referral_commission_rate ?? 0.05) * 100}%</p></div>
                <div className="flex flex-wrap items-center gap-2">
                  {user.is_superuser ? <Badge className="bg-blue-600 text-white">Superuser</Badge> : user.is_staff ? <Badge className="bg-emerald-600 text-white">Staff</Badge> : <Badge variant="outline">User</Badge>}
                  {user.is_affiliate_marketer ? <Badge className="bg-cyan-600 text-white">Affiliate marketer</Badge> : null}
                  {user.is_verified ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Verified</Badge> : <Badge variant="outline" className="border-amber-300 text-amber-700">Unverified</Badge>}
                  {user.mfa_enabled ? <Badge variant="outline" className="border-blue-300 text-blue-700">MFA enabled</Badge> : null}
                  {isSuperuser ? <Button size="sm" variant="outline" onClick={() => startEdit(user)}><Pencil className="mr-1 h-4 w-4" />Edit</Button> : null}
                  {isSuperuser && !user.is_superuser ? <Button size="sm" variant="outline" className="text-red-700 hover:text-red-800" onClick={() => void removeUser(user)} disabled={isDeleting}><Trash2 className="mr-1 h-4 w-4" />Delete</Button> : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {editingUser ? (
        <Dialog open onOpenChange={(open) => { if (!open) cancelEdit() }}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Edit platform user</DialogTitle>
              <DialogDescription>Update the account profile, referral settings, and platform access flags for {editingUser.email}.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2 md:grid-cols-2">
              <div className="space-y-2"><label htmlFor="edit-first-name" className="text-sm font-medium text-gray-900">First name</label><Input id="edit-first-name" value={editFirstName} onChange={(event) => setEditFirstName(event.target.value)} placeholder="First name" /></div>
              <div className="space-y-2"><label htmlFor="edit-last-name" className="text-sm font-medium text-gray-900">Last name</label><Input id="edit-last-name" value={editLastName} onChange={(event) => setEditLastName(event.target.value)} placeholder="Last name" /></div>
              <div className="space-y-2"><label htmlFor="edit-referral-code" className="text-sm font-medium text-gray-900">Referral code</label><Input id="edit-referral-code" value={editReferralCode} onChange={(event) => setEditReferralCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="Referral code" /></div>
              <div className="space-y-2"><label htmlFor="edit-commission" className="text-sm font-medium text-gray-900">Commission percentage</label><Input id="edit-commission" value={editCommission} onChange={(event) => setEditCommission(event.target.value)} inputMode="decimal" placeholder="Commission %" /></div>
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={editIsStaff} onChange={(event) => setEditIsStaff(event.target.checked)} /> Platform staff</label>
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={editIsAffiliate} onChange={(event) => setEditIsAffiliate(event.target.checked)} /> Affiliate marketer</label>
              <label className="flex items-center gap-2 text-sm text-gray-700"><input type="checkbox" checked={editIsVerified} onChange={(event) => setEditIsVerified(event.target.checked)} /> Verified account</label>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={cancelEdit}><X className="mr-1 h-4 w-4" />Cancel</Button>
              <Button onClick={() => void saveEdit(editingUser)} disabled={isUpdating}><Save className="mr-1 h-4 w-4" />Save changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      ) : null}
    </section>
  )
}
