'use client';
import { useForm, SubmitHandler, useWatch } from 'react-hook-form';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';
import { useResendCodeMutation, useVerifyCodeMutation } from '@/redux/features/auth/authApiSlice';
import { VerificationProps, VerifyFormData } from '../types/authForms';
import { ErrorResponse, ResendError } from '../types/authResponse';
import { useRouter } from 'nextjs-toploader/app'
import { Loader2, MailCheck } from 'lucide-react';
export default function VerificationForm({ email,redirectTo }: VerificationProps) {
  const [verifyCode, { isLoading, error }] = useVerifyCodeMutation();
  const [resendCode, { isLoading: isResending }] = useResendCodeMutation();
  const [cooldown, setCooldown] = useState(120);
  const inputsRef = useRef<HTMLInputElement[]>([]);
  const autoSubmitRef = useRef("");
  const router=useRouter();
  const { register, control, handleSubmit, setValue } = useForm<VerifyFormData>({
    defaultValues: { code: '', userId: '' }
  });

  const codeValue = useWatch({ control, name: 'code', defaultValue: '' });
// email: verifiedEmail,
//         code: data.code,
//         action: 'verify_code'
  useEffect(() => {
    const timer = setInterval(() => {
      setCooldown(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const focusTimer = window.setTimeout(() => inputsRef.current[0]?.focus(), 50);
    return () => window.clearTimeout(focusTimer);
  }, []);
  const handleResend = async () => {
    if (cooldown > 0) return;
    
    try {
      await resendCode({ email }).unwrap();
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
    autoSubmitRef.current = '';

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
    autoSubmitRef.current = '';
    inputsRef.current[Math.max(pastedData.length - 1, 0)]?.focus();
  };

  const onSubmit: SubmitHandler<VerifyFormData> = async (data) => {
    try {
      await verifyCode({ email, code: data.code }).unwrap();
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

  useEffect(() => {
    if (codeValue.length !== 6 || isLoading || autoSubmitRef.current === codeValue) {
      return;
    }
    autoSubmitRef.current = codeValue;
    void handleSubmit(onSubmit)();
  }, [codeValue, handleSubmit, isLoading, onSubmit]);
  return (
    <div className="mx-auto max-w-md">
      <div className="mb-6 rounded-2xl border border-blue-100 bg-blue-50/70 p-4 text-center dark:border-blue-400/15 dark:bg-blue-400/10">
        <MailCheck aria-hidden="true" className="mx-auto h-5 w-5 text-blue-600 dark:text-[#6ee7d2]" />
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Enter the six-digit code sent to <span className="font-semibold text-slate-800 dark:text-white">{email}</span>.</p>
      </div>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" onPaste={handlePaste}>
        <input type="hidden" {...register('code')} />
        
        <div className="flex justify-center gap-1.5 sm:gap-2 mb-8">
          {[...Array(6)].map((_, index) => (
            <input
              key={index}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={codeValue[index] || ''}
              onChange={(e) => handleCodeChange(index, e.target.value)}
              ref={(el) => { if (el) inputsRef.current[index] = el; }}
              aria-label={`Verification digit ${index + 1}`}
              className="h-11 w-10 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-semibold text-slate-900 transition focus:border-blue-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-blue-100 dark:border-white/10 dark:bg-white/5 dark:text-white dark:focus:ring-blue-400/15 sm:h-12 sm:w-12"
              autoFocus={index === 0 && !codeValue.length}
            />
          ))}
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="auth-button"
        >
          {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : 'Verify account'}
        </button>

        {error && (
          <div role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-center text-sm text-red-700 dark:border-red-400/20 dark:bg-red-400/10 dark:text-red-200">
            {'data' in error ? ((error.data as { detail?: string; error?: string }).detail || (error.data as { error?: string }).error) : 'Verification failed'}
          </div>
        )}

        <div className="text-center mt-6">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0 || isResending}
            className="auth-link text-sm disabled:cursor-not-allowed disabled:text-slate-400 dark:disabled:text-slate-500"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : 'Resend verification code'}
          </button>
        </div>
      </form>
    </div>
  );
}
