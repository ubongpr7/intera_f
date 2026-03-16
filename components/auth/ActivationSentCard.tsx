"use client";

import Link from "next/link";
import { getCookie, setCookie } from "cookies-next";
import { useEffect } from "react";
import { MailCheck, ArrowRight } from "lucide-react";

import { readCookieValue } from "@/lib/authCookies";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const ACTIVATION_NEXT_COOKIE = "interaims_activation_next";

interface ActivationSentCardProps {
  email: string;
  nextPath?: string;
}

export default function ActivationSentCard({ email, nextPath }: ActivationSentCardProps) {
  useEffect(() => {
    if (nextPath) {
      setCookie(ACTIVATION_NEXT_COOKIE, nextPath, { maxAge: 60 * 60 * 24, path: "/" });
    }
  }, [nextPath]);

  const pendingNext =
    nextPath?.trim() ||
    `${getCookie(ACTIVATION_NEXT_COOKIE) || ""}`.trim() ||
    `${readCookieValue("mfaNextPath", getCookie) || ""}`.trim();

  const signInHref = pendingNext
    ? `/accounts/signin?next=${encodeURIComponent(pendingNext)}`
    : "/accounts/signin";

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12">
      <Card className="w-full max-w-2xl shadow-xl shadow-gray-200/60">
        <CardHeader className="space-y-4">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
            <MailCheck className="h-6 w-6" />
          </div>
          <div className="space-y-2">
            <CardTitle className="text-3xl">Check your email</CardTitle>
            <CardDescription className="text-base leading-7 text-gray-600">
              We sent an account activation link to <span className="font-semibold text-gray-800">{email}</span>.
              Open the email and click the activation button to finish setting up your account.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 text-sm leading-7 text-gray-600">
          <p>You must activate your account from the email before you can sign in.</p>
          {pendingNext ? (
            <p>
              After activation, sign in and you will continue to the page you were trying to reach.
            </p>
          ) : null}
        </CardContent>
        <CardFooter className="justify-end">
          <Button asChild className="rounded-xl">
            <Link href={signInHref}>
              Go to sign in
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
