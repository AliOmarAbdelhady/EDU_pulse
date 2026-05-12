import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import HowItWorksSection from "@/components/landing/HowItWorks";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { ArrowRight, Camera, Database, Video } from "lucide-react";

export const metadata = {
  title: `How It Works | ${APP_NAME}`,
  description:
    "Understand how EDU Pulse captures, analyzes, and visualizes student emotion signals — with practical rollout steps for Egyptian universities.",
};

const captureModes = [
  {
    icon: Camera,
    title: "Live camera",
    description:
      "Capture in real time from lecture halls or labs when policy and infrastructure allow.",
  },
  {
    icon: Video,
    title: "Video upload",
    description:
      "Analyze recorded lectures to validate insights and build baselines before turning on alerts.",
  },
  {
    icon: Database,
    title: "Demo mode",
    description:
      "Start with mock data to learn the dashboards, configure roles, and align workflows across teams.",
  },
];

export default function HowItWorksPage() {
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
                How it works
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              From capture to action — without guesswork
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              EDU Pulse turns emotion signals into engagement insights, so teams
              can spot confusion early, reduce disengagement, and improve
              outcomes across courses.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
              <Button asChild className="rounded-full px-8 h-12 text-base">
                <Link href="/features">
                  Explore Features <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                variant="outline"
                asChild
                className="rounded-full px-8 h-12 text-base"
              >
                <Link href="/pricing">See Pricing</Link>
              </Button>
            </div>
          </FadeIn>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
            {captureModes.map((item) => (
              <Card key={item.title} className="border-border rounded-2xl">
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

      <HowItWorksSection />

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
                What you get
              </h2>
              <p className="mt-3 text-muted-foreground">
                Clear outputs that map to real decisions — for lecturers,
                department leadership, and quality teams.
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                {
                  title: "Dashboards",
                  desc: "Live emotion distribution and engagement trends per lecture and course.",
                },
                {
                  title: "Alerts",
                  desc: "Optional notifications for confusion or boredom spikes based on thresholds.",
                },
                {
                  title: "Reports",
                  desc: "Exportable summaries for weekly and semester-level reviews.",
                },
                {
                  title: "Governance",
                  desc: "Roles, audit logs, and settings to keep deployments accountable.",
                },
              ].map((item) => (
                <Card key={item.title} className="rounded-2xl border-border">
                  <CardContent className="p-6">
                    <h3 className="text-base font-semibold text-foreground">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
