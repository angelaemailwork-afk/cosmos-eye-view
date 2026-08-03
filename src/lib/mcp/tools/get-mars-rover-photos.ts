import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";

export default defineTool({
  name: "get_mars_rover_photos",
  title: "Mars rover photos",
  description:
    "Get the latest raw images from a NASA Mars rover (perseverance or curiosity), with camera name, sol and image URL.",
  inputSchema: {
    rover: z
      .enum(["perseverance", "curiosity"])
      .describe("Which rover's raw image feed to read."),
    limit: z.number().int().optional().describe("How many photos to return (1-25, default 10)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async ({ rover, limit }) => {
    const count = Math.min(Math.max(limit ?? 10, 1), 25);
    const feed =
      rover === "perseverance"
        ? `https://mars.nasa.gov/rss/api/?feed=raw_images&category=mars2020,ingenuity&feedtype=json&num=${count}&order=sol+desc`
        : `https://mars.nasa.gov/rss/api/?feed=raw_images&category=msl&feedtype=json&num=${count}&order=sol+desc`;
    const res = await fetch(feed);
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `Mars raw image feed failed (${res.status}).` }],
        isError: true,
      };
    }
    const json = (await res.json()) as { images?: Array<Record<string, any>> };
    const photos = (json.images ?? []).slice(0, count).map((img) => ({
      id: img['imageid'],
      sol: img['sol'],
      earth_date: img['date_taken_utc'],
      camera: img['camera']?.instrument ?? img['camera']?.camera_model_component_list,
      image_url: img['image_files']?.large ?? img['image_files']?.full_res,
    }));
    return {
      content: [{ type: "text", text: JSON.stringify(photos) }],
      structuredContent: { rover, photos },
    };
  },
});