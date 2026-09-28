"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import Link from "next/link"
import {
  Camera,
  Copy,
  KeyRound,
  Mail,
  Phone,
  ShieldCheck,
  Share2,
  UserRound
} from "lucide-react"
import { toast } from "react-toastify"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import Tabs from "@/components/common/Tabs"
import { useSetPasswordMutation } from "@/redux/features/auth/authApiSlice"
import {
  useGetLoggedInUserQuery,
  useGetReferralDashboardQuery,
  useUpdateLoggedInUserMutation
} from "@/redux/features/users/userApiSlice"

type ProfileFormState = {
  first_name: string
  last_name: string
  phone: string
  sex: "male" | "female" | "not_to_mention" | ""
  date_of_birth: string
}

type PasswordFormState = {
  current_password: string
  new_password: string
  confirm_password: string
}

const backendHost = (process.env.NEXT_PUBLIC_BACKEND_HOST_URL ?? "").replace(
  /\/+$/,
  ""
)

const buildMediaUrl = (value?: string | null) => {
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${backendHost}${value.startsWith("/") ? value : `/${value}`}`
}

const buildInitials = (
  firstName?: string,
  lastName?: string,
  email?: string
) => {
  const parts = [firstName, lastName]
    .filter(Boolean)
    .map((part) => String(part).trim())
  if (parts.length) {
    return parts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
  }
  return (email ?? "U").trim().charAt(0).toUpperCase()
}

const formatDateValue = (value?: string | Date | null) => {
  if (!value) return ""
  if (typeof value === "string") return value.slice(0, 10)
  return value.toISOString().slice(0, 10)
}

export default function UserSettingsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: user, isLoading, refetch } = useGetLoggedInUserQuery()
  const { data: referralDashboard } = useGetReferralDashboardQuery()
  const [updateLoggedInUser, { isLoading: isSavingProfile }] =
    useUpdateLoggedInUserMutation()
  const [setPassword, { isLoading: isSavingPassword }] =
    useSetPasswordMutation()

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    first_name: "",
    last_name: "",
    phone: "",
    sex: "",
    date_of_birth: ""
  })
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    current_password: "",
    new_password: "",
    confirm_password: ""
  })

  useEffect(() => {
    if (!user) return
    // Hydrate the editable form when the authenticated user record arrives.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setProfileForm({
      first_name: user.first_name ?? "",
      last_name: user.last_name ?? "",
      phone: user.phone ?? "",
      sex: user.sex ?? "",
      date_of_birth: formatDateValue(user.date_of_birth)
    })
  }, [user])

  const avatarUrl = useMemo(() => {
    if (avatarFile) return URL.createObjectURL(avatarFile)
    return buildMediaUrl(user?.picture)
  }, [avatarFile, user?.picture])

  useEffect(() => {
    return () => {
      if (avatarFile && avatarUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(avatarUrl)
      }
    }
  }, [avatarFile, avatarUrl])

  const initials = buildInitials(user?.first_name, user?.last_name, user?.email)
  const displayName =
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim() ||
    user?.email ||
    "User"
  const commissionRate =
    Number(referralDashboard?.commission_rate ?? 0.05) * 100
  const mfaEnabled = Boolean(user?.mfa_enabled || user?.has_setup_mfa)

  const handleProfileFieldChange = (
    field: keyof ProfileFormState,
    value: string
  ) => {
    setProfileForm((current) => ({ ...current, [field]: value }))
  }

  const handlePasswordFieldChange = (
    field: keyof PasswordFormState,
    value: string
  ) => {
    setPasswordForm((current) => ({ ...current, [field]: value }))
  }

  const handleSaveProfile = async () => {
    const body = new FormData()
    body.append("first_name", profileForm.first_name.trim())
    body.append("last_name", profileForm.last_name.trim())
    body.append("phone", profileForm.phone.trim())
    if (profileForm.sex) body.append("sex", profileForm.sex)
    if (profileForm.date_of_birth)
      body.append("date_of_birth", profileForm.date_of_birth)
    if (avatarFile) body.append("picture", avatarFile)

    try {
      await updateLoggedInUser(body).unwrap()
      await refetch()
      setAvatarFile(null)
      toast.success("Your account settings have been updated.")
    } catch (error: any) {
      toast.error(
        error?.data?.detail || "Unable to update your account settings."
      )
    }
  }

  const handleChangePassword = async () => {
    if (
      !passwordForm.current_password ||
      !passwordForm.new_password ||
      !passwordForm.confirm_password
    ) {
      toast.error("Fill in your current and new password.")
      return
    }
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      toast.error("New password confirmation does not match.")
      return
    }

    try {
      await setPassword({
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        re_new_password: passwordForm.confirm_password
      }).unwrap()
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: ""
      })
      toast.success("Your password has been changed.")
    } catch (error: any) {
      toast.error(error?.data?.detail || "Unable to change password.")
    }
  }

  const handleCopyReferralLink = async () => {
    const referralUrl = referralDashboard?.referral_url
    if (!referralUrl) return
    try {
      await navigator.clipboard.writeText(referralUrl)
      toast.success("Referral link copied.")
    } catch {
      toast.error("Unable to copy the referral link.")
    }
  }

  return (
    <div className="user-settings-workspace space-y-6">
      <Card className="user-settings-hero border-gray-200 bg-white shadow-sm">
        <CardHeader className="gap-4 p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <Avatar className="h-20 w-20 border border-gray-200">
                <AvatarImage src={avatarUrl ?? undefined} alt={displayName} />
                <AvatarFallback className="bg-slate-900 text-xl font-semibold text-white">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div>
                <CardTitle className="text-3xl font-semibold tracking-tight text-gray-900">
                  User settings
                </CardTitle>
                <CardDescription className="mt-2 max-w-2xl text-sm leading-6 text-gray-600">
                  Manage your personal profile, picture, password, and security
                  options here. Workspace and company administration stay under
                  the separate settings hub.
                </CardDescription>
              </div>
            </div>
            {mfaEnabled ? (
            <div className="flex flex-wrap gap-2">
                <Badge
                  variant="outline"
                  className="border-emerald-200 bg-emerald-50 text-emerald-700"
                >
                  MFA enabled
              </Badge>
            </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Tabs
        items={[
          { id: "profile", label: "Profile", content: null },
          { id: "security", label: "Security", content: null }
        ]}
        defaultActive="profile"
        className="user-settings-tabs"
      >
        {(activeTab) => (
          <>
            {activeTab === "profile" ? (
              <div
                id="tabpanel-profile"
                className="space-y-6"
                role="tabpanel"
                aria-labelledby="tab-profile"
              >
                <Card
                  id="refer-and-earn"
                  className="user-settings-card border-gray-200 shadow-sm"
                >
                  <CardHeader className="p-6">
                    <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                      <Share2 className="h-5 w-5 text-blue-600" />
                      Refer and earn
                    </CardTitle>
                    <CardDescription>
                      Earn {commissionRate}% of each referred customer&apos;s
                      subscription payment for life.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-5 p-6 pt-0">
                    <div className="grid gap-4 md:grid-cols-[180px_1fr_auto] md:items-end">
                      <div className="space-y-2">
                        <Label htmlFor="referral-code">
                          Your referral code
                        </Label>
                        <Input
                          id="referral-code"
                          value={referralDashboard?.referral_code ?? ""}
                          readOnly
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="referral-link">Referral link</Label>
                        <Input
                          id="referral-link"
                          value={referralDashboard?.referral_url ?? ""}
                          readOnly
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => void handleCopyReferralLink()}
                        disabled={!referralDashboard?.referral_url}
                      >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy link
                      </Button>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      {[
                        ["Referred", referralDashboard?.referred_count ?? 0],
                        [
                          "Pending earnings",
                          referralDashboard?.earnings.pending ?? "0.00"
                        ],
                        [
                          "Paid earnings",
                          referralDashboard?.earnings.paid ?? "0.00"
                        ]
                      ].map(([label, value]) => (
                        <div
                          key={String(label)}
                          className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3"
                        >
                          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                            {label}
                          </p>
                          <p className="mt-1 text-lg font-semibold text-gray-900">
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
          <Card className="user-settings-card border-gray-200 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                <UserRound className="h-5 w-5 text-blue-600" />
                Personal profile
              </CardTitle>
                    <CardDescription>
                      Update the personal details and avatar shown across your
                      account.
                    </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6 pt-0">
              <div className="user-settings-avatar-panel flex flex-col gap-5 rounded-3xl border border-gray-200 bg-gray-50 p-5 md:flex-row md:items-center md:justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 border border-gray-200">
                          <AvatarImage
                            src={avatarUrl ?? undefined}
                            alt={displayName}
                          />
                          <AvatarFallback className="bg-slate-900 text-lg font-semibold text-white">
                            {initials}
                          </AvatarFallback>
                  </Avatar>
                  <div>
                          <p className="text-base font-semibold text-gray-900">
                            {displayName}
                          </p>
                          <p className="text-sm text-gray-500">
                            {user?.email || "No email"}
                          </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                          onChange={(event) =>
                            setAvatarFile(event.target.files?.[0] ?? null)
                          }
                  />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                        >
                    <Camera className="mr-2 h-4 w-4" />
                          {avatarFile
                            ? "Change selected image"
                            : "Upload avatar"}
                  </Button>
                  {avatarFile ? (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setAvatarFile(null)}
                          >
                      Remove selection
                    </Button>
                  ) : null}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="first_name">First name</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "first_name",
                              event.target.value
                            )
                          }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Last name</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "last_name",
                              event.target.value
                            )
                          }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                          <Input
                            id="email"
                            value={user?.email || ""}
                            disabled
                            className="pl-10"
                          />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      id="phone"
                      value={profileForm.phone}
                            onChange={(event) =>
                              handleProfileFieldChange(
                                "phone",
                                event.target.value
                              )
                            }
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Sex</Label>
                        <Select
                          value={profileForm.sex || undefined}
                          onValueChange={(value) =>
                            handleProfileFieldChange("sex", value)
                          }
                        >
                    <SelectTrigger>
                      <SelectValue placeholder="Select your preference" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="not_to_mention">
                              Prefer not to mention
                            </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={profileForm.date_of_birth}
                          onChange={(event) =>
                            handleProfileFieldChange(
                              "date_of_birth",
                              event.target.value
                            )
                          }
                  />
                </div>
              </div>

              <div className="flex justify-end">
                      <Button
                        type="button"
                        onClick={handleSaveProfile}
                        disabled={isLoading || isSavingProfile}
                      >
                  {isSavingProfile ? "Saving..." : "Save profile"}
                </Button>
              </div>
            </CardContent>
          </Card>
              </div>
            ) : null}

            {activeTab === "security" ? (
              <div
                id="tabpanel-security"
                className="space-y-6"
                role="tabpanel"
                aria-labelledby="tab-security"
              >
          <Card className="user-settings-card border-gray-200 shadow-sm">
            <CardHeader className="p-6">
              <CardTitle className="flex items-center gap-2 text-xl text-gray-900">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                Security controls
              </CardTitle>
                    <CardDescription>
                      Manage password changes and MFA recovery from one place.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6 p-6 pt-0">
                <Card className="user-settings-security-card border-gray-200 shadow-none">
                  <CardHeader className="p-5">
                        <CardTitle className="text-lg text-gray-900">
                          Multi-factor authentication
                        </CardTitle>
                    <CardDescription>
                          {mfaEnabled
                            ? "MFA is active for this account. Reset your authenticator only if you need to replace it."
                            : "MFA is required before access to the dashboard. Contact support if this status is unexpected."}
                    </CardDescription>
                  </CardHeader>
                      {mfaEnabled ? (
                  <CardContent className="flex gap-3 p-5 pt-0">
                    <Button asChild variant="outline">
                            <Link href="/accounts/mfa/reset">
                              Reset authenticator
                            </Link>
                    </Button>
                  </CardContent>
                      ) : null}
                </Card>

              <Separator />

              <div className="space-y-5">
                <div>
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                    <KeyRound className="h-5 w-5 text-blue-600" />
                    Change password
                  </h3>
                  <p className="mt-1 text-sm text-gray-600">
                          Use your current password to set a new one for this
                          account.
                  </p>
                </div>
                <div className="grid gap-5 md:grid-cols-3">
                  <div className="space-y-2">
                          <Label htmlFor="current_password">
                            Current password
                          </Label>
                    <Input
                      id="current_password"
                      type="password"
                      value={passwordForm.current_password}
                            onChange={(event) =>
                              handlePasswordFieldChange(
                                "current_password",
                                event.target.value
                              )
                            }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new_password">New password</Label>
                    <Input
                      id="new_password"
                      type="password"
                      value={passwordForm.new_password}
                            onChange={(event) =>
                              handlePasswordFieldChange(
                                "new_password",
                                event.target.value
                              )
                            }
                    />
                  </div>
                  <div className="space-y-2">
                          <Label htmlFor="confirm_password">
                            Confirm new password
                          </Label>
                    <Input
                      id="confirm_password"
                      type="password"
                      value={passwordForm.confirm_password}
                            onChange={(event) =>
                              handlePasswordFieldChange(
                                "confirm_password",
                                event.target.value
                              )
                            }
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                        <Button
                          type="button"
                          onClick={handleChangePassword}
                          disabled={isSavingPassword}
                        >
                    {isSavingPassword ? "Saving..." : "Change password"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
              </div>
            ) : null}
          </>
        )}
      </Tabs>
    </div>
  )
}
