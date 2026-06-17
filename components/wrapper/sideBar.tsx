'use client'
import { getCookie } from "cookies-next";
import { readCookieValue } from "@/lib/authCookies";
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsSidebarCollapsed } from "../../redux/state";
import { generateColorFromName } from '../utils/colorGenerator';
import { SidebarLink } from './SideBarLinks';
import {
  Layout,
  Home,
  Users,
  Settings,
  Package,
  Gift,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  Truck,
  Undo2,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useRef } from 'react';
import { UserData } from "@/redux/features/users/userTypes";
interface SideBarDataProps{
  user?:UserData
}
const SideBar = ({}:SideBarDataProps) => {
  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
    const dispatch = useAppDispatch();
    const sidebarRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        // Only run if sidebar is expanded
        if (SidebarCollapsed) return;
  
        if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
          dispatch(setIsSidebarCollapsed(true));
        } 
      };
  
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [SidebarCollapsed, dispatch]);
  
    const sideBarClasses = `fixed inset-y-0 left-0 flex flex-col ${SidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"}
    bg-white transition-all duration-300 ease-in-out min-h-screen
    border-r border-gray-200 z-40 overflow-visible
    shadow-sm
    `
    const companyName = readCookieValue("companyName", getCookie) || readCookieValue("companyCode", getCookie) || 'Intera'
    const rawCompanyLogo = readCookieValue("companyLogo", getCookie)
    const companyLogo = rawCompanyLogo
      ? (/^https?:\/\//i.test(rawCompanyLogo)
        ? rawCompanyLogo
        : `${(process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? '').replace(/\/+$/, '')}${rawCompanyLogo.startsWith('/') ? rawCompanyLogo : `/${rawCompanyLogo}`}`)
      : null
  return (
    <div ref={sidebarRef} className={sideBarClasses}> 
        
        <div className={`flex justify-between items-center md:justify-normal pt-6 ${SidebarCollapsed?"px-3":"px-5"}`}>
            <div  className={`flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center`}
                style={{backgroundColor: generateColorFromName(companyName)}}>
                {companyLogo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={companyLogo} alt={companyName} className="h-full w-full rounded-2xl object-cover" />
                ) : (
                  <h1 className={` text-2xl text-center font-extrabold  text-gray-800`}>
                      {(companyName || 'I').trim().charAt(0).toUpperCase()}
                  </h1>
                )}
                </div>
                    <h1 className={`${SidebarCollapsed?"hidden":""} text-xl font-extrabold text-gray-800`}>
                        {companyName}
                    </h1>

            </div>
            
            </div>
            {/* Links */}
            <div className={`mt-6 flex-grow space-y-1 px-2`}>
            <SidebarLink href="/dashboard" icon={Home} label="Dashboard" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/realtime-dashboard" icon={Layout} label="Realtime Dashboard" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/inventory" icon={Package} label="Inventory" isCollapsed={SidebarCollapsed} />
            <SidebarLink
              href="/pos"
              icon={CreditCard}
              label="POS"
              isCollapsed={SidebarCollapsed}
              subLinks={[
                { href: "/pos", label: "Cashier POS" },
                { href: "/pos/remittances", label: "Remittances" },
                { href: "/pos/settings", label: "POS Settings" },
              ]}
            />
            <SidebarLink href="/profile/staff" icon={Users} label="Staff" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/companies" icon={Truck} label="Partners" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/order/purchase" icon={ShoppingCart} label="Purchase Orders" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/order/sales" icon={ReceiptText} label="Sales Orders" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/order/returns" icon={Undo2} label="Returns" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/product" icon={Gift} label="Product" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/settings" icon={Settings} label="Workspace settings" isCollapsed={SidebarCollapsed} />
            </div>
            <div className="hidden px-2 pb-4 md:block">
              <button
                type="button"
                onClick={() => dispatch(setIsSidebarCollapsed(!SidebarCollapsed))}
                className={`flex w-full items-center rounded-2xl border border-gray-200 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 ${
                  SidebarCollapsed ? "justify-center" : "justify-between"
                }`}
                aria-label={SidebarCollapsed ? "" : ""}
                title={SidebarCollapsed ? "" : ""}
              >
                {SidebarCollapsed ? (
                  <ChevronRight className="h-4 w-4" />
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
            {/* Footer 
            <div className={`text-gray-500 text-xs text-center  ${SidebarCollapsed?"hidden":""} `}>
            &copy; 2025 Intera
            </div>
            */}



    </div>
  )
}

export default SideBar
