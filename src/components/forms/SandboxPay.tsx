"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { simulateSandboxPayment } from "@/server/checkout-actions";

export function SandboxPay({ providerRef, successPath }: { providerRef: string; successPath: string }) {
  const [pending, start] = useTransition();
  const router = useRouter();
  const go = (o: "succeeded" | "failed") => start(async () => { const id = await simulateSandboxPayment(providerRef, o); router.push(`${successPath}?order=${id}`); });
  return (
    <div className="flex gap-3">
      <button disabled={pending} onClick={() => go("succeeded")} className="min-h-12 rounded-full bg-success px-5 font-semibold text-white">Simulate success</button>
      <button disabled={pending} onClick={() => go("failed")} className="min-h-12 rounded-full bg-danger px-5 font-semibold text-white">Simulate failure</button>
    </div>
  );
}
