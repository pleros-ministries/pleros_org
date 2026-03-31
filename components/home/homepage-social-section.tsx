"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import type { InstagramPost } from "../../lib/homepage-feed";
import { homeInstagramProfileUrl } from "../../lib/site-homepage-content";

type HomepageSocialSectionProps = {
  posts: InstagramPost[];
};

export function HomepageSocialSection({ posts }: HomepageSocialSectionProps) {
  const [livePosts, setLivePosts] = useState(posts);

  useEffect(() => {
    setLivePosts(posts);
  }, [posts]);

  useEffect(() => {
    if (posts.length) {
      return;
    }

    let isActive = true;

    void fetch("/api/social/instagram", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return { posts: [] as InstagramPost[] };
        }

        return (await response.json()) as { posts?: InstagramPost[] };
      })
      .then((payload) => {
        if (!isActive || !Array.isArray(payload.posts) || !payload.posts.length) {
          return;
        }

        setLivePosts(payload.posts);
      })
      .catch(() => undefined);

    return () => {
      isActive = false;
    };
  }, [posts]);

  return (
    <section
      id="socials"
      className="bg-[#EDFFEB] px-[1.5625rem] pb-[6.25rem] pt-[4.9375rem]"
    >
      <div className="grid gap-[1.8125rem]">
        <div className="grid justify-items-center gap-[0.94rem] text-center">
          <h2 className="site-section-heading max-w-[30.9375rem]">
            Follow for Daily Videos on Purpose and Gospel Answers
          </h2>
          <Link
            href={homeInstagramProfileUrl}
            target="_blank"
            rel="noreferrer"
            className="site-button-text inline-flex min-h-[2.875rem] items-center justify-center rounded-full bg-[var(--color-brand-blue)] px-6 py-2.5 text-[0.875rem] leading-none font-semibold text-white"
          >
            Follow Us
          </Link>
        </div>

        {livePosts.length ? (
          <div className="-mx-[1px] flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {livePosts.map((post) => (
              <Link
                key={post.id}
                href={post.href}
                target="_blank"
                rel="noreferrer"
                className="group w-[20.5rem] shrink-0 snap-start overflow-hidden rounded-[1.125rem] border border-[rgba(6,16,86,0.1)] bg-white shadow-[0_14px_34px_rgba(6,16,86,0.08)]"
              >
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <div className="flex size-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,#F58529,#DD2A7B,#8134AF)] p-[1.5px]">
                    {post.profileImageUrl ? (
                      <div className="relative size-full overflow-hidden rounded-full bg-white">
                        <Image
                          src={post.profileImageUrl}
                          alt="Pleros Ministries profile photo"
                          fill
                          className="object-cover"
                          sizes="36px"
                        />
                      </div>
                    ) : (
                      <div className="flex size-full items-center justify-center rounded-full bg-white">
                        <Image
                          src="/site/home/assets/social-media-icons/instagram-icon.svg"
                          alt=""
                          width={16}
                          height={16}
                          className="size-4"
                        />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-[0.875rem] leading-none font-semibold tracking-[-0.02em] text-[var(--color-text-strong)]">
                      @pleros_org
                    </p>
                    <p className="mt-1 text-[0.6875rem] leading-none font-medium tracking-[0.01em] text-[rgba(6,16,86,0.62)]">
                      {new Intl.DateTimeFormat("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }).format(new Date(post.takenAt * 1000))}
                    </p>
                  </div>
                </div>

                <div className="relative aspect-square overflow-hidden bg-[rgba(5,20,128,0.04)]">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    className="object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                    sizes="328px"
                  />
                </div>

                <div className="grid gap-3 px-3.5 pb-4 pt-3.5">
                  <div className="flex items-center justify-between gap-3 text-[0.6875rem] leading-none font-medium tracking-[0.01em] text-[rgba(6,16,86,0.62)]">
                    <span>Latest from Instagram</span>
                    <span className="uppercase">Watch reel</span>
                  </div>

                  <div className="grid gap-1.5">
                    <h3 className="site-social-post-title">{post.title}</h3>
                    <p className="text-[0.8125rem] leading-[1.38] tracking-[-0.018em] text-[rgba(6,16,86,0.72)]">
                      {post.title}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-[1.125rem] border border-[rgba(6,16,86,0.08)] bg-[rgba(6,16,86,0.04)] px-4 py-5 text-[0.95rem] leading-[1.45] tracking-[-0.02em] text-[rgba(6,16,86,0.72)]">
            Instagram posts are temporarily unavailable. Use the button above to
            open the full profile.
          </div>
        )}
      </div>
    </section>
  );
}
