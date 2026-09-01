"use client";

type Status = "connecting" | "live" | "offline";

const LABELS: Record<Status, string> = {
  connecting: "Connexion en cours",
  live: "Connecté",
  offline: "Hors ligne",
};

const DOT_COLORS: Record<Status, string> = {
  connecting: "bg-[var(--color-amber)]",
  live: "bg-[var(--color-signal)]",
  offline: "bg-[var(--color-danger)]",
};

export default function ConnectionBadge({ status }: { status: Status }) {
  const dots = [0, 1, 2];

  return (
    <div className="inline-flex items-center gap-2.5 rounded-full border border-[var(--color-line)] bg-[var(--color-surface)] px-3 py-1.5">
      <div className="flex items-center gap-1">
        {dots.map((i) => (
          <span
            key={i}
            className={`h-1.5 w-1.5 rounded-full ${DOT_COLORS[status]} ${
              status === "offline" ? "" : "packet-dot"
            }`}
            style={{ animationDelay: `${i * 0.18}s` }}
          />
        ))}
      </div>
      <span className="font-mono-ui text-[11px] uppercase tracking-wider text-[var(--color-text-dim)]">
        {LABELS[status]}
      </span>
    </div>
  );
}
