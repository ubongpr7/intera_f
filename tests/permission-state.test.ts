import assert from "node:assert/strict"
import test from "node:test"

import permissionReducer, {
  clearPermissions,
  permissionFailed,
  permissionHydrated,
  permissionLoading,
} from "../redux/features/permission/permissionSlice.ts"

test("hydrates effective permissions for the active profile", () => {
  let state = permissionReducer(undefined, { type: "permission/init" })

  state = permissionReducer(state, permissionLoading("profile-42"))
  assert.equal(state.status, "loading")
  assert.equal(state.profileId, "profile-42")
  assert.deepEqual(state.permissions, [])

  state = permissionReducer(
    state,
    permissionHydrated({
      profileId: "profile-42",
      permissions: ["inventory.read", "inventory.read", "inventory.write"],
      isOwner: true,
      isStaff: true,
    }),
  )

  assert.equal(state.status, "succeeded")
  assert.deepEqual(state.permissions, ["inventory.read", "inventory.write"])
  assert.equal(state.isOwner, true)
  assert.equal(state.isStaff, true)
})

test("failed hydration does not retain permissions from another profile", () => {
  let state = permissionReducer(
    undefined,
    permissionHydrated({
      profileId: "profile-old",
      permissions: ["inventory.read"],
      isOwner: true,
    }),
  )

  state = permissionReducer(
    state,
    permissionFailed({ profileId: "profile-new", error: "Users service unavailable" }),
  )

  assert.equal(state.status, "failed")
  assert.equal(state.profileId, "profile-new")
  assert.deepEqual(state.permissions, [])
  assert.equal(state.isOwner, false)
})

test("logout clears hydrated permission state", () => {
  const hydrated = permissionReducer(
    undefined,
    permissionHydrated({
      profileId: "profile-42",
      permissions: ["inventory.read"],
      isOwner: true,
      isStaff: true,
    }),
  )

  assert.deepEqual(permissionReducer(hydrated, clearPermissions()), {
    profileId: null,
    permissions: [],
    isOwner: false,
    isStaff: false,
    status: "idle",
    error: null,
  })
})
