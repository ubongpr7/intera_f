'use client'

import React, { useRef, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Bot,
  Lock,
  LogOut,
  Monitor,
  MonitorSpeaker,
  Moon,
  PanelLeftClose,
  PanelLeftOpen,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  UserRound,
  Wallet,
} from 'lucide-react'
import { deleteCookie, getCookie } from 'cookies-next'
import { useRouter } from 'nextjs-toploader/app'
import { useGetUserCompaniesQuery, useSwitchCompanyMutation } from '@/redux/features/auth/authApiSlice'
import { AUTH_COOKIE_KEYS, getCookieCandidates, readCookieValue } from '@/lib/authCookies'
import { canAccessPath, getPermissionRequirementLabel } from '@/lib/permissionsGuard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { resetToSystemTheme, setIsDarkMode, setIsSidebarCollapsed } from '@/redux/state'
import { useAppDispatch, useAppSelector } from '../../redux/store'
import { toast } from 'react-toastify'
import { UserData } from '@/redux/features/users/userTypes'

interface NavbarProps {
  user?: UserData
}

const buildUserImageUrl = (value?: string | null) => {
  if (!value) return undefined
  const base = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? '').replace(/\/+$/, '')
  if (/^https?:\/\//i.test(value)) return value
  return `${base}${value.startsWith('/') ? value : `/${value}`}`
}

const buildUserInitials = (user?: UserData) => {
  const parts = [user?.first_name, user?.last_name].filter(Boolean).map((part) => String(part).trim())
  if (parts.length) {
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('')
  }
  return (user?.email ?? 'U').trim().charAt(0).toUpperCase()
}

const readUserCookie = (key: 'userFirstName' | 'userLastName' | 'userEmail' | 'userPicture') =>
  readCookieValue(key, (name) => getCookie(name))

const Navbar = ({ user }: NavbarProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isDarkMode, isSystemTheme, isSidebarCollapsed } = useAppSelector((state) => state.global)

  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const { data: companyMemberships } = useGetUserCompaniesQuery()
  const [switchCompany, { isLoading: isSwitchingCompany }] = useSwitchCompanyMutation()
  const [selectedCompanyCode, setSelectedCompanyCode] = useState<string>('')
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  const activeProfile = companyMemberships?.profiles?.find(
    (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`,
  )

  React.useEffect(() => {
    if (!companyMemberships?.profiles?.length) return
    const active = companyMemberships.profiles.find(
      (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`,
    )
    if (active?.company_code) {
      setSelectedCompanyCode(active.company_code)
    } else if (companyMemberships.profiles[0]?.company_code) {
      setSelectedCompanyCode(companyMemberships.profiles[0].company_code)
    }
  }, [companyMemberships])

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const toggleSidebar = () => {
    dispatch(setIsSidebarCollapsed(!isSidebarCollapsed))
  }

  const toggleTheme = (theme: 'light' | 'dark' | 'system') => {
    if (theme === 'system') {
      dispatch(resetToSystemTheme())
    } else {
      dispatch(setIsDarkMode(theme === 'dark'))
    }
    setUserMenuOpen(false)
  }

  const handleSwitchCompany = async (companyCode: string) => {
    if (!companyCode || companyCode === selectedCompanyCode) return
    try {
      await switchCompany({ company_code: companyCode }).unwrap()
      setSelectedCompanyCode(companyCode)
      toast.success('Company context switched.')
      window.location.reload()
    } catch (error: any) {
      toast.error(error?.data?.detail || 'Failed to switch company context.')
    }
  }

  const handleLogout = async () => {
    try {
      for (const key of AUTH_COOKIE_KEYS) {
        for (const name of getCookieCandidates(key)) {
          deleteCookie(name)
        }
      }
      setUserMenuOpen(false)
      router.push('/')
      toast.success('Logged out successfully')
    } catch (error) {
      toast.error('Logout failed. Please try again.')
    }
  }

  const fallbackUser = {
    first_name: user?.first_name || readUserCookie('userFirstName') || '',
    last_name: user?.last_name || readUserCookie('userLastName') || '',
    email: user?.email || readUserCookie('userEmail') || '',
    picture: user?.picture || readUserCookie('userPicture') || null,
  }
  const activeWorkspaceName = activeProfile?.name || readCookieValue('companyName', (name) => getCookie(name)) || 'Current workspace'
  const activeWorkspaceCode = activeProfile?.company_code || readCookieValue('companyCode', (name) => getCookie(name)) || 'Workspace'
  const sidebarToggleLabel = isSidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'
  const SidebarToggleIcon = isSidebarCollapsed ? PanelLeftOpen : PanelLeftClose
  const userDisplayName = [fallbackUser.first_name, fallbackUser.last_name].filter(Boolean).join(' ').trim() || fallbackUser.email || 'User account'
  const userImageUrl = buildUserImageUrl(fallbackUser.picture)
  const userInitials = buildUserInitials({
    ...user,
    first_name: fallbackUser.first_name,
    last_name: fallbackUser.last_name,
    email: fallbackUser.email,
  } as UserData)
  const settingsLinks = [
    { href: "/settings", label: "Workspace settings", icon: SettingsIcon },
    { href: "/agent/settings", label: "Agent settings", icon: Bot },
    { href: "/pos/settings", label: "POS settings", icon: MonitorSpeaker },
    { href: "/pos/remittances", label: "POS remittances", icon: Wallet },
  ].map((item) => ({
    ...item,
    access: canAccessPath(item.href),
  }))

  return (
    <div className="sticky top-0 z-30 mb-5 flex w-full items-center justify-between rounded-2xl px-4 py-3 shadow-sm backdrop-blur">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={sidebarToggleLabel}
          title={sidebarToggleLabel}
          className="inline-flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
        >
          <SidebarToggleIcon className="h-4 w-4" />
          <span className="hidden md:inline">{sidebarToggleLabel}</span>
        </button>
      </div>

      <div className="flex items-center justify-between gap-5">
        <div className="hidden items-center gap-5 justify-between md:flex">
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

          <div className="relative">
            <button type="button" onClick={() => {}} aria-label="Notifications">
              <Bell size={24} className="cursor-pointer text-gray-500" />
              <div className="absolute -right-2 -top-2 inline-flex rounded-full bg-blue-500 px-[0.4rem] py-1 text-xs font-semibold leading-none text-white">
                <span>16</span>
              </div>
            </button>
          </div>

          <hr className="h-6 w-0 border border-solid border-l bg-gray-300" />

          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setUserMenuOpen((current) => !current)}
              className="flex items-center gap-3 rounded-full p-1 transition-colors hover:bg-gray-100"
              aria-label="Open account menu"
            >
              <Avatar className="h-9 w-9 border border-gray-200">
                <AvatarImage src={userImageUrl} alt={userDisplayName} />
                <AvatarFallback className="bg-slate-900 text-xs font-semibold text-white">{userInitials}</AvatarFallback>
              </Avatar>
            </button>

            {userMenuOpen ? (
              <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">{userDisplayName}</div>
                  <div className="mt-1 text-xs text-gray-500">{fallbackUser.email || 'Personal account'}</div>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    {activeWorkspaceName}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    {activeWorkspaceCode}
                  </div>
                </div>

                <div className="py-1">
                  <Link href="/user/settings" onClick={() => setUserMenuOpen(false)}>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                      <UserRound size={16} />
                      Profile settings
                    </div>
                  </Link>
                  <Link href="/user/settings?tab=security" onClick={() => setUserMenuOpen(false)}>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                      <ShieldCheck size={16} />
                      Security settings
                    </div>
                  </Link>
                  <Link href="/accounts/mfa/setup" onClick={() => setUserMenuOpen(false)}>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                      <ShieldCheck size={16} />
                      MFA setup
                    </div>
                  </Link>
                  <Link href="/accounts/verify" onClick={() => setUserMenuOpen(false)}>
                    <div className="flex items-center gap-2 px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                      <UserRound size={16} />
                      Account verification
                    </div>
                  </Link>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <div className="px-4 py-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Appearance
                  </div>
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 ${!isDarkMode && !isSystemTheme ? 'bg-gray-100' : ''}`}
                    onClick={() => toggleTheme('light')}
                  >
                    <div className="flex items-center gap-2">
                      <Sun size={16} />
                      Light mode
                    </div>
                  </button>
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 ${isDarkMode && !isSystemTheme ? 'bg-gray-100' : ''}`}
                    onClick={() => toggleTheme('dark')}
                  >
                    <div className="flex items-center gap-2">
                      <Moon size={16} />
                      Dark mode
                    </div>
                  </button>
                  <button
                    className={`block w-full px-4 py-2 text-left text-sm text-gray-900 hover:bg-gray-100 ${isSystemTheme ? 'bg-gray-100' : ''}`}
                    onClick={() => toggleTheme('system')}
                  >
                    <div className="flex items-center gap-2">
                      <Monitor size={16} />
                      System theme
                    </div>
                  </button>
                </div>

                <div className="border-t border-gray-100 py-1">
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    <LogOut size={16} />
                    Logout
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative" ref={settingsMenuRef}>
          <button
            type="button"
            onClick={() => setSettingsMenuOpen((current) => !current)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Open settings menu"
          >
            <SettingsIcon size={24} className="cursor-pointer text-gray-500" />
          </button>
          {settingsMenuOpen ? (
            <div className="absolute right-0 z-10 mt-2 w-56 rounded-xl border bg-white py-1 shadow-lg">
              {settingsLinks.map((item) => {
                const Icon = item.icon
                const accessLabel = getPermissionRequirementLabel(item.access)
                return (
                  <Link key={item.href} href={item.href} onClick={() => setSettingsMenuOpen(false)}>
                    <div className="px-4 py-2 text-sm text-gray-900 hover:bg-gray-100">
                      <div className="flex items-center gap-2">
                        <Icon size={16} />
                        <span>{item.label}</span>
                        {!item.access.allowed ? <Lock size={14} className="ml-auto text-red-500" /> : null}
                      </div>
                      {!item.access.allowed ? (
                        <div className="mt-1 pl-6 font-mono text-[11px] text-red-600">
                          Requires {accessLabel}
                        </div>
                      ) : null}
                    </div>
                  </Link>
                )
              })}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default Navbar
