import { compileMDX } from "next-mdx-remote/rsc";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { MDX_COMPONENTS } from "./components";
import { AUTOLINK_OPTIONS } from "./options";

/**
 * Compile an article body to React on the server (no client MDX runtime is shipped). GFM
 * tables, `rehype-slug` ids on headings (the same slugs `extractToc` predicts) and a hover
 * anchor appended to each heading. `tests/learn` runs the identical configuration.
 */
export async function renderArticleBody(body: string): Promise<React.ReactElement> {
  const { content } = await compileMDX({
    source: body,
    components: MDX_COMPONENTS,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [rehypeSlug, [rehypeAutolinkHeadings, { ...AUTOLINK_OPTIONS }]],
      },
    },
  });
  return content;
}
