import { useEffect, useState } from "preact/hooks";
import Button from "../components/Button.tsx";
import { analyticsOptedOut, setAnalyticsOptOut } from "../lib/analytics.ts";

/**
 * The privacy page's switch for Umami in this browser (`lib/analytics.ts`'s
 * `ANALYTICS_OPT_OUT_KEY`). The stored choice is read after hydration, so the
 * server renders the "counted" state for everyone.
 */
export default function AnalyticsOptOut() {
  const [off, setOff] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => setOff(analyticsOptedOut()), []);

  const toggle = () => {
    const saved = setAnalyticsOptOut(!off);
    setFailed(!saved);
    if (saved) setOff(!off);
  };

  return (
    <div data-analytics-opt-out>
      <Button class="px-4 py-2 text-sm" onClick={toggle}>
        {off ? "Count my visits again" : "Stop counting my visits"}
      </Button>
      <p class="mt-3" role="status">
        {failed
          ? "This browser refused to save the choice, so nothing changed."
          : off
          ? "Visits from this browser are not counted."
          : "Visits from this browser are counted."}
      </p>
    </div>
  );
}
