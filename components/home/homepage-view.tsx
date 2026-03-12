"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRightIcon,
  HeadphonesIcon,
  MessageCircleHeartIcon,
  SquarePlayIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/home/section-heading";
import { PathwayHero } from "@/components/home/pathway-hero";
import { WelcomePackModal } from "@/components/home/welcome-pack-modal";
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
  latestPodcastEpisode,
  libraryPreviews,
  socialShellItems,
} from "@/lib/homepage-content";

export function HomepageView() {
  const [welcomeModalRequest, setWelcomeModalRequest] = useState(0);

  const openWelcomeModal = () => {
    setWelcomeModalRequest((current) => current + 1);
  };

  return (
    <>
      <WelcomePackModal openRequest={welcomeModalRequest} />

      <PathwayHero />

      <section id="podcast" className="pt-14 pb-16 sm:pt-18 sm:pb-20">
        <div className="container-pleros grid gap-9 sm:gap-10">
          <SectionHeading
            title="Stay full of the Word with the Pleros Podcast"
            subtitle="Available on every platform you get your podcasts"
            className="max-w-2xl"
          />

          <Card tone="default" interactive className="max-w-3xl">
            <CardHeader className="gap-2">
              <Badge variant="outline">Latest episode</Badge>
              <CardTitle>{latestPodcastEpisode.title}</CardTitle>
              <CardDescription>
                {latestPodcastEpisode.platform} - {latestPodcastEpisode.duration} -{" "}
                {latestPodcastEpisode.date}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button variant="secondary" render={<Link href="/podcast" />}>
                Listen to all episodes
                <ArrowRightIcon />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section id="library" className="section-shell-tight">
        <div className="container-pleros grid gap-6">
          <SectionHeading
            title="Explore our library"
            subtitle="Teachings on every subject matter for your growth and walk in God's purpose."
          />

          <div className="grid gap-4 md:grid-cols-3">
            {libraryPreviews.map((item) => (
              <Card key={item.id} tone="muted" interactive>
                <CardHeader>
                  <Badge variant="outline">{item.topic}</Badge>
                  <CardTitle>{item.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[var(--color-text-muted)]">{item.length}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div>
            <Button variant="secondary" render={<Link href="/library" />}>
              Go to library
              <ArrowRightIcon />
            </Button>
          </div>
        </div>
      </section>

      <section id="community" className="section-shell-tight">
        <div className="container-pleros grid gap-6">
          <SectionHeading
            title="Join the Pleros Community"
            subtitle="Stay full of prayer and the Word."
          />

          <Card tone="muted" className="max-w-4xl">
            <CardHeader>
              <Badge>WhatsApp community</Badge>
              <CardTitle>Prayer updates, teaching drops, and fellowship rhythm</CardTitle>
              <CardDescription>
                A clean community touchpoint for people walking the journey together.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button
                variant="primary"
                render={
                  <a
                    href="https://chat.whatsapp.com/"
                    target="_blank"
                    rel="noreferrer"
                  />
                }
              >
                Join on WhatsApp
                <MessageCircleHeartIcon />
              </Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      <section id="socials" className="section-shell-tight">
        <div className="container-pleros grid gap-6">
          <SectionHeading
            title="Socials"
            subtitle="Shell section for future embedded Instagram content and updates."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {socialShellItems.map((item) => (
              <Card key={item.id} tone="default">
                <CardHeader>
                  <Badge variant="outline">{item.platform}</Badge>
                  <CardTitle>{item.handle}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-line-strong)] bg-[var(--color-surface-muted)] p-4 text-sm text-[var(--color-text-muted)]">
                    Embed placeholder shell
                  </div>
                </CardContent>
                <CardFooter>
                  <span className="text-xs text-[var(--color-text-muted)]">{item.note}</span>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="section-shell">
        <div className="container-pleros">
          <div className="surface-dark grid gap-5 p-6 sm:p-8">
            <div className="grid gap-2">
              <h2 className="h2 text-[var(--color-text-on-dark)]">
                Download your free welcome pack
              </h2>
              <p className="body muted-on-dark">
                Start your journey with these free Pleros resources
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary" onClick={openWelcomeModal}>
                Access your Welcome Pack
                <HeadphonesIcon />
              </Button>
              <Button variant="outline" render={<Link href="/podcast" />}>
                Explore podcast first
                <SquarePlayIcon />
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
