import Link from "next/link";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { blogPosts } from "@/lib/blog";
import { format, parseISO } from "date-fns";

export const metadata = {
  title: `Blog | ${APP_NAME}`,
  description:
    "Product updates and practical guides for rolling out emotion analytics and engagement tracking in universities — with a focus on Egypt.",
};

export default function BlogIndexPage() {
  const posts = [...blogPosts].sort((a, b) =>
    b.publishedAt.localeCompare(a.publishedAt)
  );

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
                Blog
              </Badge>
            </div>

            <h1 className="mt-5 text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-foreground">
              Practical notes on engagement analytics
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              Rollout playbooks, privacy-first patterns, and product updates —
              written for university teams.
            </p>
          </FadeIn>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group"
              >
                <Card className="h-full rounded-3xl border-border transition-colors group-hover:border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="bg-muted">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                  <CardFooter className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(post.publishedAt), "MMM d, yyyy")}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {post.readingTimeMinutes} min read
                    </span>
                  </CardFooter>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
