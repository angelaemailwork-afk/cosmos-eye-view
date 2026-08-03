import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "list_upcoming_launches",
  title: "Upcoming rocket launches",
  description:
    "List upcoming worldwide rocket launches with mission name, provider, launch pad, scheduled time (NET) and status.",
  inputSchema: {
    limit: z.number().int().optional().describe("How many launches to return (1-30, default 10)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ limit }) => {
    const count = Math.min(Math.max(limit ?? 10, 1), 30);
    const res = await fetch(
      `https://ll.thespacedevs.com/2.2.0/launch/upcoming/?limit=${count}&mode=list`,
    );
    if (!res.ok) {
      return {
        content: [
          {
            type: "text",
            text: `Launch API request failed (${res.status}). The upstream service rate-limits busy hours; try again shortly.`,
          },
        ],
        isError: true,
      };
    }
    const json = (await res.json()) as { results?: Array<Record<string, any>> };
    const launches = (json.results ?? []).map((l) => ({
      id: l['id'],
      name: l['name'],
      net: l['net'],
      status: l['status']?.name,
      provider: l['launch_service_provider']?.name,
      pad: l['pad']?.name,
      location: l['pad']?.location?.name,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(launches) }],
      structuredContent: { launches },
    };
  },
});