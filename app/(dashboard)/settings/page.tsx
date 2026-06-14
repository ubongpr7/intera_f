"use client"

import Link from "next/link"
import {
  Bot,
  Building2,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

const settingAreas = [
  {
    title: "Agent settings",
    description: "Workspace AI configuration, default-agent setup, model selection, and instruction management.",
    href: "/agent/settings",
    icon: Bot,
  },
  {
    title: "Company profile",
    description: "Business identity, address, social links, and policy setup for the active workspace.",
    href: "/profile",
    icon: Building2,
  },
  {
    title: "Staff and roles",
    description: "Invite staff, review permissions, and control access across the workspace.",
    href: "/profile/staff",
    icon: Users,
  },
]

export default function SettingsHubPage() {
  return (
    <div className="space-y-6">
      <Card className="border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-3 p-6 text-left">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
            <Settings2 className="h-3.5 w-3.5" />
            Settings Hub
          </div>
          <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">
            Workspace and application settings
          </CardTitle>
          <CardDescription className="max-w-4xl text-sm leading-6 text-gray-600">
            Use this page as the starting point for application settings. Agent setup lives on its own route, while
            product, POS, and other operational workspaces keep their own dedicated admin pages.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 p-6 pt-0 md:grid-cols-3">
          <div className="rounded-[24px] border border-blue-100 bg-blue-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-700">Purpose</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">General settings hub</p>
          </div>
          <div className="rounded-[24px] border border-emerald-100 bg-emerald-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-emerald-700">Agent setup</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Moved to /agent/settings</p>
          </div>
          <div className="rounded-[24px] border border-violet-100 bg-violet-50 px-4 py-4">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-violet-700">Operational admin</p>
            <p className="mt-2 text-lg font-semibold text-slate-900">Handled in their own modules</p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        {settingAreas.map((item) => {
          const Icon = item.icon
          return (
            <Card key={item.title} className="border-gray-200 bg-white shadow-sm">
              <CardHeader className="p-6 text-left">
                <div className="flex items-center justify-between gap-3">
                  <div className="rounded-2xl bg-gray-50 p-3 text-blue-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                    Settings area
                  </div>
                </div>
                <CardTitle className="mt-4 text-2xl tracking-tight text-gray-900">{item.title}</CardTitle>
                <CardDescription className="mt-2 text-sm leading-6 text-gray-600">
                  {item.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                <Button asChild className="w-full justify-between">
                  <Link href={item.href}>
                    Open
                    <Sparkles className="h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-gray-200 shadow-sm">
        <CardHeader className="p-6 text-left">
          <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Settings are being separated by domain
          </CardTitle>
          <CardDescription className="text-sm leading-6 text-gray-600">
            This cleanup keeps each admin area focused. POS, remittance, agent setup, and other operational modules now
            live in their own workspaces instead of being mixed into one page.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3 p-6 pt-0">
          <Button asChild variant="outline">
            <Link href="/agent/settings">
              <Bot className="mr-2 h-4 w-4" />
              Open agent settings
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile">
              <Building2 className="mr-2 h-4 w-4" />
              Open company profile
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/profile/staff">
              <Users className="mr-2 h-4 w-4" />
              Open staff and roles
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings">
              <Wrench className="mr-2 h-4 w-4" />
              Stay on settings hub
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
