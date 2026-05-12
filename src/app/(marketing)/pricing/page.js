import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";

export const metadata = {
  title: `Pricing | ${APP_NAME}`,
  description:
    "Simple, campus-friendly pricing in EGP for Egyptian universities — with privacy controls, dashboards, alerts, and reporting.",
};

const tiers = [
  {
    name: "Starter",
    price: "EGP 9,900",
    cadence: "per month",
    description: "For a single department or a focused pilot.",
    highlight: false,
    features: [
      "Dashboard + core analytics",
      "Lecture-level trends & exports",
      "Roles: Admin, Lecturer, Student",
      "Email support (business hours)",
    ],
    cta: { label: "Start a Pilot", href: "/contact" },
  },
  {
    name: "Faculty",
    price: "EGP 24,900",
    cadence: "per month",
    description: "For multiple departments with governance and alerts.",
    highlight: true,
    features: [
      "Everything in Starter",
      "Alerts + notification workflows",
      "Advanced reporting templates",
      "Audit logs and settings governance",
      "Priority support",
    ],
    cta: { label: "Request a Demo", href: "/contact" },
  },
  {
    name: "Enterprise",
    price: "Custom",
    cadence: "annual",
    description: "For campus-wide rollouts and procurement needs.",
    highlight: false,
    features: [
      "SSO + enterprise access controls (optional)",
      "On-premise / private hosting options",
      "Custom reporting & integrations",
      "Security review support",
    ],
    cta: { label: "Talk to Sales", href: "/contact" },
  },
];

export default function PricingPage() {
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
                Product
              </span>
              <Badge variant="outline" className="bg-card">
                Pricing
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Simple pricing that matches university reality
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Start with a department-level pilot, then scale to faculty or
              campus-wide rollouts. Prices shown in EGP.
            </p>

            <div className="mt-7 flex items-start gap-2 text-sm text-muted-foreground">
              <div className="inline-flex p-2 rounded-lg bg-muted border border-border">
                <ShieldCheck className="h-4 w-4 text-primary" />
              </div>
              <p className="leading-relaxed">
                Privacy and governance features are included in every tier.
                Policies and retention should be configured to match your
                institution.
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={
                  tier.highlight
                    ? "rounded-3xl border-primary/30 ring-1 ring-primary/20"
                    : "rounded-3xl border-border"
                }
              >
                <CardHeader className="px-6">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg font-semibold">
                      {tier.name}
                    </CardTitle>
                    {tier.highlight && <Badge>Most popular</Badge>}
                  </div>
                  <CardDescription className="text-sm">
                    {tier.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="px-6">
                  <div className="flex items-end gap-2">
                    <div className="text-4xl font-extrabold text-foreground tracking-tight">
                      {tier.price}
                    </div>
                    <div className="pb-1 text-sm text-muted-foreground">
                      {tier.cadence}
                    </div>
                  </div>

                  <Separator className="my-6" />

                  <ul className="space-y-2 text-sm text-muted-foreground">
                    {tier.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2">
                        <Check className="h-4 w-4 text-success mt-0.5" />
                        <span className="leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter className="px-6">
                  <Button
                    asChild
                    className={
                      tier.highlight
                        ? "w-full rounded-full h-11"
                        : "w-full rounded-full h-11"
                    }
                    variant={tier.highlight ? "default" : "outline"}
                  >
                    <Link href={tier.cta.href}>
                      {tier.cta.label} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          <div className="mt-10 text-sm text-muted-foreground">
            <p>
              Notes: Prices are indicative for product scaffolding. VAT and
              procurement terms depend on your institution and contract.
            </p>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {[
              {
                title: "Security & privacy",
                desc: "Review our policies and align retention and access controls with your governance team.",
                href: "/privacy-policy",
                label: "Privacy Policy",
              },
              {
                title: "Terms and procurement",
                desc: "Clear terms to support university procurement workflows.",
                href: "/terms-of-service",
                label: "Terms of Service",
              },
              {
                title: "Questions",
                desc: "Not sure which tier fits? We'll help you scope a pilot in 1–2 calls.",
                href: "/faq",
                label: "Read the FAQ",
              },
            ].map((item) => (
              <Card key={item.title} className="rounded-3xl border-border">
                <CardContent className="p-6">
                  <h3 className="text-base font-semibold text-foreground">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                  <Button variant="link" asChild className="px-0 mt-3">
                    <Link href={item.href}>{item.label}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
