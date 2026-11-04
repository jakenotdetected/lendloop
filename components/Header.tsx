"use client";

import { SignInButton, UserButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated } from "convex/react";
import { LayoutDashboard, LogIn } from "lucide-react";
import Link from "next/link";

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden>
      <path d="M9 3h14l6 6v20H3V9z" fill="var(--tag)" stroke="var(--ink)" strokeWidth="2" strokeLinejoin="round" />
      <circle cx="16" cy="10" r="2.6" fill="var(--paper)" stroke="var(--ink)" strokeWidth="2" />
      <path d="M9 19h14M9 24h9" stroke="var(--ink)" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <span>LendLoop, a tool library for your street.</span>
      <Link href="/credits">Photo credits</Link>
    </footer>
  );
}

export function Header({ showDashboardLink = false }: { showDashboardLink?: boolean }) {
  return (
    <header className="site-header">
      <Link href="/" className="brand">
        <BrandMark />
        LendLoop
      </Link>
      <nav className="header-actions">
        <Authenticated>
          {showDashboardLink && (
            <Link href="/dashboard" className="button button-ghost">
              <LayoutDashboard size={18} aria-hidden />
              Dashboard
            </Link>
          )}
          <UserButton
            showName
            appearance={{
              elements: {
                userButtonBox: { gap: "10px" },
                userButtonTrigger: {
                  padding: "4px 6px 4px 14px",
                  borderRadius: "999px",
                  border: "2px solid var(--line)",
                  background: "var(--surface)",
                },
                userButtonOuterIdentifier: {
                  fontSize: "1rem",
                  fontWeight: 700,
                  color: "var(--ink)",
                },
                userButtonAvatarBox: { width: "40px", height: "40px" },
                userButtonPopoverCard: { width: "360px" },
                userPreviewAvatarBox: { width: "52px", height: "52px" },
                userPreviewMainIdentifier: { fontSize: "1.1rem", fontWeight: 700 },
                userPreviewSecondaryIdentifier: { fontSize: "0.95rem" },
                userButtonPopoverActionButton: {
                  minHeight: "56px",
                  fontSize: "1.02rem",
                  fontWeight: 700,
                },
                userButtonPopoverActionButtonIcon: { width: "20px", height: "20px" },
              },
            }}
          />
        </Authenticated>
        <Unauthenticated>
          <SignInButton mode="modal">
            <button className="button button-ink">
              <LogIn size={18} aria-hidden />
              Sign in
            </button>
          </SignInButton>
        </Unauthenticated>
      </nav>
    </header>
  );
}
