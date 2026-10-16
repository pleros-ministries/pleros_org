"use client";

import { useEffect, useLayoutEffect, useRef, type PointerEvent, type MouseEvent } from "react";
import { animate, useMotionValue, useReducedMotion, useTransform } from "motion/react";
import { tabAfterSwipe, type DashboardArea } from "@/lib/dashboard/swipe-tabs";

export function useTabSwipe(area: DashboardArea, onSelect: (next: DashboardArea) => void | boolean, origin: DashboardArea = "you") {
  const viewportRef = useRef<HTMLDivElement>(null);
  const width = useRef(0);
  const active = useRef(area);
  const animateSelection = useRef(true);
  const x = useMotionValue(0);
  const viewportWidth = useMotionValue(0);
  const transform = useTransform(() => {
    const position = x.get() + (origin === "community" ? viewportWidth.get() : 0);
    // At rest, remove the containing-block transform so existing fixed
    // players, dialogs and sticky feature headers keep their normal behaviour.
    return Math.abs(position) < 0.05 ? "none" : `translate3d(${position}px, 0, 0)`;
  });
  const reduce = useReducedMotion();
  const start = useRef<{ id: number; x: number; y: number; time: number; base: number; horizontal: boolean } | null>(null);
  const suppressClick = useRef(false);
  // A spring carries current velocity when interrupted. Finger tracking is
  // direct; the spring is used only after release or a pointer-initiated tap.
  const settle = (next: DashboardArea, animated = true) => {
    const target = next === "you" ? 0 : -width.current;
    if (reduce || !animated) x.jump(target);
    else animate(x, target, { type: "spring", duration: 0.28, bounce: 0.12 });
  };
  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const resize = () => {
      const nextWidth = viewport.clientWidth;
      if (nextWidth === width.current) return;
      width.current = nextWidth;
      viewportWidth.set(nextWidth);
      start.current = null;
      x.jump(active.current === "you" ? 0 : -width.current);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(viewport);
    return () => { observer.disconnect(); x.stop(); };
  }, [x, viewportWidth]);
  useEffect(() => {
    active.current = area;
    const target = area === "you" ? 0 : -width.current;
    if (reduce || !animateSelection.current) x.jump(target);
    else animate(x, target, { type: "spring", duration: 0.28, bounce: 0.12 });
    animateSelection.current = true;
    return () => x.stop();
  }, [area, reduce, x]);
  const handlers = {
    onPointerDown(event: PointerEvent<HTMLElement>) {
      suppressClick.current = false;
      if (!event.isPrimary || event.button !== 0 || (event.target as Element).closest("input, textarea, select, audio, video, [role=slider], [contenteditable=true], dialog, [role=dialog], [data-swipe-ignore]")) {
        start.current = null;
        settle(area);
        return;
      }
      x.stop();
      start.current = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, base: x.get(), horizontal: false };
    },
    onPointerMove(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      if (!origin || origin.id !== event.pointerId) return;
      const delta = event.clientX - origin.x, dx = Math.abs(delta), dy = Math.abs(event.clientY - origin.y);
      if (!origin.horizontal && dy > 12 && dy > dx) { start.current = null; settle(area); return; }
      if (!origin.horizontal && dx > 16 && dx > dy * 2 && !window.getSelection()?.toString()) {
        origin.horizontal = true;
        event.currentTarget.setPointerCapture(event.pointerId);
      }
      if (!origin.horizontal || reduce) return;
      let position = origin.base + delta;
      // Soft resistance at the outer boundaries, rather than a hard stop.
      const rubber = (distance: number) => width.current * 0.2 * (1 - Math.exp(-distance / Math.max(1, width.current)));
      if (position > 0) position = rubber(position);
      else if (position < -width.current) position = -width.current - rubber(-width.current - position);
      x.set(position);
    },
    onPointerUp(event: PointerEvent<HTMLElement>) {
      const origin = start.current;
      start.current = null;
      if (!origin || origin.id !== event.pointerId || window.getSelection()?.toString()) { settle(area); return; }
      const next = tabAfterSwipe(area, event.clientX - origin.x, event.clientY - origin.y, event.timeStamp - origin.time);
      suppressClick.current = origin.horizontal;
      if (next !== area) { if (onSelect(next) === false) settle(area); }
      else settle(area);
    },
    onPointerCancel() { start.current = null; settle(area); },
    onClickCapture(event: MouseEvent<HTMLElement>) {
      if (suppressClick.current) { event.preventDefault(); event.stopPropagation(); suppressClick.current = false; }
    },
  };
  return {
    viewportRef,
    trackStyle: { transform },
    handlers,
    selectTab(next: DashboardArea, animated = true) {
      animateSelection.current = animated;
      if (next === area) settle(next, animated);
      else onSelect(next);
    },
  };
}
