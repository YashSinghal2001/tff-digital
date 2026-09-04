import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

import type { ContactFormValues } from "@/schemas/forms/contact.schema";

// The contact-form lead pipeline end to end (audit DEP-2's second-named
// path): Server Action → contact.service → lead.repository → WordPress REST
// → email.service. Only the network (fetch) and the SMTP transporter are
// stubbed; everything in between is the real production code.
process.env.WORDPRESS_REST_URL = "https://cms.example.test/wp-json";
process.env.EMAIL_FROM = "hello@example.test";
process.env.LEAD_NOTIFICATION_EMAIL = "leads@example.test";

interface SentMail {
  to: string;
  from: { address: string };
  subject: string;
}

const sendMail = mock.fn(async (_mail: SentMail) => ({ messageId: "<stub>" }));
// `namedExports` (not `exports`): on Node 22 the newer `exports` option is
// silently ignored and the mocked export comes back undefined.
mock.module("@/lib/email/smtp-client", {
  namedExports: {
    getSmtpTransporter: () => ({ sendMail }),
    verifySmtpConnection: async () => {},
  },
});

const { submitContactFormAction } = await import("./actions.ts");

const validValues: ContactFormValues = {
  name: "Ada Lovelace",
  email: "ada@example.test",
  phone: "+44 20 7946 0000",
  company: "Analytical Engines",
  serviceInterest: "SEO",
  budget: "$5k-$10k",
  message: "We need help with our search rankings this quarter.",
  consent: true,
  website: "",
};

function wordPressReplies(body: unknown, status = 200) {
  return mock.method(globalThis, "fetch", async () =>
    Response.json(body, { status }),
  );
}

describe("submitContactFormAction", () => {
  let error: ReturnType<typeof mock.method>;

  beforeEach(() => {
    sendMail.mock.resetCalls();
    sendMail.mock.mockImplementation(async () => ({ messageId: "<stub>" }));
    mock.method(console, "log", () => {});
    mock.method(console, "warn", () => {});
    error = mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("saves the lead to WordPress in the plugin's field shape, then sends both emails", async () => {
    const fetchMock = wordPressReplies({
      id: 42,
      status: "success",
      message: "Thanks!",
    });

    const result = await submitContactFormAction(validValues);

    assert.deepEqual(result, { success: true, message: "Thanks!" });
    assert.equal(fetchMock.mock.callCount(), 1);
    const [url, init] = fetchMock.mock.calls[0].arguments as [
      string,
      RequestInit,
    ];
    assert.equal(url, "https://cms.example.test/wp-json/headless/v1/leads");
    assert.equal(init.method, "POST");
    assert.deepEqual(JSON.parse(String(init.body)), {
      name: "Ada Lovelace",
      email: "ada@example.test",
      phone: "+44 20 7946 0000",
      company: "Analytical Engines",
      service_interest: "SEO",
      budget: "$5k-$10k",
      message: "We need help with our search rankings this quarter.",
      source: "website",
    });

    assert.equal(sendMail.mock.callCount(), 2);
    const recipients = sendMail.mock.calls.map((call) => call.arguments[0].to);
    assert.deepEqual(recipients.sort(), [
      "ada@example.test",
      "leads@example.test",
    ]);
    for (const call of sendMail.mock.calls) {
      const mail = call.arguments[0] as {
        from: { address: string };
        subject: string;
      };
      assert.equal(mail.from.address, "hello@example.test");
      assert.ok(mail.subject.length > 0);
    }
  });

  test("an SMTP failure after the WordPress save is logged but never fails the submission", async () => {
    wordPressReplies({ id: 43, status: "success" });
    sendMail.mock.mockImplementation(async () => {
      throw new Error("535 Authentication credentials invalid");
    });

    const result = await submitContactFormAction(validValues);

    assert.equal(result.success, true);
    assert.equal(sendMail.mock.callCount(), 2);
    const logged = error.mock.calls.map((call) => String(call.arguments[0]));
    assert.equal(
      logged.filter((line) =>
        line.includes("[email.service] Failed to send lead"),
      ).length,
      2,
    );
  });

  test("a filled honeypot is dropped silently: no WordPress write, no email, ordinary success shape", async () => {
    const fetchMock = wordPressReplies({ id: 1, status: "success" });

    const result = await submitContactFormAction({
      ...validValues,
      website: "https://spam.test",
    });

    assert.deepEqual(result, { success: true, message: "" });
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(sendMail.mock.callCount(), 0);
  });

  test("a WordPress outage is the 'couldn't reach' message, logged without form values, no email", async () => {
    wordPressReplies({}, 503);

    const result = await submitContactFormAction(validValues);

    assert.equal(result.success, false);
    assert.match(result.message, /couldn't reach our server/);
    assert.equal(sendMail.mock.callCount(), 0);
    const [label, detail] = error.mock.calls[0].arguments as [
      string,
      { kind: string },
    ];
    assert.match(label, /lead not saved to WordPress/);
    assert.equal(detail.kind, "http");
    assert.doesNotMatch(
      JSON.stringify(error.mock.calls[0].arguments),
      /Ada Lovelace|ada@example\.test/,
    );
  });

  test("a malformed WordPress reply is the 'unexpected response' message, not a field error", async () => {
    wordPressReplies({ ok: true });

    const result = await submitContactFormAction(validValues);

    assert.equal(result.success, false);
    assert.match(result.message, /unexpected response/);
    assert.doesNotMatch(result.message, /highlighted fields/);
    assert.equal(sendMail.mock.callCount(), 0);
  });

  test("a WordPress 'error' status is passed through as a failed submission with its message", async () => {
    wordPressReplies({ id: 0, status: "error", message: "Message too long" });

    const result = await submitContactFormAction(validValues);

    assert.deepEqual(result, { success: false, message: "Message too long" });
    assert.equal(sendMail.mock.callCount(), 0);
  });

  test("invalid form values are re-validated server-side and never reach WordPress", async () => {
    const fetchMock = wordPressReplies({ id: 1, status: "success" });

    const result = await submitContactFormAction({
      ...validValues,
      name: "A",
      message: "short",
    });

    assert.equal(result.success, false);
    assert.match(result.message, /highlighted fields/);
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(sendMail.mock.callCount(), 0);
  });
});
