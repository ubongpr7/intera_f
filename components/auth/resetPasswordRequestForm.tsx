'use client';

import Link from 'next/link';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';

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
      <div className="text-center">
        <p className="mt-2 text-[14px] text-gray-600">
          Enter the email address tied to your account and we will send you a password reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <input
            {...register('email', { required: 'Email is required' })}
            type="email"
            placeholder="Email"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          {errors.email ? <p className="mt-1 text-sm text-red-600">{errors.email.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Sending reset link...' : 'Send reset link'}
        </button>
      </form>

      {isSuccess ? (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          If the email exists in the system, a reset link has been sent.
        </div>
      ) : null}

      <div className="flex justify-center gap-1 text-sm">
        <span>Remembered your password?</span>
        <Link href="/accounts/signin" className="text-blue-600 hover:text-blue-800">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
