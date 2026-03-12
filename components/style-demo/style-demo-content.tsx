"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const radiusTokens = [
  { label: "radius-sm", value: "var(--radius-sm)" },
  { label: "radius-md", value: "var(--radius-md)" },
  { label: "radius-lg", value: "var(--radius-lg)" },
  { label: "radius-xl", value: "var(--radius-xl)" },
  { label: "radius-2xl", value: "var(--radius-2xl)" },
  { label: "radius-pill", value: "var(--radius-pill)" },
];

export function StyleDemoContent() {
  return (
    <div className="section-shell">
      <div className="container-pleros grid gap-12">
        <section className="grid gap-4">
          <Badge>Style foundations</Badge>
          <h1 className="display max-w-4xl text-[var(--color-text-strong)]">
            Pleros UI foundations demo
          </h1>
          <p className="body-lg max-w-3xl text-[var(--color-text-muted)]">
            This temporary page validates the token-driven primitives and app shell
            before homepage implementation.
          </p>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Typography scale</h2>
          <div className="surface-card grid gap-3 p-5 sm:p-6">
            <p className="display">Display text sample</p>
            <p className="h1">Heading one sample</p>
            <p className="h2">Heading two sample</p>
            <p className="h3">Heading three sample</p>
            <p className="body-lg">Body large text for intros and summaries.</p>
            <p className="body">Body text for paragraphs and supporting content.</p>
            <p className="text-sm">Small text for metadata and labels.</p>
            <p className="text-xs">Extra small text for helper details.</p>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Buttons and badges</h2>
          <div className="surface-card grid gap-4 p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Primary action</Button>
              <Button variant="secondary">Secondary action</Button>
              <Button variant="outline">Outline action</Button>
              <Button variant="ghost">Ghost action</Button>
              <Button variant="destructive">Destructive action</Button>
              <Button variant="link">Inline link action</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Badge>Default badge</Badge>
              <Badge variant="outline">Outline badge</Badge>
              <Badge variant="questions">Questions badge</Badge>
              <Badge variant="purpose">Purpose badge</Badge>
              <Badge variant="fulfil">Fulfil badge</Badge>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Inputs and overlays</h2>
          <div className="surface-card grid gap-6 p-5 sm:p-6">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">First name</span>
                <Input placeholder="Enter first name" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm text-[var(--color-text-muted)]">Email</span>
                <Input type="email" placeholder="you@example.com" variant="muted" />
              </label>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Dialog>
                <DialogTrigger render={<Button variant="secondary" />}>
                  Open dialog
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Simple branded dialog</DialogTitle>
                    <DialogDescription>
                      Dialog, button, and text styles all consume the existing token
                      values.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="outline">Cancel</Button>
                    <Button variant="primary">Continue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger render={<Button variant="outline" />}>
                  Open sheet
                </SheetTrigger>
                <SheetContent side="right">
                  <SheetHeader>
                    <SheetTitle>Mobile-first sheet</SheetTitle>
                    <SheetDescription>
                      Use this for navigation drawers and contextual forms.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="grid gap-3">
                    <Input placeholder="Quick note" />
                    <Button variant="primary">Save note</Button>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Card surfaces</h2>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card tone="default" interactive>
              <CardHeader>
                <CardTitle>Default surface</CardTitle>
                <CardDescription>Raised page surface with subtle lift.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Badge>default</Badge>
              </CardFooter>
            </Card>

            <Card tone="muted" interactive>
              <CardHeader>
                <CardTitle>Muted surface</CardTitle>
                <CardDescription>Accent-muted surface for grouped context.</CardDescription>
              </CardHeader>
              <CardFooter>
                <Badge variant="outline">muted</Badge>
              </CardFooter>
            </Card>

            <Card tone="dark" interactive>
              <CardHeader>
                <CardTitle className="text-[var(--color-text-on-dark)]">Dark surface</CardTitle>
                <CardDescription className="muted-on-dark">
                  Anchor section surface for contrast moments.
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-white/15">
                <Badge className="bg-white/10 text-white">dark</Badge>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Questions, purpose, fulfil surfaces</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <Card tone="questions" interactive>
              <CardHeader>
                <CardTitle>Questions</CardTitle>
                <CardDescription>
                  Warmer tone for exploration and curiosity prompts.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="questions">Questions</Badge>
              </CardContent>
            </Card>

            <Card tone="purpose" interactive>
              <CardHeader>
                <CardTitle>Purpose</CardTitle>
                <CardDescription>
                  Reflective tone for values, direction, and identity.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="purpose">Purpose</Badge>
              </CardContent>
            </Card>

            <Card tone="fulfil" interactive>
              <CardHeader>
                <CardTitle>Fulfil</CardTitle>
                <CardDescription>
                  Growth tone for practice, progress, and outcomes.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Badge variant="fulfil">Fulfil</Badge>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Accordion pattern</h2>
          <Accordion defaultValue={["a1"]}>
            <AccordionItem value="a1">
              <AccordionTrigger>What is this page for?</AccordionTrigger>
              <AccordionContent>
                This page is a temporary proving ground for typography, controls,
                surfaces, and layout foundations.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a2">
              <AccordionTrigger>Why branded primitives first?</AccordionTrigger>
              <AccordionContent>
                Locking primitives to tokens early keeps future pages consistent and
                fast to build.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="a3">
              <AccordionTrigger>What comes after this?</AccordionTrigger>
              <AccordionContent>
                Homepage sections can be composed from these primitives without
                redesigning the design system.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </section>

        <section className="grid gap-4">
          <h2 className="h2 text-[var(--color-text-strong)]">Radii in use</h2>
          <div className="surface-card grid gap-3 p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
            {radiusTokens.map((radius) => (
              <div
                key={radius.label}
                className="grid gap-2 border border-[var(--color-line)] bg-white p-4"
                style={{ borderRadius: radius.value }}
              >
                <span className="text-sm font-medium text-[var(--color-text-strong)]">
                  {radius.label}
                </span>
                <span className="text-xs text-[var(--color-text-muted)]">
                  {radius.value}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
