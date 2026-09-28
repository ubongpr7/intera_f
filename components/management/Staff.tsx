'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { X, UploadCloud, UserPlus, Trash2, RotateCcw } from "lucide-react";
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
import StaffAccessSummary from "./StaffAccessSummary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StaffManagementRefetchProp } from "./roles";
import { UserData } from "@/redux/features/users/userTypes";
import {
  useCreateStaffUserMutation,
  useGetCompanyUsersQuery,
  useGetPendingInvitationsQuery,
  useInviteStaffBulkMutation,
  useRemoveCompanyMemberMutation,
  useResendInvitationMutation,
  useRevokeInvitationMutation,
} from "../../redux/features/users/userApiSlice";
import {
  useGetUserPermissionQuery,
  useUpdateUserPermissionMutation,
} from "../../redux/features/permission/permit";
import { useUpdateUserMutation } from "../../redux/features/users/userApiSlice";
import { RoleAssignment } from "@/redux/features/management/managementTypes";
import { useGetUserCompaniesQuery } from "@/redux/features/auth/authApiSlice";

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
  const { data: companyMemberships } = useGetUserCompaniesQuery();
  const {
    data: pendingInvitations,
    isLoading: invitationsLoading,
    refetch: refetchInvitations,
  } = useGetPendingInvitationsQuery();

  const [inviteStaff, { isLoading: singleInviteLoading }] = useCreateStaffUserMutation();
  const [inviteStaffBulk, { isLoading: bulkInviteLoading }] = useInviteStaffBulkMutation();
  const [removeMember, { isLoading: removeMemberLoading }] = useRemoveCompanyMemberMutation();
  const [resendInvitation, { isLoading: resendInvitationLoading }] = useResendInvitationMutation();
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
    resendInvitationLoading ||
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
    const activeOwnerId =
      companyMemberships?.profiles?.find((profile) => `${profile.id}` === `${activeProfileId}`)?.owner_id ?? null;

    const activeRows: StaffRow[] = (members || [])
      .filter((member) => {
        const memberUserId = member.user?.id != null ? `${member.user.id}` : null;
        if (member.membership_role === "owner") {
          return false;
        }
        if (activeOwnerId && memberUserId === `${activeOwnerId}`) {
          return false;
        }
        return true;
      })
      .map((member) => {
        const rawMember = member as typeof member & {
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
          assigned_at?: string;
          assigned_by?: { id?: number | string } | number | string | null;
          profile?: string;
        };
        const assignedBy =
          typeof rawMember.assigned_by === "object" && rawMember.assigned_by !== null
            ? rawMember.assigned_by.id
            : rawMember.assigned_by;
        const roleAssignment: RoleAssignment[] = member.role?.id
          ? [
              {
                id: Number(member.id),
                user: `${member.user?.id ?? ""}`,
                role_name: member.role.name ?? "Assigned role",
                role: `${member.role.id}`,
                start_date: rawMember.start_date ?? rawMember.assigned_at ?? new Date().toISOString(),
                end_date: rawMember.end_date ?? "",
                is_active: rawMember.is_active ?? true,
                assigned_by: Number(assignedBy ?? 0),
                assigned_at: rawMember.assigned_at ?? new Date().toISOString(),
                profile: rawMember.profile ?? activeProfileId,
              },
            ]
          : [];

        return {
          id: Number(member.user?.id ?? member.id),
          first_name: member.user?.first_name ?? "",
          last_name: member.user?.last_name ?? "",
          email: member.user?.email ?? "",
          phone: member.user?.phone ?? null,
          is_verified: true,
          is_staff: false,
          date_joined: new Date().toISOString(),
          password: "",
          roles: roleAssignment,
          rowType: "member",
          inviteStatus: "active",
        };
      });

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
  }, [activeProfileId, companyMemberships?.profiles, members, pendingInvitations]);
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

  const handleResendInvite = async (row: StaffRow) => {
    if (row.rowType !== "invitation") {
      return;
    }
    if (!row.invitationId) {
      toast.error("Invitation id is missing.");
      return;
    }

    await resendInvitation(row.invitationId).unwrap();
    toast.success(`Invitation resent to ${row.email}.`);
    await refetchInvitations();
  };

  const handleUpdate = async (createdData: Partial<UserData>) => {
    const updateData = await updateUser({ id: userId, data: createdData }).unwrap();
    setUserDetail((previous) => (previous ? { ...previous, ...updateData } : undefined));
    await refetchMembers();
  };

  const actionButtons: ActionButton<StaffRow>[] = [
    {
      label: "Resend",
      icon: RotateCcw,
      variant: "secondary",
      hidden: (row) => row.rowType !== "invitation",
      onClick: async (row) => {
        try {
          await handleResendInvite(row);
        } catch (error: any) {
          const message = error?.data?.detail || error?.data?.error || "Unable to resend invitation.";
          toast.error(message);
        }
      },
    },
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
        searchableFields={["first_name", "last_name", "email", "phone", "inviteStatus"]}
        filterableFields={["rowType", "inviteStatus", "is_verified"]}
        sortableFields={["first_name", "last_name", "email", "phone", "inviteStatus"]}
        title="Staff"
        onClose={() => {
          setIsInviteOpen(true);
        }}
      />

      <div className={`fixed inset-0 z-50 items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm ${isInviteOpen ? "flex" : "hidden"}`}>
        <div className="w-full max-w-3xl overflow-hidden rounded-[30px] border border-slate-200 bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] shadow-[0_36px_90px_rgba(15,23,42,0.28)] dark:border-slate-800 dark:bg-[linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)]">
          <div className="relative border-b border-slate-200 bg-white/85 px-6 py-5 backdrop-blur dark:border-slate-800 dark:bg-slate-950/72">
            <div className="mb-3 inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-blue-700 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-200">
              Team workspace
            </div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">Invite Staff Members</h3>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Add people one by one or upload a CSV of email addresses. Invitations stay inside the active workspace.
                </p>
              </div>
            </div>
            <button
              type="button"
              className="absolute right-6 top-6 rounded-full border border-white/70 bg-white/85 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-800 dark:border-slate-700 dark:bg-slate-950/85 dark:text-slate-300 dark:hover:bg-slate-900 dark:hover:text-white"
              onClick={() => setIsInviteOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          <div className="grid gap-4 p-6 md:grid-cols-2">
            <form onSubmit={handleSingleInvite} className="rounded-[26px] border border-slate-200 bg-white/88 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-950/72">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <UserPlus size={16} />
                Invite by email
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Send an invitation immediately to one staff member.
              </p>
              <div className="flex flex-col gap-3">
                <Input
                  type="email"
                  value={inviteEmail}
                  onChange={(event) => setInviteEmail(event.target.value)}
                  placeholder="staff@company.com"
                  className="rounded-2xl border-slate-200 bg-slate-50 shadow-none dark:border-slate-700 dark:bg-slate-900"
                />
                <Button
                  type="submit"
                  disabled={singleInviteLoading}
                  className="rounded-2xl"
                >
                  {singleInviteLoading ? "Sending..." : "Send Invite"}
                </Button>
              </div>
            </form>

            <form onSubmit={handleBulkInvite} className="rounded-[26px] border border-slate-200 bg-white/88 p-5 shadow-[0_18px_40px_-30px_rgba(15,23,42,0.4)] dark:border-slate-800 dark:bg-slate-950/72">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                <UploadCloud size={16} />
                Invite by CSV (emails only)
              </div>
              <p className="mb-4 text-sm leading-6 text-slate-500 dark:text-slate-400">
                Upload a CSV when onboarding several staff members at once. One email address per row works best.
              </p>
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,text/csv"
                  onChange={(event) => setBulkFile(event.target.files?.[0] || null)}
                  className="w-full rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-3 py-3 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                />
                <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-500 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-400">
                  Sample format:
                  <span className="mt-1 block font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    jane@company.com
                    <br />
                    john@company.com
                  </span>
                </div>
                <Button
                  type="submit"
                  disabled={bulkInviteLoading || !bulkFile}
                  variant="secondary"
                  className="rounded-2xl"
                >
                  {bulkInviteLoading ? "Uploading..." : "Upload & Invite"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {openTabs ? (
        <VerticalTabs
          items={[
            {
              id: "access-summary",
              label: "Access Summary",
              content: (
                <StaffAccessSummary
                  userId={userId}
                  user={userDetail}
                  permissionsData={permissionsData}
                  permissionLoading={permissionDataLoading}
                />
              ),
            },
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
      ) : null}
    </div>
  );
};

export default StaffCreateCard;
