'use client';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useRegisterMutation } from '../../redux/features/auth/authApiSlice';
// import { useRouter } from "next/navigation";
import { toast } from "react-toastify"
import { useState, useMemo } from 'react';
import Link from "next/link";
import { ErrorResponse, RegisterResponse } from '../types/authResponse';
import { RegisterFormInputs } from '../types/authForms';
import { useRouter } from 'nextjs-toploader/app'
import { useSearchParams } from 'next/navigation';
import { Check, Eye, EyeOff, Loader2 } from 'lucide-react';
import { continueWithSocialAuth } from '@/lib/socialAuth';
import LegalConsentDialog, { LegalPolicy } from '@/components/legal/LegalConsentDialog';

function GoogleIcon() {
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4" focusable="false"><path fill="#4285F4" d="M21.8 12.23c0-.71-.06-1.23-.2-1.77H12v3.55h5.64c-.11.88-.73 2.2-2.1 3.09l-.02.12 3.05 2.31.21.02c1.93-1.74 3.02-4.29 3.02-7.32Z"/><path fill="#34A853" d="M12 22c2.76 0 5.08-.89 6.77-2.42l-3.23-2.45c-.86.59-2.02 1-3.54 1a6.12 6.12 0 0 1-5.78-4.14l-.12.01-3.17 2.4-.04.11A10.16 10.16 0 0 0 12 22Z"/><path fill="#FBBC05" d="M6.22 13.99A6.03 6.03 0 0 1 5.9 12c0-.69.12-1.36.31-1.99v-.13L2.99 7.46l-.1.05A9.78 9.78 0 0 0 1.8 12c0 1.62.39 3.15 1.09 4.49l3.33-2.5Z"/><path fill="#EA4335" d="M12 5.87c1.91 0 3.2.8 3.94 1.47l2.88-2.73C17.08 3.02 14.76 2 12 2a10.16 10.16 0 0 0-9.11 5.51l3.32 2.5A6.12 6.12 0 0 1 12 5.87Z"/></svg>;
}

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const strength = useMemo(() => {
    if (password.length === 0) return 0;
    
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    return strength;
  }, [password]);

  const getStrengthColor = () => {
    if (strength <= 2) return 'bg-red-500';
    if (strength <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    
    <div className="mt-2">
      <div className="h-1.5 rounded-full bg-slate-200 dark:bg-white/10">
        <div 
          className={`h-1.5 rounded-full transition-all duration-300 ${getStrengthColor()}`}
          style={{ width: `${(strength / 5) * 100}%` }}
        ></div>
      </div>
      <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
        Password strength: {['Weak', 'Fair', 'Good', 'Strong', 'Very Strong'][strength - 1] || ''}
      </p>
    </div>
  );
};

export default function RegisterForm() {
  const [registerUser, { isLoading }] = useRegisterMutation();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextUrl = searchParams.get('next')?.trim();
  const lockedEmail = searchParams.get("email")?.trim() || "";
  const isEmailLocked = searchParams.get("locked") === "1" && Boolean(lockedEmail);
  const [password, setPassword] = useState('');
  const [showPassWord,setShowPassword]=useState(false)
  const [isSocialLoading, setIsSocialLoading] = useState(false);
  const [legalDialog, setLegalDialog] = useState<LegalPolicy | null>(null);
  const [legalAccepted, setLegalAccepted] = useState({ terms: false, privacy: false });
  const hasAcceptedPolicies = legalAccepted.terms && legalAccepted.privacy;
  const { 
    register, 
    handleSubmit, 
    watch, 
    formState: { errors } 
  } = useForm<RegisterFormInputs>({
    defaultValues: {
      email: lockedEmail,
    },
  });

  const onSubmit: SubmitHandler<RegisterFormInputs> = async (formData) => {
    if (!hasAcceptedPolicies) {
      setLegalDialog(legalAccepted.terms ? 'privacy' : 'terms');
      toast.error('Read and agree to both policies before creating your account.');
      return;
    }

    try {
      const userData = await registerUser({
        ...formData,
        last_name: formData.last_name ?? "",
        terms_accepted: legalAccepted.terms,
        privacy_accepted: legalAccepted.privacy,
      }).unwrap() as RegisterResponse;
      toast.success("Registration successful. Check your email to activate your account.");
      const nextSuffix = nextUrl ? `&next=${encodeURIComponent(nextUrl)}` : "";
      router.push(`/accounts/activation-sent?email=${encodeURIComponent(userData.email)}${nextSuffix}`);
    } catch (error) {
      const apiError = error as ErrorResponse;
      const errorMessage = apiError.data?.detail || "Registration failed";
      toast.error(errorMessage);
    }
  };

  const handleGoogleAuth = async () => {
    if (!hasAcceptedPolicies) {
      setLegalDialog(legalAccepted.terms ? 'privacy' : 'terms');
      toast.error('Read and agree to both policies before continuing.');
      return;
    }
    try {
      setIsSocialLoading(true);
      await continueWithSocialAuth("google", {
        signup: true,
        termsAccepted: legalAccepted.terms,
        privacyAccepted: legalAccepted.privacy,
      });
    } catch (error: any) {
      toast.error(error?.message || "Unable to start Google sign-up.");
    } finally {
      setIsSocialLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Name Field */}
      <div>
        <label htmlFor="register-first-name" className="auth-label cursor-pointer">
          First Name
        </label>
        <input
          {...register('first_name', { 
            required: 'First name is required',
            minLength: {
              value: 2,
              message: 'Name must be at least 2 characters'
            }
          })}
          placeholder="John Doe"
          id="register-first-name"
          className="auth-field mt-1.5"
        />
        {errors.first_name && (
          <p className="auth-error">
            {errors.first_name.message}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="register-last-name" className="auth-label cursor-pointer">
          Last Name (Optional)
        </label>
        <input
          {...register('last_name')}
          placeholder="Doe"
          id="register-last-name"
          className="auth-field mt-1.5"
        />
      </div>

      {/* Email Field */}
      <div>
        <label htmlFor="register-email" className="auth-label cursor-pointer">
          Email
        </label>
        <input
          {...register('email', { 
            required: 'Email is required',
            pattern: {
              value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
              message: 'Invalid email address'
            }
          })}
          type="email"
          id="register-email"
          placeholder="john@example.com"
          readOnly={isEmailLocked}
          className="auth-field mt-1.5"
        />
        {isEmailLocked ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            This invitation email is not registered yet. Create the account with this email to continue.
          </p>
        ) : null}
        {errors.email && (
          <p className="auth-error">
            {errors.email.message}
          </p>
        )}
      </div>

      {/* Password Field */}
      <div >
      <label htmlFor="register-password" className="auth-label cursor-pointer">
      Password
      </label>
      <div className='relative flex'>
      <input
          {...register('password', { 
            required: 'Password is required',
            minLength: {
              value: 10,
              message: 'Password must be at least 10 characters'
            },
            validate: (value) => 
              /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{10,}$/.test(value) ||
              'Password must contain at least one lowercase, uppercase, number, and special character'
          })}
          type={showPassWord?"text":'password'}
          id="register-password"
          placeholder="••••••••••"
          onChange={(e) => setPassword(e.target.value)}
          className="auth-field mt-1.5 pr-11"
        />
        <button type="button" aria-label={showPassWord ? "Hide password" : "Show password"} className='absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500' onClick={()=>setShowPassword(!showPassWord)}>
        {!showPassWord ?(<Eye  className="w-4 h-4"/>):(<EyeOff className="w-4 h-4 "/>)}
        </button>
        </div>
        <PasswordStrengthIndicator password={password} />
        {errors.password && (
          <p className="auth-error">
            {errors.password.message}
          </p>
        )}
        {/* Password Requirements 
        <p className="text-sm text-gray-500 mt-2">
          Requirements:
          <ul className="list-disc pl-5 mt-1">
            <li>Minimum 10 characters</li>
            <li>At least one lowercase letter</li>
            <li>At least one uppercase letter</li>
            <li>At least one number</li>
            <li>At least one special character</li>
          </ul>
        </p>
        */}

      </div>

      {/* Confirm Password Field */}
      <div>
        <label htmlFor="register-confirm-password" className="auth-label cursor-pointer">
          Confirm Password
        </label>
        <input
          {...register('re_password', {
            required: 'Please confirm your password',
            validate: (value) => 
              value === watch('password') || 'Passwords do not match'
          })}
          type={showPassWord?'text':"password"}
          id="register-confirm-password"
          placeholder="••••••••••"
          className="auth-field mt-1.5"
        />
        {errors.re_password && (
          <p className="auth-error">
            {errors.re_password.message}
          </p>
        )}
      </div>
      

      {/* Submit Button */}
      <div className="auth-legal-consent space-y-3 rounded-2xl border p-4">
        <p className="text-sm font-semibold">Review the policies before creating your account.</p>
        <p className="text-xs">Open each policy, scroll through it, and select “I agree” at the end.</p>
        {(['terms', 'privacy'] as const).map((policy) => {
          const accepted = legalAccepted[policy];
          const label = policy === 'terms' ? 'Terms and Conditions' : 'Privacy Policy';
          return (
            <div key={policy} className="auth-consent-row flex items-start gap-3 rounded-xl p-2 text-sm">
              <button
                type="button"
                role="checkbox"
                aria-checked={accepted}
                aria-label={`Read and agree to the ${label}`}
                onClick={() => accepted ? setLegalAccepted((current) => ({ ...current, [policy]: false })) : setLegalDialog(policy)}
                className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${accepted ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-400 bg-white text-transparent hover:border-blue-500'}`}
              >
                <Check className="h-3.5 w-3.5" />
              </button>
              <span>
                I have read and agree to the {label}.{' '}
                <button type="button" onClick={() => setLegalDialog(policy)} className="auth-consent-review font-semibold underline underline-offset-2">Review in dialog</button>
              </span>
            </div>
          );
        })}
      </div>
      <button
        type="submit"
        disabled={isLoading || isSocialLoading || !hasAcceptedPolicies}
        className="auth-button"
      >
        {isLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Creating account...</> : 'Create account'}
      </button>
      <button
        type="button"
        onClick={() => void handleGoogleAuth()}
        disabled={isLoading || isSocialLoading || !hasAcceptedPolicies}
        className="auth-secondary-button"
      >
        {isSocialLoading ? <><Loader2 className="h-4 w-4 animate-spin" /> Redirecting...</> : <><GoogleIcon /> Continue with Google</>}
      </button>
      <div className="flex justify-center gap-1 text-sm">
      <p className="text-slate-600 dark:text-slate-300">Already have an account?</p>
      <Link
        href={nextUrl ? `/accounts/signin?next=${encodeURIComponent(nextUrl)}` : "/accounts/signin"}
        className="auth-link"
      >
        {" "}Sign in
      </Link>
      
      </div>
      <LegalConsentDialog
        policy={legalDialog}
        onClose={() => setLegalDialog(null)}
        onAgree={(policy) => {
          setLegalAccepted((current) => ({ ...current, [policy]: true }));
          setLegalDialog(null);
        }}
      />
    </form>
  );
}
