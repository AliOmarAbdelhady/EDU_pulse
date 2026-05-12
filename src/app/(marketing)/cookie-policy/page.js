import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `Cookie Policy | ${APP_NAME}`,
  description:
    "Cookie policy for EDU Pulse — what cookies are used for and how to control them.",
};

export default function CookiePolicyPage() {
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
                Cookie Policy
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              Cookie Policy
            </h1>
            <p className="mt-3 text-sm text-muted-foreground">
              Last updated: May 8, 2026
            </p>
          </FadeIn>

          <Card className="mt-8 rounded-3xl border-border">
            <CardContent className="p-6 sm:p-8 space-y-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                Cookies are small text files stored on your device. {APP_NAME}
                uses cookies and similar technologies to provide core
                functionality and improve the user experience.
              </p>
            </CardContent>
          </Card>

          <div className="mt-10 space-y-8">
            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                1. Essential cookies
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                These cookies are required for authentication, security, and
                basic operation of the Service.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                2. Preferences
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We may store preferences (such as theme selection) to keep the
                interface consistent.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                3. Analytics (optional)
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Institutions may enable analytics to understand feature usage
                and improve reliability. This should be configured in line with
                institutional policy.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">
                4. Managing cookies
              </h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You can manage cookies in your browser settings. Disabling
                essential cookies may prevent the Service from functioning.
              </p>
            </section>

            <section className="space-y-3">
              <h2 className="text-xl font-semibold text-foreground">5. More</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For privacy questions, see our <Link className="underline underline-offset-4" href="/privacy-policy">Privacy Policy</Link>.
              </p>
            </section>
          </div>
        </div>
      </section>
    </>
  );
}
