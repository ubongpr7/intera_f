"use client"

import { useEffect } from "react"
import { getCookie } from "cookies-next"
import { useAppDispatch, useAppSelector } from "@/redux/store"
import { useGetUserCompaniesQuery } from "@/redux/features/auth/authApiSlice"
import { useGetEffectivePermissionsQuery } from "@/redux/features/permission/permit"
import { clearPermissions, permissionFailed, permissionHydrated, permissionLoading } from "@/redux/features/permission/permissionSlice"
import { readCookieValue } from "@/lib/authCookies"
import { getDecodedToken } from "@/lib/utils"

type UserClaims = {
  id?: string | number | null
  user_id?: string | number | null
  sub?: string | number | null
}

const normalizedId = (value: string | number | null | undefined) => {
  if (value === null || value === undefined) return null
  const result = `${value}`.trim()
  return result.length ? result : null
}

export default function PermissionHydrator({ disabled = false }: { disabled?: boolean }) {
  const dispatch = useAppDispatch()
  const permissionState = useAppSelector((state) => state.permission)
  const accessToken = readCookieValue("accessToken", getCookie)
  const {
    data: companies,
    isLoading: companiesLoading,
    isFetching: companiesFetching,
    isError: companiesError,
    isUninitialized: companiesUninitialized,
  } = useGetUserCompaniesQuery(undefined, { skip: disabled || !accessToken })
  const profileId = companies?.active_profile_id ? `${companies.active_profile_id}` : ""
  const activeProfile = companies?.profiles?.find((profile) => `${profile.id}` === profileId)
  const claims = getDecodedToken() as UserClaims | null
  const currentUserId = normalizedId(claims?.id) ?? normalizedId(claims?.user_id) ?? normalizedId(claims?.sub)
  const membershipOwnerId = normalizedId(activeProfile?.owner_id)
  const membershipRole = `${activeProfile?.role ?? ""}`.trim().toLowerCase()
  const isMembershipOwner = membershipRole === "owner" || (
    membershipOwnerId !== null && currentUserId !== null && membershipOwnerId === currentUserId
  )
  const permissionQuery = useGetEffectivePermissionsQuery(profileId, { skip: disabled || !accessToken || !profileId })

  useEffect(() => {
    if (disabled || !accessToken) {
      dispatch(clearPermissions())
      return
    }
    // A background refetch must not blank the application while the last
    // resolved workspace context is still usable.
    if (companiesUninitialized || (companiesLoading && !companies)) {
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
    if (permissionState.status !== "succeeded" || permissionState.profileId !== profileId) {
      dispatch(permissionLoading(profileId))
    }
  }, [accessToken, companies, companiesError, companiesFetching, companiesLoading, companiesUninitialized, disabled, dispatch, permissionState.profileId, permissionState.status, profileId])

  useEffect(() => {
    if (!profileId || permissionQuery.isUninitialized || permissionQuery.isLoading) return
    if (permissionQuery.isError || !permissionQuery.data) {
      dispatch(permissionFailed({ profileId, error: "Unable to load workspace permissions." }))
      return
    }
    dispatch(permissionHydrated({
      profileId,
      permissions: permissionQuery.data.permissions,
      isOwner: Boolean(permissionQuery.data.is_owner || isMembershipOwner),
      isStaff: permissionQuery.data.is_staff || permissionQuery.data.is_superuser,
    }))
  }, [dispatch, isMembershipOwner, permissionQuery.data, permissionQuery.isError, permissionQuery.isLoading, permissionQuery.isUninitialized, profileId])

  return null
}
