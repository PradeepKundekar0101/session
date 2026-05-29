type LogoIconProps = {
  size?: number;
  className?: string;
};

/** GetMentor mark — two people connected by a session arc. */
export function LogoIcon({ size = 32, className = "" }: LogoIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <rect width="32" height="32" rx="8" fill="#BDFF3A" />
      <path
        d="M10 14.5C16 10.5 22 14.5"
        stroke="#0a0a0a"
        strokeWidth="2.25"
        strokeLinecap="round"
      />
      <circle cx="10" cy="19" r="3.5" fill="#0a0a0a" />
      <circle cx="22" cy="19" r="3.5" fill="#0a0a0a" />
    </svg>
  );
}

export function BrandLogo({ showText = true }: { showText?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <LogoIcon size={32} className="h-8 w-8 shrink-0" />
      {showText ? (
        <span className="font-serif text-lg tracking-tight text-white">
          GetMentor
        </span>
      ) : null}
    </span>
  );
}
