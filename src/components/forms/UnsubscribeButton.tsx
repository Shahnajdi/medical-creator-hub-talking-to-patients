"use client";

import { useState, useTransition } from "react";
import { confirmUnsubscribe } from "@/server/privacy-actions";

export function UnsubscribeButton({ token, labels }: { token: string; labels: { button: string; done: string; error: string } }) {
  const [state, setState] = useState<"idle" | "done" | "error">("idle");
  const [pending, start] = useTransition();
  if (state === "done") return <p role="status" className="text-success">{labels.done}</p>;
  return (
    <>
      <button disabled={pending} onClick={() => start(async () => setState((await confirmUnsubscribe(token)).ok ? "done" : "error"))} className="min-h-12 rounded-full bg-midnight px-6 font-semibold text-white">{labels.button}</button>
      {state === "error" && <p role="alert" className="mt-3 text-danger">{labels.error}</p>}
    </>
  );
}
