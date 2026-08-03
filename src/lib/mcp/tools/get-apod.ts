import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { nasaApiKey } from "../env";

export default defineTool({
  name: "get_astronomy_picture_of_the_day",
  title: "Astronomy Picture of the Day",
  description:
    "Get NASA's Astronomy Picture of the Day: title, explanation and image/video URL. Optionally pass a date (YYYY-MM-DD, from 1995-06-16 onwards).",
  inputSchema: {
    date: z.string().optional().describe("Date in YYYY-MM-DD format. Defaults to today."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: true },
  handler: async ({ date }) => {
    const url = new URL("https://api.nasa.gov/planetary/apod");
    url.searchParams.set("api_key", nasaApiKey());
    if (date) url.searchParams.set("date", date);
    const res = await fetch(url);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `NASA APOD request failed (${res.status}).` }],
        isError: true,
      };
    }
    const apod = (await res.json()) as Record<string, unknown>;
    const summary = {
      date: apod['date'],
      title: apod['title'],
      explanation: apod['explanation'],
      media_type: apod['media_type'],
      url: apod['url'],
      hdurl: apod['hdurl'],
      copyright: apod['copyright'],
    };
    return {
      content: [{ type: "text", text: JSON.stringify(summary) }],
      structuredContent: summary,
    };
  },
});