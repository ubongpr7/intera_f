'use client'
import { useEffect, useState } from 'react';
import Navbar from './navbar'
import SideBar from './sideBar'
import AdminSidebar from './adminSidebar'
import { useAppDispatch, useAppSelector } from "../../redux/store";
import { setIsSidebarCollapsed } from "../../redux/state";
import { usePathname } from 'next/navigation';
import { ToastContainer } from "react-toastify";
import { useGetLoggedInUserQuery } from '../../redux/features/users/userApiSlice';
import { useGetUserCompaniesQuery } from '../../redux/features/auth/authApiSlice';
import { useGetCompanyAgentSetupQuery } from '../../redux/features/management/companyProfileApiSlice';
import { isPublicAuthRoute } from '../../redux/features/users/useAuth';

import { getCookie } from 'cookies-next';
import A2AChat from '../agents/ai-chat-widget';
import { readCookieValue } from '@/lib/authCookies';
import PermissionHydrator from '@/components/auth/PermissionHydrator';
import { useAdminHost } from '@/lib/adminHost';

const DashboardHeader = ({children}:{children:  React.ReactNode}) => {

  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const dispatch = useAppDispatch();
  const permissionState = useAppSelector((state) => ({
    status: state.permission.status,
    profileId: state.permission.profileId,
    isOwner: state.permission.isOwner,
    permissions: state.permission.permissions,
  }));
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const { isAdminHost, isReady: isAdminHostReady } = useAdminHost();
  const pathname = usePathname();
  const isPublic = isPublicAuthRoute(pathname);
  const accessToken = readCookieValue("accessToken", getCookie);

  const { data: user } = useGetLoggedInUserQuery(undefined, {
    skip: isPublic || !isAdminHostReady,
    refetchOnMountOrArgChange: true,
  });
  const {
    data: companyMemberships,
    isLoading: companyMembershipsLoading,
    isFetching: companyMembershipsFetching,
    isError: companyMembershipsError,
  } = useGetUserCompaniesQuery(undefined, {
    skip: isPublic || !isAdminHostReady || isAdminHost || !accessToken,
  });
  const hasWorkspaceProfile = isAdminHost || Boolean(companyMemberships?.profiles?.length);
  const workspaceContextResolved =
    isAdminHost ||
    companyMembershipsError ||
    (Boolean(companyMemberships) && !companyMembershipsLoading && !companyMembershipsFetching);
  const showWorkspaceNavigation =
    isAdminHost || (workspaceContextResolved && hasWorkspaceProfile);
  const activeProfileId = companyMemberships?.active_profile_id ?? null;
  const permissionReady =
    permissionState.status === "succeeded" &&
    permissionState.profileId === `${activeProfileId ?? ""}`;
  const canReadAgent =
    permissionState.isOwner || permissionState.permissions.includes("read_agent");
  const shouldFetchAgentSetup =
    isAdminHostReady &&
    !isPublic &&
    !isAdminHost &&
    Boolean(accessToken) &&
    Boolean(activeProfileId) &&
    permissionReady &&
    canReadAgent;

  const { data: companyAgentSetup } = useGetCompanyAgentSetupQuery(undefined, {
    skip: !shouldFetchAgentSetup,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    pollingInterval: 30000,
  });
  
  

  const shouldHideDashboardUI = (path: string) => {
    return path.startsWith('/accounts') || path === '/';
  };

  const hasCompleteWorkspaceAiSetup = Boolean(
    companyAgentSetup?.configured &&
    companyAgentSetup?.agent?.has_api_key
  );

  const shouldShowLegacyAgentWidget =
    pathname !== "/agent" &&
    Boolean(accessToken) &&
    hasCompleteWorkspaceAiSetup;

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);
  
  return (
    <div className={`dashboard-shell ${SidebarCollapsed ? "sidebar-is-collapsed" : "sidebar-is-expanded"} flex w-full min-h-screen bg-gray-50 text-gray-900`}>
    <PermissionHydrator disabled={isPublic || !isAdminHostReady || isAdminHost} />
    
    <ToastContainer position="top-right" autoClose={3000} />
    
    {isAdminHostReady && showWorkspaceNavigation && !shouldHideDashboardUI(pathname) ? (
      <>
        {isAdminHost ? (
          <AdminSidebar
            user={user}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        ) : (
          <SideBar
            user={user}
            workspace={companyMemberships?.profiles?.find(
              (profile) => `${profile.id}` === `${companyMemberships.active_profile_id}`
            )}
            mobileOpen={mobileSidebarOpen}
            onMobileClose={() => setMobileSidebarOpen(false)}
          />
        )}
        {mobileSidebarOpen ? (
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-950/45 backdrop-blur-[2px] md:hidden"
            onClick={() => setMobileSidebarOpen(false)}
          />
        ) : null}
      </>
    ) : null}
    <main
      className={`dashboard-main flex min-h-screen min-w-0 w-full flex-1 flex-col overflow-x-hidden bg-gray-50 px-3 pb-6 pt-24 transition-[margin,width] duration-300 ${
        shouldHideDashboardUI(pathname) || !showWorkspaceNavigation
          ? ""
          : SidebarCollapsed
            ? "md:ml-16 md:w-[calc(100%-4rem)] md:flex-none md:px-4"
            : "md:ml-64 md:w-[calc(100%-16rem)] md:flex-none md:px-5"
      }`}
    >
    
    {isAdminHostReady && !shouldHideDashboardUI(pathname) && (
      <Navbar
        user={user}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        onToggleDesktopSidebar={() => dispatch(setIsSidebarCollapsed(!SidebarCollapsed))}
        sidebarCollapsed={SidebarCollapsed}
        showWorkspaceNavigation={showWorkspaceNavigation}
        hasWorkspaceProfile={hasWorkspaceProfile}
      />
    )}
    
    {children}
    
     {shouldShowLegacyAgentWidget && (<A2AChat/>)}
    
    </main>
    </div>
  )
}
export default DashboardHeader
