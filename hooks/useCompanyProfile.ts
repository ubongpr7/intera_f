"use client"

import { useCreateCompanyProfileMutation,
   useGetCompanyProfileQuery,
   useGetOwnerCompanyProfileQuery, 
   useUpdateCompanyProfileMutation } from "@/redux/features/management/companyProfileApiSlice"
import {useAuth} from "@/redux/features/users/useAuth"


export function useCompanyProfile() {
  const { user } = useAuth()
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } =   useGetCompanyProfileQuery(String(user?.profile))

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
