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
  const {
    data: companies,
    isLoading: companiesLoading,
    isFetching: companiesFetching,
    isError: companiesError,
    isUninitialized: companiesUninitialized,
  } = useGetUserCompaniesQuery(undefined, { skip: disabled || !accessToken })
  const profileId = companies?.active_profile_id ? `${companies.active_profile_id}` : ""
  const permissionQuery = useGetEffectivePermissionsQuery(profileId, { skip: disabled || !accessToken || !profileId })

  useEffect(() => {
    if (disabled || !accessToken) {
      dispatch(clearPermissions())
      return
    }
    if (companiesUninitialized || companiesLoading || companiesFetching) {
      dispatch(permissionLoading(profileId || "pending"))
      return
    }
    if (companiesError) {
      dispatch(permissionFailed({ profileId: profileId || "pending", error: "Unable to load workspace access." }))
      return
    }
    if (!profileId) {
      // The company lookup has completed. An account without a workspace is
      // resolved as having no workspace permissions, not as an unresolved
      // request that can briefly render a false denial.
      dispatch(permissionHydrated({ profileId: "", permissions: [] }))
      return
    }
    dispatch(permissionLoading(profileId))
  }, [accessToken, companiesError, companiesFetching, companiesLoading, companiesUninitialized, disabled, dispatch, profileId])

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
