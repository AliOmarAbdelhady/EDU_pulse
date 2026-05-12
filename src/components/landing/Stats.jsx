"use client";

import FadeIn from "@/components/shared/FadeIn";
import AnimatedCounter from "@/components/shared/AnimatedCounter";

const stats = [
  { value: 2500, suffix: "+", label: "Students Analyzed" },
  { value: 150000, suffix: "+", label: "Emotions Processed" },
  { value: 450, suffix: "+", label: "Lectures Monitored" },
  { value: 87, suffix: "%", label: "Avg Engagement Score" },
];

export default function Stats() {
  return (
    <section id="stats" className="py-24 sm:py-32 bg-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <FadeIn className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-semibold uppercase tracking-widest text-primary">
            By The Numbers
          </span>
          <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
            Trusted by Universities Worldwide
          </h2>
        </FadeIn>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <FadeIn key={stat.label} delay={index * 0.08}>
              <div className="text-center p-6 rounded-2xl bg-muted border border-border">
                <div className="text-3xl sm:text-4xl font-bold text-foreground">
                  <AnimatedCounter
                    value={stat.value}
                    suffix={stat.suffix}
                    duration={2}
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            </FadeIn>
          ))}
        </div>
      </div>
    </section>
  );
}
