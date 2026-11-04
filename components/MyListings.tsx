"use client";

import { useMutation, useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { categoryLabel, conditionLabel, errorMessage, formatRange } from "@/lib/format";
import { CalendarDays, Check, Gauge, Hourglass, Pencil, PackageOpen, Plus, Trash2 } from "lucide-react";
import { CategoryIcon } from "./CategoryIcon";
import { ConditionIcon } from "./ConditionIcon";
import { Stamp, Tag } from "./Tag";
import { ToolForm } from "./ToolForm";
import { ToolPhoto } from "./ToolPhoto";

export function MyListings() {
  const tools = useQuery(api.tools.mine);
  const create = useMutation(api.tools.create);
  const update = useMutation(api.tools.update);
  const remove = useMutation(api.tools.remove);
  const [editing, setEditing] = useState<Id<"tools"> | null>(null);
  const [confirming, setConfirming] = useState<Id<"tools"> | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove(toolId: Id<"tools">) {
    setError(null);
    try {
      await remove({ toolId });
      setConfirming(null);
    } catch (err) {
      setError(errorMessage(err));
    }
  }

  return (
    <div className="split">
      <section className="panel panel-sticky">
        <h2 className="heading-icon">
          <span className="heading-icon-mark">
            <Plus size={20} strokeWidth={2.6} aria-hidden />
          </span>
          Hang up a tool
        </h2>
        <p className="muted small">Only the name and category are shown to people who aren&apos;t signed in.</p>
        <ToolForm submitLabel="List tool" submitIcon={<Plus size={20} strokeWidth={2.6} aria-hidden />} onSubmit={(fields) => create(fields)} />
      </section>

      <section className="stack">
        {error && <p className="notice notice-error">{error}</p>}
        {tools === undefined ? (
          <p className="muted">Loading your listings…</p>
        ) : tools.length === 0 ? (
          <div className="empty">
            <span className="empty-icon">
              <PackageOpen size={30} aria-hidden />
            </span>
            <p className="empty-title">Your hooks are empty</p>
            <p>List your first tool with the form. It appears on the board straight away.</p>
          </div>
        ) : (
          <div className="tag-grid tag-grid-narrow">
            {tools.map((tool) =>
              editing === tool._id ? (
                <Tag key={tool._id} className="tag-editing">
                  <ToolForm
                    initial={tool}
                    initialPhotoUrl={tool.photoUrl}
                    submitLabel="Save changes"
                    submitIcon={<Check size={20} strokeWidth={2.6} aria-hidden />}
                    onCancel={() => setEditing(null)}
                    onSubmit={async (fields) => {
                      await update({ toolId: tool._id, ...fields });
                      setEditing(null);
                    }}
                  />
                </Tag>
              ) : (
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
                  <ToolPhoto category={tool.category} src={tool.photoUrl} name={tool.name} className="tag-photo" />
                  <h3 className="tag-name">{tool.name}</h3>
                  {tool.description && <p className="tag-description">{tool.description}</p>}
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
                    {tool.pendingRequests > 0 && (
                      <div>
                        <dt>
                          <Hourglass size={16} aria-hidden /> Waiting
                        </dt>
                        <dd>
                          {tool.pendingRequests} {tool.pendingRequests === 1 ? "request" : "requests"}
                        </dd>
                      </div>
                    )}
                    {tool.bookings.length > 0 && (
                      <div>
                        <dt>
                          <CalendarDays size={16} aria-hidden /> Booked
                        </dt>
                        <dd>{tool.bookings.map((b) => formatRange(b.startDate, b.endDate)).join(", ")}</dd>
                      </div>
                    )}
                  </dl>
                  <div className="tag-footer">
                    {confirming === tool._id ? (
                      <div className="confirm">
                        <p className="small">Remove this tool? Any pending requests will be cancelled.</p>
                        <div className="form-actions">
                          <button className="button button-ghost" onClick={() => setConfirming(null)}>
                            Keep it
                          </button>
                          <button className="button button-danger" onClick={() => handleRemove(tool._id)}>
                            <Trash2 size={18} aria-hidden />
                            Remove tool
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="form-actions">
                        <button className="button button-ghost" onClick={() => setConfirming(tool._id)}>
                          <Trash2 size={18} aria-hidden />
                          Remove
                        </button>
                        <button className="button button-ink" onClick={() => setEditing(tool._id)}>
                          <Pencil size={18} aria-hidden />
                          Edit
                        </button>
                      </div>
                    )}
                  </div>
                </Tag>
              ),
            )}
          </div>
        )}
      </section>
    </div>
  );
}
