import WeeklySummaries from "@/components/WeeklySummaries";
import { AppHeader } from "@/components/AppHeader";

export default function Summaries() {
  return (
    <>
      <AppHeader />
      <div className="pt-16">
        <WeeklySummaries />
      </div>
    </>
  );
}
