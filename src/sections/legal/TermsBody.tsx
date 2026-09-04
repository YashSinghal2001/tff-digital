import { Container } from "@/components/ui/Container";
import { LegalContent } from "@/components/legal/LegalContent";
import { LegalDisclaimer } from "@/sections/legal/LegalDisclaimer";

export function TermsBody() {
  return (
    <section className="pb-20 lg:pb-28">
      <Container size="full" className="max-w-[1280px]">
        <div className="mx-auto max-w-3xl">
          <LegalDisclaimer />

          <LegalContent>
            <h2>1. Introduction / Acceptance of Terms</h2>
            <p>
              These Terms and Conditions (&ldquo;Terms&rdquo;) govern your access to and use of
              the website located at tffdigital.com (the &ldquo;Website&rdquo;), operated by TFF
              Digital (&ldquo;TFF Digital,&rdquo; &ldquo;we,&rdquo; &ldquo;us,&rdquo; or
              &ldquo;our&rdquo;). By accessing or using the Website, you agree to be bound by
              these Terms. If you do not agree, please do not use the Website.
            </p>

            <h2>2. Use of Website</h2>
            <p>
              You agree to use the Website only for lawful purposes and in a manner that does not
              infringe the rights of, or restrict or inhibit the use and enjoyment of, the Website
              by any third party. You agree not to:
            </p>
            <ul>
              <li>
                Attempt to gain unauthorized access to any part of the Website or its underlying
                systems;
              </li>
              <li>Interfere with or disrupt the security or proper functioning of the Website;</li>
              <li>
                Use any automated means to scrape, copy, or extract content from the Website
                without our prior written consent; or
              </li>
              <li>Submit false, misleading, or fraudulent information through any form on the Website.</li>
            </ul>

            <h2>3. Services</h2>
            <p>
              TFF Digital is a digital growth agency offering services described on the Website,
              including but not limited to SEO, social media marketing, web design and
              development, branding, paid media, and conversion rate optimization. Descriptions of
              our services on the Website are for general informational purposes. Any specific
              engagement, scope of work, pricing, or deliverables will be governed by a separate
              signed agreement or proposal between TFF Digital and the client, and not by these
              Terms alone.
            </p>

            <h2>4. User Responsibilities</h2>
            <p>
              When submitting information through the Website (for example, our contact form),
              you agree to provide accurate and current information and to use the form only for
              genuine inquiries related to our services.
            </p>

            <h2>5. Intellectual Property</h2>
            <p>
              All content on the Website, including text, graphics, logos, the TFF Digital name
              and brand marks, layout, and design, is owned by or licensed to TFF Digital and is
              protected by applicable intellectual property laws. You may not reproduce,
              distribute, modify, or create derivative works from any part of the Website without
              our prior written permission.
            </p>

            <h2>6. Website Content</h2>
            <p>
              Content on the Website — including service descriptions, case studies, and blog
              articles — is provided for general informational purposes only. We aim to keep this
              content accurate and current, but we make no representation or warranty that it is
              complete, error-free, or up to date at all times.
            </p>

            <h2>7. Third-Party Links</h2>
            <p>
              The Website may include links to third-party websites and social media platforms
              for your convenience. These links do not constitute an endorsement, and we are not
              responsible for the content, accuracy, or practices of any third-party site.
            </p>

            <h2>8. Disclaimer</h2>
            <p>
              The Website and its content are provided on an &ldquo;as is&rdquo; and &ldquo;as
              available&rdquo; basis, without warranties of any kind, whether express or implied,
              to the fullest extent permitted by applicable law.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, TFF Digital shall not be liable
              for any indirect, incidental, special, consequential, or punitive damages arising
              out of or relating to your access to or use of, or inability to access or use, the
              Website.
            </p>

            <h2>10. Indemnification</h2>
            <p>
              You agree to indemnify and hold TFF Digital harmless from any claims, damages,
              liabilities, and expenses (including reasonable legal fees) arising out of your
              misuse of the Website or your violation of these Terms.
            </p>

            <h2>11. Changes to These Terms</h2>
            <p>
              We may update these Terms from time to time. Any changes will be posted on this page
              with a revised &ldquo;Last Updated&rdquo; date. Your continued use of the Website
              after changes are posted constitutes your acceptance of the updated Terms.
            </p>

            <h2>12. Governing Law / Jurisdiction</h2>
            <p>
              These Terms shall be governed by the laws of India, without
              regard to its conflict of law principles.
            </p>

            <h2>13. Contact Information</h2>
            <p>Questions about these Terms can be directed to:</p>
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
