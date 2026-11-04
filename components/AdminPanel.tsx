"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { categoryLabel, errorMessage, timeAgo } from "@/lib/format";
import { Activity } from "./Activity";
import { DateSpan, StatusPill } from "./LoanList";

export function AdminPanel() {
  const data = useQuery(api.admin.overview);
  const removeListing = useMutation(api.admin.removeListing);
  const setTrusted = useMutation(api.admin.setTrustedLender);
  const [confirming, setConfirming] = useState<Id<"tools"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function run(action: () => Promise<unknown>) {
    setError(null);
    try {
      await action();
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  if (data === undefined) return <p className="muted">Loading admin view…</p>;

  const activeLoans = data.loans.filter((loan) => loan.status === "approved").length;
  const overdueLoans = data.loans.filter((loan) => loan.overdue).length;

  return (
    <div className="stack-lg">
      {error && <p className="notice notice-error">{error}</p>}

      <dl className="tally">
        <div>
          <dt>Listings</dt>
          <dd>{data.tools.length}</dd>
        </div>
        <div>
          <dt>Out on loan</dt>
          <dd>{activeLoans}</dd>
        </div>
        <div className={overdueLoans > 0 ? "is-alert" : undefined}>
          <dt>Overdue</dt>
          <dd>{overdueLoans}</dd>
        </div>
        <div className={data.errors.length > 0 ? "is-alert" : undefined}>
          <dt>Automation errors</dt>
          <dd>{data.errors.length}</dd>
        </div>
      </dl>

      <section className="panel">
        <div className="panel-head">
          <h2>Automation errors</h2>
          <span className="muted small">{data.errors.length === 0 ? "All clear" : "Last 20"}</span>
        </div>
        {data.errors.length === 0 ? (
          <p className="muted small">Every workflow run and notification has gone through.</p>
        ) : (
          <ul className="error-list">
            {data.errors.map((e) => (
              <li key={e._id}>
                <div className="error-head">
                  <strong>{e.source.replace(/^n8n:/, "")}</strong>
                  <span className="muted small">{timeAgo(e.at)}</span>
                </div>
                {e.message && <p className="small">{e.message}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="split split-even">
        <section className="panel">
          <h2>Lenders</h2>
          {data.lenders.length === 0 ? (
            <p className="muted small">Nobody has listed a tool yet.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th className="align-right">Listings</th>
                    <th className="align-right">Trusted</th>
                  </tr>
                </thead>
                <tbody>
                  {data.lenders.map((user) => (
                    <tr key={user._id}>
                      <td>{user.firstName}</td>
                      <td className="muted">{user.email ?? "Not shared"}</td>
                      <td className="align-right">{user.listings}</td>
                      <td className="align-right">
                        <label className="switch">
                          <input
                            type="checkbox"
                            role="switch"
                            checked={user.trustedLender}
                            aria-label={`Trusted lender: ${user.firstName}`}
                            onChange={(e) => run(() => setTrusted({ userId: user._id, trusted: e.target.checked }))}
                          />
                          <span aria-hidden />
                        </label>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="panel">
          <h2>All listings</h2>
          {data.tools.length === 0 ? (
            <p className="muted small">No tools listed.</p>
          ) : (
            <ul className="admin-list">
              {data.tools.map((tool) => (
                <li key={tool._id}>
                  <div>
                    <strong>{tool.name}</strong>
                    <p className="muted small">
                      {categoryLabel(tool.category)}, lent by {tool.ownerFirstName}
                    </p>
                  </div>
                  {confirming === tool._id ? (
                    <div className="form-actions">
                      <button className="button button-ghost button-small" onClick={() => setConfirming(null)}>
                        Keep
                      </button>
                      <button
                        className="button button-danger button-small"
                        onClick={() => run(() => removeListing({ toolId: tool._id })).then(() => setConfirming(null))}
                      >
                        Remove listing
                      </button>
                    </div>
                  ) : (
                    <button className="button button-ghost button-small" onClick={() => setConfirming(tool._id)}>
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="panel">
        <h2>All loans</h2>
        {data.loans.length === 0 ? (
          <p className="muted small">No loans yet.</p>
        ) : (
          <ul className="ledger ledger-flat">
            {data.loans.map((loan) => (
              <li key={loan._id} className={`ledger-row ${loan.overdue ? "is-overdue" : ""}`}>
                <DateSpan start={loan.startDate} end={loan.endDate} />
                <div className="ledger-main">
                  <h3>{loan.toolName}</h3>
                  <p className="ledger-meta">
                    {loan.lenderFirstName} lending to {loan.borrowerFirstName}
                  </p>
                  <Activity events={loan.activity} />
                </div>
                <div className="ledger-side">
                  <StatusPill status={loan.status} overdue={loan.overdue} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
