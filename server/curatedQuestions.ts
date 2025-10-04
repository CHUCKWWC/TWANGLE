// Curated conversation starter questions for couples
// Research-backed questions based on Gottman Method, EFT, and Attachment Theory

export interface CuratedQuestion {
  topicId: string;
  question: string;
  order: number;
}

export const CURATED_QUESTIONS: CuratedQuestion[] = [
  // Communication (8 questions)
  {
    topicId: "communication",
    question: "What's one thing I do that makes you feel truly heard and understood?",
    order: 1,
  },
  {
    topicId: "communication",
    question: "When we disagree, what communication style helps you feel safe to share your perspective?",
    order: 2,
  },
  {
    topicId: "communication",
    question: "Is there something you've been wanting to talk about but haven't found the right moment?",
    order: 3,
  },
  {
    topicId: "communication",
    question: "How do you prefer to receive feedback or constructive input from me?",
    order: 4,
  },
  {
    topicId: "communication",
    question: "What's a recent conversation we had where you felt particularly connected to me?",
    order: 5,
  },
  {
    topicId: "communication",
    question: "When I'm stressed or upset, what's the best way for you to support me through communication?",
    order: 6,
  },
  {
    topicId: "communication",
    question: "Are there topics you feel we avoid discussing? What would make them easier to address?",
    order: 7,
  },
  {
    topicId: "communication",
    question: "What does 'active listening' look like to you, and how can I practice it better with you?",
    order: 8,
  },

  // Emotional Intimacy (8 questions)
  {
    topicId: "emotional-intimacy",
    question: "What makes you feel most emotionally close to me?",
    order: 1,
  },
  {
    topicId: "emotional-intimacy",
    question: "Is there a vulnerability or fear you've been hesitant to share with me?",
    order: 2,
  },
  {
    topicId: "emotional-intimacy",
    question: "When do you feel most emotionally safe in our relationship?",
    order: 3,
  },
  {
    topicId: "emotional-intimacy",
    question: "What's one thing you wish I knew about how you experience emotions?",
    order: 4,
  },
  {
    topicId: "emotional-intimacy",
    question: "How can I better support you when you're going through difficult emotions?",
    order: 5,
  },
  {
    topicId: "emotional-intimacy",
    question: "What does emotional intimacy mean to you, and how do we cultivate it together?",
    order: 6,
  },
  {
    topicId: "emotional-intimacy",
    question: "Are there moments when you feel emotionally distant from me? What triggers that?",
    order: 7,
  },
  {
    topicId: "emotional-intimacy",
    question: "What's a dream or hope you have that you'd like me to understand more deeply?",
    order: 8,
  },

  // Physical Intimacy (8 questions)
  {
    topicId: "physical-intimacy",
    question: "What forms of physical touch make you feel most loved and connected?",
    order: 1,
  },
  {
    topicId: "physical-intimacy",
    question: "How do you feel about our current level of physical intimacy?",
    order: 2,
  },
  {
    topicId: "physical-intimacy",
    question: "Is there a type of physical affection you'd like more of in our daily life?",
    order: 3,
  },
  {
    topicId: "physical-intimacy",
    question: "What helps you feel most comfortable and connected during intimate moments?",
    order: 4,
  },
  {
    topicId: "physical-intimacy",
    question: "How can we create more opportunities for physical closeness in our routine?",
    order: 5,
  },
  {
    topicId: "physical-intimacy",
    question: "Are there boundaries or preferences around physical intimacy you'd like to discuss?",
    order: 6,
  },
  {
    topicId: "physical-intimacy",
    question: "What does physical intimacy mean to you beyond sexual connection?",
    order: 7,
  },
  {
    topicId: "physical-intimacy",
    question: "When was a time you felt particularly connected to me physically? What made it special?",
    order: 8,
  },

  // Conflict Resolution (8 questions)
  {
    topicId: "conflict-resolution",
    question: "What's your ideal way to resolve disagreements together?",
    order: 1,
  },
  {
    topicId: "conflict-resolution",
    question: "How do you typically feel during and after our conflicts?",
    order: 2,
  },
  {
    topicId: "conflict-resolution",
    question: "What's one thing I do during disagreements that helps you feel respected?",
    order: 3,
  },
  {
    topicId: "conflict-resolution",
    question: "Is there a recurring disagreement we have that needs a different approach?",
    order: 4,
  },
  {
    topicId: "conflict-resolution",
    question: "What would help you feel safer bringing up difficult topics with me?",
    order: 5,
  },
  {
    topicId: "conflict-resolution",
    question: "When we argue, what do you need most from me to feel heard and valued?",
    order: 6,
  },
  {
    topicId: "conflict-resolution",
    question: "How can we better repair and reconnect after a disagreement?",
    order: 7,
  },
  {
    topicId: "conflict-resolution",
    question: "What conflict patterns from your past relationships do you notice showing up in ours?",
    order: 8,
  },

  // Trust & Security (8 questions)
  {
    topicId: "trust-security",
    question: "What makes you feel most secure in our relationship?",
    order: 1,
  },
  {
    topicId: "trust-security",
    question: "Are there areas where you'd like to feel more trust or security with me?",
    order: 2,
  },
  {
    topicId: "trust-security",
    question: "What does trust mean to you, and how do I demonstrate it?",
    order: 3,
  },
  {
    topicId: "trust-security",
    question: "Is there something I could do to help you feel more emotionally safe with me?",
    order: 4,
  },
  {
    topicId: "trust-security",
    question: "How do past relationship experiences affect your sense of security with me?",
    order: 5,
  },
  {
    topicId: "trust-security",
    question: "What boundaries are most important to you for maintaining trust in our relationship?",
    order: 6,
  },
  {
    topicId: "trust-security",
    question: "When have you felt most secure and trusting in our relationship?",
    order: 7,
  },
  {
    topicId: "trust-security",
    question: "How can we rebuild or strengthen trust if it ever feels shaken?",
    order: 8,
  },

  // Shared Goals (8 questions)
  {
    topicId: "shared-goals",
    question: "What are your top three personal goals for the next year?",
    order: 1,
  },
  {
    topicId: "shared-goals",
    question: "What dreams do you have for our relationship's future?",
    order: 2,
  },
  {
    topicId: "shared-goals",
    question: "How do you envision our life together five years from now?",
    order: 3,
  },
  {
    topicId: "shared-goals",
    question: "Are there goals or dreams of mine you'd like to understand better?",
    order: 4,
  },
  {
    topicId: "shared-goals",
    question: "What shared goals feel most important for us to work toward together?",
    order: 5,
  },
  {
    topicId: "shared-goals",
    question: "How can we better support each other's individual goals while pursuing shared ones?",
    order: 6,
  },
  {
    topicId: "shared-goals",
    question: "What values do you want to guide our decisions as a couple?",
    order: 7,
  },
  {
    topicId: "shared-goals",
    question: "Is there a goal or dream you've set aside that you'd like to revisit?",
    order: 8,
  },

  // Quality Time (8 questions)
  {
    topicId: "quality-time",
    question: "What does quality time together look like to you?",
    order: 1,
  },
  {
    topicId: "quality-time",
    question: "When do you feel most present and connected with me?",
    order: 2,
  },
  {
    topicId: "quality-time",
    question: "What's an activity we could do together that would make you feel cherished?",
    order: 3,
  },
  {
    topicId: "quality-time",
    question: "How can we protect our time together from distractions and interruptions?",
    order: 4,
  },
  {
    topicId: "quality-time",
    question: "What's a memory of quality time we've shared that stands out to you?",
    order: 5,
  },
  {
    topicId: "quality-time",
    question: "Do you feel we have enough quality time together? What would ideal look like?",
    order: 6,
  },
  {
    topicId: "quality-time",
    question: "What daily or weekly rituals could help us stay connected?",
    order: 7,
  },
  {
    topicId: "quality-time",
    question: "How do you prefer to spend quality time - doing activities together or having deep conversations?",
    order: 8,
  },

  // Appreciation (8 questions)
  {
    topicId: "appreciation",
    question: "What's something I do that you deeply appreciate but may not thank me for enough?",
    order: 1,
  },
  {
    topicId: "appreciation",
    question: "How do you most like to receive appreciation - words, actions, or something else?",
    order: 2,
  },
  {
    topicId: "appreciation",
    question: "What qualities do you admire most about me?",
    order: 3,
  },
  {
    topicId: "appreciation",
    question: "Is there a way you show me love that you wish I noticed or acknowledged more?",
    order: 4,
  },
  {
    topicId: "appreciation",
    question: "What small gestures from me make you feel most valued?",
    order: 5,
  },
  {
    topicId: "appreciation",
    question: "When was the last time you felt truly appreciated by me? What did I do?",
    order: 6,
  },
  {
    topicId: "appreciation",
    question: "How can we cultivate a culture of appreciation in our daily interactions?",
    order: 7,
  },
  {
    topicId: "appreciation",
    question: "What's one thing about our relationship you're grateful for today?",
    order: 8,
  },
];

// Topic IDs must match the topics in the database
export const TOPIC_IDS = [
  "communication",
  "emotional-intimacy",
  "physical-intimacy",
  "conflict-resolution",
  "trust-security",
  "shared-goals",
  "quality-time",
  "appreciation",
] as const;
