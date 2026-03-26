import Image from "next/image";

const welcomePackCards = [
  {
    title: "Introduction to God's Purpose",
    imageSrc: "/site/home/assets/welcome-pack-cards/purpose-welcome-card.svg",
  },
  {
    title: "The Gospel Answers You",
    imageSrc: "/site/home/assets/welcome-pack-cards/ga-welcome-card.svg",
  },
] as const;

export function WelcomePackPage() {
  return (
    <section className="site-font-theme bg-[var(--color-surface)] pb-10 pt-5 sm:pb-12 sm:pt-6">
      <div className="container-pleros max-w-[36rem] grid gap-12">
        <div className="grid gap-2">
          <h1 className="site-hero-heading max-w-[11ch] text-[clamp(2.4rem,6.2vw,3.45rem)] text-[var(--color-brand-blue)]">
            Access your Welcome Pack here
          </h1>
          <p className="site-section-heading text-[1.75rem] text-[var(--color-brand-blue)] sm:text-[2rem]">
            We&apos;re glad to have you!
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {welcomePackCards.map((card) => (
            <div
              key={card.title}
              className="overflow-hidden rounded-[0.6875rem] shadow-[0_12px_26px_rgba(15,23,40,0.08)]"
            >
              <div className="overflow-hidden rounded-[0.6875rem]">
                <Image
                  src={card.imageSrc}
                  alt={card.title}
                  width={253}
                  height={355}
                  className="h-auto w-full"
                  priority={card.title === "Introduction to God's Purpose"}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
