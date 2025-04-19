import { User } from "lucide-react";
import { useAuth } from "../../redux/features/users/useAuth";
import { useRouter } from "next/router";
import { useEffect } from "react";
export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    const router=useRouter()
    const { isLoading, isAuthenticated, isPublic } = useAuth();
  
    if (isLoading) {
      return (
        <div className="min-h-screen flex items-center justify-center">
        </div>
      );
    }
    
    if (!isPublic && !isAuthenticated) {
      return null; // Redirect already handled in useAuth
    }
    useEffect(() => {
      if (!isLoading && isPublic && isAuthenticated) {
          router.push('/dashboard');
      }
  }, [isLoading, isPublic, isAuthenticated, router]);

    return <>{children}</>;
  };