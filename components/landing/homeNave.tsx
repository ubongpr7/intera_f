'use client'
import Link from 'next/link'
import { Sun, Moon } from 'lucide-react'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { setIsDarkMode } from "../../redux/state";

const Navbar = () => {
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const dispatch = useAppDispatch();

  return (
    <nav className="flex items-center justify-between px-6 py-4 bg-white  shadow-sm">
      {/* Logo */}
      <Link href="/" className="text-xl font-bold text-blue-600 ">
        Intera Inventory
      </Link>

      {/* Navigation Links */}
      <div className="flex items-center gap-6">
        {/* Dark Mode Toggle */}
        <button 
          onClick={() => dispatch(setIsDarkMode(!isDarkMode))}
          className="p-2 rounded-lg hover:bg-gray-100 "
        >
          {isDarkMode ? (
            <Sun className="w-5 h-5 text-gray-500 " />
          ) : (
            <Moon className="w-5 h-5 text-gray-500 " />
          )}
        </button>

        {/* Auth Links */}
        <div className="flex items-center gap-4">
          <Link
            href="/accounts"
            className="px-4 py-2 text-gray-600  hover:bg-gray-100  rounded-lg transition-colors"
          >
            Get Started
          </Link>
          <div className="h-6 w-px bg-gray-200 " />
          <Link
            href="/accounts/signin"
            className="px-4 py-2 text-gray-600  hover:bg-gray-100  rounded-lg transition-colors"
          >
            Signin
          </Link>
          
        </div>
      </div>
    </nav>
  )
}

export default Navbar