'use client'
import React, { useRef, useState } from 'react'
import {Menu, Bell,Sun,Moon,Settings as SettingsIcon,  User, Monitor, Wallet, MonitorSpeaker, Bot } from 'lucide-react'
import Link from 'next/link'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsDarkMode, setIsSidebarCollapsed,resetToSystemTheme } from "@/redux/state";
import { UserData } from "@/redux/features/users/userTypes"
import LogoutButton from '../auth/logoutUser'
import { useGetUserCompaniesQuery, useSwitchCompanyMutation } from '@/redux/features/auth/authApiSlice';
import { toast } from 'react-toastify';

interface NavbarProps{
    user?:UserData
}

const  Navbar = ({}:NavbarProps) => {
    // const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const dispatch = useAppDispatch();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { isDarkMode, isSystemTheme } = useAppSelector((state) => state.global)

  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
        const toggleSidebar = () => {
            dispatch(setIsSidebarCollapsed(!SidebarCollapsed))
        }
  const themeMenuRef = useRef<HTMLDivElement>(null)
  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const { data: companyMemberships } = useGetUserCompaniesQuery();
  const [switchCompany, { isLoading: isSwitchingCompany }] = useSwitchCompanyMutation();
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string>("");
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)

  React.useEffect(() => {
    if (!companyMemberships?.profiles?.length) return;
    const active = companyMemberships.profiles.find(
      (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`,
    );
    if (active?.company_code) {
      setSelectedCompanyCode(active.company_code);
    } else if (companyMemberships.profiles[0]?.company_code) {
      setSelectedCompanyCode(companyMemberships.profiles[0].company_code);
    }
  }, [companyMemberships]);

  const toggleTheme = (theme: "light" | "dark" | "system") => {
    if (theme === "system") {
      dispatch(resetToSystemTheme())
    } else {
      dispatch(setIsDarkMode(theme === "dark"))
    }
    setThemeMenuOpen(false)
  }

  const handleSwitchCompany = async (companyCode: string) => {
    if (!companyCode || companyCode === selectedCompanyCode) return;
    try {
      await switchCompany({ company_code: companyCode }).unwrap();
      setSelectedCompanyCode(companyCode);
      toast.success("Company context switched.");
      window.location.reload();
    } catch (error: any) {
      toast.error(error?.data?.detail || "Failed to switch company context.");
    }
  };

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(event.target as Node)) {
        setThemeMenuOpen(false)
      }
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  return (
    <div className={`sticky top-0 z-30 mb-5 flex w-full items-center justify-between rounded-2xl   px-4 py-3 shadow-sm backdrop-blur`}> 
    {/* Left Side */}
        <div className={`flex justify-between items-center gap-5`}> 
        <div className={`flex items-center gap-5`}>
           
        </div>
        {/* 
        <div className={`relative`}> 
        <input 
            type="search"
            className={`
                px-3 py-2 pr-4 pl-10 w-50 bg-gray-100 rounded-lg md:w-80
                 border-2 border-gray-300   focus:outline-none
                  focus:border-blue-500 `
                } 
            placeholder={`Search`} />

            <div className={`absolute top-0 left-0 flex items-center h-full ml-3 pointer-events-none`}>
                <Search />
            </div>
            
        </div>
        */}
        </div>
        {/* Right Side */}
        <div className={`flex items-center justify-between gap-5`}> 
                <div className={`hidden md:flex items-center gap-5 justify-between`}>
                     {companyMemberships?.profiles?.length ? (
                      <select
                        value={selectedCompanyCode}
                        onChange={(e) => handleSwitchCompany(e.target.value)}
                        disabled={isSwitchingCompany}
                        className="rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        {companyMemberships.profiles.map((profile) => (
                          <option key={`${profile.id}`} value={profile.company_code}>
                            {profile.name} ({profile.company_code})
                          </option>
                        ))}
                      </select>
                    ) : null}
                     <div className="relative" ref={themeMenuRef}>
          <button
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            aria-label="Change theme"
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {themeMenuOpen && (
            <div className={`absolute right-0 z-10 mt-2 w-48 rounded-xl border bg-white py-1 shadow-lg`}>
              <button
                className={`block px-4 py-2 text-sm w-full ${!isDarkMode && !isSystemTheme ? "bg-gray-100 " : ""} text-left text-gray-900`}
                onClick={() => toggleTheme("light")}
              >
                <div className="flex items-center">
                  <Sun size={16} className="mr-2" />
                  Light
                </div>
              </button>
              <button
                className={`block px-4 py-2 text-sm w-full ${isDarkMode && !isSystemTheme ? "bg-gray-100" : ""} text-left text-gray-900`}
                onClick={() => toggleTheme("dark")}
              >
                <div className="flex items-center text-gray-900">
                  <Moon size={16} className="mr-2" />
                  Dark
                </div>
              </button>
              <button
                className={`block px-4 py-2 text-sm w-full text-left text-gray-900  ${isSystemTheme ? 'bg-gray-100 ' : ''}`}
                onClick={() => toggleTheme("system")}
              >
                <div className="flex items-center">
                  <Monitor size={16} className="mr-2" />
                  System
                </div>
              </button>
            </div>
          )}
        </div>

                    <div className={`relative `}>
                    <button 
                        onClick={()=>{}}>
                        <Bell  size={24} className={`cursor-pointer text-gray-500`}/>
                        <div 
                            className={`absolute -top-2  -right-2 inline-flex rounded-full bg-blue-500 px-[0.4rem] py-1 text-xs font-semibold leading-none text-white`}>
                            <span>16</span></div>

                    </button>

                    </div>
                    <hr className={`h-6 w-0 border border-solid border-l bg-gray-300`} />
                    <div className={`flex items-center gap-3 cursor-pointer`}>
                    <div className="w-8 h-8 flex rounded-full bg-gray-800 items-center justify-center text-gray-50">
                        <User size={20} className="w-full h-full p-1" />
                    </div>
                    </div>
                    </div>
                    
                    
                    <div className="relative" ref={settingsMenuRef}>
                        <button
                          type="button"
                          onClick={() => setSettingsMenuOpen((current) => !current)}
                          className="rounded-full p-2 transition-colors hover:bg-gray-100"
                          aria-label="Open settings menu"
                        >
                          <SettingsIcon  size={24} className={`cursor-pointer text-gray-500`}/>
                        </button>
                        {settingsMenuOpen ? (
                          <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border bg-white py-1 shadow-lg">
                            <Link href="/settings" onClick={() => setSettingsMenuOpen(false)}>
                              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                                <SettingsIcon size={16} />
                                Settings hub
                              </div>
                            </Link>
                            <Link href="/agent/settings" onClick={() => setSettingsMenuOpen(false)}>
                              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                                <Bot size={16} />
                                Agent settings
                              </div>
                            </Link>
                            <Link href="/pos/settings" onClick={() => setSettingsMenuOpen(false)}>
                              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                                <MonitorSpeaker size={16} />
                                POS settings
                              </div>
                            </Link>
                            <Link href="/pos/remittances" onClick={() => setSettingsMenuOpen(false)}>
                              <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                                <Wallet size={16} />
                                POS remittances
                              </div>
                            </Link>
                          </div>
                        ) : null}
                    </div>
                    <LogoutButton />
        </div>

    </div>
  )
}

export default  Navbar
