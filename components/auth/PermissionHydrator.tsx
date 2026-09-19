"use client"

import { useEffect } from "react"
import { getCookie } from "cookies-next"
import { useAppDispatch } from "@/redux/store"
import { useGetUserCompaniesQuery } from "@/redux/features/auth/authApiSlice"
import { useGetEffectivePermissionsQuery } from "@/redux/features/permission/permit"
import { clearPermissions, permissionFailed, permissionHydrated, permissionLoading } from "@/redux/features/permission/permissionSlice"
import { readCookieValue } from "@/lib/authCookies"

export default function PermissionHydrator({ disabled = false }: { disabled?: boolean }) {
  const dispatch = useAppDispatch()
  const accessToken = readCookieValue("accessToken", getCookie)
  const { data: companies } = useGetUserCompaniesQuery(undefined, { skip: disabled || !accessToken })
  const profileId = companies?.active_profile_id ? `${companies.active_profile_id}` : ""
  const permissionQuery = useGetEffectivePermissionsQuery(profileId, { skip: disabled || !accessToken || !profileId })

  useEffect(() => {
    if (disabled || !accessToken || !profileId) {
      dispatch(clearPermissions())
      return
    }
    dispatch(permissionLoading(profileId))
  }, [accessToken, disabled, dispatch, profileId])

  useEffect(() => {
    if (!profileId || permissionQuery.isUninitialized || permissionQuery.isLoading) return
    if (permissionQuery.isError || !permissionQuery.data) {
      dispatch(permissionFailed({ profileId, error: "Unable to load workspace permissions." }))
      return
    }
    dispatch(permissionHydrated({
      profileId,
      permissions: permissionQuery.data.permissions,
      isOwner: permissionQuery.data.is_owner,
      isStaff: permissionQuery.data.is_staff || permissionQuery.data.is_superuser,
    }))
  }, [dispatch, permissionQuery.data, permissionQuery.isError, permissionQuery.isLoading, permissionQuery.isUninitialized, profileId])

  return null
}
