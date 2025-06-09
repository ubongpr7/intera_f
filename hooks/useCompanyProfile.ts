"use client"

import {
  useCreateCompanyProfileMutation,
  useGetCompanyProfileQuery,
  useUpdateCompanyProfileMutation,
} from "@/redux/features/management/companyProfileApiSlice"
import { useAuth } from "@/redux/features/users/useAuth"

export function useCompanyProfile() {
  const { user, isLoading: isAuthLoading } = useAuth()

  const profileId = user?.profile
  const shouldSkip = isAuthLoading || !profileId

  const {
    data: profile,
    isLoading: isProfileLoading,
    error,
    refetch,
  } = useGetCompanyProfileQuery(profileId, {
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
    isLoading: isAuthLoading || isProfileLoading || isUpdating || isCreating,
    error,
    updateProfile: updateCompanyProfile,
    refetch,
  }
}
