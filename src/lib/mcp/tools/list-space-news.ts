import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_space_news",
  title: "Latest space news",
  description:
    "List the latest spaceflight and astronomy news articles with title, source, publish date, summary and link.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many articles to return (1-30, default 10)."),
    search: z.string().optional().describe("Optional keyword to filter article titles."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ limit, search }) => {
    const count = Math.min(Math.max(limit ?? 10, 1), 30);
    const url = new URL("https://api.spaceflightnewsapi.net/v4/articles/");
    url.searchParams.set("limit", String(count));
    if (search) url.searchParams.set("title_contains", search);
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Space news request failed (${res.status}).` }],
        isError: true,
      };
    }
    const json = (await res.json()) as { results?: Array<Record<string, any>> };
    const articles = (json.results ?? []).map((a) => ({
      title: a['title'],
      news_site: a['news_site'],
      published_at: a['published_at'],
      summary: a['summary'],
      url: a['url'],
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(articles) }],
      structuredContent: { articles },
    };
  },
});