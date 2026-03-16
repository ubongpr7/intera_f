"use client"

import {
  useCreateCompanyProfileMutation,
  useGetCompanyProfileQuery,
  useUpdateCompanyProfileMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import { useGetUserCompaniesQuery } from "@/redux/features/auth/authApiSlice"

export function useCompanyProfile() {
  const { data: memberships, isLoading: isMembershipLoading } = useGetUserCompaniesQuery()
  const activeProfileId = memberships?.active_profile_id ?? null
  const shouldSkip = isMembershipLoading || !activeProfileId

  const {
    data: profile,
    isLoading: isProfileLoading,
    error,
    refetch,
  } = useGetCompanyProfileQuery(String(activeProfileId), {
    skip: shouldSkip,
  })

  const [updateProfile, { isLoading: isUpdating }] = useUpdateCompanyProfileMutation()
  const [createProfile, { isLoading: isCreating }] = useCreateCompanyProfileMutation()

  const updateCompanyProfile = async (data: any) => {
    if (profile?.id) {
      return await updateProfile({ id: profile.id, data }).unwrap()
    } else {
      return await createProfile(data).unwrap()
    }
  }

  return {
    profile,
    isLoading: isMembershipLoading || isProfileLoading || isUpdating || isCreating,
    error,
    updateProfile: updateCompanyProfile,
    refetch,
  }
}
