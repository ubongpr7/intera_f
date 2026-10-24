'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef } from 'react'
import { Activity, ChevronLeft, ChevronRight, FileSearch, Gift, LayoutDashboard, Link2, Settings, ShieldCheck, UserRound, Users, X } from 'lucide-react'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SidebarLink } from './SideBarLinks'
import { useAppDispatch, useAppSelector } from '../../redux/store'
import { setIsSidebarCollapsed } from '../../redux/state'
import type { UserData } from '@/redux/features/users/userTypes'

interface AdminSidebarProps {
  user?: UserData
  mobileOpen: boolean
  onMobileClose: () => void
}

export default function AdminSidebar({ user, mobileOpen, onMobileClose }: AdminSidebarProps) {
  const collapsed = useAppSelector((state) => state.global.isSidebarCollapsed)
  const dispatch = useAppDispatch()
  const sidebarRef = useRef<HTMLElement>(null)
  const navigationCollapsed = collapsed && !mobileOpen

  useEffect(() => {
    if (collapsed) return
    const closeOnDesktopClickAway = (event: MouseEvent) => {
      if (!window.matchMedia('(min-width: 768px)').matches) return
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        dispatch(setIsSidebarCollapsed(true))
      }
    }
    document.addEventListener('mousedown', closeOnDesktopClickAway)
    return () => document.removeEventListener('mousedown', closeOnDesktopClickAway)
  }, [collapsed, dispatch])

  const sidebarClasses = `dashboard-sidebar fixed inset-y-0 left-0 z-50 flex min-h-screen w-72 flex-col border-r border-slate-800 bg-slate-950 text-slate-100 shadow-xl transition-[transform,width] duration-300 ease-out md:z-40 md:translate-x-0 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} ${collapsed ? 'md:w-16' : 'md:w-64'}`

  return (
    <TooltipProvider delayDuration={250}>
      <aside ref={sidebarRef} className={sidebarClasses} aria-label="Admin navigation">
        <button type="button" onClick={onMobileClose} aria-label="Close navigation menu" className="absolute right-4 top-6 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700 bg-slate-900 text-slate-300 md:hidden">
          <X className="h-5 w-5" />
        </button>
        <button type="button" onClick={() => dispatch(setIsSidebarCollapsed(!collapsed))} className="absolute -right-3 top-7 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-slate-300 shadow-md md:inline-flex" aria-label={collapsed ? 'Expand admin sidebar' : 'Collapse admin sidebar'}>
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>

        <Link href="/dashboard" className={`flex items-center gap-3 pt-6 ${navigationCollapsed ? 'justify-center px-3' : 'px-5'}`} onClick={onMobileClose}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 ring-1 ring-slate-700">
            <Image src="/assets/intera/intera-mark-light.png" alt="Intera IMS" width={32} height={32} className="h-8 w-8 object-contain" priority />
          </div>
          {!navigationCollapsed ? <div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-emerald-300">Platform</p><h1 className="truncate text-sm font-extrabold text-white">Intera IMS Admin Portal</h1></div> : null}
        </Link>

        <nav className="dashboard-sidebar-nav mt-8 flex-grow space-y-1 overflow-y-auto px-2 pb-4" onClick={(event) => { if ((event.target as HTMLElement).closest('a')) onMobileClose() }}>
          <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Dashboard" isCollapsed={navigationCollapsed} />
          <div className={`my-4 border-t border-slate-800 ${navigationCollapsed ? 'mx-1' : 'mx-3'}`} />
          <div className={`px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500 ${navigationCollapsed ? 'hidden' : ''}`}>Administration</div>
          <SidebarLink href="/product/global-catalog-admin" icon={Gift} label="Global Products" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/admin/affiliates" icon={Link2} label="Affiliates" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/admin/users" icon={UserRound} label="Platform Users" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/admin/invitations" icon={Users} label="Staff Invitations" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/payment-admin" icon={ShieldCheck} label="Billing & Plans" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/audit" icon={FileSearch} label="Audit Trail" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/admin/service-health" icon={Activity} label="Service Health" isCollapsed={navigationCollapsed} />
          <SidebarLink href="/admin/settings" icon={Settings} label="Admin Settings" isCollapsed={navigationCollapsed} />
        </nav>

        <div className={`border-t border-slate-800 ${navigationCollapsed ? 'p-2' : 'p-3'}`}>
          <div className={`flex items-center gap-3 rounded-xl bg-slate-900/80 ${navigationCollapsed ? 'justify-center p-2' : 'px-3 py-3'}`}>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-sm font-bold text-emerald-300">{(user?.first_name || user?.email || 'A').charAt(0).toUpperCase()}</span>
            {!navigationCollapsed ? <div className="min-w-0"><p className="truncate text-sm font-semibold text-white">{user?.get_full_name || user?.email || 'Administrator'}</p><p className="truncate text-xs text-slate-400">Platform staff</p></div> : null}
          </div>
        </div>
      </aside>
    </TooltipProvider>
  )
}
