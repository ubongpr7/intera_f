"use client"

import { useState } from "react"
import { Copy, Link2, Pencil, Plus, Save, Trash2, Users, X } from "lucide-react"
import { toast } from "react-toastify"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  useCreateAffiliatePartnerMutation,
  useListReferralPayoutsQuery,
  useListUsersQuery,
  useListAffiliatePartnersQuery,
  useUpdateReferralPayoutMutation,
  useUpdateAffiliatePartnerMutation,
  useDeleteAffiliatePartnerMutation,
  useUpdateUserMutation,
} from "@/redux/features/users/userApiSlice"
import type { AffiliatePartner, UserSummary } from "@/redux/features/users/userTypes"

const DEFAULT_RATE = "5"

const toRate = (value: string) => {
  const percentage = Number(value)
  if (!Number.isFinite(percentage) || percentage < 0 || percentage > 100) return null
  return (percentage / 100).toFixed(5)
}

export default function AffiliatePartnersPage() {
  const { data: partners = [], isLoading, isError, refetch: refetchPartners } = useListAffiliatePartnersQuery()
  const { data: users = [] } = useListUsersQuery()
  const { data: payouts = [] } = useListReferralPayoutsQuery()
  const [createPartner, { isLoading: isCreating }] = useCreateAffiliatePartnerMutation()
  const [updatePartner, { isLoading: isUpdating }] = useUpdateAffiliatePartnerMutation()
  const [deletePartner, { isLoading: isDeleting }] = useDeleteAffiliatePartnerMutation()
  const [updateUser, { isLoading: isUpdatingUser }] = useUpdateUserMutation()
  const [updatePayout] = useUpdateReferralPayoutMutation()
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [rate, setRate] = useState(DEFAULT_RATE)
  const [notes, setNotes] = useState("")
  const [editingId, setEditingId] = useState<AffiliatePartner["id"] | null>(null)
  const [editName, setEditName] = useState("")
  const [editCode, setEditCode] = useState("")
  const [editRate, setEditRate] = useState("")
  const [editNotes, setEditNotes] = useState("")
  const [editingUserId, setEditingUserId] = useState<UserSummary["id"] | null>(null)
  const [editUserCode, setEditUserCode] = useState("")
  const [editUserRate, setEditUserRate] = useState("")

  const create = async () => {
    const commissionRate = toRate(rate)
    if (!name.trim() || !email.trim() || !code.trim() || commissionRate === null) {
      toast.error("Enter a partner name, email, unique code, and a rate from 0 to 100%.")
      return
    }
    try {
      await createPartner({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        code: code.trim().toUpperCase(),
        commission_rate: commissionRate,
        is_active: true,
        notes: notes.trim(),
      }).unwrap()
      setName("")
      setEmail("")
      setCode("")
      setRate(DEFAULT_RATE)
      setNotes("")
      toast.success("Affiliate partner created.")
    } catch (error: any) {
      toast.error(error?.data?.code?.[0] || error?.data?.detail || "Unable to create affiliate partner.")
    }
  }

  const togglePartner = async (partner: AffiliatePartner) => {
    try {
      await updatePartner({ id: partner.id, is_active: !partner.is_active }).unwrap()
      await refetchPartners()
      toast.success(`${partner.name} is now ${partner.is_active ? "inactive" : "active"}.`)
    } catch {
      toast.error("Unable to update affiliate partner.")
    }
  }

  const removePartner = async (partner: AffiliatePartner) => {
    if (!window.confirm(`Delete affiliate partner ${partner.name} (${partner.code})? This cannot be undone.`)) return
    try {
      await deletePartner(partner.id).unwrap()
      await refetchPartners()
      toast.success("Affiliate partner deleted.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to delete affiliate partner.")
    }
  }

  const startEdit = (partner: AffiliatePartner) => {
    setEditingId(partner.id)
    setEditName(partner.name)
    setEditCode(partner.code)
    setEditRate(String(Number(partner.commission_rate) * 100))
    setEditNotes(partner.notes || "")
  }

  const cancelEdit = () => setEditingId(null)

  const saveEdit = async (partner: AffiliatePartner) => {
    const commissionRate = toRate(editRate)
    if (!editName.trim() || !editCode.trim() || commissionRate === null) {
      toast.error("Enter a partner name, unique code, and a rate from 0 to 100%.")
      return
    }
    try {
      await updatePartner({
        id: partner.id,
        name: editName.trim(),
        code: editCode.trim().toUpperCase(),
        commission_rate: commissionRate,
        notes: editNotes.trim(),
      }).unwrap()
      await refetchPartners()
      setEditingId(null)
      toast.success("Affiliate partner updated.")
    } catch (error: any) {
      toast.error(error?.data?.code?.[0] || error?.data?.detail || "Unable to update affiliate partner.")
    }
  }

  const copyLink = async (partner: AffiliatePartner) => {
    const url = `${window.location.origin}/accounts?ref=${encodeURIComponent(partner.code)}`
    try {
      await navigator.clipboard.writeText(url)
      toast.success("Affiliate link copied.")
    } catch {
      toast.error("Unable to copy affiliate link.")
    }
  }

  const startUserEdit = (user: UserSummary) => {
    setEditingUserId(user.id)
    setEditUserCode(user.referral_code || "")
    setEditUserRate(String(Number(user.referral_commission_rate ?? 0.05) * 100))
  }

  const saveUser = async (user: UserSummary) => {
    const commissionRate = toRate(editUserRate)
    if (!editUserCode.trim() || commissionRate === null) {
      toast.error("Enter a unique referral code and a rate from 0 to 100%.")
      return
    }
    try {
      await updateUser({
        id: user.id,
        data: { referral_code: editUserCode.trim().toUpperCase(), referral_commission_rate: commissionRate },
      }).unwrap()
      setEditingUserId(null)
      toast.success("Referral settings updated.")
    } catch (error: any) {
      toast.error(error?.data?.referral_code?.[0] || error?.data?.detail || "Unable to update referral settings.")
    }
  }

  const markPayout = async (id: string | number, status: "paid" | "cancelled") => {
    try {
      await updatePayout({ id, status }).unwrap()
      toast.success(`Payout marked ${status}.`)
    } catch {
      toast.error("Unable to update payout status.")
    }
  }

  return (
    <div className="admin-portal-surface mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 lg:px-8">
      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <div className="flex items-start gap-3">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-blue-700">
              <Link2 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Affiliate partners</CardTitle>
              <CardDescription>
                Create unique partner links and set the commission rate for each agreement. New partners default to 5% unless you specify another rate.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-[1fr_1fr_1fr_180px_1fr_auto] xl:items-end">
          <div className="space-y-2">
            <Label htmlFor="affiliate-name">Partner name</Label>
            <Input id="affiliate-name" value={name} onChange={(event) => setName(event.target.value)} placeholder="Gibonet" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-email">Partner email</Label>
            <Input id="affiliate-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="partner@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-code">Unique code</Label>
            <Input id="affiliate-code" value={code} onChange={(event) => setCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} placeholder="GIBONET" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-rate">Commission (%)</Label>
            <Input id="affiliate-rate" inputMode="decimal" value={rate} onChange={(event) => setRate(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="affiliate-notes">Agreement notes</Label>
            <Textarea id="affiliate-notes" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Optional internal note" rows={1} />
          </div>
          <Button type="button" onClick={() => void create()} disabled={isCreating} className="bg-blue-600 text-white hover:bg-blue-700">
            <Plus className="mr-2 h-4 w-4" />
            Create link
          </Button>
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Platform referral accounts</CardTitle>
          <CardDescription>Set a memorable code and negotiated commission for individual referrers. Payouts remain manual.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {users.filter((user) => user.referral_code).map((user) => (
            <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              {editingUserId === user.id ? (
                <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2">
                  <Input value={editUserCode} onChange={(event) => setEditUserCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} aria-label="User referral code" />
                  <Input inputMode="decimal" value={editUserRate} onChange={(event) => setEditUserRate(event.target.value)} aria-label="User commission percentage" />
                </div>
              ) : (
                <div>
                  <p className="font-semibold text-slate-950">{user.first_name || user.email}</p>
                  <p className="text-sm text-slate-600">{user.email} · Code: <span className="font-semibold text-slate-900">{user.referral_code}</span> · Commission: <span className="font-semibold text-slate-900">{Number(user.referral_commission_rate ?? 0.05) * 100}%</span></p>
                </div>
              )}
              <div className="flex gap-2">
                {editingUserId === user.id ? (
                  <>
                    <Button type="button" onClick={() => void saveUser(user)} disabled={isUpdatingUser}><Save className="mr-2 h-4 w-4" />Save</Button>
                    <Button type="button" variant="outline" onClick={() => setEditingUserId(null)}><X className="mr-2 h-4 w-4" />Cancel</Button>
                  </>
                ) : <Button type="button" variant="outline" onClick={() => startUserEdit(user)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Manual payout queue</CardTitle>
          <CardDescription>Review earned commissions and mark them paid only after the external transfer is complete.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {payouts.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No referral payouts have been recorded.</div> : null}
          {payouts.map((payout) => (
            <div key={payout.id} className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="font-semibold text-slate-950">{payout.referrer_email || payout.affiliate_name || "Affiliate"}</p>
                <p className="text-sm text-slate-600">{payout.referred_email || "Referred customer"} · {payout.currency} {payout.payout_amount} · {payout.status}</p>
                <p className="text-xs text-slate-500">Reference: {payout.payment_reference}</p>
              </div>
              {payout.status === "pending" ? <div className="flex gap-2"><Button type="button" onClick={() => void markPayout(payout.id, "paid")}>Mark paid</Button><Button type="button" variant="outline" onClick={() => void markPayout(payout.id, "cancelled")}>Cancel</Button></div> : null}
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader>
          <CardTitle>Configured links</CardTitle>
          <CardDescription>Codes are unique and are captured when a new customer registers.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? <div className="rounded-2xl bg-gray-50 p-8 text-sm text-gray-500">Loading affiliate partners...</div> : null}
          {isError ? <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load affiliate partners. Refresh and try again.</div> : null}
          {!isLoading && !isError && partners.length === 0 ? <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">No custom affiliate partners have been created.</div> : null}
          <div className="space-y-3">
            {partners.map((partner) => (
              <div key={partner.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                {editingId === partner.id ? (
                  <div className="grid min-w-0 flex-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <Input value={editName} onChange={(event) => setEditName(event.target.value)} aria-label="Partner name" />
                    <Input value={editCode} onChange={(event) => setEditCode(event.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))} aria-label="Unique code" />
                    <Input inputMode="decimal" value={editRate} onChange={(event) => setEditRate(event.target.value)} aria-label="Commission percentage" />
                    <Input value={editNotes} onChange={(event) => setEditNotes(event.target.value)} aria-label="Agreement notes" placeholder="Agreement notes" />
                  </div>
                ) : (
                  <div className="flex min-w-0 items-start gap-3">
                  <div className="rounded-xl bg-white p-2 text-blue-700 shadow-sm"><Users className="h-5 w-5" /></div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-950">{partner.name}</h3>
                      <Badge variant="outline" className={partner.is_active ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-gray-200 text-gray-500"}>{partner.is_active ? "Active" : "Inactive"}</Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{partner.email} · Code: <span className="font-semibold text-slate-900">{partner.code}</span> · Commission: <span className="font-semibold text-slate-900">{Number(partner.commission_rate) * 100}%</span></p>
                    {partner.notes ? <p className="mt-1 text-xs text-slate-500">{partner.notes}</p> : null}
                  </div>
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {editingId === partner.id ? (
                    <>
                      <Button type="button" onClick={() => void saveEdit(partner)} disabled={isUpdating}><Save className="mr-2 h-4 w-4" />Save</Button>
                      <Button type="button" variant="outline" onClick={cancelEdit}><X className="mr-2 h-4 w-4" />Cancel</Button>
                    </>
                  ) : (
                    <>
                      <Button type="button" variant="outline" onClick={() => startEdit(partner)}><Pencil className="mr-2 h-4 w-4" />Edit</Button>
                      <Button type="button" variant="outline" onClick={() => void copyLink(partner)}><Copy className="mr-2 h-4 w-4" />Copy link</Button>
                      <Button type="button" variant="outline" onClick={() => void togglePartner(partner)} disabled={isUpdating}><Save className="mr-2 h-4 w-4" />{partner.is_active ? "Deactivate" : "Activate"}</Button>
                      <Button type="button" variant="outline" className="text-red-700 hover:text-red-800" onClick={() => void removePartner(partner)} disabled={isDeleting}><Trash2 className="mr-2 h-4 w-4" />Delete</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
