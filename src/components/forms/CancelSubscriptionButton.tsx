"use client";

import { useState, useTransition } from "react";
import { cancelMySubscription } from "@/server/account-actions";

/** One click, no retention maze, no "are you sure you want to lose…" guilt copy. */
export function CancelSubscriptionButton({ id, label, done }: { id: string; label: string; done: string }) {
  const [pending, start] = useTransition();
  const [ok, setOk] = useState(false);
  if (ok) return <span role="status" className="text-sm text-success">{done}</span>;
  return <button disabled={pending} onClick={() => start(async () => setOk(await cancelMySubscription(id)))} className="min-h-11 rounded-full px-4 text-sm font-semibold ring-1 ring-line">{label}</button>;
}
