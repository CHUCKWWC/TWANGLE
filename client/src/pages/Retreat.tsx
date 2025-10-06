import RetreatBuilder from "@/components/RetreatBuilder";
import { AppHeader } from "@/components/AppHeader";
import { RequirePlan } from "@/components/RequirePlan";

export default function Retreat() {
  return (
    <RequirePlan message="Create personalized DIY retreats with a premium subscription">
      <AppHeader />
      <div className="pt-16">
        <RetreatBuilder />
      </div>
    </RequirePlan>
  );
}
