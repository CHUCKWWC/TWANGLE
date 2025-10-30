import ExercisesLibrary from "@/components/ExercisesLibrary";
import { AppHeader } from "@/components/AppHeader";
import { SEO, SEO_CONTENT } from "@/components/SEO";

export default function Exercises() {
  return (
    <>
      <SEO {...SEO_CONTENT.exercises} />
      <AppHeader />
      <div className="pt-16">
        <ExercisesLibrary />
      </div>
    </>
  );
}
