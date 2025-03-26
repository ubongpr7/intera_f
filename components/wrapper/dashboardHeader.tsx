'use client'
import Navbar from './navbar'
import SideBar from './sideBar'
import { useAppSelector, useAppDispatch } from "../../redux/store";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from "react-toastify"
import { ToastContainer } from "react-toastify";
import { useGetLoggedInUserQuery } from '../../redux/features/users/userApiSlice';
import { AuthGuard } from '../users/AuthGuard';
import { publicRoutes } from '../../redux/features/users/useAuth';
import NextTopLoader from 'nextjs-toploader';

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
    return path.startsWith('/accounts')|| path ==='/profile' || path === '/';
  };
  useEffect(()=>{
    if (isDarkMode){
      document.documentElement.classList.add('dark')
    }else{  
      document.documentElement.classList.add('light')
    }
  })
  
  return (
    <div className={`${ isDarkMode ?'dark':'light'}  flex bg-gray-50 text-gray-900 w-full min-h-screen`}>
    
    <AuthGuard>
    <ToastContainer position="top-right" autoClose={3000} />
    {!shouldHideDashboardUI(pathname) && <SideBar user={user} />}
    <main className={`flex flex-col w-full h-full py-7 px-9 bg-gray-50 ${SidebarCollapsed ? "md:pl-24": "md:pl-12"}`}>
    
    {!shouldHideDashboardUI(pathname) &&  <Navbar user={user} />}
    
    {children}
    </main>
    </AuthGuard>
    </div>
  )
}
export default DashboardHeader