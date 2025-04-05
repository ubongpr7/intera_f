'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useLoginMutation } from '../../redux/features/authApiSlice';
import { toast } from "react-toastify"
// import { useRouter, useSearchParams } from "next/navigation";
import Link from 'next/link';
import { useRouter } from 'nextjs-toploader/app'
import { LoginErrorResponse, LoginResponse } from '../types/authResponse';
import { LoginFormData } from '../types/authForms';
import { setCookie } from 'cookies-next';
import { VerificationError, ErrorResponse, ResendError } from '../types/authResponse';
import { useVerifyAccountMutation, useGetverifyAccountMutation } from '../../redux/features/authApiSlice';

export default function LoginForm() {
  const [login, { isLoading, error }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();
  const router = useRouter();
  const [resendCode, { isLoading: isResending }] = useGetverifyAccountMutation();
 
  const handleResend = async (userId: string) => {
  
    try {
      await resendCode({ id: userId }).unwrap();
      toast.success("Verification code resent successfully");
    } catch (error) {
      const apiError = error as ResendError;
  
      // Handle different error scenarios
      if (apiError.status === 400) {
        if (apiError.data?.error === "Maximum attempts reached") {
          toast.error("Too many attempts. Please contact support.");
        } else if (apiError.data?.error === "User ID required") {
          toast.error("Session expired. Please register again.");
        }
      } else if (apiError.status === 404) {
        if (apiError.data?.error === "User not found") {
          toast.error("Account not found. Please register first.");
        } else if (apiError.data?.error === "Verification code not found") {
          toast.error("Verification expired. Please register again.");
        }
      } else if (apiError.status === 500) {
        toast.error("Server error. Please try again later.");
      } else {
        toast.error("Failed to resend code. Check your connection.");
      }
    }
  };
  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      const userData = await login(data).unwrap() as LoginResponse;
      setCookie('userID',userData.id)
      
        if (userData.profile === null) {
          router.push("/profile/create");
          
        }else{
        handleResend(userData.id);
          router.push("/accounts/signin/verify");
        
      }
    } catch (err) {
      const error = err as LoginErrorResponse;
      
      if (error.status === 400) {
        const errorMessage = error.data?.non_field_errors?.[0] || 
                           error.data?.detail || 
                           "Invalid email or password";
        toast.error(errorMessage);
      } else if (error.status === 401) {
        toast.error("Unauthorized - Please check your credentials");
      } else if (error.status === 500) {
        toast.error("Server error - Please try again later");
      } else {
        toast.error("Login failed - Please check your network connection");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Email</label>
        <input
          {...register('email', { required: 'Email is required' })}
          type="email"
          placeholder="Email"
          className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700">Password</label>
        <input
          {...register('password', { required: 'Password is required' })}
          type="password"
          placeholder='Password'
          className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
        />
        {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
      </div>
      <div className="flex mt-2  justify-between">
      <Link href="/accounts" className="text-blue-600 hover:text-blue-800"> Forgot Password?</Link>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
      >
        {isLoading ? 'Signing in...' : 'Sign in'}
      </button>

      {error && (
        <div className="mt-2 text-sm text-red-600">
          {'data' in error ? (error.data as { detail?: string }).detail : 'An error occurred'}
        </div>
      )}
      <div className="flex justify-center gap-1"> 
      <p> No Account Yet?</p>
       <Link href="/accounts" className="text-blue-600 hover:text-blue-800"> Register Here</Link>
      
      </div>
    </form>
  );
}