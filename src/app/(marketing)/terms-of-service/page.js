import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Terms of Service | ${APP_NAME}`,
  description:
    "Terms of service for EDU Pulse — baseline terms for demo/prototype deployments.",
};

export default function TermsOfServicePage() {
  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
        </div>

        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-16">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Legal
              </span>
              <Badge variant="outline" className="bg-card">
                Terms of Service
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Terms of Service
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: May 8, 2026
            </p>
          </FadeIn>

          <Card className="mt-8 rounded-3xl border-border">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                These terms are a baseline for a product demo/prototype and may
                not be suitable for production. Institutions should review and
                adapt them with legal counsel.
              </p>
            </CardContent>
          </Card>

          <div className="mt-10 space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                1. Acceptance
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                By accessing or using {APP_NAME}, you agree to these Terms.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                2. Accounts and roles
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Access is governed by roles (e.g., admin, lecturer, student).
                You are responsible for maintaining the confidentiality of your
                credentials and for activity under your account.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                3. Acceptable use
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Do not misuse the Service or attempt unauthorized access.</li>
                <li>
                  Do not use outputs to harass, discriminate, or unfairly
                  penalize students.
                </li>
                <li>
                  Follow your institution’s policies for consent, retention,
                  and classroom governance.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                4. Service changes
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may update the Service and these Terms over time. For
                significant changes, we will provide reasonable notice.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                5. Disclaimers
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                The Service is provided on an “as is” basis without warranties.
                Emotion analytics are probabilistic and should be interpreted
                in context.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                6. Liability
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                To the maximum extent permitted by law, we are not liable for
                indirect or consequential damages.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                7. Privacy
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                See our <Link className="underline underline-offset-4" href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For questions about these Terms, visit <Link className="underline underline-offset-4" href="/contact">Contact</Link>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
