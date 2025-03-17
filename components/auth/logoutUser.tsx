import { useLogoutMutation } from '@/redux/features/authApiSlice';
import { useRouter } from 'nextjs-toploader/app';
import { toast } from 'react-toastify';

function LogoutButton() {
  const [logoutMutation, { isLoading }] = useLogoutMutation();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logoutMutation('').unwrap();
      
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      router.push('/');
      
      toast.success('Logged out successfully');
    } catch (error) {
      toast.error('Logout failed. Please try again.');
    }
  };

  return (
    <button 
      onClick={handleLogout}
      disabled={isLoading}
      className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400"
    >
      {isLoading ? 'Logging out...' : 'Logout'}
    </button>
  );
}

export default LogoutButton;