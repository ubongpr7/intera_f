'use client';

import { useForm, SubmitHandler } from 'react-hook-form';
import { useLoginMutation } from '../../redux/features/auth/authApiSlice';
import { toast } from "react-toastify";
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LoginErrorResponse } from '../types/authResponse';
import { LoginFormData } from '../types/authForms';
import { Eye, EyeOff, Loader2, Mail, LockKeyhole, Building2 } from 'lucide-react';
import { useState } from 'react';
import { initializeMfaChallenge } from '@/lib/mfaFlow';
import { continueWithSocialAuth } from '@/lib/socialAuth';

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" focusable="false"><path fill="#4285F4" d="M21.8 12.23c0-.71-.06-1.23-.2-1.77H12v3.55h5.64c-.11.88-.73 2.2-2.1 3.09l-.02.12 3.05 2.31.21.02c1.93-1.74 3.02-4.29 3.02-7.32Z"/><path fill="#34A853" d="M12 22c2.76 0 5.08-.89 6.77-2.42l-3.23-2.45c-.86.59-2.02 1-3.54 1a6.12 6.12 0 0 1-5.78-4.14l-.12.01-3.17 2.4-.04.11A10.16 10.16 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.22 13.99A6.03 6.03 0 0 1 5.9 12c0-.69.12-1.36.31-1.99v-.13L2.99 7.46l-.1.05A9.78 9.78 0 0 0 1.8 12c0 1.62.39 3.15 1.09 4.49l3.33-2.5Z"/><path fill="#EA4335" d="M12 5.87c1.91 0 3.2.8 3.94 1.47l2.88-2.73C17.08 3.02 14.76 2 12 2a10.16 10.16 0 0 0-9.11 5.51l3.32 2.5A6.12 6.12 0 0 1 12 5.87Z"/></svg>;
}

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next');
  const lockedEmail = searchParams.get('email')?.trim() || "";
  const isEmailLocked = searchParams.get("locked") === "1" && Boolean(lockedEmail);
  const [showPassWord, setShowPassword] = useState(false);
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormData>({
    defaultValues: {
      email: lockedEmail,
    },
  });

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
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-slate-300">
        Sign in with your email and password to access your workspace.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="auth-label cursor-pointer">Email address</label>
          <div className="relative mt-1.5"><Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input
            {...register('email', { required: 'Email is required' })}
            type="email"
            id="login-email"
            placeholder="name@company.com"
            readOnly={isEmailLocked}
            className="auth-field pl-10"
          /></div>
          {isEmailLocked ? (
            <p className="mt-2 text-xs text-slate-500">
              This invitation email already belongs to an account. Sign in with it to continue.
            </p>
          ) : null}
          {errors.email && <p className="auth-error">{errors.email.message}</p>}
        </div>

        <div>
          <label htmlFor="login-password" className="auth-label cursor-pointer">Password</label>
          <div className="relative">
            <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              {...register('password', { required: 'Password is required' })}
              type={showPassWord ? "text" : "password"}
            id="login-password"
            placeholder='Enter your password'
            className="auth-field mt-1.5 pl-10 pr-11"
            />
            <button
              type="button"
              className='absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500'
              onClick={() => setShowPassword(!showPassWord)}
            >
              {!showPassWord ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
          <div className="mt-2 flex justify-end">
            <Link
              href="/accounts/password_reset"
              className="auth-link text-sm"
            >
              Forgot password?
            </Link>
          </div>
          {errors.password && <p className="auth-error">{errors.password.message}</p>}
        </div>

        <div>
          <label htmlFor="login-company-code" className="auth-label cursor-pointer">Company code <span className="font-normal text-slate-400">(optional)</span></label>
          <div className="relative mt-1.5"><Building2 aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input
            {...register('company_code')}
            type="text"
            id="login-company-code"
            placeholder="e.g. X8B2F9K1P4Q7"
            className="auth-field pl-10"
          /></div>
        </div>

        <button
          type="submit"
          disabled={isLoading || isSocialLoading}
          className="auth-button"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Signing in...</> : 'Sign in'}
        </button>

        <button
          type="button"
          onClick={() => void handleGoogleAuth()}
          disabled={isLoading || isSocialLoading}
          className="auth-secondary-button"
        >
          {isSocialLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting...</> : <><GoogleIcon /> Continue with Google</>}
        </button>
      </form>

      <div className="flex justify-center gap-1">
        <p className="text-slate-600 dark:text-slate-300">New to Intera?</p>
        <Link
          href={nextUrl ? `/accounts?next=${encodeURIComponent(nextUrl)}` : "/accounts"}
          className="auth-link"
        >
          Register Here
        </Link>
      </div>
    </div>
  );
}
