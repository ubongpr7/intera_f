import Link from "next/link"
import { Settings, ShieldCheck, Users } from "lucide-react"

const settings = [
  { href: "/admin/invitations", label: "Staff access", description: "Invite and revoke platform staff access.", icon: Users },
  { href: "/audit", label: "Audit trail", description: "Review platform events and administrative actions.", icon: ShieldCheck },
]

export default function AdminSettingsPage() {
  return <section className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 lg:px-8"><div><p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-700">Platform configuration</p><h1 className="mt-2 text-3xl font-semibold text-slate-950">Admin settings</h1><p className="mt-3 text-sm text-slate-600">Administrative controls are kept separate from workspace settings.</p></div><div className="grid gap-4 md:grid-cols-2">{settings.map(({ href, label, description, icon: Icon }) => <Link key={href} href={href} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md"><Icon className="h-5 w-5 text-blue-700" /><h2 className="mt-4 font-semibold text-slate-950">{label}</h2><p className="mt-1 text-sm leading-6 text-slate-600">{description}</p></Link>)}</div><div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 text-sm text-blue-950"><Settings className="mb-3 h-5 w-5 text-blue-700" />More platform controls can be added here without exposing workspace operations in the public application.</div></section>
}
