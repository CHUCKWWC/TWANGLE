import { storage } from "../storage";

// Embedded challenge data to avoid file path issues in production
const challengesData = [
  {
    day_number: 1,
    title: "Day 1: Patience",
    scripture: "1 Corinthians 13:4",
    summary: "Show patience and understanding toward your partner today.",
    action_prompt: "Show patience and understanding toward your partner today.",
    journal_question: "How did you express patience with your partner today?"
  },
  {
    day_number: 2,
    title: "Day 2: Kindness",
    scripture: "Ephesians 4:32",
    summary: "Do something kind and unexpected for your partner.",
    action_prompt: "Do something kind and unexpected for your partner.",
    journal_question: "How did you express kindness with your partner today?"
  },
  {
    day_number: 3,
    title: "Day 3: Humility",
    scripture: "Philippians 2:3-4",
    summary: "Put your partner's needs ahead of your own today.",
    action_prompt: "Put your partner's needs ahead of your own today.",
    journal_question: "How did you express humility with your partner today?"
  },
  {
    day_number: 4,
    title: "Day 4: Forgiveness",
    scripture: "Colossians 3:13",
    summary: "Forgive a small offense quickly and without resentment.",
    action_prompt: "Forgive a small offense quickly and without resentment.",
    journal_question: "How did you express forgiveness with your partner today?"
  },
  {
    day_number: 5,
    title: "Day 5: Encouragement",
    scripture: "1 Thessalonians 5:11",
    summary: "Speak words that lift your partner up today.",
    action_prompt: "Speak words that lift your partner up today.",
    journal_question: "How did you express encouragement with your partner today?"
  },
  {
    day_number: 6,
    title: "Day 6: Gratitude",
    scripture: "1 Thessalonians 5:18",
    summary: "Thank your partner for something specific they've done.",
    action_prompt: "Thank your partner for something specific they've done.",
    journal_question: "How did you express gratitude with your partner today?"
  },
  {
    day_number: 7,
    title: "Day 7: Servanthood",
    scripture: "Matthew 20:28",
    summary: "Find a way to serve your partner without being asked.",
    action_prompt: "Find a way to serve your partner without being asked.",
    journal_question: "How did you express servanthood with your partner today?"
  },
  {
    day_number: 8,
    title: "Day 8: Peace",
    scripture: "Romans 12:18",
    summary: "Create a peaceful atmosphere in your home today.",
    action_prompt: "Create a peaceful atmosphere in your home today.",
    journal_question: "How did you express peace with your partner today?"
  },
  {
    day_number: 9,
    title: "Day 9: Self-Control",
    scripture: "Proverbs 29:11",
    summary: "Hold back a criticism you're tempted to share.",
    action_prompt: "Hold back a criticism you're tempted to share.",
    journal_question: "How did you express self-control with your partner today?"
  },
  {
    day_number: 10,
    title: "Day 10: Unity",
    scripture: "Ephesians 4:3",
    summary: "Work together on a project or goal today.",
    action_prompt: "Work together on a project or goal today.",
    journal_question: "How did you express unity with your partner today?"
  },
  {
    day_number: 11,
    title: "Day 11: Understanding",
    scripture: "Proverbs 2:2-5",
    summary: "Listen to understand, not to reply, in today's conversations.",
    action_prompt: "Listen to understand, not to reply, in today's conversations.",
    journal_question: "How did you express understanding with your partner today?"
  },
  {
    day_number: 12,
    title: "Day 12: Respect",
    scripture: "1 Peter 3:7",
    summary: "Speak about your partner with respect to others today.",
    action_prompt: "Speak about your partner with respect to others today.",
    journal_question: "How did you express respect with your partner today?"
  },
  {
    day_number: 13,
    title: "Day 13: Sacrifice",
    scripture: "John 15:13",
    summary: "Give up something you enjoy for your partner's benefit.",
    action_prompt: "Give up something you enjoy for your partner's benefit.",
    journal_question: "How did you express sacrifice with your partner today?"
  },
  {
    day_number: 14,
    title: "Day 14: Trust",
    scripture: "Proverbs 31:11",
    summary: "Share a vulnerability with your partner today.",
    action_prompt: "Share a vulnerability with your partner today.",
    journal_question: "How did you express trust with your partner today?"
  },
  {
    day_number: 15,
    title: "Day 15: Joy",
    scripture: "Proverbs 17:22",
    summary: "Do something fun together that makes you both laugh.",
    action_prompt: "Do something fun together that makes you both laugh.",
    journal_question: "How did you express joy with your partner today?"
  },
  {
    day_number: 16,
    title: "Day 16: Compassion",
    scripture: "Colossians 3:12",
    summary: "Show tenderness toward a struggle your partner is facing.",
    action_prompt: "Show tenderness toward a struggle your partner is facing.",
    journal_question: "How did you express compassion with your partner today?"
  },
  {
    day_number: 17,
    title: "Day 17: Commitment",
    scripture: "Matthew 19:6",
    summary: "Reaffirm your commitment to your relationship today.",
    action_prompt: "Reaffirm your commitment to your relationship today.",
    journal_question: "How did you express commitment with your partner today?"
  },
  {
    day_number: 18,
    title: "Day 18: Hope",
    scripture: "Hebrews 11:1",
    summary: "Share a dream or hope for your future together.",
    action_prompt: "Share a dream or hope for your future together.",
    journal_question: "How did you express hope with your partner today?"
  },
  {
    day_number: 19,
    title: "Day 19: Protection",
    scripture: "Song of Songs 2:4",
    summary: "Protect your partner's reputation and feelings today.",
    action_prompt: "Protect your partner's reputation and feelings today.",
    journal_question: "How did you express protection with your partner today?"
  },
  {
    day_number: 20,
    title: "Day 20: Celebration",
    scripture: "Proverbs 5:18",
    summary: "Celebrate something about your partner today.",
    action_prompt: "Celebrate something about your partner today.",
    journal_question: "How did you express celebration with your partner today?"
  },
  {
    day_number: 21,
    title: "Day 21: Gentleness",
    scripture: "Galatians 5:22-23",
    summary: "Be extra gentle in your words and actions today.",
    action_prompt: "Be extra gentle in your words and actions today.",
    journal_question: "How did you express gentleness with your partner today?"
  },
  {
    day_number: 22,
    title: "Day 22: Wisdom",
    scripture: "James 1:5",
    summary: "Seek wisdom before responding to a challenge today.",
    action_prompt: "Seek wisdom before responding to a challenge today.",
    journal_question: "How did you express wisdom with your partner today?"
  },
  {
    day_number: 23,
    title: "Day 23: Generosity",
    scripture: "2 Corinthians 9:7",
    summary: "Be generous with your time and attention today.",
    action_prompt: "Be generous with your time and attention today.",
    journal_question: "How did you express generosity with your partner today?"
  },
  {
    day_number: 24,
    title: "Day 24: Presence",
    scripture: "Ecclesiastes 3:1",
    summary: "Be fully present during your time together today.",
    action_prompt: "Be fully present during your time together today.",
    journal_question: "How did you express presence with your partner today?"
  },
  {
    day_number: 25,
    title: "Day 25: Reconciliation",
    scripture: "Matthew 5:23-24",
    summary: "Make the first move to heal any tension between you.",
    action_prompt: "Make the first move to heal any tension between you.",
    journal_question: "How did you express reconciliation with your partner today?"
  },
  {
    day_number: 26,
    title: "Day 26: Faithfulness",
    scripture: "Proverbs 3:3-4",
    summary: "Demonstrate loyalty in thought, word, and deed today.",
    action_prompt: "Demonstrate loyalty in thought, word, and deed today.",
    journal_question: "How did you express faithfulness with your partner today?"
  },
  {
    day_number: 27,
    title: "Day 27: Creativity",
    scripture: "Genesis 1:27",
    summary: "Find a creative way to express your love today.",
    action_prompt: "Find a creative way to express your love today.",
    journal_question: "How did you express creativity with your partner today?"
  },
  {
    day_number: 28,
    title: "Day 28: Courage",
    scripture: "Joshua 1:9",
    summary: "Have the courage to address something difficult with love.",
    action_prompt: "Have the courage to address something difficult with love.",
    journal_question: "How did you express courage with your partner today?"
  },
  {
    day_number: 29,
    title: "Day 29: Honesty",
    scripture: "Ephesians 4:15",
    summary: "Share an honest thought with love and kindness.",
    action_prompt: "Share an honest thought with love and kindness.",
    journal_question: "How did you express honesty with your partner today?"
  },
  {
    day_number: 30,
    title: "Day 30: Playfulness",
    scripture: "Proverbs 15:13",
    summary: "Be playful and lighthearted with your partner today.",
    action_prompt: "Be playful and lighthearted with your partner today.",
    journal_question: "How did you express playfulness with your partner today?"
  },
  {
    day_number: 31,
    title: "Day 31: Acceptance",
    scripture: "Romans 15:7",
    summary: "Accept your partner exactly as they are today.",
    action_prompt: "Accept your partner exactly as they are today.",
    journal_question: "How did you express acceptance with your partner today?"
  },
  {
    day_number: 32,
    title: "Day 32: Partnership",
    scripture: "Ecclesiastes 4:9-10",
    summary: "Work as true partners in a task or decision today.",
    action_prompt: "Work as true partners in a task or decision today.",
    journal_question: "How did you express partnership with your partner today?"
  },
  {
    day_number: 33,
    title: "Day 33: Perseverance",
    scripture: "Galatians 6:9",
    summary: "Don't give up on working through a challenge together.",
    action_prompt: "Don't give up on working through a challenge together.",
    journal_question: "How did you express perseverance with your partner today?"
  },
  {
    day_number: 34,
    title: "Day 34: Blessing",
    scripture: "Numbers 6:24-26",
    summary: "Speak a blessing over your partner today.",
    action_prompt: "Speak a blessing over your partner today.",
    journal_question: "How did you express blessing with your partner today?"
  },
  {
    day_number: 35,
    title: "Day 35: Friendship",
    scripture: "Proverbs 17:17",
    summary: "Be your partner's best friend today.",
    action_prompt: "Be your partner's best friend today.",
    journal_question: "How did you express friendship with your partner today?"
  },
  {
    day_number: 36,
    title: "Day 36: Restoration",
    scripture: "Joel 2:25",
    summary: "Work to restore something that's been neglected.",
    action_prompt: "Work to restore something that's been neglected.",
    journal_question: "How did you express restoration with your partner today?"
  },
  {
    day_number: 37,
    title: "Day 37: Vision",
    scripture: "Proverbs 29:18",
    summary: "Share your vision for your relationship's future.",
    action_prompt: "Share your vision for your relationship's future.",
    journal_question: "How did you express vision with your partner today?"
  },
  {
    day_number: 38,
    title: "Day 38: Nurture",
    scripture: "1 Thessalonians 2:7",
    summary: "Nurture your partner's growth in some way today.",
    action_prompt: "Nurture your partner's growth in some way today.",
    journal_question: "How did you express nurture with your partner today?"
  },
  {
    day_number: 39,
    title: "Day 39: Legacy",
    scripture: "Psalm 78:4",
    summary: "Consider the legacy your relationship is creating.",
    action_prompt: "Consider the legacy your relationship is creating.",
    journal_question: "How did you express legacy with your partner today?"
  },
  {
    day_number: 40,
    title: "Day 40: Love",
    scripture: "1 Corinthians 13:13",
    summary: "Express your love in the way your partner receives it best.",
    action_prompt: "Express your love in the way your partner receives it best.",
    journal_question: "How did you express love with your partner today?"
  }
];

export async function seed40dayTwangle() {
  console.log("Seeding 40dayTwangle challenges...");
  
  try {
    // Check if challenges already exist
    const existing = await storage.getAllChallenges();
    
    if (existing.length > 0) {
      console.log(`Challenges already seeded (${existing.length} found), skipping...`);
      return { status: 'already_seeded', count: existing.length };
    }

    // Insert all 40 challenges
    for (const challenge of challengesData) {
      await storage.createChallenge({
        dayNumber: challenge.day_number,
        title: challenge.title,
        scripture: challenge.scripture,
        summary: challenge.summary,
        actionPrompt: challenge.action_prompt,
        journalQuestion: challenge.journal_question,
      });
    }
    
    console.log("Successfully seeded 40 challenges!");
    return { status: 'seeded', count: 40 };
  } catch (error) {
    console.error("Error seeding challenges:", error);
    throw error;
  }
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed40dayTwangle()
    .then((result) => {
      console.log("Seeding complete!", result);
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}