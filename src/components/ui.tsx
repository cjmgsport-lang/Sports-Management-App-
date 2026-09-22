import { clsx } from "clsx";
import Link from "next/link";
import type { ButtonHTMLAttributes, InputHTMLAttributes, LabelHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={clsx("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-5 py-4">
      <div>
        <h2 className="text-base font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function CardBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={clsx("px-5 py-4", className)}>{children}</div>;
}

export function Button({
  className,
  variant = "primary",
  size = "md",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "secondary" | "accent" | "danger" | "ghost"; size?: "sm" | "md" }) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" ? "px-3 py-1.5 text-sm" : "px-4 py-2 text-sm",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        variant === "accent" && "bg-accent-500 text-white hover:bg-accent-600",
        variant === "danger" && "bg-red-600 text-white hover:bg-red-700",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className
      )}
      {...props}
    />
  );
}

export function LinkButton({
  href,
  className,
  variant = "primary",
  children,
}: {
  href: string;
  className?: string;
  variant?: "primary" | "secondary" | "accent" | "ghost";
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={clsx(
        "inline-flex items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors",
        variant === "primary" && "bg-brand-600 text-white hover:bg-brand-700",
        variant === "secondary" && "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
        variant === "accent" && "bg-accent-500 text-white hover:bg-accent-600",
        variant === "ghost" && "text-slate-600 hover:bg-slate-100",
        className
      )}
    >
      {children}
    </Link>
  );
}

export function Label(props: LabelHTMLAttributes<HTMLLabelElement>) {
  return <label className="mb-1 block text-sm font-medium text-slate-700" {...props} />;
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={clsx(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={clsx(
        "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
        className
      )}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={clsx(
        "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-100",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function Badge({
  children,
  color = "slate",
  className,
}: {
  children: React.ReactNode;
  color?: "slate" | "green" | "amber" | "red" | "blue" | "purple";
  className?: string;
}) {
  const colors: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700",
    green: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    red: "bg-red-100 text-red-700",
    blue: "bg-blue-100 text-blue-700",
    purple: "bg-purple-100 text-purple-700",
  };
  return (
    <span className={clsx("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colors[color], className)}>
      {children}
    </span>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 py-10 text-center">
      <p className="text-sm font-medium text-slate-600">{title}</p>
      {subtitle && <p className="mt-1 text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
