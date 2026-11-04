import { timeAgo } from "@/lib/format";

type ActivityEvent = {
  _id: string;
  kind: "notification" | "overdue_reminder" | "automation_error";
  status: "sent" | "failed";
  at: number;
};

const labels: Record<ActivityEvent["kind"], Record<ActivityEvent["status"], string>> = {
  notification: { sent: "Notification sent", failed: "Notification failed" },
  overdue_reminder: { sent: "Reminder sent", failed: "Reminder failed" },
  automation_error: { sent: "Automation recovered", failed: "Automation error" },
};

export function Activity({ events }: { events: ActivityEvent[] }) {
  if (events.length === 0) return null;
  return (
    <ul className="activity" aria-label="Automation activity">
      {events.map((event) => (
        <li key={event._id} className={event.status === "failed" ? "activity-failed" : undefined}>
          {labels[event.kind][event.status]} {timeAgo(event.at)}
        </li>
      ))}
    </ul>
  );
}
