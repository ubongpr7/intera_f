'use client'

import React, { useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  CirclePlus,
  Bell,
  Bot,
  CheckCheck,
  CreditCard,
  KeyRound,
  Lock,
  LogOut,
  MailOpen,
  Menu,
  Monitor,
  MonitorSpeaker,
  Moon,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  UserRound,
  Wallet,
} from 'lucide-react'
import { deleteCookie, getCookie } from 'cookies-next'
import { useRouter } from 'nextjs-toploader/app'
import { getNotificationWebSocketBaseUrl, getRealtimeAccessToken } from '@/lib/serviceRealtime'
import { useGetUserCompaniesQuery, useSwitchCompanyMutation } from '@/redux/features/auth/authApiSlice'
import {
  useGetNotificationUnreadCountQuery,
  useListNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} from '@/redux/features/notification/notificationApiSlice'
import type { NotificationRecord } from '@/redux/features/notification/notificationTypes'
import { getNotificationPresentation } from '@/lib/notificationEventHelpers'
import { AUTH_COOKIE_KEYS, getCookieCandidates, readCookieValue } from '@/lib/authCookies'
import { canAccessPath, getPermissionRequirementLabel } from '@/lib/permissionsGuard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { resetToSystemTheme, setIsDarkMode } from '@/redux/state'
import { useAppDispatch, useAppSelector } from '../../redux/store'
import { toast } from 'react-toastify'
import { UserData } from '@/redux/features/users/userTypes'

interface NavbarProps {
  user?: UserData
  onOpenMobileSidebar: () => void
  sidebarCollapsed: boolean
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

const Navbar = ({ user, onOpenMobileSidebar, sidebarCollapsed }: NavbarProps) => {
  const dispatch = useAppDispatch()
  const router = useRouter()
  const { isDarkMode, isSystemTheme } = useAppSelector((state) => state.global)

  const settingsMenuRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const notificationMenuRef = useRef<HTMLDivElement>(null)

  const { data: companyMemberships } = useGetUserCompaniesQuery()
  const {
    data: unreadResponse,
    refetch: refetchUnreadCount,
  } = useGetNotificationUnreadCountQuery(undefined, { pollingInterval: 60000 })
  const {
    data: notificationResponse,
    isLoading: notificationsLoading,
    refetch: refetchNotifications,
  } = useListNotificationsQuery({ limit: 15, offset: 0 }, { pollingInterval: 60000 })
  const [switchCompany, { isLoading: isSwitchingCompany }] = useSwitchCompanyMutation()
  const [markNotificationRead] = useMarkNotificationReadMutation()
  const [markAllNotificationsRead, { isLoading: markingAllRead }] = useMarkAllNotificationsReadMutation()
  const [settingsMenuOpen, setSettingsMenuOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [notificationMenuOpen, setNotificationMenuOpen] = useState(false)
  const [liveNotifications, setLiveNotifications] = useState<NotificationRecord[]>([])

  const activeProfile = companyMemberships?.profiles?.find(
    (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`,
  )

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
        setSettingsMenuOpen(false)
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false)
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(event.target as Node)) {
        setNotificationMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  React.useEffect(() => {
    const accessToken = getRealtimeAccessToken()
    if (!accessToken) {
      return
    }

    let socket: WebSocket | null = null
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null
    let disposed = false

    const connect = () => {
      socket = new WebSocket(
        `${getNotificationWebSocketBaseUrl()}/ws/notifications?token=${encodeURIComponent(accessToken)}`,
      )

      socket.onmessage = (message) => {
        try {
          const payload = JSON.parse(message.data) as {
            payload?: {
              notifications?: NotificationRecord[]
            }
          }
          const incomingNotifications = payload.payload?.notifications ?? []
          if (incomingNotifications.length > 0) {
            setLiveNotifications((current) => {
              const merged = new Map(current.map((item) => [item.id, item]))
              incomingNotifications.forEach((notification) => merged.set(notification.id, notification))
              return Array.from(merged.values())
                .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
                .slice(0, 15)
            })
            void refetchUnreadCount()
            void refetchNotifications()
          }
        } catch {
          return
        }
      }

      socket.onclose = () => {
        if (disposed) {
          return
        }
        reconnectTimer = setTimeout(connect, 3000)
      }
    }

    connect()

    return () => {
      disposed = true
      if (reconnectTimer) {
        clearTimeout(reconnectTimer)
      }
      socket?.close()
    }
  }, [refetchNotifications, refetchUnreadCount])

  const recentNotifications = React.useMemo(() => {
    const merged = new Map<string, NotificationRecord>()
    liveNotifications.forEach((notification) => merged.set(notification.id, notification))
    notificationResponse?.results.forEach((notification) => {
      if (!merged.has(notification.id)) merged.set(notification.id, notification)
    })
    return Array.from(merged.values())
      .sort((left, right) => new Date(right.created_at).getTime() - new Date(left.created_at).getTime())
      .slice(0, 15)
  }, [liveNotifications, notificationResponse?.results])
  const liveUnreadCount = unreadResponse?.unread_count ?? 0
  const unreadNotificationCount = liveUnreadCount || recentNotifications.filter((notification) => !notification.is_read).length
  const selectedCompanyCode = useMemo(() => {
    if (!companyMemberships?.profiles?.length) return ''
    const active = companyMemberships.profiles.find(
      (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`,
    )
    return active?.company_code || companyMemberships.profiles[0]?.company_code || ''
  }, [companyMemberships])

  const markOneRead = async (notification: NotificationRecord) => {
    if (notification.is_read) return
    try {
      await markNotificationRead(notification.id).unwrap()
      setLiveNotifications((current) => {
        const source = current.length ? current : recentNotifications
        return source.map((item) => item.id === notification.id ? { ...item, is_read: true, read_at: new Date().toISOString() } : item)
      })
    } catch {
      toast.error('Unable to mark notification as read.')
    }
  }

  const openNotificationAction = async (notification: NotificationRecord) => {
    await markOneRead(notification)
    setNotificationMenuOpen(false)
    router.push(notification.action_url || '/notifications')
  }

  const markEveryNotificationRead = async () => {
    try {
      await markAllNotificationsRead().unwrap()
      setLiveNotifications(recentNotifications.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at || new Date().toISOString(),
      })))
      await Promise.all([refetchNotifications(), refetchUnreadCount()])
    } catch {
      toast.error('Unable to mark all notifications as read.')
    }
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
    { href: "/subscription", label: "Institution billing", icon: CreditCard },
    { href: "/agent/settings", label: "Agent settings", icon: Bot },
    { href: "/profile/support-access", label: "Support access", icon: KeyRound },
    { href: "/pos/settings", label: "POS settings", icon: MonitorSpeaker },
    { href: "/pos/remittances", label: "POS remittances", icon: Wallet },
  ].map((item) => ({
    ...item,
    access: canAccessPath(item.href),
  }))

  return (
    <div
      className={`fixed top-3 z-30 flex items-center justify-between rounded-2xl bg-gray-50/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-gray-50/80 ${
        sidebarCollapsed ? "md:left-16 md:right-5" : "md:left-64 md:right-5"
      } left-3 right-3 md:px-3 md:py-2.5`}
    >
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onOpenMobileSidebar}
          aria-label="Open navigation menu"
          title="Open navigation menu"
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 md:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 items-center justify-end gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-3 overflow-visible">
          {companyMemberships?.profiles?.length ? (
            <div className="flex min-w-0 items-center gap-2">
              <select
                value={selectedCompanyCode}
                onChange={(e) => handleSwitchCompany(e.target.value)}
                disabled={isSwitchingCompany}
                className="min-w-0 max-w-[10rem] rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 md:max-w-[12rem] lg:max-w-[14rem] xl:max-w-[18rem]"
              >
                {companyMemberships.profiles.map((profile) => (
                  <option key={`${profile.id}`} value={profile.company_code}>
                    {profile.name} ({profile.company_code}){profile.support_access ? " • support" : ""}
                  </option>
                ))}
              </select>
              <Link
                href="/profile/create?mode=new"
                className="inline-flex h-10 items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 md:px-2.5"
                aria-label="Create a new workspace"
                title="Create a new workspace"
              >
                <CirclePlus className="h-4 w-4" />
                <span className="hidden 2xl:inline">New workspace</span>
              </Link>
            </div>
          ) : null}

          <div className="relative shrink-0" ref={notificationMenuRef}>
            <button
              type="button"
              onClick={() => {
                setNotificationMenuOpen((current) => !current)
                setUserMenuOpen(false)
                setSettingsMenuOpen(false)
              }}
              aria-label={`Open notifications${unreadNotificationCount ? `, ${unreadNotificationCount} unread` : ''}`}
              aria-expanded={notificationMenuOpen}
              className="relative rounded-full p-2 transition-colors hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <Bell size={24} className="cursor-pointer text-gray-500" />
              {unreadNotificationCount > 0 ? (
                <div className="absolute -right-2 -top-2 inline-flex min-w-5 justify-center rounded-full bg-blue-500 px-[0.4rem] py-1 text-xs font-semibold leading-none text-white">
                  <span>{unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}</span>
                </div>
              ) : null}
            </button>

            {notificationMenuOpen ? (
              <div className="absolute right-0 z-50 mt-3 w-[min(26rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="flex items-center justify-between gap-4 border-b border-gray-100 px-5 py-4">
                    <div>
                      <div className="text-base font-semibold text-gray-900">Notifications</div>
                      <div className="mt-0.5 text-xs text-gray-500">
                      {notificationResponse?.count ?? recentNotifications.length} total{unreadNotificationCount ? ` · ${unreadNotificationCount} unread` : ' · all read'}
                    </div>
                  </div>
                  {liveUnreadCount > 0 ? (
                    <button
                      type="button"
                      onClick={() => void markEveryNotificationRead()}
                      disabled={markingAllRead}
                      className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-50"
                    >
                      <CheckCheck className="h-4 w-4" />
                      Mark all read
                    </button>
                  ) : null}
                </div>

                <div className="max-h-[min(65vh,36rem)] overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="space-y-3 p-4">
                      {Array.from({ length: 4 }).map((_, index) => (
                        <div key={index} className="h-20 animate-pulse rounded-xl bg-gray-100" />
                      ))}
                    </div>
                  ) : recentNotifications.length ? (
                    recentNotifications.map((notification) => {
                      const presentation = getNotificationPresentation(notification)
                      return (
                        <div
                          key={notification.id}
                          className={`border-b border-gray-100 px-4 py-3 last:border-b-0 ${notification.is_read ? 'bg-white' : 'bg-blue-50/60'}`}
                        >
                          <div className="flex gap-3">
                            <div className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${notification.is_read ? 'bg-gray-200' : 'bg-blue-500'}`} />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-3">
                                <p className="line-clamp-1 text-sm font-semibold text-gray-900">
                                  {notification.title || 'Notification'}
                                </p>
                                <span className="shrink-0 text-[11px] text-gray-400">
                                  {new Date(notification.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              </div>
                              <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-600">
                                {notification.message || 'No message was attached to this notification.'}
                              </p>
                              <div className="mt-2 flex items-center justify-between gap-3">
                                <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${presentation.tone.badgeClassName}`}>
                                  {presentation.categoryLabel}
                                </span>
                                <div className="flex items-center gap-1">
                                  {!notification.is_read ? (
                                    <button
                                      type="button"
                                      onClick={() => void markOneRead(notification)}
                                      className="rounded-lg p-1.5 text-gray-500 hover:bg-white hover:text-blue-700"
                                      aria-label={`Mark ${notification.title || 'notification'} as read`}
                                    >
                                      <MailOpen className="h-4 w-4" />
                                    </button>
                                  ) : null}
                                  {notification.action_url ? (
                                    <button
                                      type="button"
                                      onClick={() => void openNotificationAction(notification)}
                                      className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-semibold text-blue-700 hover:bg-white"
                                    >
                                      Open
                                      <ArrowRight className="h-3.5 w-3.5" />
                                    </button>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <div className="flex flex-col items-center px-6 py-10 text-center">
                      <div className="rounded-full bg-gray-100 p-3">
                        <Bell className="h-6 w-6 text-gray-400" />
                      </div>
                      <div className="mt-3 text-sm font-semibold text-gray-900">No notifications yet</div>
                      <div className="mt-1 text-xs leading-5 text-gray-500">New workspace activity will appear here in real time.</div>
                    </div>
                  )}
                </div>

                <Link
                  href="/notifications"
                  onClick={() => setNotificationMenuOpen(false)}
                  className="flex items-center justify-center gap-2 border-t border-gray-100 bg-gray-50 px-5 py-3 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                >
                  View all notifications
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : null}
          </div>

          <hr className="hidden h-6 w-0 border border-solid border-l bg-gray-300 md:block" />

          <div className="relative shrink-0" ref={userMenuRef}>
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
              <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border bg-white py-1 shadow-lg">
                <div className="border-b border-gray-100 px-4 py-3">
                  <div className="text-sm font-semibold text-gray-900">{userDisplayName}</div>
                  <div className="mt-1 text-xs text-gray-500">{fallbackUser.email || 'Personal account'}</div>
                  <div className="mt-2 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                    {activeWorkspaceName}
                  </div>
                  <div className="mt-1 text-[11px] text-gray-400">
                    {activeWorkspaceCode}
                  </div>
                  {activeProfile?.support_access ? (
                    <div className="mt-2 inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-amber-700">
                      Support access
                    </div>
                  ) : null}
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

        <div className="relative shrink-0" ref={settingsMenuRef}>
          <button
            type="button"
            onClick={() => setSettingsMenuOpen((current) => !current)}
            className="rounded-full p-2 transition-colors hover:bg-gray-100"
            aria-label="Open settings menu"
          >
            <SettingsIcon size={24} className="cursor-pointer text-gray-500" />
          </button>
          {settingsMenuOpen ? (
            <div className="absolute right-0 z-50 mt-2 w-56 rounded-xl border bg-white py-1 shadow-lg">
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
