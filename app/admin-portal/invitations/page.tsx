"use client"

import { useState } from "react"
import { toast } from "react-toastify"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useCreatePlatformStaffInvitationMutation, useGetAdminContextQuery, useListPlatformStaffInvitationsQuery, useRevokePlatformStaffInvitationMutation } from "@/redux/features/users/userApiSlice"

export default function StaffInvitationsPage() {
  const { data: admin } = useGetAdminContextQuery()
  const { data = [], isLoading } = useListPlatformStaffInvitationsQuery(undefined, { skip: !admin?.is_superuser })
  const [create, { isLoading: creating }] = useCreatePlatformStaffInvitationMutation()
  const [revoke] = useRevokePlatformStaffInvitationMutation()
  const [email, setEmail] = useState("")
  if (!admin?.is_superuser) return <section className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6"><h1 className="text-2xl font-semibold">Superuser access required</h1><p className="mt-2 text-slate-300">Only a superuser can invite platform staff.</p></section>
  const submit = async (event: React.FormEvent) => { event.preventDefault(); try { await create({ email: email.trim() }).unwrap(); setEmail(""); toast.success("Staff invitation sent.") } catch (error: any) { toast.error(error?.data?.detail || "Could not send invitation.") } }
  return <section className="space-y-8"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-300">Access control</p><h1 className="mt-2 text-3xl font-semibold">Platform staff invitations</h1><p className="mt-3 text-slate-400">Invitations create staff access only. They never create a superuser and never attach a workspace.</p></div><form onSubmit={submit} className="flex max-w-xl gap-3"><Input value={email} onChange={(event) => setEmail(event.target.value)} type="email" required placeholder="staff@example.com" className="border-white/10 bg-slate-900 text-white" /><Button disabled={creating}>{creating ? "Sending..." : "Invite staff"}</Button></form><div className="overflow-hidden rounded-2xl border border-white/10 bg-slate-900"><div className="border-b border-white/10 px-5 py-4 font-semibold">Recent invitations</div>{isLoading ? <p className="p-5 text-slate-400">Loading...</p> : data.length === 0 ? <p className="p-5 text-slate-400">No invitations yet.</p> : <div className="divide-y divide-white/10">{data.map((item) => <div key={item.id} className="flex items-center justify-between gap-4 px-5 py-4"><div><p className="font-medium">{item.email}</p><p className="text-sm text-slate-400">{item.status} · expires {new Date(item.expires_at).toLocaleDateString()}</p></div>{item.status === "pending" ? <Button variant="outline" size="sm" onClick={async () => { await revoke(item.id).unwrap(); toast.success("Invitation revoked.") }}>Revoke</Button> : null}</div>)}</div>}</div></section>
}
