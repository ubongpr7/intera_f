import Link from "next/link"
import { ShieldCheck } from "lucide-react"
import AdminPortalGuard from "@/components/admin/AdminPortalGuard"

export default function AdminPortalLayout({ children }: { children: React.ReactNode }) {
  return <AdminPortalGuard><div className="min-h-screen bg-slate-950 text-slate-100"><header className="border-b border-white/10 bg-slate-900/90 px-6 py-5"><div className="mx-auto flex max-w-7xl items-center justify-between gap-6"><Link href="/admin-portal" className="flex items-center gap-3 font-semibold"><ShieldCheck className="h-6 w-6 text-emerald-300" /> Intera IMS Admin</Link><nav className="flex flex-wrap gap-2 text-sm text-slate-300"><Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/admin-portal">Overview</Link><Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/admin-portal/catalog">Catalog</Link><Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/admin-portal/affiliates">Affiliates</Link><Link className="rounded-lg px-3 py-2 hover:bg-white/10" href="/admin-portal/invitations">Staff invitations</Link></nav></div></header><main className="mx-auto max-w-7xl px-6 py-8">{children}</main></div></AdminPortalGuard>
}
