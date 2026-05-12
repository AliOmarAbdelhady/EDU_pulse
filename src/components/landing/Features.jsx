"use client";

import FadeIn from "@/components/shared/FadeIn";
import AnimatedCard from "@/components/shared/AnimatedCard";
import { Card, CardContent } from "@/components/ui/card";
import {
  Brain,
  BarChart3,
  Activity,
  FileText,
  Bell,
  Users,
} from "lucide-react";

const features = [
  {
    icon: Brain,
    title: "AI Emotion Detection",
    description:
      "Real-time facial recognition captures and classifies student emotions — happy, confused, bored, engaged, and more.",
    gradient: "from-primary to-primary/70",
  },
  {
    icon: BarChart3,
    title: "Real-Time Analytics",
    description:
      "Live dashboards showing emotion distributions, engagement scores, and trends across lectures and time periods.",
    gradient: "from-secondary to-secondary/70",
  },
  {
    icon: Activity,
    title: "Engagement Tracking",
    description:
      "Quantitative engagement scores calculated from emotion data, attention levels, and emotional stability metrics.",
    gradient: "from-warning to-warning/70",
  },
  {
    icon: FileText,
    title: "Smart Reports",
    description:
      "Generate detailed reports with emotion frequency distributions, time-based trends, and cluster analysis.",
    gradient: "from-success to-success/70",
  },
  {
    icon: Bell,
    title: "Real-Time Alerts",
    description:
      "Instant notifications for low engagement or negative emotion patterns, enabling timely lecturer intervention.",
    gradient: "from-danger to-danger/70",
  },
  {
    icon: Users,
    title: "Cluster Analysis",
    description:
      "Group students and lecturers based on engagement patterns to identify trends and personalize teaching strategies.",
    gradient: "from-primary/80 to-secondary",
  },
];

export default function Features() {
  return (
    <section id="features" className="py-24 sm:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            Features
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Everything You Need to Understand Your Classroom
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            A comprehensive suite of tools powered by AI to transform how you
            monitor and improve student engagement.
          </p>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <AnimatedCard key={feature.title} delay={index * 0.08}>
              <Card className="h-full border-border hover:border-primary/30 transition-colors rounded-2xl">
                <CardContent className="p-6">
                  <div
                    className={`inline-flex p-3 rounded-xl bg-gradient-to-br ${feature.gradient} mb-4`}
                  >
                    <feature.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </AnimatedCard>
          ))}
        </div>
      </div>
    </section>
  );
}
