import { drizzle } from "drizzle-orm/neon-serverless";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { challenges } from "@shared/schema";
import ws from "ws";

// Configure Neon to use WebSocket for Node.js environment
neonConfig.webSocketConstructor = ws;

const pool = new Pool({ connectionString: process.env.DATABASE_URL! });
const db = drizzle(pool);

// 40dayTwangle challenge data from The Message paraphrase
const challengeData = [
  {
    day_number: 1,
    title: "Day 1: Patience",
    scripture: "1 Corinthians 13:4 (The Message paraphrase)",
    passage: "Love doesn't rush or push; it gives room for people to grow, staying steady instead of snapping.",
    action_prompt: "Show patience and understanding toward your partner today.",
    explanation: "Patience creates safety. Slowing down your reactions makes space for trust and healing.",
    journal_question: "Where did you choose patience over irritation today?"
  },
  {
    day_number: 2,
    title: "Day 2: Kindness",
    scripture: "Ephesians 4:32 (The Message paraphrase)",
    passage: "Be warmhearted and quick to extend grace, treating each other the way God keeps treating you.",
    action_prompt: "Do something kind and unexpected for your partner.",
    explanation: "Kindness lowers defenses. Small, gentle actions preach louder than lectures.",
    journal_question: "What kind act did you choose, and how was it received?"
  },
  {
    day_number: 3,
    title: "Day 3: Humility",
    scripture: "Philippians 2:3–4 (The Message paraphrase)",
    passage: "Drop the spotlight on yourself. Lift others up and look for their good; pay attention to their interests.",
    action_prompt: "Put your partner's needs ahead of your own today.",
    explanation: "Humility clears the fog of ego so love can see what truly serves your partner.",
    journal_question: "Where did you yield preference to your partner today?"
  },
  {
    day_number: 4,
    title: "Day 4: Forgiveness",
    scripture: "Colossians 3:13 (The Message paraphrase)",
    passage: "Make allowance for each other's rough edges. As you've been forgiven, keep forgiving.",
    action_prompt: "Forgive a small offense quickly and without resentment.",
    explanation: "Forgiveness breaks scorekeeping and keeps love from hardening into bitterness.",
    journal_question: "What did you release today, and how did that change the tone between you?"
  },
  {
    day_number: 5,
    title: "Day 5: Encouragement",
    scripture: "1 Thessalonians 5:11 (The Message paraphrase)",
    passage: "Build each other up—brick by brick—so no one caves in under the load.",
    action_prompt: "Speak words that lift your partner up today.",
    explanation: "Encouragement feeds hope. Your voice can become their strength for the day.",
    journal_question: "Which words did you use to strengthen your partner?"
  },
  {
    day_number: 6,
    title: "Day 6: Gratitude",
    scripture: "1 Thessalonians 5:18 (The Message paraphrase)",
    passage: "In everything, learn the language of thanks; it tunes your heart to God's steady goodness.",
    action_prompt: "Thank your partner for something specific they've done.",
    explanation: "Gratitude redirects attention from what's missing to what's working, multiplying joy.",
    journal_question: "What did you name and appreciate out loud?"
  },
  {
    day_number: 7,
    title: "Day 7: Faithfulness",
    scripture: "Proverbs 3:3 (The Message paraphrase)",
    passage: "Tie love and loyalty around your life like a ribbon; let them leave a mark on your heart.",
    action_prompt: "Reaffirm your commitment to your partner in word or deed.",
    explanation: "Steady love calms fear. Public or private commitment signals 'I'm here.'",
    journal_question: "How did you demonstrate loyalty today?"
  },
  {
    day_number: 8,
    title: "Day 8: Listening",
    scripture: "James 1:19 (The Message paraphrase)",
    passage: "Be quick to listen, slow to speak, and even slower to heat up.",
    action_prompt: "Listen fully before responding in conversation today.",
    explanation: "Deep listening tells your partner, 'You matter more than my rebuttal.'",
    journal_question: "What did you hear that you'd usually miss?"
  },
  {
    day_number: 9,
    title: "Day 9: Service",
    scripture: "Mark 10:45 (The Message paraphrase)",
    passage: "The Son of Man showed up not to be waited on but to roll up his sleeves and serve.",
    action_prompt: "Serve your partner in a tangible, practical way.",
    explanation: "Service turns love into verbs your partner can feel and trust.",
    journal_question: "What small service spoke love most clearly today?"
  },
  {
    day_number: 10,
    title: "Day 10: Respect",
    scripture: "Romans 12:10 (The Message paraphrase)",
    passage: "Be the first to show honor; outdo each other in treating one another well.",
    action_prompt: "Show respect in tone and action, especially when disagreeing.",
    explanation: "Respect preserves dignity and keeps tough talks from turning toxic.",
    journal_question: "How did you shift your tone to show honor?"
  },
  {
    day_number: 11,
    title: "Day 11: Peace",
    scripture: "Philippians 4:7 (The Message paraphrase)",
    passage: "God's peace stands guard over your inner world, keeping chaos from running the show.",
    action_prompt: "Be the calm presence in your partnership today.",
    explanation: "Peace is contagious; your calm invites your partner to exhale.",
    journal_question: "Where did you choose calm over control today?"
  },
  {
    day_number: 12,
    title: "Day 12: Self-Control",
    scripture: "Galatians 5:22–23 (The Message paraphrase)",
    passage: "When God's Spirit is at work, life bears fruit—gentleness and discipline show up in real time.",
    action_prompt: "Respond gently even if provoked or frustrated.",
    explanation: "Self-control protects connection when emotions run hot.",
    journal_question: "What response did you tame for love's sake?"
  },
  {
    day_number: 13,
    title: "Day 13: Joy",
    scripture: "John 15:11 (The Message paraphrase)",
    passage: "Stay close to me and your joy won't leak; it fills up and spills over.",
    action_prompt: "Do something together that brings shared joy.",
    explanation: "Shared joy rewires memories and reminds you why you chose each other.",
    journal_question: "What brought you joy together today?"
  },
  {
    day_number: 14,
    title: "Day 14: Gentleness",
    scripture: "Ephesians 4:2 (The Message paraphrase)",
    passage: "Walk with humility and gentleness; be patient with each other's pace.",
    action_prompt: "Handle your partner's emotions with tenderness today.",
    explanation: "Gentleness is strength under control; it keeps hearts open.",
    journal_question: "When did you choose a softer approach?"
  },
  {
    day_number: 15,
    title: "Day 15: Trust",
    scripture: "Proverbs 3:5 (The Message paraphrase)",
    passage: "Lean your weight on God more than your own conclusions; he sees the whole road.",
    action_prompt: "Choose to trust your partner's intentions today.",
    explanation: "Trust gives the benefit of the doubt and breaks the loop of suspicion.",
    journal_question: "Where did you choose trust over assumption?"
  },
  {
    day_number: 16,
    title: "Day 16: Unity",
    scripture: "Ecclesiastes 4:9–10 (The Message paraphrase)",
    passage: "Two working together get more done; when one stumbles, the other is there to lift up.",
    action_prompt: "Work on something together—showing you're stronger united.",
    explanation: "Unity shifts the goal from 'me vs. you' to 'us vs. the problem.'",
    journal_question: "What did teamwork unlock today?"
  },
  {
    day_number: 17,
    title: "Day 17: Compassion",
    scripture: "Colossians 3:12 (The Message paraphrase)",
    passage: "Dress your life in compassion and kindness like daily clothes you never forget to wear.",
    action_prompt: "Show empathy when your partner shares a struggle.",
    explanation: "Compassion says, 'I'm with you in this,' not 'Get over it.'",
    journal_question: "How did you practice empathy today?"
  },
  {
    day_number: 18,
    title: "Day 18: Faith",
    scripture: "Hebrews 11:1 (The Message paraphrase)",
    passage: "Faith is trusting what you can't yet hold; it leans forward with expectation.",
    action_prompt: "Pray together and trust God's plan for your relationship.",
    explanation: "Praying together re-centers the partnership on God's steady hands.",
    journal_question: "What did you ask God to grow in your partnership?"
  },
  {
    day_number: 19,
    title: "Day 19: Generosity",
    scripture: "2 Corinthians 9:7 (The Message paraphrase)",
    passage: "Give from the heart, not under pressure; God delights in cheerful giving.",
    action_prompt: "Give time or attention freely without expecting something back.",
    explanation: "Generosity de-anchors love from transactions and keeps it a gift.",
    journal_question: "What did you give today that cost you something?"
  },
  {
    day_number: 20,
    title: "Day 20: Hope",
    scripture: "Romans 15:13 (The Message paraphrase)",
    passage: "God fills you with fresh hope and a brimful joy that overflows as you trust him.",
    action_prompt: "Encourage your partner with hope about your shared future.",
    explanation: "Hope lifts your gaze from current bumps to the bigger story God is writing.",
    journal_question: "What future promise did you speak over your relationship?"
  },
  {
    day_number: 21,
    title: "Day 21: Love in Action",
    scripture: "1 John 3:18 (The Message paraphrase)",
    passage: "Let's not love with talk that evaporates; let's love with actions that stick.",
    action_prompt: "Show love not just in words but through action today.",
    explanation: "Action validates affection; do the thing love would do.",
    journal_question: "Which action best expressed love today?"
  },
  {
    day_number: 22,
    title: "Day 22: Communication",
    scripture: "Proverbs 18:21 (The Message paraphrase)",
    passage: "Words carry life or death; choose language that nourishes, not poisons.",
    action_prompt: "Speak life—avoid sarcasm or harsh words.",
    explanation: "Your tone sets the climate; kindness keeps conversation safe.",
    journal_question: "What words did you retire today, and what replaced them?"
  },
  {
    day_number: 23,
    title: "Day 23: Reconciliation",
    scripture: "Matthew 5:9 (The Message paraphrase)",
    passage: "You're blessed when you make peace—stepping in to mend what's torn.",
    action_prompt: "Make peace over a lingering disagreement.",
    explanation: "Peacemaking is proactive love; it moves first toward repair.",
    journal_question: "What step did you take toward peace today?"
  },
  {
    day_number: 24,
    title: "Day 24: Patience in Trials",
    scripture: "Romans 12:12 (The Message paraphrase)",
    passage: "Stay lit with hope, stick with prayer, and keep going when things get tough.",
    action_prompt: "Respond with grace when plans go wrong.",
    explanation: "Grace under pressure guards the bond when life squeezes it.",
    journal_question: "Where did you keep steady when plans unraveled?"
  },
  {
    day_number: 25,
    title: "Day 25: Joyful Giving",
    scripture: "Acts 20:35 (The Message paraphrase)",
    passage: "You're happier giving than grabbing; it's the way Jesus lived it.",
    action_prompt: "Do something generous together for someone else.",
    explanation: "Serving others together pulls you to the same side of the table.",
    journal_question: "How did shared generosity affect your connection?"
  },
  {
    day_number: 26,
    title: "Day 26: Mutual Honor",
    scripture: "1 Peter 3:7 (The Message paraphrase)",
    passage: "Treat each other with dignity; your prayers flourish in that climate.",
    action_prompt: "Show your partner honor through small acts of respect.",
    explanation: "Honor says, 'You're weighty to me,' and invites deeper intimacy.",
    journal_question: "What respectful act shifted the atmosphere today?"
  },
  {
    day_number: 27,
    title: "Day 27: Kind Words",
    scripture: "Proverbs 16:24 (The Message paraphrase)",
    passage: "Gracious words are like honey—sweet, healing, and good for the soul.",
    action_prompt: "Speak only what is kind, healing, or helpful today.",
    explanation: "Kind speech mends small tears before they become rips.",
    journal_question: "Which phrase brought healing today?"
  },
  {
    day_number: 28,
    title: "Day 28: Faith in Each Other",
    scripture: "Galatians 6:9 (The Message paraphrase)",
    passage: "Don't give up doing good; in the right season, the harvest shows up.",
    action_prompt: "Believe in your partner's growth and journey.",
    explanation: "Belief fuels perseverance; your confidence becomes their courage.",
    journal_question: "Where did you cheer for your partner's growth?"
  },
  {
    day_number: 29,
    title: "Day 29: Love that Endures",
    scripture: "1 Corinthians 13:7 (The Message paraphrase)",
    passage: "Love puts up with plenty, trusts through storms, hopes again, and keeps going.",
    action_prompt: "Commit to love even when feelings fluctuate.",
    explanation: "Enduring love keeps the covenant louder than the mood of the moment.",
    journal_question: "How did you show 'I'm here' today?"
  },
  {
    day_number: 30,
    title: "Day 30: Gentle Correction",
    scripture: "Proverbs 27:6 (The Message paraphrase)",
    passage: "A friend's honest wound can heal; flattery hides a knife.",
    action_prompt: "Offer truth with compassion if correction is needed.",
    explanation: "Truth wrapped in care fixes problems without breaking people.",
    journal_question: "What truth did you offer gently today?"
  },
  {
    day_number: 31,
    title: "Day 31: Rest Together",
    scripture: "Exodus 20:8–10 (The Message paraphrase)",
    passage: "Set aside rest on purpose; stop the grind so your soul can breathe.",
    action_prompt: "Take a day of rest together, without distraction.",
    explanation: "Shared rest restores tenderness and resets perspective.",
    journal_question: "How did rest refresh your connection?"
  },
  {
    day_number: 32,
    title: "Day 32: Grace",
    scripture: "Ephesians 2:8 (The Message paraphrase)",
    passage: "You're saved by sheer grace—God's gift, not your earning—so live like it.",
    action_prompt: "Extend grace when your partner falls short.",
    explanation: "Grace keeps shame from running the partnership.",
    journal_question: "Where did you choose mercy over measurement?"
  },
  {
    day_number: 33,
    title: "Day 33: Courage",
    scripture: "Joshua 1:9 (The Message paraphrase)",
    passage: "Be strong and take heart; God walks with you into what's next.",
    action_prompt: "Encourage your partner in facing something they fear.",
    explanation: "Courage grows when someone stands beside you and believes.",
    journal_question: "How did you support bravery today?"
  },
  {
    day_number: 34,
    title: "Day 34: Purpose",
    scripture: "Jeremiah 29:11 (The Message paraphrase)",
    passage: "God's plans lean toward your good—future and hope, not a dead end.",
    action_prompt: "Discuss God's vision for your partnership.",
    explanation: "Purpose aligns daily choices with a bigger calling.",
    journal_question: "What purpose theme surfaced in your talk?"
  },
  {
    day_number: 35,
    title: "Day 35: Joy in Service",
    scripture: "Philippians 2:14 (The Message paraphrase)",
    passage: "Do the work without the grumble; joy shines in the doing.",
    action_prompt: "Serve together with a joyful heart today.",
    explanation: "Shared service + joy bonds you as teammates, not opponents.",
    journal_question: "Where did you choose joy while serving?"
  },
  {
    day_number: 36,
    title: "Day 36: Peaceful Words",
    scripture: "Proverbs 15:1 (The Message paraphrase)",
    passage: "A gentle answer cools the heat; a sharp one throws gasoline on it.",
    action_prompt: "Choose peace over pride in every response today.",
    explanation: "Gentle replies de-escalate and protect closeness.",
    journal_question: "Which heated moment did you cool with gentleness?"
  },
  {
    day_number: 37,
    title: "Day 37: Faith Renewal",
    scripture: "Isaiah 40:31 (The Message paraphrase)",
    passage: "Those who wait on God catch a second wind—running without running out.",
    action_prompt: "Renew your faith together through prayer or scripture reading.",
    explanation: "Shared renewal replenishes hope and stamina for love's work.",
    journal_question: "How did you refuel your faith as a team?"
  },
  {
    day_number: 38,
    title: "Day 38: Shared Vision",
    scripture: "Amos 3:3 (The Message paraphrase)",
    passage: "How can two walk together if they're headed different ways? Agree on the direction.",
    action_prompt: "Talk about your shared goals for the next season of life.",
    explanation: "Vision clarifies next steps and reduces friction.",
    journal_question: "What goal did you align on today?"
  },
  {
    day_number: 39,
    title: "Day 39: Perseverance",
    scripture: "James 1:12 (The Message paraphrase)",
    passage: "Blessed are those who stay with it under pressure; there's a prize on the other side.",
    action_prompt: "Stay steady in love even through stress or challenge.",
    explanation: "Staying power proves love's depth more than big displays do.",
    journal_question: "Where did you keep showing up today?"
  },
  {
    day_number: 40,
    title: "Day 40: Covenant Love",
    scripture: "Ruth 1:16–17 (The Message paraphrase)",
    passage: "Where you go, I'll go; your people will be mine; I'm in this to the end with you and with God.",
    action_prompt: "Reaffirm your devotion and commitment to your partner.",
    explanation: "Covenant love names the promise and chooses it again—come what may.",
    journal_question: "How did you renew your yes today?"
  }
];

export async function seedChallenges() {
  console.log("Seeding 40dayTwangle challenges...");

  try {
    // Delete existing challenges
    await db.delete(challenges);
    console.log("Cleared existing challenges");

    // Insert all 40 days
    for (const challenge of challengeData) {
      await db.insert(challenges).values({
        dayNumber: challenge.day_number,
        title: challenge.title,
        scripture: challenge.scripture,
        passage: challenge.passage,
        explanation: challenge.explanation,
        actionPrompt: challenge.action_prompt,
        journalQuestion: challenge.journal_question,
      });
    }

    console.log("Successfully seeded 40 challenges");
  } catch (error) {
    console.error("Error seeding challenges:", error);
    throw error;
  }
}

// Run if called directly
seedChallenges()
  .then(() => {
    console.log("Seed complete!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  });
