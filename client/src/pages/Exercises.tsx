import ExercisesLibrary from "@/components/ExercisesLibrary";
import { AppHeader } from "@/components/AppHeader";

export default function Exercises() {
  return (
    <>
      <AppHeader />
      <div className="pt-16">
        <ExercisesLibrary />
      </div>
    </>
  );
}
