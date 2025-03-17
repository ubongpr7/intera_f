import { useAuth } from "@/redux/features/users/useAuth";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
    
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
  
    return <>{children}</>;
  };