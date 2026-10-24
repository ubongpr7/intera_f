"use client"

import { useMemo, useState } from "react"
import { Search, ShieldCheck, UserRound, Users } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { useListUsersQuery } from "@/redux/features/users/userApiSlice"

const formatDate = (value?: Date | string | null) => value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value)) : "Never"

export default function PlatformUsersPage() {
  const { data: users = [], isLoading, isError } = useListUsersQuery()
  const [search, setSearch] = useState("")

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) return users
    return users.filter((user) => [user.email, user.first_name, user.last_name, user.get_full_name, user.role].filter(Boolean).join(" ").toLowerCase().includes(query))
  }, [search, users])

  const staffCount = users.filter((user) => user.is_staff || user.is_superuser).length
  const verifiedCount = users.filter((user) => user.is_verified).length

  return (
    <section className="admin-portal-surface mx-auto w-full max-w-[1500px] space-y-6 px-4 py-6 lg:px-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[.2em] text-emerald-700">People and access</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Platform users</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">Review every account on Intera IMS separately from staff invitations and workspace membership.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardContent className="flex items-center gap-3 p-5"><Users className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-slate-600">Total users</p><p className="text-2xl font-semibold text-slate-950">{users.length}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><ShieldCheck className="h-5 w-5 text-emerald-600" /><div><p className="text-sm text-slate-600">Platform staff</p><p className="text-2xl font-semibold text-slate-950">{staffCount}</p></div></CardContent></Card>
        <Card><CardContent className="flex items-center gap-3 p-5"><UserRound className="h-5 w-5 text-cyan-600" /><div><p className="text-sm text-slate-600">Verified accounts</p><p className="text-2xl font-semibold text-slate-950">{verifiedCount}</p></div></CardContent></Card>
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div><CardTitle>All users</CardTitle><CardDescription>Search accounts and inspect their platform-level status.</CardDescription></div>
          <div className="relative w-full sm:max-w-xs"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search by name, email, or role" className="pl-9" aria-label="Search platform users" /></div>
        </CardHeader>
        <CardContent>
          {isLoading ? <p className="py-8 text-sm text-slate-500">Loading platform users...</p> : null}
          {isError ? <p className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">Unable to load platform users. Refresh and try again.</p> : null}
          {!isLoading && !isError && filteredUsers.length === 0 ? <p className="py-8 text-center text-sm text-slate-500">No users match this search.</p> : null}
          <div className="space-y-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-gray-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0"><p className="font-semibold text-slate-950">{user.get_full_name || [user.first_name, user.last_name].filter(Boolean).join(" ") || user.email}</p><p className="mt-1 text-sm text-slate-600">{user.email} · Joined {formatDate(user.date_joined)} · Last login {formatDate(user.last_login)}</p></div>
                <div className="flex flex-wrap gap-2">
                  {user.is_superuser ? <Badge className="bg-blue-600 text-white">Superuser</Badge> : user.is_staff ? <Badge className="bg-emerald-600 text-white">Staff</Badge> : <Badge variant="outline">User</Badge>}
                  {user.is_verified ? <Badge variant="outline" className="border-emerald-300 text-emerald-700">Verified</Badge> : <Badge variant="outline" className="border-amber-300 text-amber-700">Unverified</Badge>}
                  {user.mfa_enabled ? <Badge variant="outline" className="border-blue-300 text-blue-700">MFA enabled</Badge> : null}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
