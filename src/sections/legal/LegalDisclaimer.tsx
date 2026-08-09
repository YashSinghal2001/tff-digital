import { Card } from "@/components/ui/Card";

export function LegalDisclaimer() {
  return (
    <Card className="mb-10 border-primary/30 p-5 sm:p-6">
      <p className="font-body text-xs leading-relaxed text-muted">
        This page is a general information template for the TFF Digital website. It is not a
        substitute for professional legal advice and does not account for the specific laws of
        any single jurisdiction. We recommend having this document reviewed by a qualified legal
        professional before relying on it for compliance purposes.
      </p>
    </Card>
  );
}
