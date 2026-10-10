import type { Metadata } from "next";
import { applyPageSeo } from "@/lib/seo/page-seo";
import { notFound } from "next/navigation";
import { CtaDisc, FigureSection, Foot, MotifSprite, SceneHero } from "@/components/content";
import {
  ArticleGrid,
  DoorSpread,
  LearnFigure,
  learnCtaMotif,
  learnFigureRatio,
  learnMetadata,
} from "@/components/learn";
import { ARTICLE_CATEGORIES, getArticleCategory } from "@/content/article-categories";
import { getArticles, getCategoryFaqs } from "@/lib/articles";
import { getSiteUrl } from "@/lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return ARTICLE_CATEGORIES.map((c) => ({ category: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/learn/[category]">): Promise<Metadata> {
  const { category } = await params;
  const cat = getArticleCategory(category);
  if (!cat) return {};
  return applyPageSeo(
    learnMetadata({
      title: `${cat.name} — guides`,
      description: `${cat.name} from Astrologer Kavita: ${cat.description}`,
      path: `/learn/${cat.slug}`,
      siteUrl: getSiteUrl(),
      ogKind: cat.motif === "compass" ? "vastu" : "astrologer",
    }),
    `/learn/${cat.slug}`,
  );
}

/**
 * `/learn/[category]` — one section of the library: its instrument as the hero, then the
 * section's question and answer as a quiet ruled plate (the hero already is its instrument; a
 * second copy would only repeat it) with its guides as doors beneath, the readers' questions
 * in the foot, the disc.
 */
export default async function CategoryPage({ params }: PageProps<"/learn/[category]">) {
  const { category } = await params;
  const cat = getArticleCategory(category);
  if (!cat) notFound();
  const articles = getArticles(cat.slug);
  const faqs = getCategoryFaqs(cat.slug);
  const count = articles.length === 1 ? "one guide" : `${articles.length} guides`;
  const route = `/learn/${cat.slug}`;

  return (
    <>
      <MotifSprite />
      <SceneHero
        title={cat.name}
        tagline={`Learn · ${cat.name}`}
        lede={cat.description}
        figure={
          <LearnFigure motif={cat.motif} size="small" title={`The instrument of ${cat.name}`} />
        }
        figureSize="small"
        figureRatio={learnFigureRatio(cat.motif)}
        breadcrumbs={[
          { name: "Learn", href: "/learn" },
          { name: cat.name, href: route },
        ]}
      />

      <FigureSection id="articles" route={route} n="I" question={cat.question} answer={cat.answer}>
        <DoorSpread>
          <p className="plate-n mb-5 text-center">{count}</p>
          <ArticleGrid articles={articles} showCategory={false} columns={3} />
        </DoorSpread>
      </FigureSection>

      <Foot
        route={route}
        heading={`What do readers ask about ${cat.name.toLowerCase()}?`}
        answer={`These are the questions readers most often bring to the ${cat.name.toLowerCase()} guides, each answered in a few sentences by Astrologer Kavita. Every answer is drawn from the articles in this section, so the fuller explanation — with its tables, definitions and examples — is one click away in the guide it comes from.`}
        faqs={faqs}
      />

      <CtaDisc
        eyebrow="Next step"
        title="Would you like this applied to your own chart and home?"
        body="A consultation with Astrologer Kavita takes what these guides explain and reads it against your kundli and your floor plan, online in your local hours, with a written summary afterwards."
        primaryHref="/book"
        primaryLabel="Book a consultation"
        secondaryHref="/learn"
        secondaryLabel="Back to all guides"
        motif={learnCtaMotif(cat.motif)}
      />
    </>
  );
}
