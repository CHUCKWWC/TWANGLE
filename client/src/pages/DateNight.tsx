import DateNightPlanner from "@/components/DateNightPlanner";
import { AppHeader } from "@/components/AppHeader";
import { SEO, SEO_CONTENT } from "@/components/SEO";

export default function DateNight() {
  return (
    <>
      <SEO {...SEO_CONTENT.dateNight} />
      <AppHeader />
      <div className="pt-16">
        <DateNightPlanner />
      </div>
    </>
  );
}
