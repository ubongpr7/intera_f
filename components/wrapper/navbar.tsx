'use client'
import classNames from 'classnames'
import React, { useRef, useState } from 'react'
import {Menu, Bell, Search,Sun,Moon,Settings as SettingsIcon,  User, Monitor} from 'lucide-react'
import Link from 'next/link'
import { Settings } from 'http2'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsDarkMode, setIsSidebarCollapsed,resetToSystemTheme } from "@/redux/state";
import { UserData } from '../interfaces/User'
import LogoutButton from '../auth/logoutUser'

interface NavbarProps{
    user:UserData
}

const  Navbar = ({user}:NavbarProps) => {
    // const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
    const dispatch = useAppDispatch();
  const [themeMenuOpen, setThemeMenuOpen] = useState(false)
  const { isDarkMode, isSystemTheme } = useAppSelector((state) => state.global)

    const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
        const toggleSidebar = () => {
            dispatch(setIsSidebarCollapsed(!SidebarCollapsed))
        }
  const themeMenuRef = useRef<HTMLDivElement>(null)

  const toggleTheme = (theme: "light" | "dark" | "system") => {
    if (theme === "system") {
      dispatch(resetToSystemTheme())
    } else {
      dispatch(setIsDarkMode(theme === "dark"))
    }
    setThemeMenuOpen(false)
  }

  return (
    <div className={`flex justify-between items-center w-full mb-7`}> 
    {/* Left Side */}
        <div className={`flex justify-between items-center gap-5`}> 
        <div className={`flex items-center gap-5`}>
            <button 
            className={`px-3 py-3 bg-gray-100
                rounded-full hover:bg-blue-100`
            } 
            onClick={()=>{
                toggleSidebar()
            }} > 
            <Menu className={`w-4 h-4 `} />
            </button>
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
                     <div className="relative" ref={themeMenuRef}>
          <button
            className="p-2 rounded-full hover:bg-gray-200 "
            onClick={() => setThemeMenuOpen(!themeMenuOpen)}
            aria-label="Change theme"
          >
            {isDarkMode ? <Moon size={20} /> : <Sun size={20} />}
          </button>

          {themeMenuOpen && (
            <div className={`absolute right-0 mt-2 w-48 bg-white  rounded-md shadow-lg py-1 z-10 border `}>
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
                            className={`absolute -top-2  -right-2 bg-blue-500 rounded-full inline-flex px-[0.4rem] py-1 text-xs font-semibold leading-none text-red-100 `}>
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
                    
                    
                    <div>
                        <Link 
                            href={`/settings`}>
                            <SettingsIcon  size={24} className={`cursor-pointer text-gray-500`}/>
                        </Link>
                    </div>
                    <LogoutButton />
        </div>

    </div>
  )
}

export default  Navbar