import { auth, defineMcp } from "@lovable.dev/mcp-js";
import apodTool from "./tools/get-apod";
import issTool from "./tools/get-iss-position";
import launchesTool from "./tools/list-upcoming-launches";
import newsTool from "./tools/list-space-news";
import marsTool from "./tools/get-mars-rover-photos";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "cosmos-chronicle",
  title: "Cosmos Chronicle",
  version: "0.1.0",
  instructions:
    "Live space observatory tools for Cosmos Live. Use `get_astronomy_picture_of_the_day` for NASA's APOD, `get_iss_position` for real-time ISS telemetry, `list_upcoming_launches` for the worldwide launch manifest, `list_space_news` for the latest spaceflight news, and `get_mars_rover_photos` for the newest raw Mars rover imagery.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [apodTool, issTool, launchesTool, newsTool, marsTool],
});