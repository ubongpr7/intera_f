'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRegisterMutation } from '../../redux/features/auth/authApiSlice';
// import { useRouter } from "next/navigation";
import { toast } from "react-toastify"
import { useState, useMemo } from 'react';
import Link from "next/link";
import { ErrorResponse, RegisterResponse } from '../types/authResponse';
import { RegisterFormInputs } from '../types/authForms';
import { useRouter } from 'nextjs-toploader/app'
import { useSearchParams } from 'next/navigation';
import { Eye, EyeOff } from 'lucide-react';
import { continueWithSocialAuth } from '@/lib/socialAuth';

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = useMemo(() => {
    if (password.length === 0) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  }, [password]);

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    
    <div className="mt-2">
      <div className="h-2 bg-gray-200 rounded-full">
        <div 
          className={`h-2 rounded-full transition-all ${getStrengthColor()}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
      <p className="text-sm text-gray-500 mt-1">
        Password strength: {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength - 1] || ''}
      </p>
    </div>
  );
};

export default function RegisterForm() {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next')?.trim();
  const [password, setPassword] = useState('');
  const [showPassWord,setShowPassword]=useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm<RegisterFormInputs>();

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (formData) => {
    try {
      const userData = await registerUser({
        ...formData,
        last_name: formData.last_name ?? "",
      }).unwrap() as RegisterResponse;
      toast.success("Registration successful. Check your email to activate your account.");
      const nextSuffix = nextUrl ? `&next=${encodeURIComponent(nextUrl)}` : "";
      router.push(`/accounts/activation-sent?email=${encodeURIComponent(userData.email)}${nextSuffix}`);
    } catch (error) {
      const apiError = error as ErrorResponse;
      const errorMessage = apiError.data?.detail || "Registration failed";
      toast.error(errorMessage);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsSocialLoading(true);
      await continueWithSocialAuth("google");
    } catch (error: any) {
      toast.error(error?.message || "Unable to start Google sign-up.");
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6 bg-white rounded-lg shadow-md">
      {/* Name Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <input
          {...register('first_name', { 
            required: 'First name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters'
            }
          })}
          placeholder="John Doe"
          className={`mt-1 block w-full rounded-md border border-gray-300 px-3 bg-gray-50  py-2 shadow-sm 
            focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
        />
        {errors.first_name && (
          <p className="mt-1 text-sm text-red-600">
            {errors.first_name.message}
          </p>
        )}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Last Name (Optional)
        </label>
        <input
          {...register('last_name')}
          placeholder="Doe"
          className={`mt-1 block w-full rounded-md border border-gray-300 px-3 bg-gray-50  py-2 shadow-sm 
            focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
        />
      </div>

      {/* Email Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email address'
            }
          })}
          type="email"
          placeholder="john@example.com"
          className={`mt-1 block w-full rounded-md border border-gray-300 px-3 bg-gray-50 py-2 shadow-sm 
            focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div >
      <label className="block text-sm font-medium text-gray-700">
      Password
      </label>
      <div className='relative flex'>
      <input
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 10,
              message: 'Password must be at least 10 characters'
            },
            validate: (value) => 
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(value) ||
              'Password must contain at least one lowercase, uppercase, number, and special character'
          })}
          type={showPassWord?"text":'password'}
          placeholder="••••••••••"
          onChange={(e) => setPassword(e.target.value)}
          className={`mt-1 block w-full rounded-md border border-gray-300 bg-gray-50  px-4 py-2 shadow-sm 
            focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
        />
        <span className='absolute right-2 translate-y-1/2 m-2 text-red-400' onClick={()=>setShowPassword(!showPassWord)}>
        {!showPassWord ?(<Eye  className="w-4 h-4"/>):(<EyeOff className="w-4 h-4 "/>)}
        </span>
        </div>
        <PasswordStrengthIndicator password={password} />
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">
            {errors.password.message}
          </p>
        )}
        {/* Password Requirements 
        <p className="text-sm text-gray-500 mt-2">
          Requirements:
          <ul className="list-disc pl-5 mt-1">
            <li>Minimum 10 characters</li>
            <li>At least one lowercase letter</li>
            <li>At least one uppercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </p>
        */}

      </div>

      {/* Confirm Password Field */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Confirm Password
        </label>
        <input
          {...register('re_password', {
            required: 'Please confirm your password',
            validate: (value) => 
              value === watch('password') || 'Passwords do not match'
          })}
          type={showPassWord?'text':"password"}
          placeholder="••••••••••"
          className={`mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm 
            focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm`}
        />
        {errors.re_password && (
          <p className="mt-1 text-sm text-red-600">
            {errors.re_password.message}
          </p>
        )}
      </div>
      

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isLoading || isSocialLoading}
        className={`w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white 
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 
          disabled:opacity-50`}
      >
        {isLoading ? 'Registering...' : 'Create Account'}
      </button>
      <button
        type="button"
        onClick={() => void handleGoogleAuth()}
        disabled={isLoading || isSocialLoading}
        className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
      >
        {isSocialLoading ? "Redirecting..." : "Continue with Google"}
      </button>
      <div className="flex justify-center gap-1"> 
      <p> Already have an account?</p>
      <Link
        href={nextUrl ? `/accounts/signin?next=${encodeURIComponent(nextUrl)}` : "/accounts/signin"}
        className="text-blue-600 hover:text-blue-800"
      >
        {" "}Sign in
      </Link>
      
      </div>
    </form>
  );
}
