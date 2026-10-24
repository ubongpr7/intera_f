"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const usersApi = process.env.NEXT_PUBLIC_BACKEND_HOST_URL || ""

export default function AdminInvitePage() {
  const params = useParams<{ token: string }>(); const router = useRouter()
  const [email, setEmail] = useState(""); const [firstName, setFirstName] = useState(""); const [lastName, setLastName] = useState(""); const [password, setPassword] = useState(""); const [error, setError] = useState(""); const [done, setDone] = useState(false)
  useEffect(() => { fetch(`${usersApi}/accounts/platform-staff-invitations/lookup/?token=${encodeURIComponent(params.token)}`, { credentials: "include" }).then(async (r) => { if (!r.ok) throw new Error("This invitation is invalid or expired."); const body = await r.json(); setEmail(body.email) }).catch((e) => setError(e.message)) }, [params.token])
  const submit = async (event: React.FormEvent) => { event.preventDefault(); setError(""); const response = await fetch(`${usersApi}/accounts/platform-staff-invitations/accept/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token: params.token, first_name: firstName, last_name: lastName, password }) }); const body = await response.json(); if (!response.ok) { setError(body.detail || body.password?.join(" ") || "Unable to accept invitation."); return } setDone(true) }
  if (done) return <main className="mx-auto max-w-lg p-10 text-center"><h1 className="text-3xl font-semibold">Staff access enabled</h1><p className="mt-3 text-slate-600">Your account is now eligible for the private admin portal. Sign in to continue.</p><Button className="mt-6" onClick={() => router.push("/accounts/signin?next=/admin-portal")}>Continue to sign in</Button></main>
  return <main className="mx-auto max-w-lg p-10"><h1 className="text-3xl font-semibold">Accept staff invitation</h1><p className="mt-3 text-slate-600">Complete your profile to receive Intera IMS staff access.</p>{error ? <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}<form onSubmit={submit} className="mt-6 space-y-4"><Input value={email} readOnly aria-label="Invited email" /><Input value={firstName} onChange={(e) => setFirstName(e.target.value)} required placeholder="First name" /><Input value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" /><Input value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="Create password" type="password" /><Button className="w-full">Accept invitation</Button></form></main>
}
