import AttachmentResults from '../AttachmentResults';

export default function AttachmentResultsExample() {
  const scores = {
    secure: 45,
    anxious: 30,
    avoidant: 15,
    fearful: 10,
  };

  return (
    <AttachmentResults
      scores={scores}
      hasRedFlags={false}
      onTalkToCoach={() => console.log('Talk to coach clicked')}
      onPlanRetreat={() => console.log('Plan retreat clicked')}
      onViewExercises={() => console.log('View exercises clicked')}
    />
  );
}
