'use client'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsSidebarCollapsed } from "../../redux/state";
import { generateColorFromName } from '../utils/colorGenerator';
import { SidebarLink } from './SideBarLinks';
import {
  Layout,
  Menu,
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
  
    
    const toggleSidebar = () => {
        dispatch(setIsSidebarCollapsed(!SidebarCollapsed))
    }
    const sideBarClasses = `fixed inset-y-0 left-0 flex flex-col ${SidebarCollapsed ? "w-0 md:w-16" : "w-72 md:w-64"}
    bg-white transition-all duration-300 ease-in-out min-h-screen
    border-r border-gray-200 z-40 overflow-visible
    shadow-sm
    ` 
  return (
    <div ref={sidebarRef} className={sideBarClasses}> 
        
        <div className={`flex justify-between items-center md:justify-normal pt-6 ${SidebarCollapsed?"px-3":"px-5"}`}>
            <div  className={`flex items-center gap-4`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center`}
                style={{backgroundColor: generateColorFromName('Intera')}}>
                <h1 className={` text-2xl text-center font-extrabold  text-gray-800`}>
                    I
                </h1>
                </div>
                    <h1 className={`${SidebarCollapsed?"hidden":""} text-xl font-extrabold text-gray-800`}>
                        Intera
                    </h1>

                    <button onClick={()=>{
                      toggleSidebar()
                    }}
                       className={`hidden rounded-full border border-gray-200 bg-gray-50 px-3 py-3 ml-3.5 transition-colors hover:border-blue-200 hover:bg-blue-50 md:inline-flex`}>
                        <Menu  className={`w-4 h-4 text-gray-500`}/>
                    </button>
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
            <SidebarLink href="/settings" icon={Settings} label="Settings" isCollapsed={SidebarCollapsed} />
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
