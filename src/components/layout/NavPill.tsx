"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, type ReactNode } from "react";

/**
 * Sliding "pill" indicator for a horizontal nav. A full-size pill is clipped
 * with `clip-path: inset()` down to the target item. When moving, the leading
 * edge travels first and faster; the trailing edge catches up — giving a
 * stretchy, liquid motion. No animation library: a tiny rAF tween with
 * power3 easings. Works in RTL (physical offsets) and respects reduced motion.
 */
const power3Out = (t: number) => 1 - Math.pow(1 - t, 3);
const power3InOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

type Edge = { from: number; to: number; duration: number; ease: (t: number) => number };

export function NavPill({ children, activeIndex, className }: { children: ReactNode; activeIndex: number; className?: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const pillRef = useRef<HTMLSpanElement>(null);
  // Current inset values (left, right) in px — the single source of truth.
  const cur = useRef<{ l: number; r: number } | null>(null);
  const frame = useRef<number | null>(null);

  const insetsFor = useCallback((target: HTMLElement) => {
    const box = boxRef.current!;
    const W = box.scrollWidth;
    const H = box.offsetHeight;
    return {
      L: target.offsetLeft,
      R: W - (target.offsetLeft + target.offsetWidth),
      T: target.offsetTop,
      B: H - (target.offsetTop + target.offsetHeight),
    };
  }, []);

  const moveTo = useCallback(
    (target: HTMLElement | null, instant = false) => {
      const pill = pillRef.current;
      if (!pill || !boxRef.current) return;
      if (!target) {
        pill.style.opacity = "0";
        return;
      }
      const { L, R, T, B } = insetsFor(target);
      const clip = (l: number, r: number) => `inset(${T}px ${r}px ${B}px ${l}px round 999px)`;
      const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      pill.style.opacity = "1";

      if (frame.current !== null) cancelAnimationFrame(frame.current); // never let two tweens fight
      if (instant || reduced || !cur.current) {
        cur.current = { l: L, r: R };
        pill.style.clipPath = clip(L, R);
        return;
      }

      const start = { ...cur.current };
      const movingRight = L > start.l;
      // Leading edge: fast (0.36s, out). Trailing edge: slower (0.55s, inOut).
      const left: Edge = { from: start.l, to: L, duration: movingRight ? 550 : 360, ease: movingRight ? power3InOut : power3Out };
      const right: Edge = { from: start.r, to: R, duration: movingRight ? 360 : 550, ease: movingRight ? power3Out : power3InOut };
      const t0 = performance.now();
      const step = (now: number) => {
        const at = (e: Edge) => e.from + (e.to - e.from) * e.ease(Math.min(1, (now - t0) / e.duration));
        cur.current = { l: at(left), r: at(right) };
        pill.style.clipPath = clip(cur.current.l, cur.current.r);
        frame.current = now - t0 < Math.max(left.duration, right.duration) ? requestAnimationFrame(step) : null;
      };
      frame.current = requestAnimationFrame(step);
    },
    [insetsFor],
  );

  const itemAt = useCallback((i: number) => (i >= 0 ? (boxRef.current?.querySelectorAll<HTMLElement>("[data-pill-item]")[i] ?? null) : null), []);

  useLayoutEffect(() => {
    moveTo(itemAt(activeIndex), cur.current === null);
  }, [activeIndex, itemAt, moveTo]);

  useEffect(() => {
    const onResize = () => moveTo(itemAt(activeIndex), true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("resize", onResize);
      if (frame.current !== null) cancelAnimationFrame(frame.current);
    };
  }, [activeIndex, itemAt, moveTo]);

  const follow = (e: React.SyntheticEvent) => {
    const item = (e.target as HTMLElement).closest<HTMLElement>("[data-pill-item]");
    if (item && boxRef.current?.contains(item)) moveTo(item);
  };

  return (
    <div
      ref={boxRef}
      className={`relative ${className ?? ""}`}
      onPointerOver={follow}
      onFocus={follow}
      onPointerLeave={() => moveTo(itemAt(activeIndex))}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) moveTo(itemAt(activeIndex));
      }}
    >
      <span ref={pillRef} aria-hidden className="pointer-events-none absolute inset-0 bg-white/10 opacity-0" style={{ clipPath: "inset(50% 50% round 999px)" }} />
      {children}
    </div>
  );
}
