import { defineTool } from "@lovable.dev/mcp-js";

export default defineTool({
  name: "get_iss_position",
  title: "ISS live position",
  description:
    "Get the current position of the International Space Station: latitude, longitude, altitude (km), velocity (km/h) and daylight visibility.",
  inputSchema: {},
  annotations: { readOnlyHint: true, openWorldHint: true },
  handler: async () => {
    const res = await fetch("https://api.wheretheiss.at/v1/satellites/25544");
    if (!res.ok) {
      return {
        content: [{ type: "text", text: `ISS telemetry request failed (${res.status}).` }],
        isError: true,
      };
    }
    const pos = (await res.json()) as Record<string, unknown>;
    return {
      content: [{ type: "text", text: JSON.stringify(pos) }],
      structuredContent: pos,
    };
  },
});