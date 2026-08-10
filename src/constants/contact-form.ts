// Shared between the client-side ContactForm (src/features/contact/ContactForm.tsx)
// and the server-only lead email templates (src/lib/email/templates) so both
// render the same human-readable labels for a given form value, without
// duplicating — or importing across the client/server boundary for — this list.
export const serviceOptions = [
  { label: "SEO", value: "seo" },
  { label: "Social Media Marketing", value: "smm" },
  { label: "Web Design & Development", value: "web-design" },
  { label: "Branding", value: "branding" },
  { label: "Google & Meta Ads", value: "paid-ads" },
  { label: "Conversion Rate Optimization", value: "cro" },
  { label: "Other", value: "other" },
];

export const budgetOptions = [
  { label: "Under $2k / mo", value: "under-2k" },
  { label: "$2k – $5k / mo", value: "2k-5k" },
  { label: "$5k – $10k / mo", value: "5k-10k" },
  { label: "$10k+ / mo", value: "10k-plus" },
];
