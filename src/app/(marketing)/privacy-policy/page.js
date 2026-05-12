import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Privacy Policy | ${APP_NAME}`,
  description:
    "Privacy policy for EDU Pulse — how we collect, use, and protect information in education analytics deployments.",
};

export default function PrivacyPolicyPage() {
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
                Privacy Policy
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Privacy Policy
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: May 8, 2026
            </p>
          </FadeIn>

          <Card className="mt-8 rounded-3xl border-border">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                This page provides a professional baseline policy for the EDU
                Pulse product demo. It should be reviewed and adapted by your
                institution’s legal counsel and governance team before
                production use.
              </p>
            </CardContent>
          </Card>

          <div className="mt-10 space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">1. Scope</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                This Privacy Policy explains how {APP_NAME} (“we”, “us”) handles
                information when you use our website, dashboards, and services
                (the “Service”).
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                2. Information we collect
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>
                  <span className="text-foreground">Account data</span>:
                  username, email, role, and authentication information.
                </li>
                <li>
                  <span className="text-foreground">Operational data</span>:
                  courses, departments, lecture schedules, and system settings.
                </li>
                <li>
                  <span className="text-foreground">Analytics outputs</span>:
                  emotion classifications and engagement metrics, often stored as
                  aggregated records.
                </li>
                <li>
                  <span className="text-foreground">Logs</span>: device and
                  browser information, timestamps, and audit logs for security.
                </li>
              </ul>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Depending on your deployment configuration, the Service may
                process video frames or camera streams to infer emotion signals.
                Institutions should define whether and how media is stored.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                3. How we use information
              </h2>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>Provide and improve the Service and its features.</li>
                <li>Authenticate users and enforce role-based access.</li>
                <li>Generate dashboards, reports, and notifications.</li>
                <li>Detect abuse and maintain security and integrity.</li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                4. Sharing
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We do not sell personal data. We may share information with:
              </p>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
                <li>
                  Your institution’s authorized administrators and staff (based
                  on roles).
                </li>
                <li>
                  Service providers involved in hosting and operations (as
                  applicable).
                </li>
                <li>
                  Authorities if required by law or to protect rights and
                  security.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                5. Retention
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Retention depends on institutional policy and configuration.
                Where possible, we recommend storing only what is needed for
                educational outcomes and governance.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                6. Security
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We use reasonable technical and organizational measures
                (including access control and audit logs) to protect
                information. No system can be guaranteed secure.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                7. Your choices
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                If your institution uses {APP_NAME}, your access and controls
                may be managed by institutional administrators. Contact your
                admin for account requests, and contact us for product-level
                questions.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">8. Contact</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For inquiries, reach out via the <Link className="underline underline-offset-4" href="/contact">Contact</Link> page.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
