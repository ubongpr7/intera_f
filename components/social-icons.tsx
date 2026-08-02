type SocialIconProps = {
  name: "linkedin" | "x";
  size?: number;
};

export function SocialIcon({ name, size = 18 }: SocialIconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      {name === "linkedin" ? (
        <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.36V8.99h3.4v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.59 0 4.25 2.36 4.25 5.43v6.32ZM5.35 7.43A2.06 2.06 0 1 1 5.35 3.3a2.06 2.06 0 0 1 0 4.13ZM3.58 20.45h3.55V8.99H3.58v11.46Z" />
      ) : (
        <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.68l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
      )}
    </svg>
  );
}
