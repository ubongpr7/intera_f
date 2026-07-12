'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm, SubmitHandler } from 'react-hook-form';
import { toast } from 'react-toastify';

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
      <div className="text-center">
        <p className="mt-2 text-[14px] text-gray-600">
          Choose a new password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">New password</label>
          <input
            {...register('password', { required: 'New password is required' })}
            type="password"
            placeholder="New password"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          {errors.password ? <p className="mt-1 text-sm text-red-600">{errors.password.message}</p> : null}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Confirm new password</label>
          <input
            {...register('confirmPassword', {
              required: 'Please confirm your new password',
              validate: (value) => value === getValues('password') || 'Passwords do not match',
            })}
            type="password"
            placeholder="Confirm new password"
            className="mt-1 block w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
          />
          {errors.confirmPassword ? <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p> : null}
        </div>

        <button
          type="submit"
          disabled={isLoading || isSuccess}
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
        >
          {isLoading ? 'Resetting password...' : 'Reset password'}
        </button>
      </form>

      <div className="flex justify-center gap-1 text-sm">
        <span>Need to sign in instead?</span>
        <Link href="/accounts/signin" className="text-blue-600 hover:text-blue-800">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
