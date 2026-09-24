import assert from "node:assert/strict";
import test, { afterEach, describe, mock } from "node:test";
import { existsSync, readFileSync } from "node:fs";

import {
  homePreviewFaq,
  homePreviewFounders,
  homePreviewServiceCopy,
  homePreviewTestimonials,
  richTextToPlain,
} from "../../data/home-preview-content.ts";
import { testimonials } from "../../data/testimonials.ts";
import { isReservedPageSlug } from "../../lib/content/reserved-page-slugs.ts";

// /home-preview: staging copy of the homepage carrying the client's homepage
// PDF. .tsx can't load under this runner, so page wiring is pinned by source;
// copy, auth and sitemap are exercised for real.

const PREVIEW = readFileSync(new URL("./page.tsx", import.meta.url), "utf8");
const HOME = readFileSync(new URL("../page.tsx", import.meta.url), "utf8");
const ABOUT_JOURNEY = readFileSync(
  new URL("../../sections/home/AboutJourney.tsx", import.meta.url),
  "utf8",
);

const SECTION_TAGS =
  /<(HeroSection|TrustedBrands|WhatWeDo|WhyTFF|StatementBand|HowWeWork|AboutJourney|SelectedWork|Testimonials|WhoThisIsFor|NotSureYet|Industries|FAQ|CTABookForm)\b/g;
const sectionOrder = (source: string) =>
  [...source.matchAll(SECTION_TAGS)].map((match) => match[1]);

describe("/home-preview route", () => {
  test("is noindex, nofollow", () => {
    assert.match(
      PREVIEW,
      /robots:\s*\{\s*index:\s*false,\s*follow:\s*false\s*\}/,
    );
  });

  test("emits no page-level JSON-LD (no duplicate Breadcrumb/FAQPage)", () => {
    assert.doesNotMatch(PREVIEW, /JsonLd|buildFaqJsonLd|buildBreadcrumbJsonLd/);
  });

  test("declares no canonical, so it never claims the homepage's URL", () => {
    assert.doesNotMatch(PREVIEW, /canonical/);
  });

  test("keeps the homepage section order, with FAQ between Industries and the final CTA", () => {
    assert.deepEqual(sectionOrder(PREVIEW), sectionOrder(HOME));
    const order = sectionOrder(PREVIEW);
    assert.ok(
      order.indexOf("TrustedBrands") === order.indexOf("HeroSection") + 1,
    );
    assert.ok(order.indexOf("AboutJourney") < order.indexOf("Testimonials"));
    assert.ok(order.indexOf("Testimonials") < order.indexOf("WhoThisIsFor"));
    assert.equal(order.indexOf("FAQ"), order.indexOf("Industries") + 1);
    assert.equal(order.at(-1), "CTABookForm");
  });

  test("renders one process section and drops the duplicate three-part journey cards", () => {
    assert.equal(PREVIEW.match(/<HowWeWork\b/g)?.length, 1);
    assert.match(PREVIEW, /<AboutJourney\s+showJourney=\{false\}/);
    assert.doesNotMatch(
      PREVIEW,
      /<ThreePartJourney\b|import.*ThreePartJourney/,
    );
  });

  test("never truncates the approved service copy", () => {
    assert.match(PREVIEW, /clampSummary=\{false\}/);
  });
});

describe("production homepage isolation", () => {
  test("does not import preview copy or pass any preview-only prop", () => {
    assert.doesNotMatch(HOME, /home-preview|RichText|clampSummary|showJourney/);
    for (const tag of [
      "WhyTFF",
      "HowWeWork",
      "AboutJourney",
      "Testimonials",
      "WhoThisIsFor",
      "FAQ",
      "CTABookForm",
    ]) {
      assert.match(
        HOME,
        new RegExp(`<${tag} />`),
        `${tag} must stay prop-less on /`,
      );
    }
    assert.match(HOME, /<HeroSection \/>/);
  });

  test("section defaults still render the original copy and journey cards", () => {
    assert.match(ABOUT_JOURNEY, /showJourney = true/);
    assert.match(ABOUT_JOURNEY, /<ThreePartJourney \/>/);
  });
});

describe("PDF copy", () => {
  test("covers exactly the six live services, with the PDF card titles", () => {
    assert.deepEqual(
      Object.entries(homePreviewServiceCopy).map(([slug, { title }]) => [
        slug,
        title,
      ]),
      [
        ["aeo-seo", "AEO and SEO"],
        ["smm", "Social Media Marketing"],
        ["meta-ads", "Meta Ads"],
        ["web-development", "Web Development"],
        ["video-editing", "Video Editing"],
        ["zoho-one", "Zoho One"],
      ],
    );
    for (const { summary } of Object.values(homePreviewServiceCopy)) {
      assert.ok(summary.length > 0 && summary.endsWith("."));
    }
  });

  test("has all seven FAQs, once each", () => {
    const questions = homePreviewFaq.items.map((item) => item.question);
    assert.deepEqual(questions, [
      "What makes TFF Digital different from another digital marketing agency?",
      "Which digital marketing services can you manage?",
      "Can you help improve organic visibility?",
      "Do you manage social media marketing?",
      "Do you work with paid social campaigns?",
      "Can you build or improve our website?",
      "Can I review examples before booking?",
    ]);
  });

  test("applies the PDF's FAQ internal-linking plan with its exact anchor text", () => {
    const links = homePreviewFaq.items.map((item) =>
      item.answer.flatMap((part) =>
        typeof part === "string" ? [] : [[part.text, part.href]],
      ),
    );
    assert.deepEqual(links, [
      [["About page", "/about"]],
      [["digital marketing services", "/services"]],
      [["AEO and SEO service", "/services/aeo-seo"]],
      [["social media marketing service", "/services/smm"]],
      [["Meta Ads service", "/services/meta-ads"]],
      [["web development service", "/services/web-development"]],
      [
        ["case studies", "/case-studies"],
        ["Contact page", "/contact"],
      ],
    ]);
  });

  test("keeps link text inside the sentence (anchor text reads as prose)", () => {
    assert.equal(
      richTextToPlain(homePreviewFaq.items[6].answer),
      "Yes. Browse us case studies for examples of structured SEO and growth work, then book a consultation through the Contact page.",
    );
  });

  test("founder intro links to Case Studies", () => {
    assert.deepEqual(
      homePreviewFounders.intro.filter((part) => typeof part !== "string"),
      [{ text: "case studies", href: "/case-studies" }],
    );
  });

  test("every testimonial excerpt is drawn from its verified Upwork review", () => {
    const words = (text: string): string[] =>
      text.toLowerCase().match(/[a-z]+/g) ?? [];
    for (const { quote, testimonialId } of homePreviewTestimonials.excerpts) {
      const source = testimonials.find((t) => t.id === testimonialId);
      assert.ok(source, `no verified testimonial "${testimonialId}"`);
      // In-order word subsequence: the PDF trims words/commas, never adds any.
      const review = words(source.review);
      let cursor = 0;
      for (const word of words(quote)) {
        cursor = review.indexOf(word, cursor);
        assert.notEqual(
          cursor,
          -1,
          `"${word}" of "${quote}" not in ${testimonialId}`,
        );
        cursor++;
      }
    }
  });

  test("carries no editorial PLACEMENT or linking-plan text", () => {
    const content = readFileSync(
      new URL("../../data/home-preview-content.ts", import.meta.url),
      "utf8",
    ).replace(/\/\*[\s\S]*?\*\/|\/\/.*$/gm, "");
    assert.doesNotMatch(
      content,
      /PLACEMENT|Internal-Linking Plan|tffdigital\.com/,
    );
  });
});

describe("public access (no authentication)", () => {
  const exists = (path: string) => existsSync(new URL(path, import.meta.url));

  test("no proxy/middleware can intercept the route with an auth prompt or redirect", () => {
    for (const file of [
      "../../proxy.ts",
      "../../middleware.ts",
      "../../../proxy.ts",
      "../../../middleware.ts",
    ]) {
      assert.ok(!exists(file), `${file} must not exist`);
    }
  });

  test("the page reads no request credentials, env gate or redirect", () => {
    assert.doesNotMatch(
      PREVIEW,
      /headers\(|cookies\(|process\.env|redirect\(|notFound\(|HOME_PREVIEW/,
    );
  });

  test(".env.example no longer documents preview credentials", () => {
    const env = readFileSync(
      new URL("../../../.env.example", import.meta.url),
      "utf8",
    );
    assert.doesNotMatch(env, /HOME_PREVIEW/);
  });
});

describe("sitemap exclusion", () => {
  afterEach(() => mock.restoreAll());

  test("never lists /home-preview, even if WordPress had a same-slug Page", async () => {
    process.env.WORDPRESS_GRAPHQL_ENDPOINT = "https://cms.example.test/graphql";
    process.env.WORDPRESS_USE_MOCK_DATA = "";
    mock.method(console, "error", () => {});
    mock.method(globalThis, "fetch", async () => {
      throw new TypeError("fetch failed");
    });
    const { getAllSitemapEntries } = await import("../../lib/seo/sitemap.ts");
    const entries = await getAllSitemapEntries();
    assert.ok(entries.length > 0);
    assert.ok(entries.every((entry) => !entry.url.includes("home-preview")));
    assert.ok(isReservedPageSlug("home-preview"));
  });
});
