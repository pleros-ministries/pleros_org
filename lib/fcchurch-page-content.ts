export const fcchurchPageHero = {
  title: "Fullness of Christ Church",
  description:
    "Join us for worship, teaching, and fellowship as we grow together to fulfill God's purpose.",
} as const;

export const fcchurchAboutSection = {
  eyebrow: "About the church",
  title: "A family of purpose",
  description:
    "We're a family of believers grounded in the Word of Truth, committed to reaching people with the Gospel, and helping them grow to fulfill God's purpose.",
} as const;

export type ScheduleEntry = {
  type: "prayer" | "bible-study" | "sunday";
  label: string;
  time: string;
  venue?: string;
};

export type ContactPerson = {
  name: string;
  phone: string;
  href: string;
};

export type FcchurchLocation = {
  id: string;
  city: string;
  state: string;
  venueName: string;
  address: string;
  schedule: ScheduleEntry[];
  contacts: ContactPerson[];
};

export const fcchurchLocations: FcchurchLocation[] = [

  {
    id: "ibadan",
    city: "Ibadan",
    state: "Oyo",
    venueName: "ROFEL Hotel",
    address: "15 Moremi Estate, off Aare Avenue, New Bodija, Ibadan",
    schedule: [
      {
        type: "prayer",
        label: "Prayer Meeting",
        time: "Monday · 5:30 pm",
        venue: "Chapel of Resurrection Tarmac, University of Ibadan",
      },
      {
        type: "bible-study",
        label: "Bible Study",
        time: "Thursday · 6 pm",
        venue: "BNI Building, Opp. Queen Idia Hall, UI",
      },
      {
        type: "sunday",
        label: "Sunday Service",
        time: "Sunday · 8 am",
        venue: "ROFEL Hotel, New Bodija",
      },
    ],
    contacts: [
      {
        name: "Daniel Adeyemo",
        phone: "08100569867",
        href: "tel:+2348100569867",
      },
    ],
  },
  {
    id: "kwara",
    city: "Ilorin",
    state: "Kwara",
    venueName: "Faraday Educational Consult",
    address: "Chapel Junction, University Road, Ilorin",
    schedule: [
      {
        type: "prayer",
        label: "Prayer Meeting",
        time: "Monday · 5:30 pm",
        venue: "Faraday Educational Consult, Chapel Junction",
      },
      {
        type: "bible-study",
        label: "Bible Study",
        time: "Thursday · 6 pm",
        venue: "Faraday Educational Consult, Chapel Junction",
      },
      {
        type: "sunday",
        label: "Sunday Service",
        time: "Sunday · 8 am",
        venue: "Faraday Educational Consult, Chapel Junction",
      },
    ],
    contacts: [
      { name: "Grace", phone: "08147044321", href: "tel:+2348147044321" },
      { name: "Grace", phone: "09164216552", href: "tel:+2349164216552" },
    ],
  },

  {
    id: "lagos",
    city: "Lagos",
    state: "Lagos",
    venueName: "Maritime Overflow, UNILAG",
    address:
      "Opposite Maritime Department, beside Main Auditorium, Sapara Road, University of Lagos",
    schedule: [
      {
        type: "prayer",
        label: "Prayer Meeting",
        time: "Monday · 6–8 pm",
        venue: "Maritime Overflow, UNILAG",
      },
      {
        type: "bible-study",
        label: "Bible Study",
        time: "Thursday · 6–8 pm",
        venue: "Maritime Overflow, UNILAG",
      },
      {
        type: "sunday",
        label: "Sunday Service",
        time: "Sunday · 8:30–11 am",
        venue: "Maritime Overflow, UNILAG",
      },
    ],
    contacts: [
      {
        name: "Oluseyi Onashile",
        phone: "09065000699",
        href: "tel:+2349065000699",
      },
      {
        name: "Ayotomiwa Sodeinde",
        phone: "08166001029",
        href: "tel:+2348166001029",
      },
    ],
  },
  {
    id: "ife",
    city: "Ile-Ife",
    state: "Osun",
    venueName: "Former Indigo, Oduduwa Estate",
    address: "Oduduwa Estate, Ibadan Road, Ile-Ife",
    schedule: [
      {
        type: "prayer",
        label: "Prayer Meeting",
        time: "Monday · 5:30–7:30 pm (Campus) / 7–9 am (Town)",
      },
      {
        type: "bible-study",
        label: "Bible Study",
        time: "Friday · 6–8 pm",
      },
      {
        type: "sunday",
        label: "Sunday Service",
        time: "1st Session · 8–10 am  ·  2nd Session · 10 am–12 pm",
      },
    ],
    contacts: [
      {
        name: "David Adeyemi",
        phone: "09013333336",
        href: "tel:+2349013333336",
      },
      {
        name: "David Adeyemi",
        phone: "09013333338",
        href: "tel:+2349013333338",
      },
    ],
  },
  {
    id: "calabar",
    city: "Calabar",
    state: "Cross River",
    venueName: "University of Calabar (UNICAL)",
    address: "University of Calabar, Calabar, Cross River State",
    schedule: [
      {
        type: "prayer",
        label: "Prayer Meeting",
        time: "Monday · 5:30–7:30 pm",
      },
      {
        type: "bible-study",
        label: "Bible Study",
        time: "Friday · 5–7 pm",
      },
      {
        type: "sunday",
        label: "Sunday Service",
        time: "Sunday · 8:30–11 am",
      },
    ],
    contacts: [
      {
        name: "Gabriel Monday Edet",
        phone: "09163889027",
        href: "tel:+2349163889027",
      },
    ],
  },
];

export const fcchurchOnlineSection = {
  eyebrow: "Can't join in person?",
  title: "Join us online",
  description:
    "We encourage you to fellowship with a local church in person. But if you can't, you're welcome to join our live services wherever you are.",
  streamLabel: "Watch on YouTube",
  streamHref: "https://www.youtube.com/@PlerosLive",
} as const;
