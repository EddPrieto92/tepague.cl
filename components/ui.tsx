import Link from "next/link";
import { clsx } from "clsx";
import type { ComponentProps, ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <main className="safe-screen mx-auto flex w-full max-w-md flex-col px-4 py-5">{children}</main>;
}

export function TopBar({ title, href }: { title: string; href?: string }) {
  return (
    <header className="sticky top-0 z-40 -mx-4 mb-5 flex items-center justify-between border-b-2 border-ink/10 bg-paper/95 px-4 py-3 backdrop-blur">
      <Link className="text-sm font-bold text-ink/70" href={href ?? "/"}>
        {href ? "← Volver" : "Mesa Cobrada"}
      </Link>
      <span className="rounded-full bg-ink px-3 py-1 text-xs font-bold text-paper">{title}</span>
    </header>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={clsx("rounded-lg border-2 border-ink bg-white p-4 shadow-soft", className)}>{children}</section>;
}

export function Button({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-limewash px-4 py-2 text-sm font-black text-ink shadow-[4px_4px_0_#151515] transition active:translate-x-1 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export function SecondaryButton({ className, ...props }: ComponentProps<"button">) {
  return (
    <button
      className={clsx(
        "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border-2 border-ink bg-white px-4 py-2 text-sm font-extrabold text-ink transition active:bg-paper disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: ComponentProps<"input">) {
  return (
    <input
      className={clsx(
        "min-h-12 w-full rounded-lg border-2 border-ink bg-white px-3 text-base outline-none focus:ring-4 focus:ring-aqua/25",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-2 block text-xs font-black uppercase tracking-wide text-ink/70">{children}</label>;
}
