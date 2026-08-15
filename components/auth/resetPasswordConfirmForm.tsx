'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';
import { Loader2, LockKeyhole } from 'lucide-react';

import { useResetPasswordConfirmMutation } from '@/redux/features/auth/authApiSlice';

type ResetPasswordConfirmFormProps = {
  token: string;
  uid: string;
};

type ResetPasswordConfirmFormData = {
  password: string;
  confirmPassword: string;
};

export default function ResetPasswordConfirmForm({ token, uid }: ResetPasswordConfirmFormProps) {
  const router = useRouter();
  const [resetPasswordConfirm, { isLoading, isSuccess }] = useResetPasswordConfirmMutation();
  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<ResetPasswordConfirmFormData>();

  const onSubmit: SubmitHandler<ResetPasswordConfirmFormData> = async (data) => {
    try {
      await resetPasswordConfirm({
        uid,
        token,
        new_password: data.password,
        re_new_password: data.confirmPassword,
      }).unwrap();
      toast.success('Password reset successful. You can now sign in.');
      router.push('/accounts/signin');
    } catch (error: any) {
      const detail =
        error?.data?.detail ||
        error?.data?.token?.[0] ||
        error?.data?.uid?.[0] ||
        error?.data?.new_password?.[0] ||
        error?.data?.non_field_errors?.[0] ||
        'Unable to reset password.';
      toast.error(detail);
    }
  };

  return (
    <div className="max-w-md w-full space-y-6 mx-auto">
      <div className="rounded-2xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-slate-600 dark:border-blue-400/15 dark:bg-blue-400/10 dark:text-slate-300">
        Choose a strong new password to keep your account protected.
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="new-password" className="auth-label cursor-pointer">New password</label>
          <div className="relative mt-1.5"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input
            {...register('password', { required: 'New password is required' })}
            type="password"
            id="new-password"
            placeholder="Enter a new password"
            className="auth-field pl-10"
          /></div>
          {errors.password ? <p className="auth-error">{errors.password.message}</p> : null}
        </div>

        <div>
          <label htmlFor="confirm-new-password" className="auth-label cursor-pointer">Confirm new password</label>
          <div className="relative mt-1.5"><LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" /><input
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) => value === getValues('password') || 'Passwords do not match',
            })}
            type="password"
            id="confirm-new-password"
            placeholder="Re-enter your new password"
            className="auth-field pl-10"
          /></div>
          {errors.confirmPassword ? <p className="auth-error">{errors.confirmPassword.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="auth-button"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Updating password...</> : 'Reset password'}
        </button>
      </form>

      <div className="flex justify-center gap-1 text-sm">
        <span className="text-slate-600 dark:text-slate-300">Need to sign in instead?</span>
        <Link href="/accounts/signin" className="auth-link">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
