"use client";

import { SignInButton } from "@clerk/nextjs";
import { Authenticated, Unauthenticated, useQuery } from "convex/react";
import { ArrowRight, LayoutGrid, LogIn, SearchX } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { CategoryIcon } from "@/components/CategoryIcon";
import { Header, SiteFooter } from "@/components/Header";
import { SearchBox, matches } from "@/components/SearchBox";
import { ToolPhoto } from "@/components/ToolPhoto";
import { api } from "@/convex/_generated/api";
import { CATEGORIES } from "@/convex/lib/validators";
import { categoryLabel } from "@/lib/format";
import { WORKSHOP_PHOTO } from "@/lib/photos";

const PEG_LIMIT = 6;
const SHELF_LIMIT = 12;

const steps = [
  {
    title: "Hang it up",
    body: "List a tool you're happy to lend, with its condition and anything a borrower should know.",
  },
  {
    title: "Ask for the dates",
    body: "Neighbours pick the days they need it. Overlapping bookings are refused automatically.",
  },
  {
    title: "Hand it over",
    body: "Approve the request, swap the tool on the doorstep, and mark it returned when it's back.",
  },
];

export default function Home() {
  const tools = useQuery(api.tools.publicAvailable);
  const pegged = tools?.slice(0, PEG_LIMIT) ?? [];
  const extra = tools ? Math.max(tools.length - PEG_LIMIT, 0) : 0;

  return (
    <>
      <Header showDashboardLink />
      <main className="page">
        <section className="hero">
          <div className="hero-copy">
            <h1>Borrow what you need. Lend what you don&apos;t.</h1>
            <p className="lede">
              LendLoop is a tool library for your street. The drill that comes
              out twice a year can live in one shed and work for everyone.
            </p>
            <div className="hero-actions">
              <Unauthenticated>
                <SignInButton mode="modal">
                  <button className="button button-ink button-large">
                    <LogIn size={22} aria-hidden />
                    Sign in to lend or borrow
                  </button>
                </SignInButton>
              </Unauthenticated>
              <Authenticated>
                <Link
                  href="/dashboard"
                  className="button button-ink button-large"
                >
                  Go to your dashboard
                  <ArrowRight size={22} aria-hidden />
                </Link>
              </Authenticated>
            </div>
          </div>

          <div className="pegboard" aria-labelledby="pegboard-title">
            <div className="pegboard-head">
              <h2 id="pegboard-title">On the board today</h2>
              {tools && (
                <span className="pegboard-count">
                  {tools.length} {tools.length === 1 ? "tool" : "tools"} free to
                  borrow
                </span>
              )}
            </div>
            {tools === undefined ? (
              <p className="pegboard-empty">Checking the shed…</p>
            ) : tools.length === 0 ? (
              <p className="pegboard-empty">
                The board is empty. Sign in and hang up the first tool.
              </p>
            ) : (
              <ul className="pegs">
                {pegged.map((tool, index) => (
                  <li
                    key={`${tool.name}-${index}`}
                    className="peg"
                    style={{ ["--i" as string]: index }}
                  >
                    <div className="peg-tag">
                      <span className="tag-hole" aria-hidden />
                      <span className="peg-name">{tool.name}</span>
                      <span className="peg-category">
                        {categoryLabel(tool.category)}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {extra > 0 && (
              <p className="pegboard-more">and {extra} more inside</p>
            )}
          </div>
        </section>

        <Shelf tools={tools} />

        <section className="how" aria-labelledby="how-title">
          <div className="how-photo">
            <Image
              src={WORKSHOP_PHOTO.src}
              alt={WORKSHOP_PHOTO.alt}
              fill
              sizes="(max-width: 900px) 100vw, 440px"
            />
          </div>
          <div className="how-body">
            <h2 id="how-title">How a loan works</h2>
            <ol className="steps">
              {steps.map((step) => (
                <li key={step.title}>
                  <h3>{step.title}</h3>
                  <p>{step.body}</p>
                </li>
              ))}
            </ol>
            <p className="how-note">
              Both sides hear about every change, and borrowers get a friendly
              nudge if something is overdue. Neighbours only ever see each
              other&apos;s first name.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

function Shelf({
  tools,
}: {
  tools: { name: string; category: string }[] | undefined;
}) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string | undefined>(undefined);

  const searched = useMemo(
    () =>
      (tools ?? []).filter((tool) =>
        matches(query, tool.name, categoryLabel(tool.category)),
      ),
    [tools, query],
  );
  const visible = category
    ? searched.filter((tool) => tool.category === category)
    : searched;
  const present = new Set(searched.map((tool) => tool.category));

  if (!tools || tools.length === 0) return null;

  return (
    <section className="shelf" aria-labelledby="shelf-title">
      <div className="shelf-head">
        <div>
          <h2 id="shelf-title">Find something to borrow</h2>
          <p className="muted">
            Everything here is free to borrow today. Sign in to pick your dates.
          </p>
        </div>
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Try drill, tent or mixer"
          label="Search available tools"
        />
      </div>
      <div className="filters" role="group" aria-label="Filter by category">
        <button
          className={`filter ${category === undefined ? "active" : ""}`}
          aria-pressed={category === undefined}
          onClick={() => setCategory(undefined)}
        >
          <LayoutGrid size={18} aria-hidden />
          Everything
        </button>
        {CATEGORIES.filter(
          (c) => present.has(c.value) || category === c.value,
        ).map((c) => (
          <button
            key={c.value}
            className={`filter ${category === c.value ? "active" : ""}`}
            aria-pressed={category === c.value}
            onClick={() => setCategory(c.value)}
          >
            <CategoryIcon category={c.value} />
            {c.label}
          </button>
        ))}
      </div>
      {visible.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">
            <SearchX size={30} aria-hidden />
          </span>
          <p className="empty-title">Nothing matches that yet</p>
          <p>
            Try another word, or sign in and ask your neighbours to list one.
          </p>
        </div>
      ) : (
        <ul className="shelf-grid">
          {visible.slice(0, SHELF_LIMIT).map((tool, index) => (
            <li key={`${tool.name}-${index}`} className="shelf-card">
              <ToolPhoto
                category={tool.category}
                sizes="(max-width: 640px) 50vw, 260px"
              />
              <div className="shelf-card-body">
                <h3>{tool.name}</h3>
                <p className="shelf-card-category">
                  <CategoryIcon category={tool.category} size={16} />
                  {categoryLabel(tool.category)}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}
      {visible.length > SHELF_LIMIT && (
        <p className="muted small">
          Showing {SHELF_LIMIT} of {visible.length}. Sign in to see the rest.
        </p>
      )}
    </section>
  );
}
