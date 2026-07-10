import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const SESSION_KEY = "cosmos_visit_counted_v1";

export function VisitorCounter() {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function run() {
      try {
        const alreadyCounted =
          typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY);

        if (!alreadyCounted) {
          const { data, error } = await supabase.rpc("increment_visitor_count");
          if (!error && typeof data === "number") {
            sessionStorage.setItem(SESSION_KEY, "1");
            if (!cancelled) setCount(data);
            return;
          }
        }

        const { data: row } = await supabase
          .from("visitor_stats")
          .select("count")
          .eq("id", 1)
          .maybeSingle();
        if (!cancelled && row?.count != null) setCount(Number(row.count));
      } catch {
        // silent — footer stat is non-critical
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="inline-flex items-center gap-1.5 text-muted-foreground">
      <Users className="h-3 w-3 text-primary" />
      <span>
        {count === null ? "Counting visitors…" : (
          <>
            <span className="text-foreground font-medium tabular-nums">
              {count.toLocaleString()}
            </span>{" "}
            cosmic visitors and counting
          </>
        )}
      </span>
    </div>
  );
}