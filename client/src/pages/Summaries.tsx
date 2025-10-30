import WeeklySummaries from "@/components/WeeklySummaries";
import { AppHeader } from "@/components/AppHeader";
import { RequirePlan } from "@/components/RequirePlan";
import { SEO, SEO_CONTENT } from "@/components/SEO";

export default function Summaries() {
  return (
    <>
      <SEO {...SEO_CONTENT.summaries} />
      <RequirePlan message="View your weekly coaching summaries with a premium subscription">
      <AppHeader />
      <div className="pt-16">
        <WeeklySummaries />
      </div>
    </RequirePlan>
    </>
  );
}
