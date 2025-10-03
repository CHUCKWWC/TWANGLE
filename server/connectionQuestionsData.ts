// Curated relationship questions organized by topics
// Based on Gottman Method, EFT, and relationship research

export const connectionTopicsData = [
  {
    name: "Communication",
    description: "How you share thoughts, feelings, and listen to each other",
    icon: "MessageCircle",
    order: 1,
  },
  {
    name: "Emotional Intimacy",
    description: "Emotional connection, vulnerability, and understanding",
    icon: "Heart",
    order: 2,
  },
  {
    name: "Physical Intimacy",
    description: "Affection, touch, and physical connection",
    icon: "Users",
    order: 3,
  },
  {
    name: "Conflict Resolution",
    description: "How you navigate disagreements and challenges",
    icon: "Shield",
    order: 4,
  },
  {
    name: "Trust & Security",
    description: "Foundation of safety and reliability in your relationship",
    icon: "Lock",
    order: 5,
  },
  {
    name: "Shared Goals & Vision",
    description: "Future dreams and alignment on life direction",
    icon: "Target",
    order: 6,
  },
  {
    name: "Quality Time",
    description: "How you spend time together and create experiences",
    icon: "Clock",
    order: 7,
  },
  {
    name: "Appreciation & Gratitude",
    description: "Recognizing and valuing each other",
    icon: "Star",
    order: 8,
  },
];

export const connectionQuestionsData: { [topicName: string]: Array<{ question: string; description?: string; order: number }> } = {
  "Communication": [
    {
      question: "How do you typically express when something is bothering you in our relationship?",
      description: "Understanding your communication patterns helps identify areas for growth",
      order: 1,
    },
    {
      question: "When do you feel most heard and understood by your partner?",
      description: "Recognizing positive communication moments",
      order: 2,
    },
    {
      question: "What makes it difficult for you to share your feelings openly?",
      description: "Identifying communication barriers",
      order: 3,
    },
    {
      question: "How could your partner better support you during stressful times?",
      description: "Clarifying support needs",
      order: 4,
    },
    {
      question: "What topics do you find hardest to discuss with your partner?",
      description: "Recognizing sensitive areas",
      order: 5,
    },
  ],
  "Emotional Intimacy": [
    {
      question: "What makes you feel emotionally close to your partner?",
      description: "Identifying connection builders",
      order: 1,
    },
    {
      question: "When do you feel most vulnerable with your partner, and how does that feel?",
      description: "Understanding vulnerability and safety",
      order: 2,
    },
    {
      question: "What emotions do you find most difficult to share in your relationship?",
      description: "Recognizing emotional barriers",
      order: 3,
    },
    {
      question: "How do you typically respond when your partner shares difficult emotions?",
      description: "Understanding your support patterns",
      order: 4,
    },
    {
      question: "What does emotional intimacy mean to you in this relationship?",
      description: "Defining personal emotional needs",
      order: 5,
    },
  ],
  "Physical Intimacy": [
    {
      question: "How satisfied are you with the level of physical affection in your relationship?",
      description: "Assessing satisfaction with touch and affection",
      order: 1,
    },
    {
      question: "What types of physical touch make you feel most loved and connected?",
      description: "Identifying your love language through touch",
      order: 2,
    },
    {
      question: "How comfortable do you feel discussing your physical intimacy needs?",
      description: "Understanding communication about intimacy",
      order: 3,
    },
    {
      question: "What barriers, if any, prevent you from being more physically affectionate?",
      description: "Identifying obstacles to physical connection",
      order: 4,
    },
    {
      question: "How could you and your partner enhance your physical connection?",
      description: "Exploring growth opportunities",
      order: 5,
    },
  ],
  "Conflict Resolution": [
    {
      question: "How do you typically react when conflict arises in your relationship?",
      description: "Understanding your conflict style",
      order: 1,
    },
    {
      question: "What patterns do you notice in your arguments or disagreements?",
      description: "Recognizing recurring dynamics",
      order: 2,
    },
    {
      question: "How do you feel after conflicts are resolved (or not resolved)?",
      description: "Assessing resolution effectiveness",
      order: 3,
    },
    {
      question: "What do you wish your partner understood about how you experience conflict?",
      description: "Clarifying your conflict needs",
      order: 4,
    },
    {
      question: "What helps you return to connection after a disagreement?",
      description: "Identifying repair strategies",
      order: 5,
    },
  ],
  "Trust & Security": [
    {
      question: "What makes you feel most secure in your relationship?",
      description: "Identifying trust builders",
      order: 1,
    },
    {
      question: "Are there any areas where you struggle to fully trust your partner?",
      description: "Recognizing trust challenges",
      order: 2,
    },
    {
      question: "How do you show your partner that they can trust you?",
      description: "Understanding your trustworthiness actions",
      order: 3,
    },
    {
      question: "What past experiences influence how you trust in this relationship?",
      description: "Recognizing trust history",
      order: 4,
    },
    {
      question: "What would help you feel even more secure in this relationship?",
      description: "Clarifying security needs",
      order: 5,
    },
  ],
  "Shared Goals & Vision": [
    {
      question: "What are your most important goals for the next 5-10 years?",
      description: "Exploring long-term vision",
      order: 1,
    },
    {
      question: "How aligned do you feel with your partner about your future together?",
      description: "Assessing vision alignment",
      order: 2,
    },
    {
      question: "What dreams or aspirations do you hope your partner supports?",
      description: "Identifying personal goals needing support",
      order: 3,
    },
    {
      question: "What concerns do you have about your future together, if any?",
      description: "Recognizing future anxieties",
      order: 4,
    },
    {
      question: "What shared experiences or goals excite you most about your future?",
      description: "Finding shared enthusiasm",
      order: 5,
    },
  ],
  "Quality Time": [
    {
      question: "How satisfied are you with the quality of time you spend together?",
      description: "Assessing time satisfaction",
      order: 1,
    },
    {
      question: "What activities help you feel most connected to your partner?",
      description: "Identifying connection activities",
      order: 2,
    },
    {
      question: "What prevents you from spending more quality time together?",
      description: "Recognizing time barriers",
      order: 3,
    },
    {
      question: "How do you balance together time with personal space and independence?",
      description: "Understanding autonomy needs",
      order: 4,
    },
    {
      question: "What would your ideal week together look like?",
      description: "Envisioning quality time",
      order: 5,
    },
  ],
  "Appreciation & Gratitude": [
    {
      question: "What do you appreciate most about your partner?",
      description: "Recognizing partner strengths",
      order: 1,
    },
    {
      question: "How often do you feel appreciated by your partner?",
      description: "Assessing appreciation satisfaction",
      order: 2,
    },
    {
      question: "What are the small things your partner does that mean a lot to you?",
      description: "Noticing everyday kindnesses",
      order: 3,
    },
    {
      question: "How do you typically express appreciation to your partner?",
      description: "Understanding your gratitude expression",
      order: 4,
    },
    {
      question: "What would help you feel more appreciated in this relationship?",
      description: "Clarifying appreciation needs",
      order: 5,
    },
  ],
};
