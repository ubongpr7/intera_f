"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import AuthSplitShell from "@/components/auth/AuthSplitShell"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

const usersApi = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL || "").replace(/\/$/, "")

export default function AffiliateInvitePage() {
  const params = useParams<{ token: string }>()
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [partnerName, setPartnerName] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!params.token) return
    fetch(`${usersApi}/accounts/affiliate-partner-invitations/lookup/?token=${encodeURIComponent(params.token)}`)
      .then(async (response) => {
        const body = await response.json()
        if (!response.ok) throw new Error(body.detail || "This invitation is invalid or expired.")
        setEmail(body.email)
        setPartnerName(body.partner_name || "Intera IMS")
      })
      .catch((cause) => setError(cause instanceof Error ? cause.message : "This invitation is invalid or expired."))
  }, [params.token])

  const submit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError("")
    const response = await fetch(`${usersApi}/accounts/affiliate-partner-invitations/accept/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: params.token, first_name: firstName, last_name: lastName, password }),
    })
    const body = await response.json()
    if (!response.ok) {
      setError(body.detail || body.password?.join(" ") || "Unable to accept affiliate invitation.")
      return
    }
    setDone(true)
  }

  return (
    <AuthSplitShell
      eyebrow="Affiliate partnership"
      title={done ? "Your affiliate account is ready" : "Accept your affiliate invitation"}
      description={done ? "Your affiliate link and partner account are now connected. Sign in to view your referrals and earnings." : "Complete the short setup to activate the affiliate account created for you."}
    >
      <div className="auth-card w-full p-6 sm:p-8">
        {done ? (
          <div className="space-y-4">
            <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">You can now sign in with your invited email and password.</p>
            <Button className="w-full" onClick={() => router.push("/accounts/signin")}>Continue to sign in</Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {partnerName ? <p className="text-sm text-slate-600 dark:text-slate-300">You are joining as <strong>{partnerName}</strong>.</p> : null}
            <div className="space-y-1.5"><label className="auth-label" htmlFor="affiliate-email">Invited email</label><Input id="affiliate-email" value={email} readOnly /></div>
            <div className="space-y-1.5"><label className="auth-label" htmlFor="affiliate-first-name">First name</label><Input id="affiliate-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} required /></div>
            <div className="space-y-1.5"><label className="auth-label" htmlFor="affiliate-last-name">Last name</label><Input id="affiliate-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} /></div>
            <div className="space-y-1.5"><label className="auth-label" htmlFor="affiliate-password">Create password</label><Input id="affiliate-password" value={password} onChange={(event) => setPassword(event.target.value)} required type="password" /></div>
            {error ? <p className="auth-error">{error}</p> : null}
            <Button className="w-full" disabled={!email}>Accept invitation</Button>
          </form>
        )}
      </div>
    </AuthSplitShell>
  )
}
