import Image from "next/image";
import Link from "next/link";

import type { HomePathwayCard } from "../../lib/site-homepage-content";
import { Card, CardContent } from "../ui/card";

export function HomepagePathwayCard({
  title,
  description,
  mobileDescription,
  href,
  headerImageSrc,
  wordmarkImageSrc,
  surfaceClassName,
  headerClassName,
}: HomePathwayCard) {
  return (
    <Link href={href} className="group block min-w-0">
      <Card
        className={`relative h-[13.75rem] gap-0 overflow-hidden rounded-[10.6px] border-0 p-0 shadow-none ${surfaceClassName}`}
      >
        <div className={`relative h-[6.6rem] overflow-hidden ${headerClassName}`}>
          {headerImageSrc ? (
            <Image
              src={headerImageSrc}
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 767px) 50vw, 249px"
            />
          ) : null}

          {wordmarkImageSrc ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Image
                src={wordmarkImageSrc}
                alt=""
                width={95}
                height={46}
                className="h-[2.45rem] w-auto"
              />
            </div>
          ) : null}
        </div>

        <CardContent className="flex flex-1 flex-col justify-between gap-2 px-3 pb-3.5 pt-3 text-white sm:p-4">
          <div className="grid gap-1.5">
            <h2 className="site-pathway-title">{title}</h2>
            <p className="text-[0.76rem] leading-[1.1] font-medium tracking-[-0.018em] text-white/96">
              {mobileDescription ?? description}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
