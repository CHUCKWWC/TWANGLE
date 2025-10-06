import DateNightPlanner from "@/components/DateNightPlanner";
import { AppHeader } from "@/components/AppHeader";
import { RequirePlan } from "@/components/RequirePlan";

export default function DateNight() {
  return (
    <RequirePlan message="Plan romantic date nights with AI-powered suggestions">
      <AppHeader />
      <div className="pt-16">
        <DateNightPlanner />
      </div>
    </RequirePlan>
  );
}
