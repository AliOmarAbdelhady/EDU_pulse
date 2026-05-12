import Link from "next/link";
import { notFound } from "next/navigation";
import FadeIn from "@/components/shared/FadeIn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { APP_NAME } from "@/lib/constants";
import { getBlogPostBySlug } from "@/lib/blog";
import { format, parseISO } from "date-fns";
import { ArrowLeft } from "lucide-react";

export async function generateMetadata({ params }) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) {
    return {
      title: `Blog | ${APP_NAME}`,
    };
  }

  return {
    title: `${post.title} | ${APP_NAME}`,
    description: post.excerpt,
  };
}

export default function BlogPostPage({ params }) {
  const post = getBlogPostBySlug(params.slug);
  if (!post) notFound();

  return (
    <>
      <section className="bg-background">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
          <Button variant="ghost" asChild className="px-0">
            <Link href="/blog">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Blog
            </Link>
          </Button>

          <FadeIn className="mt-6">
            <div className="flex flex-wrap items-center gap-2">
              {post.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="bg-muted">
                  {tag}
                </Badge>
              ))}
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {format(parseISO(post.publishedAt), "MMM d, yyyy")}
              </span>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                {post.readingTimeMinutes} min read
              </span>
            </div>

            <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground">
              {post.title}
            </h1>
            <p className="mt-4 text-lg text-muted-foreground leading-relaxed">
              {post.excerpt}
            </p>
          </FadeIn>

          <Separator className="my-10" />

          <article className="space-y-10">
            {post.sections.map((section) => (
              <section key={section.heading} className="space-y-4">
                <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                  {section.heading}
                </h2>
                <div className="space-y-4">
                  {section.paragraphs.map((p, idx) => (
                    <p key={idx} className="text-sm sm:text-base text-muted-foreground leading-relaxed">
                      {p}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      </section>
    </>
  );
}
