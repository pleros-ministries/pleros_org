"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { Accordion } from "@base-ui/react/accordion";
import { ChevronDown } from "lucide-react";

import type { getSogpCurriculumLevels } from "@/lib/sogp/landing-content";

type CurriculumLevel = ReturnType<typeof getSogpCurriculumLevels>[number];

export function SogpCurriculumAccordion({
  levels,
}: {
  levels: CurriculumLevel[];
}) {
  // Track a single open level so opening one closes whichever was open before.
  const [open, setOpen] = useState<string | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  // Remembers the just-opened header's viewport position so we can pin it in
  // place after a taller panel above it collapses (single-open shifts layout).
  const anchor = useRef<{ value: string; top: number } | null>(null);

  useLayoutEffect(() => {
    const pending = anchor.current;
    anchor.current = null;
    if (!pending) return;
    const element = triggerRefs.current.get(pending.value);
    if (!element) return;

    // The panel above collapses over the 300ms grid-rows transition, so the
    // layout shift arrives gradually. Re-pin the opened header on every frame
    // until the animation settles instead of correcting once up front.
    let frame = 0;
    const deadline = performance.now() + 360;
    const pin = () => {
      const delta = element.getBoundingClientRect().top - pending.top;
      if (Math.abs(delta) > 0.5) window.scrollBy(0, delta);
      if (performance.now() < deadline) frame = requestAnimationFrame(pin);
    };
    pin();

    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Accordion.Root
      value={open ? [open] : []}
      onValueChange={(value) => {
        const next = (value.at(-1) as string) ?? null;
        // Only opening a level can pull content up from above; capture where its
        // header sits now so the layout effect can hold it steady afterwards.
        if (next) {
          const element = triggerRefs.current.get(next);
          anchor.current = element
            ? { value: next, top: element.getBoundingClientRect().top }
            : null;
        } else {
          anchor.current = null;
        }
        setOpen(next);
      }}
      className="border-t border-[var(--color-line)]"
    >
      {levels.map((level) => (
        <Accordion.Item
          key={level.value}
          value={level.value}
          className="border-b border-[var(--color-line)]"
        >
          <Accordion.Header>
            <Accordion.Trigger
              ref={(element: HTMLButtonElement | null) => {
                if (element) triggerRefs.current.set(level.value, element);
                else triggerRefs.current.delete(level.value);
              }}
              className="group flex min-h-20 w-full cursor-pointer items-center justify-between gap-4 py-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand-blue)] focus-visible:ring-offset-2"
            >
              <span className="grid gap-1">
                <span className="font-[var(--font-sen)] text-[1.35rem] font-semibold tracking-[-0.04em] text-[var(--color-brand-blue)]">
                  {level.label}
                </span>
                <span className="font-[var(--font-be-vietnam-pro)] text-xs text-[var(--color-text-muted)]">
                  {level.description}
                </span>
              </span>
              <ChevronDown
                className="size-5 shrink-0 text-[var(--color-brand-blue)] transition-transform duration-300 ease-out group-aria-expanded:rotate-180"
                aria-hidden="true"
              />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Panel
            keepMounted
            className="grid overflow-hidden transition-[grid-template-rows,opacity] duration-300 ease-out data-open:grid-rows-[1fr] data-open:opacity-100 data-closed:grid-rows-[0fr] data-closed:opacity-0"
          >
            <ol className="grid min-h-0 border-t border-[var(--color-line)] md:grid-cols-2">
              {level.tracks.map((track) => (
                <li
                  key={`${level.value}-${track.title}`}
                  className="grid min-h-20 grid-cols-[2.5rem_1fr] gap-3 border-b border-[var(--color-line)] py-4 last:border-b-0 md:gap-5 md:odd:pr-8 md:even:border-l md:even:pl-8 md:[&:nth-last-child(2):nth-child(odd)]:border-b-0"
                >
                  <span className="font-[var(--font-sen)] text-sm font-semibold tabular-nums text-[var(--color-brand-blue)]">
                    {String(track.number).padStart(2, "0")}
                  </span>
                  <h3 className="font-[var(--font-sen)] text-[1rem] font-semibold leading-[1.25] tracking-[-0.03em] text-[var(--color-text-strong)] md:text-[1.08rem]">
                    {track.title}
                  </h3>
                </li>
              ))}
            </ol>
          </Accordion.Panel>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}
