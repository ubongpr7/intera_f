'use client'
import Link from "next/link";
import { getCookie } from "cookies-next";
import { readCookieValue } from "@/lib/authCookies";
import { canAccessPath } from "@/lib/permissionsGuard";
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsSidebarCollapsed } from "../../redux/state";
import { SidebarLink } from './SideBarLinks';
import { TooltipProvider } from '@/components/ui/tooltip';
import {
  Layout,
  Home,
  Users,
  Settings,
  Package,
  Gift,
  Bell,
  FileSearch,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  Truck,
  Undo2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  UserRound,
  Building2,
  X,
  ShieldAlert,
} from 'lucide-react';
import { UserData } from "@/redux/features/users/userTypes";
import { useEffect, useRef, useState } from 'react';
interface SideBarDataProps{
  user?:UserData
  mobileOpen: boolean
  onMobileClose: () => void
}
const SideBar = ({ user, mobileOpen, onMobileClose }:SideBarDataProps) => {
  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
    const navigationCollapsed = SidebarCollapsed && !mobileOpen;
    const dispatch = useAppDispatch();
    const sidebarRef = useRef<HTMLElement>(null);
    const [profileMenuOpen, setProfileMenuOpen] = useState(false);

    useEffect(() => {
      if (SidebarCollapsed) return;

      const collapseOnDesktopClickAway = (event: MouseEvent) => {
        if (!window.matchMedia('(min-width: 768px)').matches) return;
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
          dispatch(setIsSidebarCollapsed(true));
        }
      };

      document.addEventListener('mousedown', collapseOnDesktopClickAway);
      return () => document.removeEventListener('mousedown', collapseOnDesktopClickAway);
    }, [SidebarCollapsed, dispatch]);
  
    const sideBarClasses = `dashboard-sidebar fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white transition-[transform,width] duration-300 ease-out md:z-40 md:translate-x-0 ${
      mobileOpen ? "translate-x-0" : "-translate-x-full"
    } ${SidebarCollapsed ? "md:w-16" : "md:w-64"}
    min-h-screen border-r border-gray-200 shadow-xl md:shadow-sm
    `
    const companyName = readCookieValue("companyName", getCookie) || readCookieValue("companyCode", getCookie) || 'Intera'
    const rawCompanyLogo = readCookieValue("companyLogo", getCookie)
    const companyLogo = rawCompanyLogo
      ? (/^https?:\/\//i.test(rawCompanyLogo)
        ? rawCompanyLogo
        : `${(process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? '').replace(/\/+$/, '')}${rawCompanyLogo.startsWith('/') ? rawCompanyLogo : `/${rawCompanyLogo}`}`)
      : null
    const canViewAuditTrail = canAccessPath("/audit").allowed
    const canViewAdminHub = canAccessPath("/admin").allowed
  return (
    <TooltipProvider delayDuration={250}>
    <aside ref={sidebarRef} className={sideBarClasses} aria-label="Primary navigation"> 
        <button
          type="button"
          onClick={onMobileClose}
          aria-label="Close navigation menu"
          className="absolute right-4 top-6 inline-flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm hover:bg-gray-50 md:hidden"
        >
          <X className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={() => dispatch(setIsSidebarCollapsed(!SidebarCollapsed))}
          className="absolute -right-3 top-7 z-10 hidden h-7 w-7 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-md transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:inline-flex"
          aria-label={SidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={SidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {SidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
        
        <div className={`dashboard-sidebar-brand flex items-center justify-between md:justify-normal pt-6 ${navigationCollapsed?"px-3":"px-5"}`}>
            <div  className={`flex items-center gap-4`}>
                <div className="dashboard-sidebar-mark flex h-10 w-10 items-center justify-center rounded-2xl">
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companyLogo} alt={companyName} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <h1 className="text-2xl text-center font-extrabold text-gray-800">
                      {(companyName || 'I').trim().charAt(0).toUpperCase()}
                  </h1>
                )}
                </div>
                    <div className={`${navigationCollapsed?"hidden":""} min-w-0`}>
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-gray-400">Workspace</p>
                    <h1 className="truncate text-base font-extrabold text-gray-800">
                        {companyName}
                    </h1>
                    </div>

            </div>
            
            </div>
            {/* Links */}
            <nav
              className="dashboard-sidebar-nav mt-6 flex-grow space-y-1 overflow-y-auto px-2 pb-4"
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) onMobileClose();
              }}
            >
            <SidebarLink href="/dashboard" icon={Home} label="Dashboard" isCollapsed={navigationCollapsed} />
            <SidebarLink href="/realtime-dashboard" icon={Layout} label="Realtime Dashboard" isCollapsed={navigationCollapsed} />
            <SidebarLink href="/notifications" icon={Bell} label="Notifications" isCollapsed={navigationCollapsed} />
            {canViewAuditTrail ? (
              <SidebarLink href="/audit" icon={FileSearch} label="Audit trail" isCollapsed={navigationCollapsed} />
            ) : null}
            {canViewAdminHub ? (
              <div className="space-y-1 pt-3">
                <div className={`px-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-gray-400 ${navigationCollapsed ? "hidden" : ""}`}>
                  Admin
                </div>
                <SidebarLink
                  href="/admin"
                  icon={ShieldAlert}
                  label="Admin hub"
                  isCollapsed={navigationCollapsed}
                  subLinks={[
                    { href: "/admin", label: "Admin dashboard" },
                    { href: "/payment-admin", label: "Billing & subscriptions" },
                    { href: "/product/global-catalog-admin", label: "Global catalog admin" },
                    { href: "/audit", label: "Audit trail" },
                    { href: "/realtime-dashboard", label: "Realtime operations" },
                    { href: "/notifications", label: "Notifications" },
                  ]}
                />
              </div>
            ) : null}
            <div className={`dashboard-nav-divider ${navigationCollapsed ? "mx-1" : "mx-3"}`} />
            <div className={`dashboard-nav-group-label ${navigationCollapsed ? "hidden" : ""}`}>Operations</div>
            <SidebarLink href="/inventory" icon={Package} label="Inventory" isCollapsed={navigationCollapsed} />
            <SidebarLink
              href="/pos/settings"
              icon={CreditCard}
              label="POS Settings"
              isCollapsed={navigationCollapsed}
              subLinks={[
                { href: "/pos/settings", label: "POS Settings" },
                { href: "/pos/remittances", label: "Remittances" },
              ]}
            />
            <SidebarLink
              href="/profile/staff"
              icon={Users}
              label="Staff"
              isCollapsed={navigationCollapsed}
              subLinks={[
                { href: "/profile/staff", label: "Staff and roles" },
                { href: "/profile/support-access", label: "Support access" },
              ]}
            />
            <SidebarLink href="/companies" icon={Truck} label="Partners" isCollapsed={navigationCollapsed} />
            <SidebarLink href="/order/purchase" icon={ShoppingCart} label="Purchase Orders" isCollapsed={navigationCollapsed} />
            <SidebarLink href="/order/sales" icon={ReceiptText} label="Sales Orders" isCollapsed={navigationCollapsed} />
            <SidebarLink href="/order/returns" icon={Undo2} label="Returns" isCollapsed={navigationCollapsed} />
            <SidebarLink
              href="/product"
              icon={Gift}
              label="Product"
              isCollapsed={navigationCollapsed}
              subLinks={[
                { href: "/product", label: "Workspace products" },
                { href: "/product/imports", label: "Import Products" },
                { href: "/product/imports/imported", label: "Imported products" },
              ]}
            />
            <div className={`dashboard-nav-divider ${navigationCollapsed ? "mx-1" : "mx-3"}`} />
            <div className={`dashboard-nav-group-label ${navigationCollapsed ? "hidden" : ""}`}>Workspace</div>
            <SidebarLink href="/settings" icon={Settings} label="Workspace settings" isCollapsed={navigationCollapsed} />
            </nav>
            <div className={`dashboard-sidebar-profile ${navigationCollapsed ? "p-2" : "p-3"}`}>
              <button
                type="button"
                onClick={() => setProfileMenuOpen((current) => !current)}
                className={`dashboard-profile-trigger ${navigationCollapsed ? "justify-center px-2" : "px-3"}`}
                aria-expanded={profileMenuOpen}
                aria-label="Open account menu"
              >
                {user?.picture || user?.profile_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={user.picture || user.profile_image || ""} alt="" className="h-9 w-9 rounded-xl object-cover" />
                ) : (
                  <span className="dashboard-profile-avatar">{(user?.first_name || user?.email || "U").charAt(0).toUpperCase()}</span>
                )}
                {!navigationCollapsed ? <span className="min-w-0 flex-1 text-left"><span className="block truncate text-sm font-semibold">{user?.get_full_name || `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || "Workspace member"}</span><span className="block truncate text-xs">{user?.role || user?.email || "Account"}</span></span> : null}
                {!navigationCollapsed ? <ChevronDown className={`h-4 w-4 transition-transform ${profileMenuOpen ? "rotate-180" : ""}`} /> : null}
              </button>
              {profileMenuOpen && !navigationCollapsed ? (
                <div className="dashboard-profile-menu">
                  <Link href="/user/settings" onClick={() => setProfileMenuOpen(false)}><UserRound className="h-4 w-4" />Account settings</Link>
                  <Link href="/profile" onClick={() => setProfileMenuOpen(false)}><Building2 className="h-4 w-4" />Company profile</Link>
                </div>
              ) : null}
            </div>



    </aside>
    </TooltipProvider>
  )
}

export default SideBar
