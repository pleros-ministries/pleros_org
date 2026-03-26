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
  "Your daily dose of God's Word helping you fulfil God's purpose";

function buildDriveThumbnailSrc(fileId: string): string {
  return `https://lh3.googleusercontent.com/d/${fileId}=w1200`;
}

export const purposePathwayVideos: PurposePathwayVideoItem[] = [
  {
    id: "gods-purpose-01",
    title: "What is God's Purpose? (Part 1)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1t3Q2A73kPwmo6azHNXImYCjCKTjhnA54"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1t3Q2A73kPwmo6azHNXImYCjCKTjhnA54/preview",
  },
  {
    id: "gods-purpose-02",
    title: "What is God's Purpose? (Part 2)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1YQDScqhn7CLszSwSNX5L3oMqIjJVehv4/preview",
  },
  {
    id: "gods-purpose-03",
    title: "What is God's Purpose? (Part 3)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1jyF70_5Iap2QGQFKhhoAXAqts8r3vZ2a"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1jyF70_5Iap2QGQFKhhoAXAqts8r3vZ2a/preview",
  },
  {
    id: "gods-purpose-04",
    title: "What is God's Purpose? (Part 4)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1zJl9EMAekmK0NQi2S5q4n7B4dWCSaguB"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1zJl9EMAekmK0NQi2S5q4n7B4dWCSaguB/preview",
  },
  {
    id: "gods-purpose-05",
    title: "What is God's Purpose? (Part 5)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1yFtmqVUiw2j5ck-DmhX5-CJkOhaCnsIL"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1yFtmqVUiw2j5ck-DmhX5-CJkOhaCnsIL/preview",
  },
  {
    id: "gods-purpose-06",
    title: "What is God's Purpose? (Part 6)",
    description: sharedVideoDescription,
    thumbnailSrc: buildDriveThumbnailSrc("1ByY9J8Yk29zal7KXi23hopyCejZR9Grk"),
    playIconSrc: sharedPlayIconSrc,
    href: "https://drive.google.com/file/d/1ByY9J8Yk29zal7KXi23hopyCejZR9Grk/preview",
  },
];
