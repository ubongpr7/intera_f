'use client'
import Navbar from './navbar'
import SideBar from './sideBar'
import { useAppSelector } from "../../redux/store";
import { usePathname } from 'next/navigation';
import { ToastContainer } from "react-toastify";
import { useGetLoggedInUserQuery } from '../../redux/features/users/userApiSlice';
import { publicRoutes } from '../../redux/features/users/useAuth';

import { getCookie } from 'cookies-next';
import A2AChat from '../agents/ai-chat-widget';
import { readCookieValue } from '@/lib/authCookies';

const DashboardHeader = ({children}:{children:  React.ReactNode}) => {

  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);

  const { data: user } = useGetLoggedInUserQuery(undefined, {
    skip: isPublic,
    refetchOnMountOrArgChange: true,
  });
  
  

  const shouldHideDashboardUI = (path: string) => {
    return path.startsWith('/accounts') || path === '/';
  };

  const shouldShowLegacyAgentWidget = pathname !== "/agent" && Boolean(readCookieValue("accessToken", getCookie));
  
  return (
    <div className={`flex bg-gray-50 text-gray-900 w-full min-h-screen`}>
    
    <ToastContainer position="top-right" autoClose={3000} />
    
    {!shouldHideDashboardUI(pathname) && <SideBar user={user} />}
    <main
      className={`flex min-h-screen flex-1 flex-col bg-gray-50 px-3 py-4 transition-[margin] duration-300 ${
        shouldHideDashboardUI(pathname)
          ? ""
          : SidebarCollapsed
            ? "md:ml-16 md:px-4"
            : "md:ml-64 md:px-5"
      }`}
    >
    
    {!shouldHideDashboardUI(pathname) &&  <Navbar user={user} />}
    
    {children}
    
     {shouldShowLegacyAgentWidget && (<A2AChat/>)}
    
    </main>
    </div>
  )
}
export default DashboardHeader
