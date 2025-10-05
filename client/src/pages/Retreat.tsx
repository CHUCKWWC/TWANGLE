import RetreatBuilder from "@/components/RetreatBuilder";
import { AppHeader } from "@/components/AppHeader";

export default function Retreat() {
  return (
    <>
      <AppHeader />
      <div className="pt-16">
        <RetreatBuilder />
      </div>
    </>
  );
}
