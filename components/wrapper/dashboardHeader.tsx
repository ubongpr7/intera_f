'use client'
import Navbar from './navbar'
import SideBar from './sideBar'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from "react-toastify"
import { ToastContainer } from "react-toastify";
import { useGetLoggedInUserQuery } from '../../redux/features/users/userApiSlice';
import { publicRoutes } from '../../redux/features/users/useAuth';
import NextTopLoader from 'nextjs-toploader';
import { useRefreshMutation } from '@/redux/features/authApiSlice';

import { getCookie } from 'cookies-next';
import A2AChat from '../agents/ai-chat-widget';

const DashboardHeader = ({children}:{children:  React.ReactNode}) => {

  const SidebarCollapsed = useAppSelector((state) => state.global.isSidebarCollapsed);
  const isDarkMode = useAppSelector((state) => state.global.isDarkMode);
  const dispatch = useAppDispatch();
  const pathname = usePathname();
  const isPublic = publicRoutes.includes(pathname);

  const { data: user, isLoading, isSuccess } = useGetLoggedInUserQuery(undefined, {
    skip: isPublic,
    refetchOnMountOrArgChange: true,
  });
  
  

  const shouldHideDashboardUI = (path: string) => {
    return path.startsWith('/accounts')|| path ==='/profile' || path === '/'|| path==='/features';
  };
  
  return (
    <div className={`flex bg-gray-50 text-gray-900 w-full min-h-screen`}>
    
    <ToastContainer position="top-right" autoClose={3000} />
    
    {!shouldHideDashboardUI(pathname) && <SideBar user={user} />}
    <main className={`flex flex-col w-full h-full py-7 px-2 bg-gray-50 ${((SidebarCollapsed) ? "md:pl-18": "md:pl-1")}`}>
    
    {!shouldHideDashboardUI(pathname) &&  <Navbar user={user} />}
    
    {children}
    {/*
    {getCookie('api_key') &&(
      
    )}
     */}
     {getCookie('api_key') && (<A2AChat/>)}
    
    </main>
    </div>
  )
}
export default DashboardHeader