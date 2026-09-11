import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Byline,
  CtaBand,
  FaqBlock,
  PageHero,
  Prose,
  QuestionSection,
  Toc,
} from "@/components/content";
import { ArticleGrid, TermChips, articleSchema, learnMetadata } from "@/components/learn";
import { JsonLd } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { Section } from "@/components/ui/section";
import type { GlossaryTerm } from "@/content/glossary";
import { getArticle, getArticles, getGlossaryTerm, getRelatedArticles } from "@/lib/articles";
import { getSiteSettings } from "@/lib/data";
import { renderArticleBody } from "@/lib/mdx";
import { getSiteUrl, realValue } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return getArticles().map((a) => ({ category: a.category, slug: a.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[category]/[slug]">): Promise<Metadata> {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  if (!article) return {};
  return applyPageSeo(
    learnMetadata({
      title: article.title,
      description: article.description,
      path: article.href,
      siteUrl: getSiteUrl(),
      ogKind: article.categoryInfo.motif === "compass" ? "vastu" : "astrologer",
      type: "article",
      publishedTime: article.datePublished,
      modifiedTime: article.dateModified,
    }),
    article.href,
  );
}

/**
 * `/learn/[category]/[slug]` — the article template: hero with breadcrumbs, E-E-A-T byline,
 * sticky table of contents, the MDX body (question H2s each with an `.answer`), the glossary
 * terms it uses, its FAQ (FAQPage JSON-LD), related reading, and the closing CTA. Article
 * JSON-LD names the practitioner as author. Everything is server-rendered HTML.
 */
export default async function ArticlePage({ params }: PageProps<"/learn/[category]/[slug]">) {
  const { category, slug } = await params;
  const article = getArticle(category, slug);
  if (!article) notFound();

  const siteUrl = getSiteUrl();
  const [settings, body] = await Promise.all([getSiteSettings(), renderArticleBody(article.body)]);
  const terms = article.terms
    .map((s) => getGlossaryTerm(s))
    .filter((t): t is GlossaryTerm => t !== undefined);
  const related = getRelatedArticles(article, 3);
  const cat = article.categoryInfo;
  const practitioner = realValue(settings.practitionerName);
  const authorName = practitioner ?? settings.brandName;

  return (
    <>
      <JsonLd id="article-schema" data={articleSchema({ article, siteUrl, authorName, terms })} />
      <PageHero
        eyebrow={`Learn · ${cat.name}`}
        title={article.title}
        lede={article.description}
        motif={cat.motif}
        breadcrumbs={[
          { name: "Learn", href: "/learn" },
          { name: cat.name, href: `/learn/${cat.slug}` },
          { name: article.title, href: article.href },
        ]}
        className="pb-8 sm:pb-10 lg:pb-12"
      />

      <Container size="wide">
        <Byline
          datePublished={article.datePublished}
          dateModified={article.dateModified}
          readingMinutes={article.readingMinutes}
        />
      </Container>

      <Toc items={article.toc} className="mt-6" />

      <Section as="article" spacing="lg" className="pt-10">
        <Container size="wide" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_16rem] lg:gap-16">
          <Prose className="min-w-0 text-lg [&_.answer]:my-6 [&_h2]:scroll-mt-32 [&_h3]:scroll-mt-32">
            {body}
          </Prose>
          <aside className="space-y-8 border-t border-accent-border/50 pt-6 lg:sticky lg:top-32 lg:self-start lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
            <TermChips terms={terms} label="Terms in this article" />
            <div className="space-y-3">
              <p className="font-sans text-[0.68rem] font-semibold tracking-[0.14em] text-accent-strong uppercase">
                About the author
              </p>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {practitioner
                  ? `${practitioner} practises as Astrologer Kavita, reading`
                  : "Astrologer Kavita reads"}{" "}
                the kundli and the vastu of the home together as one consultation. The credentials
                behind these guides are set out on the{" "}
                <Link
                  href="/about"
                  className="underline decoration-accent-border/60 underline-offset-[3px] hover:decoration-accent-strong"
                >
                  about page
                </Link>
                .
              </p>
            </div>
          </aside>
        </Container>
      </Section>

      <FaqBlock
        route={article.href}
        heading={`What do people ask about ${shortTopic(article.title)}?`}
        answer={`The questions below are the ones readers most often ask after this guide, each answered briefly by Astrologer Kavita. They cover the practical edge cases the main text does not dwell on, and every answer stands on its own so it can be read without the article — though the article explains the reasoning behind it.`}
        items={article.faq}
        tone="muted"
      />

      {related.length > 0 ? (
        <QuestionSection
          id="related"
          route={article.href}
          eyebrow="Keep reading"
          question="What should you read next?"
          answer={`After this guide, Astrologer Kavita suggests the related articles below: they take up the questions this one raises — the companion topics in ${cat.name.toLowerCase()} and the neighbouring sections — and each opens, as this one does, with a self-contained answer and defines every term on first use.`}
        >
          <ArticleGrid articles={related} columns={3} />
        </QuestionSection>
      ) : null}

      <CtaBand
        eyebrow="Next step"
        title="Would you like this read against your own chart and home?"
        body="A consultation with Astrologer Kavita applies what this guide explains to your own kundli and floor plan — online, in your local hours, with a written summary afterwards."
        primaryHref="/book"
        primaryLabel="Book a consultation"
        secondaryHref={`/learn/${cat.slug}`}
        secondaryLabel={`More in ${cat.name.toLowerCase()}`}
        motif={cat.motif === "compass" ? "compass" : "south-chart"}
      />
    </>
  );
}

/** "Do I need my exact birth time for a kundli?" → "your exact birth time for a kundli". */
function shortTopic(title: string): string {
  return title
    .replace(/\?$/, "")
    .replace(/^(do i need|is|how do|what is|what to prepare for|can|what are)\s+/i, "")
    .replace(/\bmy\b/gi, "your")
    .toLowerCase()
    .trim();
}
