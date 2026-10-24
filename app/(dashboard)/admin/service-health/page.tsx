import AdminServiceHealth from "@/components/admin/AdminServiceHealth"

export default function AdminServiceHealthPage() {
  return (
    <div className="admin-portal-surface mx-auto w-full max-w-[1800px] space-y-6 px-4 py-6 lg:px-8">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-600 dark:text-emerald-300">Operations</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Service health</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          Monitor public APIs, MCP services, agent runtimes, and background containers from one dedicated operations view.
        </p>
      </div>
      <AdminServiceHealth />
    </div>
  )
}
