export interface QuestionOption {
  id: string;
  text: string;
  value: string;
}

export interface Question {
  id: string;
  text: string;
  options: QuestionOption[];
}

export const ASSESSMENT_QUESTIONS: Question[] = [
  {
    id: '1',
    text: 'When I feel stressed or upset, I typically...',
    options: [
      { id: 'a', text: 'Seek comfort and support from my partner', value: 'secure' },
      { id: 'b', text: 'Need constant reassurance that everything is okay', value: 'anxious' },
      { id: 'c', text: 'Prefer to handle my feelings on my own', value: 'avoidant' },
      { id: 'd', text: 'Want to reach out but worry I will be rejected', value: 'fearful' },
    ],
  },
  {
    id: '2',
    text: 'In my relationship, I generally feel...',
    options: [
      { id: 'a', text: 'Comfortable with both closeness and independence', value: 'secure' },
      { id: 'b', text: 'A strong need for reassurance and validation', value: 'anxious' },
      { id: 'c', text: 'More comfortable maintaining some emotional distance', value: 'avoidant' },
      { id: 'd', text: 'Conflicted between wanting closeness and fearing it', value: 'fearful' },
    ],
  },
  {
    id: '3',
    text: 'When my partner seems distant or preoccupied, I...',
    options: [
      { id: 'a', text: 'Give them space and trust they will come to me if needed', value: 'secure' },
      { id: 'b', text: 'Feel anxious and immediately try to reconnect', value: 'anxious' },
      { id: 'c', text: 'Feel relieved to have some space', value: 'avoidant' },
      { id: 'd', text: 'Want to reach out but fear making things worse', value: 'fearful' },
    ],
  },
  {
    id: '4',
    text: 'When conflicts arise in my relationship, I typically...',
    options: [
      { id: 'a', text: 'Address them directly but calmly and respectfully', value: 'secure' },
      { id: 'b', text: 'Get emotional and need to talk it through immediately', value: 'anxious' },
      { id: 'c', text: 'Prefer to take time alone to process my thoughts', value: 'avoidant' },
      { id: 'd', text: 'Avoid confrontation altogether to prevent rejection', value: 'fearful' },
    ],
  },
  {
    id: '5',
    text: 'I think about my relationship...',
    options: [
      { id: 'a', text: 'In a balanced way, neither obsessing nor avoiding', value: 'secure' },
      { id: 'b', text: 'Very frequently, often analyzing every detail', value: 'anxious' },
      { id: 'c', text: 'Occasionally, preferring to focus on other areas of life', value: 'avoidant' },
      { id: 'd', text: 'With mixed feelings of hope and doubt', value: 'fearful' },
    ],
  },
  {
    id: '6',
    text: 'When my partner expresses their need for closeness, I...',
    options: [
      { id: 'a', text: 'Feel comfortable meeting their need for connection', value: 'secure' },
      { id: 'b', text: 'Feel relieved and eager to connect deeply', value: 'anxious' },
      { id: 'c', text: 'Sometimes feel overwhelmed or smothered', value: 'avoidant' },
      { id: 'd', text: 'Want to connect but worry I will disappoint them', value: 'fearful' },
    ],
  },
  {
    id: '7',
    text: 'My beliefs about depending on others are...',
    options: [
      { id: 'a', text: 'Healthy interdependence is important in relationships', value: 'secure' },
      { id: 'b', text: 'I need my partner to feel complete and secure', value: 'anxious' },
      { id: 'c', text: 'I prefer to be self-reliant and not depend on others', value: 'avoidant' },
      { id: 'd', text: 'I want to depend on others but fear being hurt', value: 'fearful' },
    ],
  },
  {
    id: '8',
    text: 'When I imagine my ideal relationship, I see...',
    options: [
      { id: 'a', text: 'A partnership where both people support each other', value: 'secure' },
      { id: 'b', text: 'A deep, all-consuming connection with my partner', value: 'anxious' },
      { id: 'c', text: 'A relationship that respects personal space and freedom', value: 'avoidant' },
      { id: 'd', text: 'A close relationship, though I worry it might not work out', value: 'fearful' },
    ],
  },
  {
    id: '9',
    text: 'When thinking about past relationships, I...',
    options: [
      { id: 'a', text: 'Can reflect objectively on both good and challenging times', value: 'secure' },
      { id: 'b', text: 'Often replay moments and wonder what I could have done differently', value: 'anxious' },
      { id: 'c', text: 'Don\'t dwell on them much, preferring to move forward', value: 'avoidant' },
      { id: 'd', text: 'Have mixed feelings of longing and relief that they ended', value: 'fearful' },
    ],
  },
  {
    id: '10',
    text: 'My comfort level with emotional intimacy is...',
    options: [
      { id: 'a', text: 'I feel comfortable being vulnerable and sharing deeply', value: 'secure' },
      { id: 'b', text: 'I crave deep intimacy and share very openly', value: 'anxious' },
      { id: 'c', text: 'I prefer to keep some emotional boundaries', value: 'avoidant' },
      { id: 'd', text: 'I want deep intimacy but struggle to fully open up', value: 'fearful' },
    ],
  },
];
