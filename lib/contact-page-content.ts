export const contactPageHero = {
  title: "Contact Us",
  description:
    "Have a question or want to connect? Ask us anything — we'd love to hear from you.",
} as const;

export const contactPageLeadLines = [
  "Reach out to us.",
  "Your journey matters.",
] as const;

export const contactPageIntro =
  "We're a ministry committed to helping you fulfil God's purpose. We are open to all your questions and inquiries. Get in touch!" as const;

export const contactFormFields = [
  { id: "full-name", name: "fullName", placeholder: "Full Name", type: "text" },
  { id: "email-address", name: "email", placeholder: "Email Address", type: "email" },
  { id: "phone-number", name: "phone", placeholder: "Phone Number", type: "tel" },
  { id: "location", name: "location", placeholder: "Location", type: "text" },
] as const;

export const contactMessagePlaceholder = "Write your Message";
export const contactSubmitLabel = "SEND MESSAGE";
