"use client";

import FadeIn from "@/components/shared/FadeIn";
import { Camera, Database, BarChart3, Bell } from "lucide-react";

const steps = [
  {
    icon: Camera,
    step: "01",
    title: "Capture",
    description:
      "Webcam or pre-recorded video captures real-time images of students during lectures.",
  },
  {
    icon: Database,
    step: "02",
    title: "Analyze",
    description:
      "AI classifies emotions (happy, neutral, bored, confused) with confidence scores and timestamps.",
  },
  {
    icon: BarChart3,
    step: "03",
    title: "Visualize",
    description:
      "Interactive dashboards display emotion distributions, trends, and engagement metrics in real-time.",
  },
  {
    icon: Bell,
    step: "04",
    title: "Improve",
    description:
      "Lecturers receive actionable insights and alerts to adapt teaching strategies on the fly.",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="py-24 sm:py-32 bg-muted"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            How It Works
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            From Capture to Insight in 4 Steps
          </h2>
        </FadeIn>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {steps.map((item, index) => (
            <FadeIn key={item.step} delay={index * 0.1} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-12 left-[calc(50%+40px)] w-[calc(100%-40px)] h-px bg-gradient-to-r from-primary/40 to-transparent" />
              )}

              <div className="text-center">
                <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-card border border-border shadow-sm mb-6">
                  <item.icon className="h-10 w-10 text-primary" />
                  <span className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shadow-lg">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
