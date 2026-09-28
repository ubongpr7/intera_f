import { createSlice, type PayloadAction } from "@reduxjs/toolkit"

type PermissionState = {
  profileId: string | null
  permissions: string[]
  isOwner: boolean
  isStaff: boolean
  status: "idle" | "loading" | "succeeded" | "failed"
  error: string | null
}

const initialState: PermissionState = {
  profileId: null,
  permissions: [],
  isOwner: false,
  isStaff: false,
  status: "idle",
  error: null,
}

const permissionSlice = createSlice({
  name: "permission",
  initialState,
  reducers: {
    permissionLoading: (state, action: PayloadAction<string>) => {
      state.profileId = action.payload
      state.permissions = []
      state.isOwner = false
      state.isStaff = false
      state.status = "loading"
      state.error = null
    },
    permissionHydrated: (state, action: PayloadAction<{ profileId: string; permissions: string[]; isOwner?: boolean; isStaff?: boolean }>) => {
      state.profileId = action.payload.profileId
      state.permissions = Array.from(new Set(action.payload.permissions))
      state.isOwner = Boolean(action.payload.isOwner)
      state.isStaff = Boolean(action.payload.isStaff)
      state.status = "succeeded"
      state.error = null
    },
    permissionFailed: (state, action: PayloadAction<{ profileId: string; error: string }>) => {
      state.profileId = action.payload.profileId
      state.permissions = []
      state.isOwner = false
      state.isStaff = false
      state.status = "failed"
      state.error = action.payload.error
    },
    clearPermissions: () => initialState,
  },
})

export const { permissionLoading, permissionHydrated, permissionFailed, clearPermissions } = permissionSlice.actions
export default permissionSlice.reducer
