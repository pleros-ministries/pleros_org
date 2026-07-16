export const fcchurchPageHero = {
  title: "Fullness of Christ Church",
  description:
    "Join us for worship, teaching, and fellowship as we grow together to fulfill God's purpose.",
} as const;

export type FcchurchLocation = {
  id: string;
  venueName: string;
  address: string;
  serviceTime: string;
  contactLabel: string;
  contactHref: string;
};

export const fcchurchLocations: FcchurchLocation[] = [
  {
    id: "location-1",
    venueName: "[Venue name]",
    address: "[Street address, City]",
    serviceTime: "[Service day & time]",
    contactLabel: "[Contact phone number]",
    contactHref: "tel:+2340000000000",
  },
  {
    id: "location-2",
    venueName: "[Venue name]",
    address: "[Street address, City]",
    serviceTime: "[Service day & time]",
    contactLabel: "[Contact phone number]",
    contactHref: "tel:+2340000000000",
  },
];

export const fcchurchOnlineSection = {
  eyebrow: "Can't join in person?",
  title: "Join us online",
  description:
    "Watch our services live and stay connected with FCC wherever you are.",
  streamLabel: "Watch on YouTube",
  streamHref: "https://www.youtube.com/@PlerosLive",
} as const;
