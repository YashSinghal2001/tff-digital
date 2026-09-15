export interface FAQItem {
  question: string;
  answer: string;
}

// Plain data module (no "use client") so Server Components — page-level
// JSON-LD (FAQPage) in particular — can import `faqs` directly. A "use
// client" module's non-component exports aren't reliably readable from
// server-rendered code, so this couldn't live inside FAQ.tsx itself.
export const faqs: FAQItem[] = [
  {
    question: "How is TFF different from other agencies?",
    answer:
      "We integrate strategy, brand, and performance marketing into one accountable team instead of handing you off between disconnected vendors.",
  },
  {
    question: "How quickly will I see results?",
    answer:
      "Most clients see early signal within the first 30-60 days, with compounding results building over the first two quarters.",
  },
  {
    question: "Do you work with businesses of my size?",
    answer:
      "We work with ambitious teams from early-stage startups to established mid-market companies ready to invest in growth.",
  },
  {
    question: "What does a typical engagement look like?",
    answer:
      "We start with a discovery and research sprint, build a prioritized roadmap, then move into design, launch, and ongoing optimization.",
  },
  {
    question: "How quickly will I hear back?",
    answer: "We reply to every inquiry within 24 hours, Monday through Friday.",
  },
];
