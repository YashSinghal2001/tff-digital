import { Container } from "@/components/ui/Container";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalDisclaimer } from "@/sections/legal/LegalDisclaimer";
import { ROUTES } from "@/constants/routes";

export function CookiePolicyBody() {
  return (
    <section className="pb-20 lg:pb-28">
      <Container size="full" className="max-w-[1280px]">
        <div className="mx-auto max-w-3xl">
          <LegalDisclaimer />

          <LegalContent>
            <h2>1. Introduction</h2>
            <p>
              This Cookie Policy explains how TFF Digital (&ldquo;TFF
              Digital,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) uses cookies and similar browser storage
              technologies on the website located at tffdigital.com (the
              &ldquo;Website&rdquo;), and the choices available to you. It
              should be read alongside our{" "}
              <a href={ROUTES.privacyPolicy}>Privacy Policy</a>.
            </p>

            <h2>2. What Cookies Are</h2>
            <p>
              Cookies are small text files placed on your device by a website
              you visit. Websites also use similar browser storage technologies,
              such as local storage, to remember information between visits.
              This policy covers both.
            </p>

            <h2>3. How TFF Digital Uses Cookies</h2>
            <p>
              The Website does not use cookies or browser storage for analytics,
              advertising, or profiling. The only technologies described below
              exist to run core site functionality: remembering your
              cookie-notice decision and, for our internal editorial team only,
              previewing unpublished content.
            </p>

            <h2>4. Types of Cookies We Use</h2>

            <h3>Strictly Necessary</h3>
            <p>
              When a member of our editorial team previews unpublished content
              from our content management system, the Website sets a temporary,
              first-party cookie (Next.js &ldquo;Draft Mode&rdquo;) so the
              preview link shows the right content. This cookie is not set for
              ordinary visitors, does not track you, and carries no advertising
              or analytics purpose.
            </p>

            <h3>Functional</h3>
            <p>
              When you accept or reject the cookie notice on the Website, we
              store that choice in your browser&rsquo;s local storage under the
              key <code>tff-cookie-consent</code>, so the notice does not appear
              again on later visits. This is the only browser storage the
              Website sets for visitors, and it is used solely to remember your
              decision.
            </p>

            <h3>Analytics Cookies</h3>
            <p>
              We do not currently use analytics cookies or tools such as Google
              Analytics on the Website.
            </p>

            <h3>Marketing / Advertising Cookies</h3>
            <p>
              We do not currently use marketing, advertising, or remarketing
              cookies (such as those from Meta Pixel or Google Ads) on the
              Website.
            </p>

            <h2>5. Third-Party Cookies</h2>
            <p>
              Some pages, such as blog posts or case studies, may include
              embedded third-party content (for example, a YouTube video). If
              you choose to play embedded content, the third party that hosts it
              may set its own cookies in accordance with its own privacy and
              cookie policies. We do not control these cookies and encourage you
              to review the relevant third party&rsquo;s policy before
              interacting with embedded content.
            </p>

            <h2>6. Cookie Duration</h2>
            <p>
              Your cookie-notice decision, stored in local storage, persists
              until you clear your browser&rsquo;s site data or storage, and is
              not otherwise given an expiry date. The editorial preview cookie
              described above is managed automatically by our content platform
              and is cleared when an editor ends their preview session.
            </p>

            <h2>7. How You Can Manage Cookies</h2>
            <p>
              You can accept or reject the cookie notice at any time it is
              shown. To reset your choice and see the notice again, clear your
              browser&rsquo;s local storage for this Website, or use your
              browser&rsquo;s privacy settings to clear site data.
            </p>

            <h2>8. Browser and Device Controls</h2>
            <p>
              Most browsers let you view, manage, and delete cookies and local
              storage through their settings, and let you block or limit them
              for specific sites. Refer to your browser&rsquo;s help
              documentation for instructions, as steps vary by browser and
              device. Blocking all storage may affect how some websites
              function.
            </p>

            <h2>9. Changes to This Cookie Policy</h2>
            <p>
              We may update this Cookie Policy if the technologies described
              above change. Any changes will be posted on this page with a
              revised &ldquo;Last Updated&rdquo; date. We encourage you to
              review this page periodically.
            </p>

            <h2>10. Contact Us</h2>
            <p>
              If you have questions about this Cookie Policy, contact us at:
            </p>
            <ul>
              <li>
                Email:{" "}
                <a href="mailto:info@tffdigital.com">info@tffdigital.com</a>
              </li>
              <li>Location: Zirakpur, Punjab, India</li>
            </ul>
          </LegalContent>
        </div>
      </Container>
    </section>
  );
}
