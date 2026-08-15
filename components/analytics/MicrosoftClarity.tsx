"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";

const SENSITIVE_PREFIXES = ["/accounts"];

function isSensitivePath(pathname: string) {
  return SENSITIVE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

type MicrosoftClarityProps = {
  projectId: string;
};

export default function MicrosoftClarity({ projectId }: MicrosoftClarityProps) {
  const pathname = usePathname();

  if (!projectId || isSensitivePath(pathname)) {
    return null;
  }

  return (
    <Script id="microsoft-clarity" strategy="afterInteractive">
      {`(function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", "${projectId}");`}
    </Script>
  );
}
