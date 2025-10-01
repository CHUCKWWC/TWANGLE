import { useState } from 'react';
import AssessmentQuestion from '../AssessmentQuestion';

export default function AssessmentQuestionExample() {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);

  const question = {
    id: '1',
    text: 'When my partner seems distant, I tend to...',
    options: [
      { id: 'a', text: 'Give them space and wait for them to come to me', value: 1 },
      { id: 'b', text: 'Reach out and try to connect with them', value: 2 },
      { id: 'c', text: 'Feel anxious and worry about what I did wrong', value: 3 },
      { id: 'd', text: 'Withdraw and protect myself emotionally', value: 4 },
    ],
  };

  return (
    <AssessmentQuestion
      question={question}
      currentQuestion={5}
      totalQuestions={25}
      selectedOption={selectedOption}
      onSelectOption={setSelectedOption}
      onNext={() => console.log('Next clicked', selectedOption)}
      onBack={() => console.log('Back clicked')}
      canGoBack={true}
    />
  );
}
