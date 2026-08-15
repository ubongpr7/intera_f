'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, X } from 'lucide-react';

import { PrivacyPolicyContent, TermsPolicyContent } from '@/components/legal/LegalPolicyContent';

export type LegalPolicy = 'terms' | 'privacy';

type LegalConsentDialogProps = {
  policy: LegalPolicy | null;
  onClose: () => void;
  onAgree: (policy: LegalPolicy) => void;
};

const policyDetails: Record<LegalPolicy, { title: string }> = {
  terms: { title: 'Terms and Conditions' },
  privacy: { title: 'Privacy Policy' },
};

export default function LegalConsentDialog({ policy, onClose, onAgree }: LegalConsentDialogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [hasReachedEnd, setHasReachedEnd] = useState(false);

  useEffect(() => {
    setHasReachedEnd(false);
  }, [policy]);

  if (!policy) return null;

  const details = policyDetails[policy];

  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const remaining = container.scrollHeight - container.scrollTop - container.clientHeight;
    if (remaining <= 16) {
      setHasReachedEnd(true);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-sm" role="presentation">
      <section
        aria-labelledby="legal-consent-title"
        aria-modal="true"
        className="flex max-h-[min(860px,calc(100vh-2rem))] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-600">Required before signup</p>
            <h2 id="legal-consent-title" className="mt-1 text-xl font-semibold text-slate-950">{details.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close policy dialog" className="rounded-lg p-2 text-slate-500 transition hover:bg-slate-100 hover:text-slate-950">
            <X className="h-5 w-5" />
          </button>
        </header>

        <div
          ref={scrollRef}
          onScroll={handleScroll}
          onClick={(event) => {
            if ((event.target as HTMLElement).closest('a')) {
              event.preventDefault();
            }
          }}
          className="min-h-0 flex-1 overflow-y-auto bg-slate-100 p-3 sm:p-5"
        >
          <article className="legal-document rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            {policy === 'terms' ? <TermsPolicyContent /> : <PrivacyPolicyContent />}
          </article>
        </div>

        <footer className="flex flex-col gap-3 border-t border-slate-200 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-600">
            {hasReachedEnd ? 'You have reached the end of this policy.' : 'Scroll to the end of the policy to continue.'}
          </p>
          <button
            type="button"
            disabled={!hasReachedEnd}
            onClick={() => onAgree(policy)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            <Check className="h-4 w-4" />
            I agree
          </button>
        </footer>
      </section>
    </div>
  );
}

