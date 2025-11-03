import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { conversationQuestions } from "@shared/schema";
import ws from "ws";

// Configure Neon to use WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

const questions = [
  // Emotional Intimacy (20 questions)
  { category: "emotional_intimacy", intensity: 1, questionText: "What is one emotion you felt strongly this week, and when did you notice it first?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "How do you physically experience sadness or happiness in your body?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "Is there a moment recently when you felt understood by your partner? Describe how that felt.", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "Which emotion is easiest for you to share, and which is hardest? Why?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "When do you most need emotional support from your partner?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "How do you show love when words are difficult to find?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "What helps you feel safe to share vulnerable feelings?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "How do you react when your partner expresses a strong feeling?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "What is one thing that helps you calm down during emotional stress?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "When did you last feel joy together, and what sparked it?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "What feeling do you struggle to name or express? Where do you feel it in your body?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "How can your partner support you when you are anxious?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "What is an emotional 'green flag' in your relationship?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "How do you know when your partner is hurt (without them saying it)?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "Is there a way you'd like to express affection more openly?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "Describe a time you felt appreciated by your partner.", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 2, questionText: "What would help you feel more comfortable sharing your feelings?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "How does your partner make you feel loved emotionally?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 3, questionText: "What emotional need do you think is unmet in your relationship?", therapyPrompt: "Go gently—name one feeling and where it shows up." },
  { category: "emotional_intimacy", intensity: 1, questionText: "How do you celebrate each other's emotional growth?", therapyPrompt: "Go gently—name one feeling and where it shows up." },

  // Communication Conflict (20 questions)
  { category: "communication_conflict", intensity: 2, questionText: "Describe a recent disagreement—what did you feel and need in that moment?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "What words help you feel heard during a conflict?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How can you express hurt without placing blame?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 1, questionText: "What is one thing your partner does that helps you stay calm in arguments?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How would you like your partner to respond when you're upset?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 1, questionText: "Is there a phrase that diffuses tension for you?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 1, questionText: "Share a positive outcome that arose from a past conflict.", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "What communication habit would you like to change?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How do you feel when feedback is given to you?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 1, questionText: "What's one way you resolve misunderstandings quickly?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How do you start difficult conversations?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 3, questionText: "Is there a communication pattern from your childhood influencing you now?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How do you express 'I'm sorry' genuinely?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "What does respectful disagreement look like for you?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How do you communicate your needs under stress?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "What is one way your partner could improve listening skills?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "When do you feel defensive, and how can you manage it?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "What tone or body language helps you feel safe?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "How do you repair after a fight?", therapyPrompt: "Focus on one moment; describe impact, not blame." },
  { category: "communication_conflict", intensity: 2, questionText: "What makes you trust your partner during tense discussions?", therapyPrompt: "Focus on one moment; describe impact, not blame." },

  // Physical Intimacy (20 questions)
  { category: "physical_intimacy", intensity: 1, questionText: "What type of touch feels most comforting?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How do you prefer your partner to initiate physical closeness?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "Is there a new way you'd like to experience physical intimacy?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How can you express boundaries around physical touch?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 1, questionText: "What physical gesture always makes you smile?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How do you communicate a desire for more closeness?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "What makes you feel safe during intimacy?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How has your comfort with physical affection changed?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "Is there a touch you'd like to try—or avoid?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 1, questionText: "What role does non-sexual touch play for you?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 1, questionText: "How do you express appreciation physically?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 1, questionText: "When do you feel most relaxed together?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How often would you like to be physically close?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 1, questionText: "How does affection help you feel connected?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 1, questionText: "What kind physical gesture means 'I love you' to you?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How do you handle differences in physical needs?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "What is an intimate moment you'd like to repeat?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How can your partner make you feel desired?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "What nonverbal signals do you use for physical comfort?", therapyPrompt: "Use clear, kind language for touch you welcome." },
  { category: "physical_intimacy", intensity: 2, questionText: "How would you like to show more physical affection?", therapyPrompt: "Use clear, kind language for touch you welcome." },

  // Finances Planning (20 questions)
  { category: "finances_planning", intensity: 2, questionText: "What does financial security look like in your relationship?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "How do you picture your future together regarding money?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "What daily habits help you feel secure about finances?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "How do you talk about unexpected expenses?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "How can you support each other's savings goals?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "What is one thing you'd like to change about budgeting?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "How do you celebrate financial milestones?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "What worries you about money, and how do you cope?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "How do you plan big purchases or trips together?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "What does 'enough' mean to you financially?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "How do you handle disagreements about spending?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "What is a money management skill you want to improve?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "How do you make financial decisions as a team?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "What is one thing you wish your partner understood about your financial mindset?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "How do financial values affect your trust in each other?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "What does generosity look like in your daily life?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "How do you balance fun and financial responsibility?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "What's a financial tradition you want to start together?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 2, questionText: "How has your view of money changed in this relationship?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },
  { category: "finances_planning", intensity: 1, questionText: "What small step can you take to feel more financially secure?", therapyPrompt: "Think in pictures—what does 'secure' look like day-to-day?" },

  // Values Spiritual (20 questions)
  { category: "values_spiritual", intensity: 2, questionText: "What brings you a sense of purpose in your life?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "How do you experience spiritual connection together?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 1, questionText: "Is there a daily ritual that grounds you or inspires you?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 1, questionText: "Share a tradition that has deep meaning for you.", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "What belief gives you hope when times are hard?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "How can you support each other's spiritual journeys?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "Describe a moment you felt spiritually connected with your partner.", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "What does forgiveness mean to you?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 1, questionText: "How do you express gratitude daily?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "Is there a value or principle you want to grow together?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "What spiritual or cultural practice would you like to try as a couple?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 1, questionText: "How do you celebrate meaning or purpose together?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "Is there an inspiring story or text you want to share or reflect on?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 3, questionText: "How do you work through spiritual differences in your relationship?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 1, questionText: "What helps you feel at peace with your partner?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "What is one value you would like your children or future generations to inherit?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "How do you talk about existential or philosophical questions together?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 1, questionText: "What gives you a sense of belonging?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "How can your partner help remind you of what matters most?", therapyPrompt: "Share what gives meaning; one practice you want together." },
  { category: "values_spiritual", intensity: 2, questionText: "What shared dream or vision inspires you both?", therapyPrompt: "Share what gives meaning; one practice you want together." },

  // Play Adventure (20 questions)
  { category: "play_adventure", intensity: 1, questionText: "What is one light-hearted activity you want to do together this week?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "Describe a silly moment you would love to recreate.", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "What is your favorite way to play as a couple?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "When was the last time you tried something new together?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 2, questionText: "Is there an adventure you've dreamed of taking together?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "How can you make everyday routines more fun?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "Share a game you'd like to play with your partner.", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "What does adventure look like in your relationship?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "How do spontaneous plans make you feel?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "What's a creative project you could try together?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 2, questionText: "Describe a place you'd like to explore together.", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "When did you last laugh until you cried together?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "Do you have a favorite tradition for fun or play?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "How can you encourage each other to loosen up and play?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "What is a playful challenge you want to take on?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "How does adventure help you feel closer?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "What activity helps you both forget stress and live in the moment?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "How can you inject more surprise into your week?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "What is a childhood game you'd like to play again?", therapyPrompt: "Choose something light you can actually do this week." },
  { category: "play_adventure", intensity: 1, questionText: "How do you show your playful side to your partner?", therapyPrompt: "Choose something light you can actually do this week." },

  // Trust Boundaries (20 questions)
  { category: "trust_boundaries", intensity: 2, questionText: "What boundary helps you feel safe and connected?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you communicate new boundaries to your partner?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 1, questionText: "Describe a moment when your partner honored your boundary.", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you know a boundary is working for your relationship?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you set a boundary with kindness?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 1, questionText: "Share a trust-building habit in your relationship.", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "What is a boundary you've struggled to keep?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 3, questionText: "How do you repair trust after a breach?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 1, questionText: "What does mutual respect look like in day-to-day life?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you want to be supported in honoring your boundaries?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How can boundaries help grow intimacy, not distance?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 1, questionText: "What is one way you show trust in your partner?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you handle differences in comfort zones?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 3, questionText: "What is a past experience that shaped your views on trust?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you recover when trust is challenged?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you negotiate boundaries when they conflict?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 1, questionText: "Describe one thing your partner does that strengthens your trust.", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "How do you talk about secrets or privacy in your relationship?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 2, questionText: "What does forgiveness mean to you in the context of trust?", therapyPrompt: "Name a boundary that protects connection, not distance." },
  { category: "trust_boundaries", intensity: 1, questionText: "How would you like to celebrate moments of mutual trust?", therapyPrompt: "Name a boundary that protects connection, not distance." },
];

export async function seedConversationQuestions() {
  console.log("Seeding conversation questions...");
  
  try {
    // Check if questions already exist
    const existing = await db.select().from(conversationQuestions).limit(1);
    
    if (existing.length > 0) {
      console.log("Questions already seeded. Skipping...");
      return;
    }

    // Insert all questions
    await db.insert(conversationQuestions).values(questions);
    
    console.log(`Successfully seeded ${questions.length} conversation questions!`);
  } catch (error) {
    console.error("Error seeding questions:", error);
    throw error;
  }
}

// Run immediately
seedConversationQuestions()
  .then(() => {
    console.log("Seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
