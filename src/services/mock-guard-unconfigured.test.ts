import assert from "node:assert/strict";
import test, { afterEach, beforeEach, describe, mock } from "node:test";

// ARCH-3, the other production misconfiguration: no endpoint at all. Before
// this guard the services silently served src/lib/mock content in that
// state; now every boundary fails closed with a 'config' error, soft
// surfaces degrade to empty, and the network is never touched.
// Next types NODE_ENV as read-only; the test runner may set it freely.
(process.env as Record<string, string | undefined>).NODE_ENV = "production";
process.env.WORDPRESS_USE_MOCK_DATA = "true";
delete process.env.WORDPRESS_GRAPHQL_ENDPOINT;

const configError = mock.method(console, "error", () => {});
const services = await import("./service-offering.service.ts");
const caseStudies = await import("./case-study.service.ts");
const { WordPressError } = await import("../lib/wordpress/errors.ts");
const startupLogs = configError.mock.calls.map((c) => String(c.arguments[0]));
mock.restoreAll();

describe("production process with no WordPress endpoint (ARCH-3)", () => {
  let fetchMock: ReturnType<typeof mock.method>;
  beforeEach(() => {
    fetchMock = mock.method(globalThis, "fetch", async () => Response.json({}));
    mock.method(console, "error", () => {});
  });
  afterEach(() => mock.restoreAll());

  test("the misconfiguration is logged at startup", () => {
    assert.ok(
      startupLogs.some((line) =>
        /WORDPRESS_GRAPHQL_ENDPOINT is not set in a production build/.test(
          line,
        ),
      ),
      JSON.stringify(startupLogs),
    );
  });

  test("soft listings are empty, not mock, and never hit the network", async () => {
    const offerings = await services.getServiceOfferings();
    const studies = await caseStudies.getCaseStudies();
    assert.deepEqual(offerings.items, []);
    assert.deepEqual(studies.items, []);
    assert.equal(fetchMock.mock.callCount(), 0);
  });

  test("strict getters fail closed with a 'config' error, not a mock entry", async () => {
    await assert.rejects(
      services.getServiceOfferingBySlug("brand-strategy"),
      (error: unknown) =>
        error instanceof WordPressError && error.kind === "config",
    );
    assert.equal(fetchMock.mock.callCount(), 0);
  });
});
