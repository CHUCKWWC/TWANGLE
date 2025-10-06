import DateNightPlanner from "@/components/DateNightPlanner";
import { AppHeader } from "@/components/AppHeader";

export default function DateNight() {
  return (
    <>
      <AppHeader />
      <div className="pt-16">
        <DateNightPlanner />
      </div>
    </>
  );
}
