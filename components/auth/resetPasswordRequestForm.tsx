'use client';

import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Loader2, Mail } from 'lucide-react';

import { useResetPasswordMutation } from '@/redux/features/auth/authApiSlice';

type ResetPasswordRequestFormData = {
  email: string;
};

export default function ResetPasswordRequestForm() {
  const [resetPassword, { isLoading, isSuccess }] = useResetPasswordMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordRequestFormData>();

  const onSubmit: SubmitHandler<ResetPasswordRequestFormData> = async (data) => {
    try {
      await resetPassword({ email: data.email.trim() }).unwrap();
      toast.success('Password reset email sent. Check your inbox.');
    } catch (error: any) {
      const detail =
        error?.data?.detail ||
        error?.data?.email?.[0] ||
        error?.data?.non_field_errors?.[0] ||
        'Unable to send password reset email.';
      toast.error(detail);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 mx-auto">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm leading-6 text-slate-600 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-slate-300">
        Enter the email address tied to your account. We’ll send a secure password reset link.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="reset-email" className="auth-label cursor-pointer">Email address</label>
          <div className="relative mt-1.5"><Mail aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input
            {...register('email', { required: 'Email is required' })}
            type="email"
            id="reset-email"
            placeholder="name@company.com"
            className="auth-field pl-10"
          /></div>
          {errors.email ? <p className="auth-error">{errors.email.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="auth-button"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Sending reset link...</> : 'Send reset link'}
        </button>
      </form>

      {isSuccess ? (
        <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:border-emerald-400/20 dark:bg-emerald-400/10 dark:text-emerald-200">
          If the email exists in the system, a reset link has been sent.
        </div>
      ) : null}

      <div className="flex justify-center gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Remembered your password?</span>
        <Link href="/accounts/signin" className="auth-link">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
