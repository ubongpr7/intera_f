"use client"

import { useCreateCompanyProfileMutation,
   useGetOwnerCompanyProfileQuery, 
   useUpdateCompanyProfileMutation } from "@/redux/features/management/companyProfileApiSlice"



export function useCompanyProfile() {
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useGetOwnerCompanyProfileQuery()

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
    isLoading: isLoading || isUpdating || isCreating,
    error,
    updateProfile: updateCompanyProfile,
    refetch,
  }
}
