export const blogPosts = [
  {
    slug: "emotion-analytics-egypt-universities",
    title: "Emotion analytics in Egyptian universities: what actually works",
    excerpt:
      "A practical guide to measuring engagement in large lecture halls without turning classrooms into surveillance.",
    publishedAt: "2026-05-08",
    readingTimeMinutes: 7,
    tags: ["Education", "AI", "Egypt"],
    sections: [
      {
        heading: "Why engagement feels harder now",
        paragraphs: [
          "Large classes, mixed preparedness, and fast-paced curricula make it difficult to notice when students are confused or disengaged until it's too late.",
          "Emotion analytics can help — but only when it's used to support teaching decisions, not to punish students.",
        ],
      },
      {
        heading: "What to measure (and what to avoid)",
        paragraphs: [
          "Focus on lecture-level trends: confusion spikes, sustained boredom, and changes after key moments (examples, quizzes, breaks).",
          "Avoid individual-level judgment from a single frame or short time window. Use aggregates, confidence thresholds, and human context.",
        ],
      },
      {
        heading: "A simple rollout plan",
        paragraphs: [
          "Start with a pilot in 1–2 departments, define success metrics with lecturers, and iterate on alerts and report formats.",
          "Once the workflow is trusted, scale to the faculty level with governance, retention rules, and clear communication to students.",
        ],
      },
    ],
  },
  {
    slug: "privacy-first-ai-in-classrooms",
    title: "Privacy-first AI in classrooms",
    excerpt:
      "How EDU Pulse is designed to minimize data collection, reduce risk, and keep humans in control.",
    publishedAt: "2026-04-22",
    readingTimeMinutes: 6,
    tags: ["Privacy", "Security"],
    sections: [
      {
        heading: "Principle 1: collect less",
        paragraphs: [
          "The most secure data is the data you never store. Where possible, process signals in-session and persist only aggregated metrics.",
        ],
      },
      {
        heading: "Principle 2: make access boring",
        paragraphs: [
          "Role-based access, audit trails, and least-privilege defaults prevent accidental misuse and simplify compliance reviews.",
        ],
      },
      {
        heading: "Principle 3: explainability over magic",
        paragraphs: [
          "When a lecturer sees an alert, they should know why it happened (time window, thresholds, confidence) and what to do next.",
        ],
      },
    ],
  },
  {
    slug: "30-day-campus-pilot",
    title: "From pilot to campus rollout in 30 days",
    excerpt:
      "A week-by-week implementation plan for universities that want fast results with minimal disruption.",
    publishedAt: "2026-03-30",
    readingTimeMinutes: 8,
    tags: ["Implementation", "Operations"],
    sections: [
      {
        heading: "Week 1: scope and governance",
        paragraphs: [
          "Decide what success means (e.g., fewer confusion spikes, faster intervention, better attendance patterns) and who owns decisions.",
        ],
      },
      {
        heading: "Week 2: setup and calibration",
        paragraphs: [
          "Configure departments, courses, and lecture capture settings. Calibrate thresholds and start with quiet dashboards before alerts.",
        ],
      },
      {
        heading: "Week 3: alerts and reporting",
        paragraphs: [
          "Turn on alerts gradually and align report formats to what deans and quality teams actually review.",
        ],
      },
      {
        heading: "Week 4: scale with confidence",
        paragraphs: [
          "Expand to more lecture halls, document SOPs, and train champions inside each department.",
        ],
      },
    ],
  },
];

export function getBlogPostBySlug(slug) {
  return blogPosts.find((post) => post.slug === slug) || null;
}
