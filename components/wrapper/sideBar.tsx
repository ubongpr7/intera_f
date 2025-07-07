'use client'
import classNames from 'classnames'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsDarkMode, setIsSidebarCollapsed } from "../../redux/state";
import { generateColorFromName } from '../utils/colorGenerator';
import { SidebarLink } from './SideBarLinks';
import {   Archive,
  CircleDollarSign,
  Clipboard,
  Layout,
  LucideIcon,
  Menu,
  Home,
  SlidersHorizontal,
  UserSearch,Users, Settings, Package, 
  Warehouse,
  Box,
  Gift,
  Tag,
  Factory,
  ReceiptText,
  CreditCard,
  ShoppingCart,
  Bus,
  Truck} from 'lucide-react';
  import { useEffect, useRef } from 'react';
import { UserData } from '../interfaces/User';
interface SideBarDataProps{
  user:UserData
}
const SideBar = ({user}:SideBarDataProps) => {
  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
    const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const dispatch = useAppDispatch();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const toggleButtonRef = useRef<HTMLButtonElement>(null); // If you have a toggle button
    
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
    const sideBarClasses = `fixed flex-col    ${SidebarCollapsed ? "w-0 md:w-16": "w-72 md:w-64"}
    bg-white transition-all duration-300 ease-in-out min-h-screen
    border-r border-gray-200    z-40 overflow-hidden
    shadow-md
    ` 
  return (
    <div ref={sidebarRef} className={sideBarClasses}> 
        <div className={`flex    justify-between items-center md:justify-normal pt-8 ${SidebarCollapsed?"px-3":"px-6"}`}>
            <div className={`flex  items-center gap-5`}>
                <div className={`w-10 h-10   rounded-full flex items-center justify-center`}
                style={{backgroundColor: generateColorFromName('LernOn')}}>
                <h1 className={` text-2xl text-center font-extrabold  text-gray-800`}>
                    D
                </h1>
                </div>
                    <h1 className={`${SidebarCollapsed?"hidden":""} text-xl font-extrabold  text-gray-800`}>
                        DrabTech
                    </h1>

                    <button onClick={()=>{
                      toggleSidebar()
                    }}
                       className={` px-3 py-3 bg-gray-100 rounded-full hover:bg-blue-100`}>
                        <Menu  className={`w-4 h-4 text-gray-500`}/>
                    </button>
            </div>
            
            </div>
            {/* Links */}
            <div className={`flex-grow mt-8 `}>
            <SidebarLink href="/dashboard" icon={Home} label="Dashboard" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/inventory" icon={Package} label="Inventory" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/profile/staff" icon={Users} label="Staff" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/companies" icon={Truck} label="Affilications" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/order/purchase" icon={ShoppingCart} label="Purchase Orders" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/product" icon={Gift} label="Product" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/stockitems" icon={Box} label="Stock Items" isCollapsed={SidebarCollapsed} />
            {/*
            <SidebarLink href="/warehouse" icon={Warehouse } label="Warehouse" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/point-of-sales" icon={CreditCard} label="Sales" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/pricing" icon={Tag} label="Pricing" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/settings" icon={Settings} label="Settings" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/archive" icon={Archive} label="Archive" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/billing" icon={CircleDollarSign} label="Billing" isCollapsed={SidebarCollapsed} />
            <SidebarLink href="/sales" icon={ReceiptText} label="Sales Record" isCollapsed={SidebarCollapsed} />
            */}
            </div>
            {/* Footer 
            <div className={`text-gray-500 text-xs text-center  ${SidebarCollapsed?"hidden":""} `}>
            &copy; 2025 DrabTech
            </div>
            */}



    </div>
  )
}

export default SideBar