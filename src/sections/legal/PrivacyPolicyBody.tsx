import { Container } from "@/components/ui/Container";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalDisclaimer } from "@/sections/legal/LegalDisclaimer";

export function PrivacyPolicyBody() {
  return (
    <section className="pb-20 lg:pb-28">
      <Container size="full" className="max-w-[1280px]">
        <div className="mx-auto max-w-3xl">
          <LegalDisclaimer />

          <LegalContent>
            <h2>1. Introduction</h2>
            <p>
              TFF Digital (&ldquo;TFF Digital,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;) operates the website located at tffdigital.com (the
              &ldquo;Website&rdquo;). This Privacy Policy explains what information we collect
              through the Website, how we use and share it, and the choices available to you. By
              using the Website, you agree to the collection and use of information in accordance
              with this Privacy Policy.
            </p>

            <h2>2. Information We Collect</h2>
            <h3>Information You Provide Directly</h3>
            <p>We collect information you choose to give us directly, including:</p>
            <ul>
              <li>
                Contact form submissions — name, work email address, phone number, company name,
                service(s) of interest, budget range, and any message you include.
              </li>
              <li>
                Newsletter sign-up — your email address, if you choose to subscribe for updates
                through our footer sign-up form.
              </li>
              <li>Any other information you voluntarily send us, such as by email.</li>
            </ul>

            <h3>Automatically Collected Information</h3>
            <p>
              When you visit the Website, certain information may be collected automatically as
              part of standard web server and hosting operations, such as your IP address,
              browser type, device information, pages viewed, referring URL, and timestamps. This
              information is used only to operate, secure, and maintain the Website.
            </p>

            <h2>3. How We Use Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Respond to inquiries submitted through our contact form;</li>
              <li>Provide information about our services;</li>
              <li>Send occasional updates to newsletter subscribers, if you opt in;</li>
              <li>Operate, maintain, and improve the Website;</li>
              <li>Detect, prevent, and address technical issues or misuse; and</li>
              <li>Comply with applicable legal obligations.</li>
            </ul>

            <h2>4. Cookies and Similar Technologies</h2>
            <p>
              At this time, the Website does not use cookies or similar tracking technologies for
              analytics, advertising, or profiling purposes. If this changes in the future, this
              Privacy Policy will be updated to describe the technologies used and any choices
              available to you.
            </p>

            <h2>5. Website Analytics / Tracking</h2>
            <p>
              We do not currently use third-party analytics or advertising tools (such as Google
              Analytics or Meta Pixel) on the Website.
            </p>

            <h2>6. How We Share Information</h2>
            <p>
              We do not sell your personal information. We may share information only in the
              following circumstances:
            </p>
            <ul>
              <li>
                With the content management platform that powers this Website, which is used to
                receive and store contact form submissions;
              </li>
              <li>
                With hosting and infrastructure providers who process data solely to deliver the
                Website to you;
              </li>
              <li>If required to do so by law, regulation, or valid legal process; or</li>
              <li>
                To protect the rights, property, or safety of TFF Digital, our users, or others.
              </li>
            </ul>

            <h2>7. Service Providers / Third Parties</h2>
            <p>
              We rely on a limited number of service providers to operate the Website and manage
              inquiries submitted to us, including our website hosting provider and our
              WordPress-based content management system. These providers process information only
              as necessary to provide their services to us.
            </p>

            <h2>8. Data Retention</h2>
            <p>
              We retain contact form submissions and related correspondence for as long as
              reasonably necessary to respond to your inquiry, maintain business records, and
              comply with legal obligations. You may request that we delete your information at
              any time by contacting us using the details below.
            </p>

            <h2>9. Data Security</h2>
            <p>
              The Website is served over HTTPS and configured with standard security headers to
              help protect information in transit. While we take reasonable steps to protect
              information submitted to us, no method of transmission or storage is completely
              secure, and we cannot guarantee absolute security.
            </p>

            <h2>10. Your Privacy Rights</h2>
            <p>
              Depending on your location, you may have rights regarding your personal
              information, such as the right to access, correct, or request deletion of the
              information we hold about you. To exercise any of these rights, contact us using the
              details in the &ldquo;Contact Us&rdquo; section below. Additional rights may apply
              to you under [GOVERNING JURISDICTION] privacy law.
            </p>

            <h2>11. Children&rsquo;s Privacy</h2>
            <p>
              The Website is not directed to children under the age of 16, and we do not
              knowingly collect personal information from children. If you believe a child has
              provided us with personal information, please contact us so we can remove it.
            </p>

            <h2>12. Third-Party Links</h2>
            <p>
              The Website may contain links to third-party websites and social media platforms.
              We are not responsible for the privacy practices or content of those third parties,
              and we encourage you to review their privacy policies before providing any
              information.
            </p>

            <h2>13. Changes to This Privacy Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. Any changes will be posted on
              this page with a revised &ldquo;Last Updated&rdquo; date. We encourage you to review
              this page periodically.
            </p>

            <h2>14. Contact Us</h2>
            <p>
              If you have questions about this Privacy Policy or how we handle your information,
              contact us at:
            </p>
            <ul>
              <li>
                Email: <a href="mailto:info@tffdigital.com">info@tffdigital.com</a>
              </li>
              <li>Location: Zirakpur, Punjab, India</li>
            </ul>
          </LegalContent>
        </div>
      </Container>
    </section>
  );
}
