export const partnerPageHero = {
  title: "Partner with Us",
  description: "Building Together for God’s Purpose",
  intro:
    "At PLEROS Ministries & Missions, partnership is how we join hands to reach people across generations with the word of truth of the Gospel, through every possible means online and offline, so they are saved, established, and helped to fulfil God’s purpose.",
  ctaLabel: "Become a partner",
} as const;

export const partnerWhatsappHref =
  "#partner" as const;

export const partnerReasons = [
  {
    step: "1",
    title: "Advance the Gospel",
    description:
      "Your partnership helps spread the Gospel through our online and offline outreaches.",
  },
  {
    step: "2",
    title: "Raise Disciples",
    description:
      "Together, we equip believers to grow spiritually, discover purpose, and walk in God’s purpose for their lives.",
  },
  {
    step: "3",
    title: "Extend the Influence of Truth",
    description:
      "Your support enables us to reach more nations, plant seeds of truth, and help many fulfil God’s purpose.",
  },
] as const;

export const partnerImpactItems = [
  "Teaching & Discipleship Programmes",
  "Missionary Outreach & Evangelism",
  "Digital Ministry & Online Resources",
] as const;

export const partnerGivingSection = {
  eyebrow: "Giving channels",
  title: "Give to Pleros",
  description:
    "You can give directly by bank transfer, or via card and international payment options.",
} as const;

export const partnerBankAccount = {
  bankName: "Providus Bank",
  accountName: "PLEROS MINISTRIES AND MISSIONS",
  accountNumber: "1310000564",
} as const;

export const partnerGivingChannelLabels = {
  bank: "Bank Transfer",
  online: "Pay Online",
} as const;

export const partnerPayOnlineCopy = {
  helperText:
    "Give securely by card in Naira or US Dollars, powered by Paystack.",
  minimumAmount: 100,
  currencies: {
    NGN: { code: "NGN", symbol: "₦" },
    USD: { code: "USD", symbol: "$" },
  },
  submitLabel: "Give now",
  submittingLabel: "Processing…",
  verifyingLabel: "Confirming payment…",
  successTitle: "Thank you for your gift!",
  successMessage: "Your payment was received and confirmed. God bless you.",
  genericErrorMessage:
    "Something went wrong with your payment. Please try again.",
} as const;
