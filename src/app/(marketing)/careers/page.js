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
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Building2, Sparkles, Users } from "lucide-react";

export const metadata = {
  title: `Careers | ${APP_NAME}`,
  description:
    "Join EDU Pulse and build privacy-first education analytics for universities in Egypt.",
};

const roles = [
  {
    title: "Frontend Engineer (Next.js)",
    location: "Cairo • Hybrid",
    type: "Full-time",
    desc: "Build fast, accessible dashboards and marketing surfaces using Next.js, shadcn UI, and modern React.",
  },
  {
    title: "Applied ML Engineer",
    location: "Cairo • Hybrid",
    type: "Full-time",
    desc: "Improve robustness for classroom environments (lighting, occlusion) and help turn model outputs into reliable product signals.",
  },
  {
    title: "Customer Success (Universities)",
    location: "Egypt • On-site",
    type: "Full-time",
    desc: "Partner with departments to run pilots, calibrate alerts, and translate analytics into measurable outcomes.",
  },
];

const principles = [
  {
    icon: Users,
    title: "We build with educators",
    desc: "Success is measured in outcomes, not dashboards. We validate with real lecturers and real constraints.",
  },
  {
    icon: Sparkles,
    title: "We prefer clarity",
    desc: "Explainable alerts and honest metrics beat flashy charts that nobody trusts.",
  },
  {
    icon: Building2,
    title: "We respect governance",
    desc: "Privacy and responsible use are requirements. We design for audits and policies.",
  },
];

export default function CareersPage() {
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
                Careers
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Build privacy-first education analytics in Egypt
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              We’re building EDU Pulse for universities that want better
              engagement outcomes with responsible governance.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button asChild className="rounded-full px-8 h-12 text-base">
                <Link href="/contact">
                  Apply / Contact <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-full px-8 h-12 text-base"
              >
                <Link href="/about">About the Company</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {principles.map((item) => (
              <Card key={item.title} className="rounded-2xl border-border">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-muted border border-border">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-foreground">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                    {item.desc}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
            Open roles
          </h2>
          <p className="mt-3 text-muted-foreground max-w-2xl">
            These roles are placeholders to make the product feel complete.
            Replace them with real hiring data when ready.
          </p>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <Card key={role.title} className="rounded-3xl border-border">
                <CardHeader>
                  <CardTitle className="text-lg">{role.title}</CardTitle>
                  <CardDescription>
                    {role.location} • {role.type}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {role.desc}
                  </p>
                </CardContent>
                <CardFooter>
                  <Button variant="outline" asChild className="rounded-full">
                    <Link href="/contact">Reach out</Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
