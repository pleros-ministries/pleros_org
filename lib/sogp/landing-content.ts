import { aboutPageMinisterFollow } from "../about-page-content";

export const sogpLandingContent = {
  hero: {
    eyebrow: "School of God’s Purpose",
    title: "Find Truth, Discover God’s Purpose, Grow to fulfill it with SOGP",
    description:
      "Get answers to difficult questions about God, gain clarity on God’s purpose for your life, and receive the transformation and empowerment needed to fulfill it.",
    ctaLabel: "Enroll for free",
    ctaHref: "/sogp/enroll",
  },
  outcomes: [
    "Get Clarity on Difficult Questions about God, His truth and His Word",
    "Discover God’s Purpose for Your Life",
    "Be transformed and strengthened to walk in God’s will",
    "Learn how to receive and minister healing and the supernatural",
    "Be empowered to pursue and fulfill God’s purpose for your life",
  ],
  definition: {
    title: "What is SOGP",
    description:
      "The School of God’s Purpose is the single platform that provides answers to life’s most foundational questions, provides edification to radically transform you whilst empowering and stirring you to fulfill God’s purpose for your life.",
  },
  audiences: [
    "a. Those in unbelief or doubt about God’s existence or the Christian faith but seeking answers to those questions.",
    "b. Those with questions and doubts about God’s purpose for their lives",
    "c. Those desiring spiritual growth and transformation especially in character—such as changing habits or breaking difficult addictions",
    "d. Those desiring to receive and minister divine healing for themselves and others",
    "e. Those desiring empowerment to walk and function in the supernatural",
    "f. Those desiring to understand God’s wisdom on their natural pursuits (career, business, etc.) and their finances",
    "g. Anyone who wants a stronger walk with God and hungers to fulfill His purpose.",
  ],
  curriculum: {
    title: "Curriculum of SOGP",
    tracks: [
      { level: "Level 1", title: "Gospel: The Word of Truth" },
      { level: "Level 1", title: "God's Purpose: Why We Exist" },
      {
        level: "Level 1",
        title: "The New Creation: Who You Are in Christ",
      },
      { level: "Level 1", title: "Faith Stand: How to Grow in Christ" },
      { level: "Level 1", title: "Commitment: How to Fulfil Purpose" },
      { level: "Level 2", title: "Introduction to Doctrinal Summaries" },
      { level: "Level 2", title: "Bibliology" },
      { level: "Level 2", title: "God and His Eternal Purpose" },
      { level: "Level 2", title: "Biblical Origin and Ontology" },
      { level: "Level 2", title: "Sin and Its Implication" },
      { level: "Level 2", title: "God's Wisdom Towards Redemption" },
      { level: "Level 2", title: "Christology" },
      { level: "Level 2", title: "Redemption" },
      { level: "Level 2", title: "Church and Its Mission" },
      { level: "Level 2", title: "Eschatology" },
      { level: "Level 2", title: "The New Creation" },
    ],
  },
  structure: {
    title: "The Structure of SOGP",
    description:
      "The School of God’s Purpose has a fixed structure that is designed to accommodate the flexible demands of all kinds and classes of people - students, working class, retired. Whether you are a freelancer, 9-5er or a busy entrepreneur, this structure was made with you in mind.",
  },
  enrollment: {
    title: "Enrollment Requirement",
    description:
      "As of today, SOGP is being offered FREE to all participants. All you need is readiness, availability to listen, learn and participate through the period of the school. With a smartphone and a laptop at your disposal for one month you can begin and complete the School of God’s Purpose",
  },
  tools: {
    title: "Tools and Platforms needed to engage:",
    items: [
      "We use Telegram for the group and community.",
      "We use the Pleros Dashboard for the course materials.",
    ],
  },
  benefits: {
    title: "More Reasons and Benefits to Join",
    items: [
      "Flexibility: Self-paced",
      "Accessibility: Worldwide",
      "Confidentiality: You can stay private throughout the entire process",
      "Community: You can enjoy the benefits of a community in doctrinal dialogue and debates, prayer and fellowship",
      "Easy and simple communication",
      "Accountability: You can choose to have a direct accountability partner to help your progress and growth in the faith",
    ],
  },
  facilitator: {
    title: "Lead Facilitator",
    name: aboutPageMinisterFollow.name,
    handle: aboutPageMinisterFollow.handle,
    imageSrc: "/assets/home/pastor.jpg",
    links: aboutPageMinisterFollow.links,
  },
  socialProof: [] as Array<{ quote: string; name: string }>,
  faqs: [
    {
      question: "What does SOGP cost?",
      answer: "Currently completely free.",
    },
    {
      question: "Can I join if I attend another church?",
      answer: "Yes. No church-membership change required.",
    },
    {
      question: "Who can enrol?",
      answer:
        "Anyone seeking truth, purpose, spiritual growth, or answers about Christianity.",
    },
    {
      question: "How long does it take?",
      answer:
        "Four-week guided cohort: weekday tracks and weekend live classes.",
    },
    {
      question: "Is it self-paced?",
      answer:
        "Guided schedule, with flexibility to catch up and finish outstanding work.",
    },
    {
      question: "What do I need?",
      answer:
        "Internet-enabled smartphone or laptop, Telegram, and Pleros Dashboard access.",
    },
    {
      question: "How do I earn certification?",
      answer:
        "Complete required tracks and assessments, daily podcast logging, and at least 80% Morning Prayer Watch attendance.",
    },
  ],
} as const;
