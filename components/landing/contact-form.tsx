"use client";

import { FormEvent, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    const form = event.currentTarget;

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(form).entries())),
      });
      const result = (await response.json()) as { accepted?: boolean; error?: string };

      if (!response.ok || result.accepted !== true) {
        throw new Error(result.error || "We could not send your message.");
      }

      setSubmitted(true);
      form.reset();
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : "We could not send your message.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-700 dark:bg-gray-900 sm:p-7">
      {submitted ? (
        <div className="mb-5 rounded-2xl border border-green-300 bg-green-50 p-4 text-sm leading-6 text-green-900 dark:border-green-800 dark:bg-green-950/60 dark:text-green-100" role="status">
          Thank you. Your message has been received, and the Intera team will follow up shortly.
        </div>
      ) : null}
      {error ? (
        <div className="mb-5 rounded-2xl border border-red-300 bg-red-50 p-4 text-sm leading-6 text-red-900 dark:border-red-800 dark:bg-red-950/50 dark:text-red-100" role="alert">
          {error}
        </div>
      ) : null}
      <input
        className="absolute h-px w-px opacity-0"
        name="contact_reference"
        tabIndex={-1}
        autoComplete="new-password"
        readOnly
        aria-hidden="true"
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          Name
          <input className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500" name="name" required autoComplete="name" placeholder="Your name" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          Work email
          <input className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500" name="email" type="email" required autoComplete="email" placeholder="you@company.com" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          Business
          <input className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500" name="company" autoComplete="organization" placeholder="Your business name" />
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
          I am interested in
          <select className="rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100" name="interest" defaultValue="demo">
            <option value="demo">An Intera IMS demo</option>
            <option value="partnership">A partnership</option>
            <option value="general">A general conversation</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100 sm:col-span-2">
          How can we help?
          <textarea className="min-h-36 resize-y rounded-2xl border border-gray-300 bg-gray-50 px-4 py-3 font-normal text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100 dark:placeholder:text-gray-500" name="message" required placeholder="Tell us briefly about your operation or question." />
        </label>
      </div>
      <Button className="mt-6" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Sending..." : "Send message"}
        {!isSubmitting ? <ArrowRight className="h-4 w-4" /> : null}
      </Button>
    </form>
  );
}
