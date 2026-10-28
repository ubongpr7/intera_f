import AdminServiceHealth from "@/components/admin/AdminServiceHealth"

export default function SupportServiceHealthPage() {
  return (
    <main className="mx-auto min-h-screen w-full max-w-[1600px] bg-[#f6f8fc] p-4 text-[#172642] md:p-7">
      <nav className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-[#dce5f2] bg-white px-5 py-3 shadow-[0_12px_35px_-28px_rgba(24,45,82,0.45)]">
        <a href="/dashboard" className="flex items-center gap-3 text-sm font-extrabold tracking-tight text-[#172642]">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#172642] text-lg font-black text-[#98fcc2]">i</span>
          <span>Intera IMS <span className="font-medium text-[#71809a]">Support</span></span>
        </a>
        <a href="/dashboard" className="rounded-xl px-3 py-2 text-sm font-semibold text-[#28549a] hover:bg-[#e8f0ff]">Back to inbox</a>
      </nav>
      <div className="mb-5 rounded-[1.5rem] bg-[#172642] px-6 py-6 text-white md:px-8">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#98fcc2]">Operations</p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Service health</h1>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c5d0e2]">Monitor APIs, MCP services, agent runtimes, and background workers without mixing operational diagnostics into the support queue.</p>
      </div>
      <AdminServiceHealth />
    </main>
  )
}
