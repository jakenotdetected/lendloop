"use client";

import { useConvexAuth, useMutation, useQuery } from "convex/react";
import { Hand, Inbox, LayoutGrid, ShieldCheck, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import { AdminPanel } from "@/components/AdminPanel";
import { BrowseTools } from "@/components/BrowseTools";
import { Header, SiteFooter } from "@/components/Header";
import { IncomingRequests, MyRequests } from "@/components/LoanList";
import { MyListings } from "@/components/MyListings";
import { api } from "@/convex/_generated/api";
import { errorMessage } from "@/lib/format";

const tabs = [
  { id: "browse", label: "Browse tools", icon: LayoutGrid },
  { id: "listings", label: "My listings", icon: Tag },
  { id: "requests", label: "My requests", icon: Hand },
  { id: "incoming", label: "Incoming requests", icon: Inbox },
  { id: "admin", label: "Admin", icon: ShieldCheck, adminOnly: true },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function Dashboard() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const storeUser = useMutation(api.users.store);
  const me = useQuery(api.users.me);
  const incoming = useQuery(api.loans.incoming, me ? {} : "skip");
  const mine = useQuery(api.loans.myRequests, me ? {} : "skip");
  const [tab, setTab] = useState<TabId>("browse");
  const [setupError, setSetupError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;
    storeUser().catch((err) => setSetupError(errorMessage(err)));
  }, [isAuthenticated, storeUser]);

  const visibleTabs = tabs.filter((t) => !("adminOnly" in t) || me?.role === "admin");
  const counts: Partial<Record<TabId, number>> = {
    incoming: incoming?.filter((loan) => loan.status === "requested").length,
    requests: mine?.filter((loan) => loan.status === "requested" || loan.status === "approved").length,
  };
  const waiting = counts.incoming ?? 0;
  const overdue = mine?.filter((loan) => loan.overdue).length ?? 0;

  return (
    <>
      <Header />
      <main className="page">
        {setupError ? (
          <p className="notice notice-error">{setupError}</p>
        ) : isLoading || !me ? (
          <p className="muted">Setting up your account…</p>
        ) : (
          <>
            <div className="welcome">
              <div>
                <h1>Hi{me.firstName ? `, ${me.firstName}` : ""}</h1>
                <p className="muted">
                  {overdue > 0
                    ? `You have ${overdue} overdue ${overdue === 1 ? "loan" : "loans"} to return.`
                    : waiting > 0
                      ? `${waiting} ${waiting === 1 ? "neighbour is" : "neighbours are"} waiting on your answer.`
                      : "Nothing needs your attention right now."}
                </p>
              </div>
              <div className="welcome-badges">
                {me.trustedLender && <span className="badge badge-trusted">Trusted lender</span>}
                {me.role === "admin" && <span className="badge">Admin</span>}
              </div>
            </div>
            <nav className="tabs" role="tablist" aria-label="Dashboard sections">
              {visibleTabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={tab === t.id}
                  className={`tab ${tab === t.id ? "active" : ""}`}
                  onClick={() => setTab(t.id)}
                >
                  <t.icon size={20} aria-hidden />
                  {t.label}
                  {!!counts[t.id] && <span className="tab-count">{counts[t.id]}</span>}
                </button>
              ))}
            </nav>
            <div role="tabpanel">
              {tab === "browse" && <BrowseTools />}
              {tab === "listings" && <MyListings />}
              {tab === "requests" && <MyRequests />}
              {tab === "incoming" && <IncomingRequests />}
              {tab === "admin" && me.role === "admin" && <AdminPanel />}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </>
  );
}
