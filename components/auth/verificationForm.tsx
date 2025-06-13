'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useVerifyAccountMutation, useGetverifyAccountMutation } from '../../redux/features/authApiSlice';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
// import  { useRouter } from 'next/navigation';
import { useLoginMutation, useResendCodeMutation,
  useVerifyCodeMutation,  } from '../../redux/features/authApiSlice';
import { VerificationProps, VerifyFormData } from '../types/authForms';
import { VerificationError, ErrorResponse, ResendError } from '../types/authResponse';
import { useRouter } from 'nextjs-toploader/app'
export default function VerificationForm({ userId,redirectTo }: VerificationProps) {
  const [verify, { isLoading, error }] = useVerifyAccountMutation();
  const [resendCode, { isLoading: isResending }] = useGetverifyAccountMutation();
  const [cooldown, setCooldown] = useState(120);
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const router=useRouter();
  const { register, handleSubmit, setValue, watch } = useForm<VerifyFormData>({
    defaultValues: { userId, code: '' }
  });

  const codeValue = watch('code', '');
// email: verifiedEmail,
//         code: data.code,
//         action: 'verify_code'
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);
  const handleResend = async () => {
    if (cooldown > 0) return;
    
    try {
      await resendCode({ id: userId, }).unwrap();
      setCooldown(120);
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

  const handleCodeChange = (index: number, value: string) => {
    // Allow only numbers and limit to 1 character
    const numericValue = value.replace(/\D/g, '').slice(0, 1);
    
    // Update code value
    const newCode = codeValue.split('');
    newCode[index] = numericValue;
    const joinedCode = newCode.join('').slice(0, 6);
    setValue('code', joinedCode);

    // Auto-focus logic
    if (numericValue && index < 5) {
      inputsRef.current[index + 1]?.focus();
    } else if (!numericValue && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text/plain').replace(/\D/g, '').slice(0, 6);
    setValue('code', pastedData);
  };

  const onSubmit: SubmitHandler<VerifyFormData> = async (data) => {
    try {
      const response = await verify(data).unwrap();
      toast.success("Verification successful!");
      router.push(redirectTo);

    } catch (error) {
      const apiError = error as ErrorResponse;
      
      // Handle different error scenarios
      if (apiError.status === 400) {
        if (apiError.data?.error === "Invalid verification code") {
          toast.error("Invalid verification code. Please try again.");
        } else if (apiError.data?.error === "Both user ID and code are required") {
          toast.error("Missing required fields. Please try again.");
        }
      } else if (apiError.status === 404) {
        if (apiError.data?.error === "User not found") {
          toast.error("Account not found. Please register first.");
        } else if (apiError.data?.error === "Verification code not found") {
          toast.error("Verification expired. Please request a new code.");
        }
      } else {
        toast.error("An unexpected error occurred. Please try again.");
      }
      
    }
  };
  return (
    <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Verify Your Email</h2>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onPaste={handlePaste}>
        <input type="hidden" {...register('userId')} />
        <input type="hidden" {...register('code')} />
        
        <div className="flex justify-center space-x-2 mb-8">
          {[...Array(6)].map((_, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={codeValue[index] || ''}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              ref={(el) => { if (el) inputsRef.current[index] = el; }}
              className="w-12 h-12 bg-gray-50 text-center text-xl border-2 border-gray-300 rounded-lg focus:border-blue-500 outline-none"
              autoFocus={index === 0 && !codeValue.length}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
        >
          {isLoading ? 'Verifying...' : 'Verify Account'}
        </button>

        {error && (
          <div className="mt-4 text-red-600 text-center">
            {'data' in error ? (error.data as { detail?: string }).detail : 'Verification failed'}
          </div>
        )}

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="text-blue-600 hover:text-blue-800 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
          </button>
        </div>
      </form>
    </div>
  );
}