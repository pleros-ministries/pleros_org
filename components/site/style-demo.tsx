import Link from "next/link";
import { ArrowRightIcon, CompassIcon, Layers2Icon, SparklesIcon } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button-variants";
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
  radiusScale,
  styleDemoSections,
  themeSurfaceItems,
} from "@/lib/site-foundations";
import { cn } from "@/lib/utils";

const surfaceCardTones = [
  {
    label: "Default surface",
    tone: "default" as const,
    description: "Primary raised card for neutral content blocks and standard composition.",
  },
  {
    label: "Muted surface",
    tone: "muted" as const,
    description: "Soft supporting card for supporting notes, utility rows, and low-emphasis content.",
  },
  ...themeSurfaceItems.map(({ label, tone, description }) => ({
    label: `${label} surface`,
    tone,
    description,
  })),
  {
    label: "Dark anchor",
    tone: "dark" as const,
    description: "Dense contrast surface for moments that need gravity, focus, or emphasis.",
  },
] as const;

const buttonShowcase = [
  { label: "Primary", variant: "primary" as const },
  { label: "Secondary", variant: "secondary" as const },
  { label: "Questions", variant: "questions" as const },
  { label: "Purpose", variant: "purpose" as const },
  { label: "Fulfil", variant: "fulfil" as const },
  { label: "Outline", variant: "outline" as const },
] as const;

export function StyleDemo() {
  return (
    <div className="section-shell-tight">
      <section className="container-pleros grid gap-6 pt-4 sm:gap-8 sm:pt-8">
        <Card
          size="lg"
          className="overflow-hidden border-[var(--color-line-strong)] bg-[linear-gradient(135deg,rgba(255,255,255,0.96)_0%,rgba(248,246,242,0.94)_58%,rgba(227,244,229,0.76)_100%)]"
        >
          <CardHeader className="gap-4">
            <Badge variant="outline" className="w-fit">
              Temporary style demo
            </Badge>
            <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(18rem,0.75fr)] lg:items-end">
              <div className="grid gap-4">
                <p className="eyebrow">
                  <SparklesIcon className="size-3.5" />
                  Branded foundations for the future Pleros site
                </p>
                <div className="grid gap-3">
                  <h1 className="display max-w-4xl text-[var(--color-text-strong)]">
                    A calm, editorial shell built from the existing token system.
                  </h1>
                  <p className="body-lg max-w-2xl text-[var(--color-text-muted)]">
                    This page is a working palette for typography, surfaces, forms,
                    motion, and composition. It is intentionally not the homepage.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Link
                    href="#buttons"
                    className={buttonVariants({ variant: "primary", size: "lg" })}
                  >
                    View buttons
                  </Link>
                  <Link
                    href="#surfaces"
                    className={buttonVariants({ variant: "secondary", size: "lg" })}
                  >
                    Explore surfaces
                  </Link>
                </div>
              </div>

              <Card tone="dark" className="gap-5">
                <CardHeader className="gap-3">
                  <Badge variant="dark" className="w-fit">
                    Shell direction
                  </Badge>
                  <CardTitle>Sticky, light, and quietly structured</CardTitle>
                  <CardDescription>
                    The shell leans on restrained contrast, generous rounding, and a
                    soft grid so the primitives feel designed rather than generic.
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-[var(--color-text-on-dark-muted)]">
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-white/10 bg-white/6 px-3 py-3">
                    <CompassIcon className="size-4 text-[var(--color-brand-green)]" />
                    Mobile-first navigation with a sheet on smaller screens.
                  </div>
                  <div className="flex items-center gap-3 rounded-[var(--radius-sm)] border border-white/10 bg-white/6 px-3 py-3">
                    <Layers2Icon className="size-4 text-[var(--color-brand-green)]" />
                    Token-led surfaces for questions, purpose, and fulfil.
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardHeader>
        </Card>

        <div className="flex flex-wrap gap-2">
          {styleDemoSections.map((section) => (
            <Link
              key={section.id}
              href={`#${section.id}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "sm" }),
                "min-h-9 border border-[var(--color-line)] bg-white/72 backdrop-blur-sm",
              )}
            >
              {section.label}
            </Link>
          ))}
        </div>
      </section>

      <section id="typography" className="section-shell">
        <div className="container-pleros grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(20rem,0.85fr)]">
          <Card size="lg">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Typography scale
              </Badge>
              <CardTitle>Sentence case, strong rhythm, Suisse Int’l in motion</CardTitle>
              <CardDescription>
                A simple hierarchy that feels composed on mobile first, with enough
                contrast to scale into larger editorial layouts later.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="display">Display text for key hero moments</div>
              <div className="h1">Heading one for page introductions</div>
              <div className="h2">Heading two for content sections</div>
              <div className="h3">Heading three for compact surfaces</div>
              <div className="body-lg">
                Large body copy introduces tone and narrative without becoming dense.
              </div>
              <div className="body">
                Regular body copy handles everyday reading and supporting detail.
              </div>
              <div className="text-sm">
                Small text is reserved for labels, metadata, and secondary support.
              </div>
              <div className="text-xs">
                Extra small text stays useful for badges and overline treatments.
              </div>
            </CardContent>
          </Card>

          <Card tone="muted" size="lg">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Usage notes
              </Badge>
              <CardTitle>Type stays quiet so the surfaces can carry the mood</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 text-sm text-[var(--color-text-muted)]">
              <p>
                Display and `h1` sizes are tight and slightly condensed through spacing,
                not by adding more font weights than the brand already gives us.
              </p>
              <p>
                Supporting copy uses generous leading so content can sit comfortably on
                rounded surfaces and inside dialogs or sheets.
              </p>
              <Accordion defaultValue={["item-1"]}>
                <AccordionItem value="item-1">
                  <AccordionTrigger>What stays off-limits here?</AccordionTrigger>
                  <AccordionContent>
                    No uppercase-heavy buttons, no generic shadcn defaults, and no
                    token renaming. The system stays sentence case and token-led.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="buttons" className="section-shell pt-0">
        <div className="container-pleros grid gap-6">
          <Card size="lg">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Buttons and badges
              </Badge>
              <CardTitle>Variants feel branded, not generic</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-6">
              <div className="flex flex-wrap gap-3">
                {buttonShowcase.map((item) => (
                  <Button key={item.label} variant={item.variant}>
                    {item.label}
                  </Button>
                ))}
                <Button variant="ghost">Ghost</Button>
                <Button variant="link">Text link</Button>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small action</Button>
                <Button size="default">Default action</Button>
                <Button size="lg">Large action</Button>
                <Button size="icon" aria-label="Icon action">
                  <ArrowRightIcon />
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge>Default badge</Badge>
                <Badge variant="outline">Outline badge</Badge>
                <Badge variant="questions">Questions badge</Badge>
                <Badge variant="purpose">Purpose badge</Badge>
                <Badge variant="fulfil">Fulfil badge</Badge>
                <Badge variant="dark">Dark badge</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="inputs" className="section-shell pt-0">
        <div className="container-pleros grid gap-6 lg:grid-cols-2">
          <Card size="lg">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Inputs
              </Badge>
              <CardTitle>Form controls use the same warmth as the surfaces</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--color-text-strong)]">
                  Your email
                </span>
                <Input type="email" placeholder="you@pleros.org" />
              </label>
              <label className="grid gap-2">
                <span className="text-sm font-medium text-[var(--color-text-strong)]">
                  Search state
                </span>
                <Input variant="muted" placeholder="Search by topic, need, or pathway" />
              </label>
              <div className="grid gap-3 sm:grid-cols-3">
                <Input variant="questions" placeholder="Questions" />
                <Input variant="purpose" placeholder="Purpose" />
                <Input variant="fulfil" placeholder="Fulfil" />
              </div>
            </CardContent>
          </Card>

          <Card tone="muted" size="lg">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Interactive primitives
              </Badge>
              <CardTitle>Dialog and sheet stay subtle</CardTitle>
              <CardDescription>
                Motion is short and direct so the components feel responsive without
                turning into a presentation.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Dialog>
                <DialogTrigger className={buttonVariants({ variant: "purpose" })}>
                  Open dialog
                </DialogTrigger>
                <DialogContent tone="purpose">
                  <DialogHeader>
                    <DialogTitle>Purpose dialog</DialogTitle>
                    <DialogDescription>
                      A soft branded modal for guided explanation, confirmations, or
                      structured prompts.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <Button variant="secondary">Not now</Button>
                    <Button variant="purpose">Continue</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>

              <Sheet>
                <SheetTrigger className={buttonVariants({ variant: "questions" })}>
                  Open sheet
                </SheetTrigger>
                <SheetContent side="right" tone="questions">
                  <SheetHeader>
                    <SheetTitle>Questions sheet</SheetTitle>
                    <SheetDescription>
                      Useful for mobile menus, contextual notes, and lightweight
                      supporting navigation.
                    </SheetDescription>
                  </SheetHeader>
                  <Accordion defaultValue={["sheet-item"]}>
                    <AccordionItem value="sheet-item" tone="questions">
                      <AccordionTrigger>Why use a sheet on mobile?</AccordionTrigger>
                      <AccordionContent>
                        It preserves the page rhythm and gives navigation room to breathe
                        without forcing a new screen.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </SheetContent>
              </Sheet>
            </CardContent>
          </Card>
        </div>
      </section>

      <section id="surfaces" className="section-shell pt-0">
        <div className="container-pleros grid gap-6">
          <div className="grid gap-2">
            <Badge variant="outline" className="w-fit">
              Surface system
            </Badge>
            <h2 className="h1 max-w-3xl text-[var(--color-text-strong)]">
              Neutral and themed cards live in the same family.
            </h2>
            <p className="body-lg max-w-2xl text-[var(--color-text-muted)]">
              Questions, purpose, and fulfil keep their own voices while borrowing the
              same spacing, radius, and shadow structure.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {surfaceCardTones.map((surface) => (
              <Card
                key={surface.label}
                tone={surface.tone}
                interactive
                className="min-h-56 justify-between"
              >
                <CardHeader>
                  <Badge
                    variant={
                      surface.tone === "dark"
                        ? "dark"
                        : surface.tone === "default" || surface.tone === "muted"
                          ? "outline"
                          : surface.tone
                    }
                    className="w-fit"
                  >
                    {surface.label}
                  </Badge>
                  <CardTitle>{surface.label}</CardTitle>
                  <CardDescription>{surface.description}</CardDescription>
                </CardHeader>
                <CardFooter className="justify-between text-sm">
                  <span>Radius-driven and mobile friendly</span>
                  <ArrowRightIcon className="size-4" />
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {themeSurfaceItems.map((theme) => (
              <Card key={theme.id} tone={theme.tone} size="lg" className="gap-5">
                <CardHeader>
                  <Badge variant={theme.badgeVariant} className="w-fit">
                    {theme.label}
                  </Badge>
                  <CardTitle>{theme.eyebrow}</CardTitle>
                  <CardDescription>{theme.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Accordion defaultValue={[`${theme.id}-item`]}>
                    <AccordionItem value={`${theme.id}-item`} tone={theme.tone}>
                      <AccordionTrigger>Where this surface works best</AccordionTrigger>
                      <AccordionContent>
                        Use this palette for sections that want a distinct emotional note
                        without leaving the core Pleros system.
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="radii" className="section-shell pt-0">
        <div className="container-pleros">
          <Card size="lg">
            <CardHeader>
              <Badge variant="outline" className="w-fit">
                Radii in use
              </Badge>
              <CardTitle>Rounded decisions stay consistent across the system</CardTitle>
              <CardDescription>
                The radius scale is visible here exactly as the existing tokens define it.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {radiusScale.map((radius) => (
                <div
                  key={radius.token}
                  className={cn(
                    "grid gap-3 border border-[var(--color-line)] bg-[var(--color-surface-muted)] p-4 shadow-[var(--shadow-sm)]",
                    radius.className,
                  )}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-[var(--color-text-strong)]">
                      {radius.label}
                    </span>
                    <code className="text-xs text-[var(--color-text-muted)]">
                      {radius.token}
                    </code>
                  </div>
                  <div
                    className={cn(
                      "h-20 border border-dashed border-[var(--color-line-strong)] bg-white",
                      radius.className,
                    )}
                  />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
