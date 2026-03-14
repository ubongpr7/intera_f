'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useLoginMutation } from '../../redux/features/authApiSlice';
import { toast } from "react-toastify";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginErrorResponse } from '../types/authResponse';
import { LoginFormData } from '../types/authForms';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { initializeMfaChallenge } from '@/lib/mfaFlow';
import { continueWithSocialAuth } from '@/lib/socialAuth';

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  const [showPassWord, setShowPassword] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>();

  const onSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      const authResponse = await login({
        email: data.email,
        password: data.password,
        company_code: data.company_code?.trim() || undefined,
      }).unwrap();

      const nextPath = nextUrl || "/dashboard";
      const mfaRoute = initializeMfaChallenge(nextPath, authResponse?.access);
      toast.success("Login successful. MFA verification required.");
      router.push(mfaRoute);
    } catch (err) {
      const error = err as LoginErrorResponse;
      const errorMessage =
        error.data?.detail ||
        error.data?.non_field_errors?.[0] ||
        "Login failed.";
      toast.error(errorMessage);
    }
  };

  const handleGoogleAuth = async () => {
    try {
      setIsSocialLoading(true);
      await continueWithSocialAuth("google");
    } catch (error: any) {
      toast.error(error?.message || "Unable to start Google sign-in.");
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 mx-auto">
      <div className="text-center">
        <p className="mt-2 text-[14px]">Sign in with your email and password.</p>
      </div>

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
          <div className="relative">
            <input
              {...register('password', { required: 'Password is required' })}
              type={showPassWord ? "text" : "password"}
              placeholder='Password'
              className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            <button
              type="button"
              className='absolute right-2 translate-y-1/2 top-0.5 text-red-400'
              onClick={() => setShowPassword(!showPassWord)}
            >
              {!showPassWord ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Company Code (Optional)</label>
          <input
            {...register('company_code')}
            type="text"
            placeholder="e.g. X8B2F9K1P4Q7"
            className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || isSocialLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <button
          type="button"
          onClick={() => void handleGoogleAuth()}
          disabled={isLoading || isSocialLoading}
          className="w-full rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 disabled:opacity-50"
        >
          {isSocialLoading ? "Redirecting..." : "Continue with Google"}
        </button>
      </form>

      <div className="flex justify-center gap-1">
        <p>No Account Yet?</p>
        <Link href="/accounts" className="text-blue-600 hover:text-blue-800">Register Here</Link>
      </div>
    </div>
  );
}
