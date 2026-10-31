"use client";

import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { track } from "@/lib/tracking/consent-state";

export function TrackedLink({ event, ...props }: ComponentProps<typeof Link> & { event: string }) {
  return <Link {...props} onClick={(e) => { track(event); props.onClick?.(e); }} />;
}
