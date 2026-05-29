import Link from "next/link";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/logo-icon";

export function SiteHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="border-b border-white/[0.06] bg-background/80 backdrop-blur-md sticky top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3.5">
        <Link href="/">
          <BrandLogo />
        </Link>
        <nav className="flex items-center gap-5 text-sm text-neutral-400">
          <Link href="/mentors" className="hover:text-white transition-colors">
            Browse
          </Link>
          {children}
        </nav>
      </div>
    </header>
  );
}

export function Button({
  children,
  variant = "primary",
  size = "default",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "default" | "sm" | "lg";
}) {
  const base =
    "inline-flex items-center justify-center font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = {
    sm: "rounded-lg px-3 py-1.5 text-xs",
    default: "rounded-xl px-4 py-2.5 text-sm",
    lg: "rounded-xl px-6 py-3.5 text-sm",
  };
  const variants = {
    primary:
      "bg-gradient-to-b from-[#d4ff7a] to-[#BDFF3A] text-black shadow-[0_1px_2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.3)] hover:brightness-110 active:scale-[0.98]",
    secondary:
      "border border-white/10 bg-white/[0.05] text-neutral-200 hover:bg-white/[0.08] hover:border-white/15 active:scale-[0.98]",
    danger:
      "border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/15 active:scale-[0.98]",
    ghost:
      "text-neutral-400 hover:text-white hover:bg-white/[0.06] rounded-lg",
  };
  return (
    <button
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-white/[0.06] bg-surface p-5 ${
        hover ? "transition-all hover:border-white/10 hover:bg-surface-elevated" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  const tones = {
    neutral: "bg-white/[0.06] text-neutral-300 border-white/[0.08]",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    danger: "bg-red-500/10 text-red-400 border-red-500/20",
  };
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#BDFF3A]/40 focus:outline-none focus:ring-2 focus:ring-[#BDFF3A]/10 transition-colors"
      {...props}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className="w-full rounded-xl border border-white/[0.08] bg-white/[0.04] px-3.5 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:border-[#BDFF3A]/40 focus:outline-none focus:ring-2 focus:ring-[#BDFF3A]/10 transition-colors min-h-[120px] resize-y"
      {...props}
    />
  );
}

export function Label({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-neutral-300">
      {children}
    </label>
  );
}

export function PageTitle({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-8">
      <h1 className="font-serif text-3xl tracking-tight text-white">{title}</h1>
      {subtitle ? (
        <p className="mt-2 max-w-2xl text-neutral-400 text-[15px]">{subtitle}</p>
      ) : null}
    </div>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.02] px-6 py-16 text-center">
      {icon ? <div className="mb-4 text-neutral-600">{icon}</div> : null}
      <p className="font-medium text-neutral-200">{title}</p>
      {description ? (
        <p className="mt-1.5 text-sm text-neutral-500 max-w-sm">{description}</p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatCard({
  label,
  value,
  detail,
}: {
  label: string;
  value: string | ReactNode;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface p-5">
      <p className="text-xs font-medium uppercase tracking-wider text-neutral-500">
        {label}
      </p>
      <p className="mt-1.5 text-2xl font-semibold text-white">{value}</p>
      {detail ? (
        <p className="mt-1 text-xs text-neutral-500">{detail}</p>
      ) : null}
    </div>
  );
}
