import RetreatBuilder from '../RetreatBuilder';

export default function RetreatBuilderExample() {
  return (
    <RetreatBuilder
      onSaveRetreat={(retreat) => {
        console.log('Retreat saved:', {
          duration: retreat.duration,
          location: retreat.location,
          budget: retreat.budget,
          focuses: retreat.focuses,
          activities: retreat.activities.length,
        });
      }}
    />
  );
}
