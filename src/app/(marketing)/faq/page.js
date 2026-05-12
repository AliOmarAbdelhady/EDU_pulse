import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";

export const metadata = {
  title: `FAQ | ${APP_NAME}`,
  description:
    "Answers to common questions about EDU Pulse: privacy, deployment options, analytics, pricing, and campus rollout.",
};

const faqs = [
  {
    value: "privacy",
    q: "Is EDU Pulse a surveillance tool?",
    a: "No. It’s designed to support teaching decisions with lecture-level trends and aggregated analytics. Institutions should define clear policies, limit access by role, and communicate transparently to students.",
  },
  {
    value: "data",
    q: "Do you store video or faces?",
    a: "It depends on your configuration. The product is designed to minimize stored data and prioritize aggregated insights. Retention and storage policies should be set by your institution and reviewed with legal and governance teams.",
  },
  {
    value: "accuracy",
    q: "How accurate is emotion detection?",
    a: "Accuracy varies by environment (lighting, camera angle, occlusion) and population diversity. EDU Pulse focuses on trends and confidence-based aggregation rather than single-frame judgments.",
  },
  {
    value: "deployment",
    q: "Can we start without cameras?",
    a: "Yes. You can start with a dashboard-only pilot using mock data or recorded sessions to validate workflows, then gradually enable capture and alerts.",
  },
  {
    value: "alerts",
    q: "What triggers an alert?",
    a: "Alerts can be based on configurable thresholds (e.g., confusion spike over a time window) and can be enabled per course/lecture. The goal is to prompt lecturers to check-in, not to punish.",
  },
  {
    value: "pricing",
    q: "Do you support pricing in EGP?",
    a: "Yes — the pricing page is designed around Egyptian university procurement flows, with EGP as the primary currency. Final terms depend on contract and scope.",
  },
  {
    value: "support",
    q: "What support do you provide during rollout?",
    a: "We recommend starting with 1–2 departments, aligning on success metrics, and iterating on reports and alert thresholds with lecturers before scaling campus-wide.",
  },
];

export default function FaqPage() {
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
                FAQ
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Answers to common questions
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              If you’re evaluating EDU Pulse for a university in Egypt, this is
              the fastest way to understand privacy, deployment, and rollout.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <Card className="rounded-3xl border-border">
            <CardContent className="p-6 sm:p-8">
              <Accordion defaultValue={[faqs[0].value]}>
                {faqs.map((item) => (
                  <AccordionItem key={item.value} value={item.value}>
                    <AccordionTrigger>{item.q}</AccordionTrigger>
                    <AccordionContent>
                      <p className="text-muted-foreground leading-relaxed">
                        {item.a}
                      </p>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>

          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <Button asChild className="rounded-full h-11">
              <Link href="/pricing">See Pricing</Link>
            </Button>
            <Button variant="outline" asChild className="rounded-full h-11">
              <Link href="/contact">Talk to Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
