export interface Testimonial {
  id: string;
  title: string;
  rating: number;
  dateRange: string;
  review: string;
  endorsements: string[];
  freelancerResponse?: string;
}

/**
 * Verbatim client feedback from Upwork contracts. Do not paraphrase,
 * shorten, or invent copy here — ratings, dates, and endorsement tags
 * must match the source contracts exactly.
 */
export const testimonials: Testimonial[] = [
  {
    id: "social-media-expert-youtuber",
    title: "Social Media Expert & YouTuber",
    rating: 4,
    dateRange: "Jul 27, 2026 - Aug 11, 2026",
    review:
      "Kanchan and her team were better than I expected. I have worked with quite a few freelancers and it has been painful to get them to understand my goals, my objectives and the results I expect but Kanchan and her team understood that immediately and went to work. In the second week, we were already trending on YouTube and I have no doubt that we will meet all our objectives within the stipulated project timeline. I am ending this contract to iron out details to do with Upwork policies and guidelines and I am starting a new contract right away. You couldn't make a better choice by choosing her team to work with. Please feel free to use me as a reference if you need one in order to hire her services. Thank you Jillian Haslam",
    endorsements: ["Social Media Marketing Strategy", "Social Media Strategies", "Clear Communicator"],
  },
  {
    id: "on-page-seo-cleanup-wordpress",
    title: "On-Page SEO Cleanup & Optimization for WordPress Website",
    rating: 5,
    dateRange: "Sep 17, 2025 - Jan 7, 2026",
    review:
      "It was a pleasure working with Kanchan and her team. She is very dedicated, professional, and always available to help resolve any issues quickly. After just three months of working together, I’m already seeing results. Communication has been smooth and reliable throughout. I’m happy to continue working with her and would definitely recommend her.",
    endorsements: ["Reliable", "Collaborative", "Solution Oriented", "Clear Communicator", "Professional"],
  },
  {
    id: "google-ads-specialist",
    title: "Looking for a google ads specialist",
    rating: 5,
    dateRange: "Aug 2, 2025 - Sep 18, 2025",
    review:
      "I had a great experience Kanchan. Very helpful, punctual, and professional. I would definitely recommend whether it’s about Google Ads, marketing, or other web services. Thanks again.",
    endorsements: ["Solution Oriented", "Reliable", "Professional"],
  },
  {
    id: "graphic-designer-social-media-video",
    title: "Graphic Designer Needed for Social Media Assets and Video Production",
    rating: 5,
    dateRange: "Nov 2, 2024 - Nov 4, 2024",
    review:
      "Thank you for quickly finishing the job, taking feedback, and completing the job quickly!",
    endorsements: ["Reliable", "Collaborative"],
    freelancerResponse: "Thank you",
  },
  {
    id: "local-site-seo",
    title: "Local Site SEO",
    rating: 5,
    dateRange: "Aug 5, 2021 - Oct 1, 2021",
    review:
      "Kanchan was a pleasure to work with and did the work well and on time. Very pleased with results.",
    endorsements: ["Collaborative", "Reliable"],
  },
  {
    id: "seo-principles-website-rankings",
    title: "Apply SEO principles to Increase my website rankings on search engines.",
    rating: 5,
    dateRange: "Nov 12, 2019 - Mar 13, 2020",
    review:
      "Kanchan was clear about the services she would offer for SEO optimization, and the results she could deliver. I felt she was systematic and thorough in her approach and effective with her use of time. She kept me informed along the way and advised where my input was needed, in a timely manner. Overall, I'm very pleased and would gladly work with Kanchan, again!",
    endorsements: ["Clear Communicator", "Collaborative", "Detail Oriented"],
  },
];
