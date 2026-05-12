import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import FeaturesSection from "@/components/landing/Features";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Gauge, MapPin, ShieldCheck } from "lucide-react";

export const metadata = {
  title: `Features | ${APP_NAME}`,
  description:
    "Explore EDU Pulse features for emotion analytics, engagement tracking, alerts, and reporting — built for modern lecture halls in Egypt.",
};

const highlights = [
  {
    icon: Gauge,
    title: "Real-time insight",
    description:
      "See engagement trends as they happen and respond during the lecture — not weeks later.",
  },
  {
    icon: ShieldCheck,
    title: "Privacy-first by design",
    description:
      "Role-based access, audit trails, and configurable retention so teams can govern usage responsibly.",
  },
  {
    icon: MapPin,
    title: "Egypt-ready operations",
    description:
      "Pricing in EGP, campus-friendly workflows, and deployment options that fit real university constraints.",
  },
];

export default function FeaturesPage() {
  return (
    <>
      <section className="relative overflow-hidden bg-background">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-primary/3" />
          <div className="absolute -top-32 right-0 w-[520px] h-[520px] bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute -bottom-36 left-0 w-[460px] h-[460px] bg-primary/8 rounded-full blur-3xl" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <FadeIn className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20">
              <span className="text-xs font-semibold uppercase tracking-widest text-primary">
                Product
              </span>
              <Badge variant="outline" className="bg-card">
                Features
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Built for real classrooms — designed for Egypt
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              EDU Pulse combines AI emotion signals with engagement metrics,
              dashboards, alerts, and reports — so lecturers, departments, and
              quality teams can make decisions with confidence.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button asChild className="rounded-full px-8 h-12 text-base">
                <Link href="/pricing">
                  See Pricing <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-full px-8 h-12 text-base"
              >
                <Link href="/contact">Request a Demo</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {highlights.map((item) => (
              <Card
                key={item.title}
                className="border-border rounded-2xl bg-card/70"
              >
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-primary/10 border border-primary/20">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <FeaturesSection />
    </>
  );
}
