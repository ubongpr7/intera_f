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
    <div className="legal-consent-overlay fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6" role="presentation">
      <section
        aria-labelledby="legal-consent-title"
        aria-modal="true"
        className="legal-consent-dialog flex max-h-[calc(100dvh-1.5rem)] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border"
        role="dialog"
      >
        <header className="flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-7 sm:py-5">
          <div>
            <p className="legal-consent-kicker text-xs font-semibold uppercase tracking-[0.18em]">Required before signup</p>
            <h2 id="legal-consent-title" className="legal-consent-title mt-1 text-xl font-semibold">{details.title}</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="Close policy dialog" className="legal-consent-close rounded-xl p-2 transition">
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
          className="legal-consent-scroll min-h-0 flex-1 overflow-y-auto p-3 sm:p-5"
        >
          <article className="legal-document legal-consent-document rounded-2xl border p-6 sm:p-8">
            {policy === 'terms' ? <TermsPolicyContent /> : <PrivacyPolicyContent />}
          </article>
        </div>

        <footer className="legal-consent-footer flex flex-col gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-7">
          <p className="text-sm">
            {hasReachedEnd ? 'You have reached the end of this policy.' : 'Scroll to the end of the policy to continue.'}
          </p>
          <button
            type="button"
            disabled={!hasReachedEnd}
            onClick={() => onAgree(policy)}
            className="legal-consent-agree inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 font-semibold transition disabled:cursor-not-allowed"
          >
            <Check className="h-4 w-4" />
            I agree
          </button>
        </footer>
      </section>
    </div>
  );
}
