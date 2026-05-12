import FadeIn from "@/components/shared/FadeIn";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { APP_NAME } from "@/lib/constants";
import { Building2, Mail, Phone } from "lucide-react";

export const metadata = {
  title: `Contact | ${APP_NAME}`,
  description:
    "Contact EDU Pulse for demos, pilots, and procurement questions for Egyptian universities.",
};

export default function ContactPage({ searchParams }) {
  const sent = searchParams?.sent === "1";
  const error = searchParams?.error === "1";

  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
          <div className="absolute -top-28 right-0 w-[520px] h-[520px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 left-0 w-[460px] h-[460px] bg-primary/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <FadeIn className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Company
              </span>
              <Badge variant="outline" className="bg-card">
                Contact
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Talk to us about your university rollout
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Use the form for pilots, pricing questions, and procurement.
              Prefer email? You can reach us directly.
            </p>

            {sent && (
              <div className="mt-6 rounded-2xl border border-success/30 bg-success/10 px-4 py-3 text-sm text-foreground">
                Message received. We’ll get back to you shortly.
              </div>
            )}
            {error && (
              <div className="mt-6 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-foreground">
                Please fill in the required fields and try again.
              </div>
            )}
          </FadeIn>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <div className="lg:col-span-1 space-y-4">
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Contact details</CardTitle>
                  <CardDescription>Fastest channels for support.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-muted border border-border">
                      <Mail className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Email</div>
                      <a
                        className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                        href="mailto:support@edupulse.app"
                      >
                        support@edupulse.app
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-muted border border-border">
                      <Phone className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Phone</div>
                      <p className="text-sm text-muted-foreground">+20 (placeholder) 000 0000</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <div className="inline-flex p-2 rounded-lg bg-muted border border-border">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-foreground">Office</div>
                      <p className="text-sm text-muted-foreground">
                        Cairo, Egypt (placeholder)
                      </p>
                    </div>
                  </div>

                  <Button asChild className="rounded-full w-full mt-2">
                    <Link href="/pricing">View Pricing</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">Send a message</CardTitle>
                  <CardDescription>
                    We’ll respond with next steps for a pilot or demo.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form action="/api/contact" method="post" className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" name="name" placeholder="Your name" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="name@university.edu.eg"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="organization">Organization</Label>
                      <Input
                        id="organization"
                        name="organization"
                        placeholder="University / Faculty / Department"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Tell us about your goals, scale, and timeline."
                        required
                      />
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button type="submit" className="rounded-full h-11">
                        Submit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        asChild
                        className="rounded-full h-11"
                      >
                        <a href="mailto:support@edupulse.app?subject=EDU%20Pulse%20Demo%20Request">
                          Email instead
                        </a>
                      </Button>
                    </div>

                    <p className="text-xs text-muted-foreground leading-relaxed">
                      By submitting, you agree we may use the information to
                      respond to your inquiry. See our <Link className="underline underline-offset-4" href="/privacy-policy">Privacy Policy</Link>.
                    </p>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
