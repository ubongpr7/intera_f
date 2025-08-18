'use client';

import { useState, useEffect } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useLoginMutation, useResendCodeMutation,
	useVerifyCodeMutation,  } from '../../redux/features/authApiSlice';
import { toast } from "react-toastify";
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginErrorResponse, LoginResponse } from '../types/authResponse';
import { LoginFormData } from '../types/authForms';
import { setCookie } from 'cookies-next';
import {Eye, EyeOff,} from 'lucide-react'

interface VerificationFormData {
  code: string;
}

export default function LoginForm() {
  const [currentStep, setCurrentStep] = useState<"EMAIL" | "VERIFICATION" | "PASSWORD">("EMAIL");
  const [verifiedEmail, setVerifiedEmail] = useState<string>("");
  const router = useRouter();
  const [showPassWord,setShowPassword]=useState(false)

  // API mutations
  const [login, { isLoading }] = useLoginMutation();
  const [resendCode, { isLoading: isResending }] = useResendCodeMutation();
  const [verifyCode, { isLoading: isVerifying }] = useVerifyCodeMutation();

  // Form handlers
  const emailForm = useForm<LoginFormData>();
  const verificationForm = useForm<VerificationFormData>();
  const passwordForm = useForm<{ password: string }>();

  // Step 1: Handle email submission and send verification code
  const handleEmailSubmit: SubmitHandler<LoginFormData> = async (data) => {
    try {
      await resendCode({ email: data.email,action:'send_code' }).unwrap();
      setVerifiedEmail(data.email);
      setCurrentStep("VERIFICATION");
      toast.success("Verification code sent. Check your email.");
    } catch (err) {
      const error = err as LoginErrorResponse;
      const errorMessage = error.data?.detail || "Failed to send verification code.";
      toast.error(errorMessage);
    }
  };

  const handleVerificationSubmit: SubmitHandler<VerificationFormData> = async (data) => {
    try {
      const userData = await verifyCode({
        email: verifiedEmail,
        code: data.code,
        action: 'verify_code' 
      }).unwrap();
        setCurrentStep("PASSWORD");
        toast.success("Email verified. Please enter your password to continue.");
    } catch (err) {
      const error = err as LoginErrorResponse;
      const errorMessage = error.data?.detail || "Verification failed.";
      toast.error(errorMessage);
    }
  };

  const handlePasswordSubmit: SubmitHandler<{ password: string }> = async (data) => {
    try {
      const userData = await login({
        email: verifiedEmail,
        password: data.password,
      }).unwrap();
      toast.success("Login successful. Welcome back!");
      router.push("/dashboard");
    } catch (err) {
      const error = err as LoginErrorResponse;
      const errorMessage = error.data?.detail || "Login failed.";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 mx-auto">
      <div className="text-center">
        <p className="mt-2 text-[14px]">
          {currentStep === "EMAIL" && "Enter your email to begin"}
          {currentStep === "VERIFICATION" && "Enter the verification code sent to your email"}
          {currentStep === "PASSWORD" && "Enter your password to complete login"}
        </p>
      </div>

      {/* Step 1: Email Form */}
      {currentStep === "EMAIL" && (
        <form onSubmit={emailForm.handleSubmit(handleEmailSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input
              {...emailForm.register('email', { required: 'Email is required' })}
              type="email"
              placeholder="Email"
              className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            {emailForm.formState.errors.email && <p className="mt-1 text-sm text-red-600">{emailForm.formState.errors.email.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isResending}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isResending ? 'Sending...' : 'Send Verification Code'}
          </button>
        </form>
      )}

      {/* Step 2: Verification Form */}
      {currentStep === "VERIFICATION" && (
        <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Verification Code</label>
            <input
              {...verificationForm.register('code', { required: 'Code is required', pattern: { value: /^\d{6}$/, message: "Must be 6 digits" } })}
              type="text"
              placeholder="123456"
              className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />

            {verificationForm.formState.errors.code && <p className="mt-1 text-sm text-red-600">{verificationForm.formState.errors.code.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isVerifying}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isVerifying ? 'Verifying...' : 'Verify Code'}
          </button>
        </form>
      )}

      {/* Step 3: Password Form */}
      {currentStep === "PASSWORD" && (
        <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
            <input
              {...passwordForm.register('password', { required: 'Password is required' })}
              type={showPassWord?"text":"password"}
              placeholder='Password'
              className="mt-1 block w-full bg-gray-50 rounded-md border border-gray-300 px-4 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
            />
            <span className='absolute  right-2 translate-y-1/2  top-0.5 text-red-400' onClick={()=>setShowPassword(!showPassWord)}>
            {!showPassWord ?(<Eye  className="w-4 h-4"/>):(<EyeOff className="w-4 h-4 "/>)}
            </span>
            </div>
            {passwordForm.formState.errors.password && <p className="mt-1 text-sm text-red-600">{passwordForm.formState.errors.password.message}</p>}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      )}

      <div className="flex justify-center gap-1"> 
        <p>No Account Yet?</p>
        <Link href="/accounts" className="text-blue-600 hover:text-blue-800">Register Here</Link>
      </div>
    </div>
  );
}
