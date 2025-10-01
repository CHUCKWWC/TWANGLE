import WelcomeHero from '../WelcomeHero';

export default function WelcomeHeroExample() {
  return (
    <WelcomeHero 
      onStartAssessment={() => console.log('Start assessment clicked')}
      onJumpToCoach={() => console.log('Jump to coach clicked')}
    />
  );
}
