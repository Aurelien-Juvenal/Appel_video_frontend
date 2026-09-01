"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Radio, Eye } from "lucide-react";
import ConnectionBadge from "@/components/ConnectionBadge";

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    if (i < 2) code += "-";
  }
  return code;
}

type Role = "broadcaster" | "viewer";

export default function HomePage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("broadcaster");
  const [roomCode, setRoomCode] = useState("");
  const [name, setName] = useState("");

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    const code = roomCode.trim() || generateRoomCode();
    const params = new URLSearchParams();
    if (name.trim()) params.set("name", name.trim());
    const basePath = role === "broadcaster" ? "/broadcast" : "/watch";
    router.push(`${basePath}/${encodeURIComponent(code)}?${params.toString()}`);
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
      {/* Ambient background: faint network grid */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-line) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-signal)] opacity-[0.06] blur-[120px]" />

      <div className="rise-in relative w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--color-line)] bg-[var(--color-surface)]">
            <Radio size={19} className="text-[var(--color-signal)]" />
          </div>
          <h1 className="font-display text-[32px] font-semibold leading-tight tracking-tight text-[var(--color-text)]">
            Liaison
          </h1>
          <p className="mt-2 font-body text-[14px] text-[var(--color-text-dim)]">
            Diffusez un flux vidéo en direct, ou regardez celui de quelqu&apos;un
            d&apos;autre.
          </p>
        </div>

        <form
          onSubmit={handleJoin}
          className="flex flex-col gap-4 rounded-2xl border border-[var(--color-line)] bg-[var(--color-surface)] p-6"
        >
          {/* Sélecteur de rôle */}
          <div className="grid grid-cols-2 gap-2 rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] p-1">
            <button
              type="button"
              onClick={() => setRole("broadcaster")}
              className={`flex items-center justify-center gap-2 rounded-md py-2.5 font-body text-[13px] font-semibold transition-colors ${
                role === "broadcaster"
                  ? "bg-[var(--color-signal)] text-[var(--color-void)]"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              }`}
            >
              <Radio size={15} />
              Diffuser
            </button>
            <button
              type="button"
              onClick={() => setRole("viewer")}
              className={`flex items-center justify-center gap-2 rounded-md py-2.5 font-body text-[13px] font-semibold transition-colors ${
                role === "viewer"
                  ? "bg-[var(--color-signal)] text-[var(--color-void)]"
                  : "text-[var(--color-text-dim)] hover:text-[var(--color-text)]"
              }`}
            >
              <Eye size={15} />
              Regarder
            </button>
          </div>

          <label className="flex flex-col gap-2">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider text-[var(--color-text-faint)]">
              Votre nom
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ex. Rina"
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 font-body text-[14px] text-[var(--color-text)] outline-none placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-signal)]"
            />
          </label>

          <label className="flex flex-col gap-2">
            <span className="font-mono-ui text-[11px] uppercase tracking-wider text-[var(--color-text-faint)]">
              {role === "broadcaster"
                ? "Code du salon (optionnel)"
                : "Code du salon à rejoindre"}
            </span>
            <input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              placeholder={
                role === "broadcaster"
                  ? "Laisser vide pour en créer un"
                  : "ex. AB2-CD5-EF7"
              }
              required={role === "viewer"}
              className="rounded-lg border border-[var(--color-line)] bg-[var(--color-surface-raised)] px-3.5 py-2.5 font-mono-ui text-[14px] tracking-wider text-[var(--color-text)] outline-none placeholder:font-body placeholder:tracking-normal placeholder:text-[var(--color-text-faint)] focus:border-[var(--color-signal)]"
            />
          </label>

          <button
            type="submit"
            className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-[var(--color-signal)] py-3 font-body text-[14px] font-semibold text-[var(--color-void)] transition-opacity hover:opacity-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-signal)]"
          >
            {role === "broadcaster"
              ? roomCode.trim()
                ? "Diffuser dans ce salon"
                : "Créer un salon et diffuser"
              : "Regarder le salon"}
            <ArrowRight size={16} />
          </button>
        </form>

        <div className="mt-6 flex justify-center">
          <ConnectionBadge status="offline" />
        </div>
      </div>
    </main>
  );
}
