"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

type WaitlistResponse = {
  ok?: boolean;
  alreadyRegistered?: boolean;
  message?: string;
};

export function WaitlistForm() {
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState("");
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("submitting");
    setMessage("");

    try {
      const response = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, consent, website }),
      });
      const result = (await response.json()) as WaitlistResponse;

      if (!response.ok || !result.ok) {
        setStatus("error");
        setMessage(result.message ?? "We could not save your signup. Please try again.");
        return;
      }

      setStatus("success");
      setMessage(
        result.alreadyRegistered
          ? "This email is already on the list. We will share launch news soon."
          : "You are on the list. We will share the launch date soon.",
      );
    } catch {
      setStatus("error");
      setMessage("We could not connect right now. Please try again shortly.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-medium text-gray-700">
          Name <span className="font-normal text-gray-500">(optional)</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            type="text"
            name="name"
            autoComplete="name"
            maxLength={120}
            className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="Your name"
          />
        </label>
        <label className="block text-sm font-medium text-gray-700">
          Email address
          <input
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            name="email"
            autoComplete="email"
            required
            maxLength={254}
            className="mt-2 h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            placeholder="you@company.com"
          />
        </label>
      </div>

      <label className="hidden" aria-hidden="true">
        Website
        <input value={website} onChange={(event) => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" name="website" />
      </label>

      <label className="flex items-start gap-3 text-sm leading-6 text-gray-600">
        <input
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
          type="checkbox"
          required
          className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span>
          Send me launch updates about Intera IMS. Read our <Link href="/privacy" className="font-medium text-blue-700 underline underline-offset-2">Privacy Policy</Link>.
        </span>
      </label>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" size="lg" disabled={status === "submitting" || !consent}>
          {status === "submitting" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <ArrowRight className="h-4 w-4" />}
          {status === "submitting" ? "Joining..." : "Join the waitlist"}
        </Button>
        {message ? (
          <p role="status" className={`text-sm font-medium ${status === "error" ? "text-red-700" : "text-emerald-700"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </form>
  );
}
