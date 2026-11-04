"use client";

import { useMutation, useQuery } from "convex/react";
import {
  ArrowDownAZ,
  CalendarDays,
  CalendarPlus,
  CircleCheck,
  Clock,
  Gauge,
  LayoutGrid,
  Package,
  RotateCcw,
  SearchX,
  Send,
  UserRound,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState, type AnimationEvent, type FormEvent } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { CATEGORIES, type Category } from "@/convex/lib/validators";
import {
  categoryLabel,
  conditionLabel,
  errorMessage,
  formatRange,
  todayLocalIso,
} from "@/lib/format";
import { CategoryIcon } from "./CategoryIcon";
import { ConditionIcon } from "./ConditionIcon";
import { SearchBox, matches } from "./SearchBox";
import { Select } from "./Select";
import { Stamp, Tag } from "./Tag";
import { ToolPhoto } from "./ToolPhoto";
import { TrustedBadge } from "./TrustedBadge";

type Sort = "newest" | "name" | "available";

const SORTS: { value: Sort; label: string; icon: React.ReactNode }[] = [
  { value: "newest", label: "Newest first", icon: <Clock size={18} /> },
  { value: "name", label: "Name, A to Z", icon: <ArrowDownAZ size={18} /> },
  { value: "available", label: "Available first", icon: <CircleCheck size={18} /> },
];

export function BrowseTools() {
  const tools = useQuery(api.tools.browse, {});
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | undefined>(undefined);
  const [freeOnly, setFreeOnly] = useState(false);
  const [sort, setSort] = useState<Sort>("newest");

  const searched = useMemo(
    () =>
      (tools ?? []).filter(
        (tool) =>
          (!freeOnly || tool.status === "available") &&
          matches(
            query,
            tool.name,
            tool.description,
            categoryLabel(tool.category),
            tool.ownerFirstName,
          ),
      ),
    [tools, query, freeOnly],
  );

  const counts = useMemo(() => {
    const result = new Map<string, number>();
    for (const tool of searched)
      result.set(tool.category, (result.get(tool.category) ?? 0) + 1);
    return result;
  }, [searched]);

  const visible = useMemo(() => {
    const list = category
      ? searched.filter((tool) => tool.category === category)
      : [...searched];
    if (sort === "name") list.sort((a, b) => a.name.localeCompare(b.name));
    if (sort === "available")
      list.sort(
        (a, b) =>
          Number(b.status === "available") - Number(a.status === "available"),
      );
    return list;
  }, [searched, category, sort]);

  const filtered = query.trim() !== "" || category !== undefined || freeOnly;

  function clearFilters() {
    setQuery("");
    setCategory(undefined);
    setFreeOnly(false);
  }

  const freeNow = (tools ?? []).filter(
    (tool) => tool.status === "available" && !tool.isMine,
  ).length;
  const lenders = new Set(
    (tools ?? []).filter((tool) => !tool.isMine).map((tool) => tool.ownerFirstName),
  ).size;
  const booked = (tools ?? []).filter((tool) => tool.bookings.length > 0).length;

  return (
    <section className="stack-lg">
      {tools !== undefined && tools.length > 0 && (
        <dl className="stats">
          <div>
            <dt>
              <Package size={20} aria-hidden /> In the library
            </dt>
            <dd>{tools.length}</dd>
          </div>
          <div>
            <dt>
              <CircleCheck size={20} aria-hidden /> Free for you now
            </dt>
            <dd>{freeNow}</dd>
          </div>
          <div>
            <dt>
              <Users size={20} aria-hidden /> Neighbours lending
            </dt>
            <dd>{lenders}</dd>
          </div>
          <div>
            <dt>
              <CalendarDays size={20} aria-hidden /> Booked ahead
            </dt>
            <dd>{booked}</dd>
          </div>
        </dl>
      )}
      <div className="finder">
        <div className="toolbar">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search drills, ladders, lenders…"
            label="Search tools"
          />
          <label className="check">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
            />
            Free right now
          </label>
          <Select
            label="Sort by"
            value={sort}
            options={SORTS}
            onChange={setSort}
            inline
          />
        </div>
        <div className="filters" role="group" aria-label="Filter by category">
          <button
            className={`filter ${category === undefined ? "active" : ""}`}
            aria-pressed={category === undefined}
            onClick={() => setCategory(undefined)}
          >
            <LayoutGrid size={18} aria-hidden />
            Everything <span className="filter-count">{searched.length}</span>
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              className={`filter ${category === c.value ? "active" : ""}`}
              aria-pressed={category === c.value}
              onClick={() => setCategory(c.value)}
              disabled={!counts.get(c.value) && category !== c.value}
            >
              <CategoryIcon category={c.value} />
              {c.label}{" "}
              <span className="filter-count">{counts.get(c.value) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {tools === undefined ? (
        <p className="muted">Loading tools…</p>
      ) : visible.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">
            {filtered ? <SearchX size={30} aria-hidden /> : <Package size={30} aria-hidden />}
          </span>
          <p className="empty-title">
            {filtered ? "No tools match that" : "Nothing on the board yet"}
          </p>
          <p>
            {filtered
              ? "Try a different word or category."
              : "List one of your own tools under My listings."}
          </p>
          {filtered && (
            <button className="button button-ghost" onClick={clearFilters}>
              <RotateCcw size={18} aria-hidden />
              Clear search and filters
            </button>
          )}
        </div>
      ) : (
        <>
          <p className="result-count" aria-live="polite">
            {filtered
              ? `${visible.length} of ${tools.length} ${tools.length === 1 ? "tool" : "tools"}`
              : `${tools.length} ${tools.length === 1 ? "tool" : "tools"} in the library`}
          </p>
          <div className="tag-grid">
            {visible.map((tool, index) => (
              <Tag key={tool._id}>
                <div className="tag-top">
                  <span className="tag-category">
                    <CategoryIcon category={tool.category} size={16} />
                    {categoryLabel(tool.category)}
                  </span>
                  {tool.status === "available" ? (
                    <Stamp tone="available">Available</Stamp>
                  ) : (
                    <Stamp tone="on_loan">On loan</Stamp>
                  )}
                </div>
                <ToolPhoto
                  category={tool.category}
                  src={tool.photoUrl}
                  name={tool.name}
                  className="tag-photo"
                  eager={index < 3}
                />
                <h3 className="tag-name">{tool.name}</h3>
                {tool.description && (
                  <p className="tag-description">{tool.description}</p>
                )}
                <dl className="facts">
                  <div>
                    <dt>
                      <Gauge size={16} aria-hidden /> Condition
                    </dt>
                    <dd className="fact-with-icon">
                      <ConditionIcon condition={tool.condition} />
                      {conditionLabel(tool.condition)}
                    </dd>
                  </div>
                  <div>
                    <dt>
                      <UserRound size={16} aria-hidden /> Lender
                    </dt>
                    <dd className="fact-with-icon">
                      {tool.isMine ? "You" : tool.ownerFirstName}
                      {tool.ownerTrusted && <TrustedBadge />}
                    </dd>
                  </div>
                  {tool.bookings.length > 0 && (
                    <div>
                      <dt>
                        <CalendarDays size={16} aria-hidden /> Booked
                      </dt>
                      <dd>
                        {tool.bookings
                          .map((b) => formatRange(b.startDate, b.endDate))
                          .join(", ")}
                      </dd>
                    </div>
                  )}
                </dl>
                {!tool.isMine && <BorrowForm toolId={tool._id} />}
              </Tag>
            ))}
          </div>
        </>
      )}
    </section>
  );
}

function BorrowForm({ toolId }: { toolId: Id<"tools"> }) {
  const request = useMutation(api.loans.request);
  const today = todayLocalIso();
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [message, setMessage] = useState<{
    kind: "error" | "success";
    text: string;
  } | null>(null);
  const [busy, setBusy] = useState(false);
  const days =
    Math.round(
      (Date.parse(`${endDate}T00:00:00Z`) - Date.parse(`${startDate}T00:00:00Z`)) /
        86_400_000,
    ) + 1;

  function closeForm() {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) setOpen(false);
    else setClosing(true);
  }

  function finishClosing(event: AnimationEvent<HTMLDivElement>) {
    if (!closing || event.target !== event.currentTarget) return;
    setClosing(false);
    setOpen(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setMessage(null);
    try {
      await request({ toolId, startDate, endDate });
      setMessage({
        kind: "success",
        text: "Request sent. Track it under My requests.",
      });
      closeForm();
    } catch (err) {
      setMessage({ kind: "error", text: errorMessage(err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="tag-footer">
      {open ? (
        <div
          className={`borrow-reveal ${closing ? "is-closing" : ""}`}
          onAnimationEnd={finishClosing}
        >
          <form className="borrow-form" onSubmit={handleSubmit}>
            <label>
              From
              <input
                type="date"
                required
                min={today}
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  if (endDate < e.target.value) setEndDate(e.target.value);
                }}
              />
            </label>
            <label>
              Until
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </label>
            <p className="borrow-length">
              <Clock size={16} aria-hidden />
              {days === 1 ? "1 day" : `${days} days`}
            </p>
            <div className="form-actions">
              <button
                type="button"
                className="button button-ghost"
                onClick={closeForm}
              >
                <X size={18} aria-hidden />
                Cancel
              </button>
              <button type="submit" className="button button-ink" disabled={busy}>
                <Send size={18} aria-hidden />
                {busy ? "Sending…" : "Send request"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          className="button button-ink button-block"
          onClick={() => setOpen(true)}
        >
          <CalendarPlus size={18} aria-hidden />
          Request to borrow
        </button>
      )}
      {message && (
        <p className={`notice notice-${message.kind}`}>{message.text}</p>
      )}
    </div>
  );
}
