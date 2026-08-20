'use client'
import { useEffect, useState } from 'react';
import Navbar from './navbar'
import SideBar from './sideBar'
import { useAppSelector } from "../../redux/store";
import { usePathname } from 'next/navigation';
import { ToastContainer } from "react-toastify";
import { useGetLoggedInUserQuery } from '../../redux/features/users/userApiSlice';
import { useGetCompanyAgentSetupQuery } from '../../redux/features/management/companyProfileApiSlice';
import { publicRoutes } from '../../redux/features/users/useAuth';

import { getCookie } from 'cookies-next';
import A2AChat from '../agents/ai-chat-widget';
import { readCookieValue } from '@/lib/authCookies';

const DashboardHeader = ({children}:{children:  React.ReactNode}) => {

  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);
  const accessToken = readCookieValue("accessToken", getCookie);

  const { data: user } = useGetLoggedInUserQuery(undefined, {
    skip: isPublic,
    refetchOnMountOrArgChange: true,
  });

  const { data: companyAgentSetup } = useGetCompanyAgentSetupQuery(undefined, {
    skip: isPublic || !accessToken,
    refetchOnMountOrArgChange: true,
  });
  
  

  const shouldHideDashboardUI = (path: string) => {
    return path.startsWith('/accounts') || path === '/';
  };

  const hasCompleteWorkspaceAiSetup = Boolean(
    companyAgentSetup?.configured &&
    companyAgentSetup?.agent?.has_api_key &&
    companyAgentSetup?.agent?.has_tavily_api_key
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
    
    <ToastContainer position="top-right" autoClose={3000} />
    
    {!shouldHideDashboardUI(pathname) ? (
      <>
        <SideBar
          user={user}
          mobileOpen={mobileSidebarOpen}
          onMobileClose={() => setMobileSidebarOpen(false)}
        />
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
        shouldHideDashboardUI(pathname)
          ? ""
          : SidebarCollapsed
            ? "md:ml-16 md:w-[calc(100%-4rem)] md:flex-none md:px-4"
            : "md:ml-64 md:w-[calc(100%-16rem)] md:flex-none md:px-5"
      }`}
    >
    
    {!shouldHideDashboardUI(pathname) && (
      <Navbar
        user={user}
        onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
        sidebarCollapsed={SidebarCollapsed}
      />
    )}
    
    {children}
    
     {shouldShowLegacyAgentWidget && (<A2AChat/>)}
    
    </main>
    </div>
  )
}
export default DashboardHeader
