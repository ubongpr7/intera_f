"use client";

import Link from "next/link";
import Image from "next/image";
import { deleteCookie, getCookie } from "cookies-next";
import { useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useActivationMutation } from "@/redux/features/auth/authApiSlice";

const ACTIVATION_NEXT_COOKIE = "interaims_activation_next";

interface ActivationResultCardProps {
  uid: string;
  token: string;
}

export default function ActivationResultCard({ uid, token }: ActivationResultCardProps) {
  const router = useRouter();
  const [activateAccount, { isLoading, isSuccess, isError, error }] = useActivationMutation();
  const hasTriggeredActivation = useRef(false);
  const nextPath = `${getCookie(ACTIVATION_NEXT_COOKIE) || ""}`.trim();
  const signInHref = useMemo(
    () => (nextPath ? `/accounts/signin?next=${encodeURIComponent(nextPath)}` : "/accounts/signin"),
    [nextPath],
  );

  useEffect(() => {
    if (hasTriggeredActivation.current) {
      return;
    }
    hasTriggeredActivation.current = true;
    void activateAccount({ uid, token });
  }, [activateAccount, token, uid]);

  useEffect(() => {
    if (isSuccess) {
      deleteCookie(ACTIVATION_NEXT_COOKIE);
    }
  }, [isSuccess]);

  return (
    <div className="auth-page flex min-h-screen items-center justify-center px-4 py-8 sm:py-12">
      <Card className="auth-card w-full max-w-xl overflow-hidden p-2 sm:p-3">
        <div className="px-4 pt-5 sm:px-6">
          <Link href="/" aria-label="Go to Intera home" className="inline-flex rounded-xl focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Image src="/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-BLACK-3.png" alt="Intera" width={220} height={66} className="h-12 w-auto dark:hidden" priority />
            <Image src="/assets/img/logos/verticals/no-bg/INTERA-PRIMARY-LOGO-VERTICAL-WHITE-4.png" alt="Intera" width={220} height={66} className="hidden h-12 w-auto dark:block" priority />
          </Link>
        </div>
        {isLoading ? (
          <>
            <CardHeader className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Activating your account</CardTitle>
                <CardDescription className="text-base leading-7 text-gray-600">
                  Please wait while we confirm your email address.
                </CardDescription>
              </div>
            </CardHeader>
          </>
        ) : null}

        {isSuccess ? (
          <>
            <CardHeader className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-700">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Account activated</CardTitle>
                <CardDescription className="text-base leading-7 text-gray-600">
                  Your email has been confirmed successfully. You can now sign in to continue.
                </CardDescription>
              </div>
            </CardHeader>
            <CardFooter className="justify-end">
              <Button asChild className="rounded-xl">
                <Link href={signInHref}>Continue to sign in</Link>
              </Button>
            </CardFooter>
          </>
        ) : null}

        {isError ? (
          <>
            <CardHeader className="space-y-4">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
                <XCircle className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">Activation failed</CardTitle>
                <CardDescription className="text-base leading-7 text-gray-600">
                  {((error as { data?: { detail?: string } })?.data?.detail) ||
                    "We could not activate this account. The link may be invalid or already used."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="text-sm text-gray-600">
              If this keeps happening, request a new activation email or contact support.
            </CardContent>
            <CardFooter className="justify-end">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => router.push("/accounts/signin")}
              >
                Back to sign in
              </Button>
            </CardFooter>
          </>
        ) : null}
      </Card>
    </div>
  );
}
