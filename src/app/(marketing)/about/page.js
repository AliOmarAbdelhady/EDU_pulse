import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Building2, HeartHandshake, ShieldCheck } from "lucide-react";

export const metadata = {
  title: `About | ${APP_NAME}`,
  description:
    "Learn about EDU Pulse — our mission to improve teaching and engagement with privacy-first analytics, built for Egyptian universities.",
};

const values = [
  {
    icon: HeartHandshake,
    title: "Human-first outcomes",
    description:
      "We optimize for better teaching decisions and student support — not punishment or ranking.",
  },
  {
    icon: ShieldCheck,
    title: "Governance over hype",
    description:
      "Access control, audit trails, and transparency are product features — not afterthoughts.",
  },
  {
    icon: Building2,
    title: "Built for universities",
    description:
      "Workflows match real faculty operations: departments, courses, lecturers, and reports.",
  },
];

export default function AboutPage() {
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
                About
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              We help educators understand engagement — responsibly
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              EDU Pulse is built to make classrooms more supportive. It surfaces
              trends like confusion spikes and disengagement patterns so
              lecturers can adapt and students can get help sooner.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button asChild className="rounded-full px-8 h-12 text-base">
                <Link href="/contact">
                  Contact Us <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-full px-8 h-12 text-base"
              >
                <Link href="/careers">Careers</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {values.map((item) => (
              <Card key={item.title} className="rounded-2xl border-border">
                <CardContent className="p-6">
                  <div className="inline-flex p-3 rounded-xl bg-muted border border-border">
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

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-3xl border-border">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-foreground">
                  Why Egypt?
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  Egyptian universities operate at scale: large cohorts,
                  high-stakes exams, and diverse student backgrounds.
                  Engagement problems often show up late. Our goal is to make
                  early signals visible in a way that’s practical and governed.
                </p>
              </CardContent>
            </Card>

            <Card className="rounded-3xl border-border">
              <CardContent className="p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-foreground">
                  How we build
                </h2>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                  We focus on outcomes and operational fit: role-based access,
                  clear reporting, and workflows that match departments and
                  faculties. We design for privacy and transparency from day
                  one.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </>
  );
}
