import WeeklySummaries from "@/components/WeeklySummaries";
import { AppHeader } from "@/components/AppHeader";
import { RequirePlan } from "@/components/RequirePlan";

export default function Summaries() {
  return (
    <RequirePlan message="View your weekly coaching summaries with a premium subscription">
      <AppHeader />
      <div className="pt-16">
        <WeeklySummaries />
      </div>
    </RequirePlan>
  );
}
