"use client";

import { useMutation, useQuery } from "convex/react";
import type { FunctionReturnType } from "convex/server";
import { Check, Clock, Hand, Inbox, Undo2, UserRound, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { dateParts, errorMessage, timeAgo } from "@/lib/format";
import { Activity } from "./Activity";
import { Stamp } from "./Tag";

type Loan = FunctionReturnType<typeof api.loans.myRequests>[number];

const statusLabels: Record<Loan["status"], string> = {
  requested: "Pending",
  approved: "Approved",
  declined: "Declined",
  cancelled: "Cancelled",
  returned: "Returned",
};

export function StatusPill({ status, overdue }: { status: Loan["status"]; overdue: boolean }) {
  if (overdue) return <Stamp tone="overdue">Overdue</Stamp>;
  return <Stamp tone={status}>{statusLabels[status]}</Stamp>;
}

export function DateSpan({ start, end }: { start: string; end: string }) {
  const from = dateParts(start);
  const to = dateParts(end);
  return (
    <div className="date-span" aria-label={`${from.day} ${from.month} to ${to.day} ${to.month}`}>
      <span className="date-block">
        <strong>{from.day}</strong>
        {from.month}
      </span>
      {start !== end && (
        <>
          <span className="date-to" aria-hidden />
          <span className="date-block">
            <strong>{to.day}</strong>
            {to.month}
          </span>
        </>
      )}
    </div>
  );
}

export function MyRequests() {
  const loans = useQuery(api.loans.myRequests);
  const cancel = useMutation(api.loans.cancel);
  return (
    <LoanList
      loans={loans}
      emptyTitle="You haven't borrowed anything yet"
      emptyBody="Find something under Browse tools and pick the dates you need it."
      icon={<Hand size={30} aria-hidden />}
      counterpart={(loan) => (
        <>
          <UserRound size={16} aria-hidden />
          Lent by {loan.counterpartFirstName}
          {loan.counterpartTrusted && <span className="badge badge-trusted badge-small">Trusted</span>}
        </>
      )}
      actions={(loan, run) =>
        loan.status === "requested" && (
          <button className="button button-ghost" onClick={() => run(() => cancel({ loanId: loan._id }))}>
            <X size={18} aria-hidden />
            Cancel request
          </button>
        )
      }
    />
  );
}

export function IncomingRequests() {
  const loans = useQuery(api.loans.incoming);
  const decide = useMutation(api.loans.decide);
  const markReturned = useMutation(api.loans.markReturned);
  return (
    <LoanList
      loans={loans}
      emptyTitle="No requests for your tools yet"
      emptyBody="When a neighbour asks to borrow something, it lands here for you to approve."
      icon={<Inbox size={30} aria-hidden />}
      counterpart={(loan) => (
        <>
          <UserRound size={16} aria-hidden />
          Requested by {loan.counterpartFirstName}
        </>
      )}
      actions={(loan, run) => (
        <>
          {loan.status === "requested" && (
            <>
              <button
                className="button button-ghost"
                onClick={() => run(() => decide({ loanId: loan._id, decision: "declined" }))}
              >
                <X size={18} aria-hidden />
                Decline
              </button>
              <button
                className="button button-ink"
                onClick={() => run(() => decide({ loanId: loan._id, decision: "approved" }))}
              >
                <Check size={18} strokeWidth={2.6} aria-hidden />
                Approve
              </button>
            </>
          )}
          {loan.status === "approved" && (
            <button className="button button-ink" onClick={() => run(() => markReturned({ loanId: loan._id }))}>
              <Undo2 size={18} aria-hidden />
              Mark returned
            </button>
          )}
        </>
      )}
    />
  );
}

function LoanList({
  loans,
  emptyTitle,
  emptyBody,
  icon,
  counterpart,
  actions,
}: {
  loans: Loan[] | undefined;
  emptyTitle: string;
  emptyBody: string;
  icon: ReactNode;
  counterpart: (loan: Loan) => ReactNode;
  actions: (loan: Loan, run: (action: () => Promise<unknown>) => void) => ReactNode;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<Id<"loans"> | null>(null);

  function runFor(loanId: Id<"loans">) {
    return async (action: () => Promise<unknown>) => {
      setBusy(loanId);
      setErrors(({ [loanId]: _, ...rest }) => rest);
      try {
        await action();
      } catch (err) {
        setErrors((current) => ({ ...current, [loanId]: errorMessage(err) }));
      } finally {
        setBusy(null);
      }
    };
  }

  if (loans === undefined) return <p className="muted">Loading…</p>;
  if (loans.length === 0)
    return (
      <div className="empty">
        <span className="empty-icon">{icon}</span>
        <p className="empty-title">{emptyTitle}</p>
        <p>{emptyBody}</p>
      </div>
    );

  return (
    <ul className="ledger">
      {loans.map((loan) => {
        const actionNodes = actions(loan, runFor(loan._id));
        return (
          <li
            key={loan._id}
            className={`ledger-row ${loan.overdue ? "is-overdue" : ""} ${busy === loan._id ? "is-busy" : ""}`}
          >
            <DateSpan start={loan.startDate} end={loan.endDate} />
            <div className="ledger-main">
              <h3>
                {loan.toolName}
                {loan.toolRemoved && <span className="muted small"> (no longer listed)</span>}
              </h3>
              <p className="ledger-meta">{counterpart(loan)}</p>
              <p className="ledger-meta muted">
                <Clock size={16} aria-hidden />
                Asked {timeAgo(loan.requestedAt)}
              </p>
              <Activity events={loan.activity} />
              {errors[loan._id] && <p className="notice notice-error">{errors[loan._id]}</p>}
            </div>
            <div className="ledger-side">
              <StatusPill status={loan.status} overdue={loan.overdue} />
              {actionNodes && <div className="form-actions">{actionNodes}</div>}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
