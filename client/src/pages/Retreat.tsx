import RetreatBuilder from "@/components/RetreatBuilder";
import { AppHeader } from "@/components/AppHeader";
import { RequirePlan } from "@/components/RequirePlan";
import { SEO, SEO_CONTENT } from "@/components/SEO";

export default function Retreat() {
  return (
    <>
      <SEO {...SEO_CONTENT.retreat} />
      <RequirePlan message="Create personalized DIY retreats with a premium subscription">
      <AppHeader />
      <div className="pt-16">
        <RetreatBuilder />
      </div>
    </RequirePlan>
    </>
  );
}
