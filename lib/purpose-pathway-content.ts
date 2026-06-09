export type PurposePathwayHero = {
  title: string;
  description: string;
  illustrationSrc: string;
};

export type PurposePathwayVideoItem = {
  id: string;
  title: string;
  description: string;
  thumbnailSrc: string;
  playIconSrc: string;
  href: string;
};

export const purposePathwayHero: PurposePathwayHero = {
  title: "Discover Purpose",
  description: "Do you have doubts about God and/or the Gospel?",
  illustrationSrc: "/site/home/assets/discover-pathway/discover-header-icon.svg",
};

const sharedPlayIconSrc =
  "/site/home/assets/questions-pathway/video-circle-icon.png";

const sharedVideoDescription =
  "Your daily dose of God's Word helping you fulfill God's purpose";

function buildDriveThumbnailSrc(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
}

const uploadThingPurposeVideoUrls = {
  "gods-purpose-01":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfre0q9MBt0SwW8Jhfc1YqsjZEAzHnGivQD5po",
  "gods-purpose-02":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfKdzAFmtrd2xJU9QLNTm65YMRqw3cOiAhp4fB",
  "gods-purpose-03":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfaTaCZD6FEzZxA49tLVybfpnrmaPeBYD256dw",
  "gods-purpose-04":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfqQHseHVaVf0zYIgnd8AkUqlRHSXEvW3wK1rQ",
  "gods-purpose-05":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfM8UBAyZNzEjyqYasUGDrxkQeP0n28iWJl1hb",
  "gods-purpose-06":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfZLHRs0SAkQWloJGzabH2rgNULZvI9hB1cfpK",
  "gods-purpose-07":
    "https://jqhxdgo3h8.ufs.sh/f/3pDCanj1aBdfhXTG1e8MbI2mgJarcYuFdAHfLs5wi1ZjKhGU",
} as const;

const purposePartSixThumbnailSrc = buildDriveThumbnailSrc(
  "1ByY9J8Yk29zal7KXi23hopyCejZR9Grk",
);

export const purposePathwayVideos: PurposePathwayVideoItem[] = [
  {
    id: "gods-purpose-01",
    title: "What is God's Purpose? (Part 1)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1t3Q2A73kPwmo6azHNXImYCjCKTjhnA54"),
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-01"],
  },
  {
    id: "gods-purpose-02",
    title: "What is God's Purpose? (Part 2)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4"),
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-02"],
  },
  {
    id: "gods-purpose-03",
    title: "What is God's Purpose? (Part 3)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1jyF70_5Iap2QGQFKhhoAXAqts8r3vZ2a"),
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-03"],
  },
  {
    id: "gods-purpose-04",
    title: "What is God's Purpose? (Part 4)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1zJl9EMAekmK0NQi2S5q4n7B4dWCSaguB"),
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-04"],
  },
  {
    id: "gods-purpose-05",
    title: "What is God's Purpose? (Part 5)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1yFtmqVUiw2j5ck-DmhX5-CJkOhaCnsIL"),
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-05"],
  },
  {
    id: "gods-purpose-06",
    title: "What is God's Purpose? (Part 6)",
    description: sharedVideoDescription,
    thumbnailSrc: purposePartSixThumbnailSrc,
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-06"],
  },
  {
    id: "gods-purpose-07",
    title: "What is God's Purpose? (Part 7)",
    description: sharedVideoDescription,
    thumbnailSrc: purposePartSixThumbnailSrc,
    playIconSrc: sharedPlayIconSrc,
    href: uploadThingPurposeVideoUrls["gods-purpose-07"],
  },
];
