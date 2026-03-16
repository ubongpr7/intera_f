'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, UploadCloud, UserPlus, Trash2 } from "lucide-react";
import { getCookie } from "cookies-next";
import { toast } from "react-toastify";
import { readCookieValue } from "@/lib/authCookies";

import { Column, DataTable, type ActionButton } from "../common/DataTable/DataTable";
import VerticalTabs from "../common/verticalTabs";
import ActivityLogs from "./activityLogs";
import UserPermissionForm from "../permissions/customPermission";
import UserGroupManager from "../permissions/manytomany";
import CustomUpdateForm from "../common/updateForm";
import RoleManager from "./roleManager";
import { StaffManagementRefetchProp } from "./roles";
import { UserData } from "@/redux/features/users/userTypes";
import {
  useCreateStaffUserMutation,
  useGetCompanyUsersQuery,
  useGetPendingInvitationsQuery,
  useInviteStaffBulkMutation,
  useRemoveCompanyMemberMutation,
  useRevokeInvitationMutation,
} from "../../redux/features/users/userApiSlice";
import {
  useGetUserPermissionQuery,
  useUpdateUserPermissionMutation,
} from "../../redux/features/permission/permit";
import { useUpdateUserMutation } from "../../redux/features/users/userApiSlice";
import { RoleAssignment } from "@/redux/features/management/managementTypes";

type StaffRow = UserData & {
  rowType: "member" | "invitation";
  invitationId?: string;
  inviteStatus?: string;
};

const inventoryColumns: Column<StaffRow>[] = [
  {
    header: "Name",
    accessor: "first_name",
    render: (value, row) => {
      if (row.rowType === "invitation") {
        return "Pending Invite";
      }
      return value || "N/A";
    },
    className: "font-medium",
  },
  {
    header: "Email",
    accessor: "email",
    render: (value) => value || "N/A",
  },
  {
    header: "Phone",
    accessor: "phone",
    render: (value, row) => {
      if (row.rowType === "invitation") return "-";
      return value || "N/A";
    },
  },
  {
    header: "Status",
    accessor: (row) => row.inviteStatus ?? "active",
    render: (_, row) =>
      row.rowType === "invitation"
        ? `Invitation: ${row.inviteStatus ?? "pending"}`
        : "Active member",
  },
];

const StaffCreateCard = ({ refetchData, setRefetchData }: StaffManagementRefetchProp) => {
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [openTabs, setOpenTabs] = useState(false);
  const [userId, setUserId] = useState("0");
  const [inviteEmail, setInviteEmail] = useState("");
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [userRoles, setUserRoles] = useState<RoleAssignment[]>([]);
  const [userDetail, setUserDetail] = useState<UserData>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const profileIdCookie = readCookieValue("profileId", getCookie) ?? readCookieValue("profile", getCookie);
  const activeProfileId = profileIdCookie ? `${profileIdCookie}` : "";

  const {
    data: members,
    isLoading: membersLoading,
    refetch: refetchMembers,
  } = useGetCompanyUsersQuery();
  const {
    data: pendingInvitations,
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useGetPendingInvitationsQuery();

  const [inviteStaff, { isLoading: singleInviteLoading }] = useCreateStaffUserMutation();
  const [inviteStaffBulk, { isLoading: bulkInviteLoading }] = useInviteStaffBulkMutation();
  const [removeMember, { isLoading: removeMemberLoading }] = useRemoveCompanyMemberMutation();
  const [revokeInvitation, { isLoading: revokeInvitationLoading }] = useRevokeInvitationMutation();

  const {
    data: permissionsData,
    isLoading: permissionDataLoading,
    refetch: refetchPermissions,
  } = useGetUserPermissionQuery(userId, { skip: !userId || userId === "0" });
  const [updatePermission, { isLoading: permissionLoading }] = useUpdateUserPermissionMutation();
  const [updateUser, { isLoading: userUpdateLoading }] = useUpdateUserMutation();

  const isLoading =
    membersLoading ||
    invitationsLoading ||
    singleInviteLoading ||
    bulkInviteLoading ||
    removeMemberLoading ||
    revokeInvitationLoading;

  const refreshAll = useCallback(async () => {
    await refetchMembers();
    await refetchInvitations();
  }, [refetchMembers, refetchInvitations]);

  useEffect(() => {
    if (!refetchData) return;
    refreshAll().finally(() => setRefetchData(false));
  }, [refetchData, refreshAll, setRefetchData]);

  const tableData = useMemo<StaffRow[]>(() => {
    const activeRows: StaffRow[] = (members || []).map((member) => ({
      id: Number(member.user?.id ?? member.id),
      first_name: member.user?.first_name ?? "",
      last_name: member.user?.last_name ?? "",
      email: member.user?.email ?? "",
      phone: member.user?.phone ?? null,
      is_verified: true,
      is_staff: false,
      date_joined: new Date().toISOString(),
      password: "",
      roles: [],
      rowType: "member",
      inviteStatus: "active",
    }));

    const inviteRows: StaffRow[] = (pendingInvitations || []).map((invite, idx) => ({
      id: Number(`${invite.id}`.replace(/\D/g, "").slice(0, 9) || idx + 1),
      first_name: "Pending",
      last_name: "Invite",
      email: invite.email ?? "",
      phone: null,
      is_verified: false,
      is_staff: false,
      date_joined: invite.created_at ?? new Date().toISOString(),
      password: "",
      rowType: "invitation",
      invitationId: invite.id,
      inviteStatus: invite.status ?? "pending",
    }));

    return [...activeRows, ...inviteRows];
  }, [members, pendingInvitations]);

  const handleUpdatePermissionSubmit = async (createdData: { permissions: string[] }) => {
    await updatePermission({ id: userId, data: createdData }).unwrap();
    await refetchPermissions();
  };

  const handleRowClick = async (row: StaffRow) => {
    if (row.rowType === "invitation") {
      toast.info("This user has a pending invitation.");
      return;
    }

    setRefetchData(true);
    setUserId(`${row.id}`);
    setUserDetail(row);
    setUserRoles(row?.roles || []);
    setRefetchData(false);

    if (permissionsData) {
      await refetchPermissions();
    }
    setOpenTabs(true);
    await refetchMembers();
  };

  const handleSingleInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = inviteEmail.trim().toLowerCase();
    if (!email) {
      toast.error("Provide an email address.");
      return;
    }

    await inviteStaff({ email }).unwrap();
    toast.success(`Invitation sent to ${email}`);
    setInviteEmail("");
    await refreshAll();
  };

  const handleBulkInvite = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bulkFile) {
      toast.error("Select a CSV file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", bulkFile);
    const result = await inviteStaffBulk(formData).unwrap();

    toast.success(
      `Bulk invite completed: ${result.created_count} created, ${result.existing_pending_count} existing, ${result.skipped_count} skipped, ${result.invalid_count} invalid.`,
    );

    setBulkFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    await refreshAll();
  };

  const handleRemove = async (row: StaffRow) => {
    if (row.rowType === "invitation") {
      if (!row.invitationId) {
        toast.error("Invitation id is missing.");
        return;
      }
      await revokeInvitation(row.invitationId).unwrap();
      toast.success("Invitation cancelled.");
      await refetchInvitations();
      return;
    }

    if (!activeProfileId) {
      toast.error("No active company context. Switch to a company first.");
      return;
    }

    await removeMember({ profileId: activeProfileId, user_id: row.id }).unwrap();
    toast.success("Staff member removed.");
    await refetchMembers();
  };

  const handleUpdate = async (createdData: Partial<UserData>) => {
    const updateData = await updateUser({ id: userId, data: createdData }).unwrap();
    setUserDetail((previous) => (previous ? { ...previous, ...updateData } : undefined));
    await refetchMembers();
  };

  const actionButtons: ActionButton<StaffRow>[] = [
    {
      label: "Remove",
      icon: Trash2,
      variant: "danger",
      onClick: async (row) => {
        try {
          await handleRemove(row);
        } catch (error: any) {
          const message = error?.data?.detail || error?.data?.error || "Action failed.";
          toast.error(message);
        }
      },
    },
  ];

  return (
    <div>
      <DataTable<StaffRow>
        columns={inventoryColumns}
        data={tableData}
        isLoading={isLoading}
        onRowClick={handleRowClick}
        actionButtons={actionButtons}
        searchableFields={["first_name", "email", "phone"]}
        filterableFields={[]}
        sortableFields={["first_name", "email", "phone"]}
        title="Staff"
        onClose={() => setIsInviteOpen(true)}
      />

      <div className={`fixed inset-0 z-50 items-center justify-center bg-black/50 p-4 ${isInviteOpen ? "flex" : "hidden"}`}>
        <div className="w-full max-w-2xl rounded-xl bg-white p-6 shadow-xl">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold text-gray-900">Invite Staff Members</h3>
            <button
              type="button"
              className="rounded-md p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              onClick={() => setIsInviteOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="space-y-6">
            <form onSubmit={handleSingleInvite} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <UserPlus size={16} />
                Invite by email
              </div>
              <div className="flex gap-3">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="staff@company.com"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="submit"
                  disabled={singleInviteLoading}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {singleInviteLoading ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </form>

            <form onSubmit={handleBulkInvite} className="rounded-lg border border-gray-200 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-gray-700">
                <UploadCloud size={16} />
                Invite by CSV (emails only)
              </div>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setBulkFile(event.target.files?.[0] || null)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-700"
                />
                <button
                  type="submit"
                  disabled={bulkInviteLoading || !bulkFile}
                  className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {bulkInviteLoading ? "Uploading..." : "Upload & Invite"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <div className={`fixed inset-0 z-50 items-center justify-center bg-black/50 p-4 ${openTabs ? "flex" : "hidden"}`}>
        <VerticalTabs
          items={[
            {
              id: "activities",
              label: "Staff Activities",
              content: (
                <ActivityLogs
                  userId={userId}
                  refetchData={refetchData}
                  onRefetchComplete={() => setRefetchData(false)}
                />
              ),
            },
            {
              id: "permission",
              label: "Staff Permissions",
              content: (
                <UserPermissionForm
                  permissionsData={permissionsData}
                  permissionLoading={permissionLoading}
                  isLoading={permissionDataLoading}
                  onSubmit={handleUpdatePermissionSubmit}
                />
              ),
            },
            ...(userId !== "0"
              ? [
                  {
                    id: "details",
                    label: "User Details",
                    content: (
                      <CustomUpdateForm
                        data={(userDetail || {}) as UserData}
                        isLoading={userUpdateLoading}
                        onSubmit={handleUpdate}
                        editableFields={["first_name", "phone"]}
                        displayKeys={["first_name", "phone", "email"]}
                        selectOptions={{}}
                        keyInfo={{}}
                        notEditableFields={[]}
                      />
                    ),
                  },
                  {
                    id: "group",
                    label: "Staff Group",
                    content: <UserGroupManager userId={userId} setRefetchData={() => setRefetchData(true)} />,
                  },
                  {
                    id: "update",
                    label: "Staff Roles",
                    content: (
                      <RoleManager
                        userId={userId}
                        roles={userRoles || []}
                        refetch={async () => {
                          setRefetchData(true);
                          await refetchMembers();
                        }}
                        closeTab={() => setOpenTabs(false)}
                      />
                    ),
                  },
                ]
              : []),
          ]}
          onClose={() => setOpenTabs(false)}
          className="rounded-lg border p-4"
        />
      </div>
    </div>
  );
};

export default StaffCreateCard;
