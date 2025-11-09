import { storage } from "../storage";

// Embedded challenge data to avoid file path issues in production
const challengesData = [
  {
    day_number: 1,
    title: "Day 1: Patience",
    scripture: "1 Corinthians 13:4",
    scripture_text: "Love never gives up. Love cares more for others than for self. Love doesn't want what it doesn't have.",
    translation: "The Message",
    summary: "Show patience and understanding toward your partner today.",
    action_prompt: "Show patience and understanding toward your partner today.",
    journal_question: "How did you express patience with your partner today?"
  },
  {
    day_number: 2,
    title: "Day 2: Kindness",
    scripture: "Ephesians 4:32",
    scripture_text: "Be gentle with one another, sensitive. Forgive one another as quickly and thoroughly as God in Christ forgave you.",
    translation: "The Message",
    summary: "Do something kind and unexpected for your partner.",
    action_prompt: "Do something kind and unexpected for your partner.",
    journal_question: "How did you express kindness with your partner today?"
  },
  {
    day_number: 3,
    title: "Day 3: Humility",
    scripture: "Philippians 2:3-4",
    scripture_text: "Don't push your way to the front; don't sweet-talk your way to the top. Put yourself aside, and help others get ahead. Don't be obsessed with getting your own advantage. Forget yourselves long enough to lend a helping hand.",
    translation: "The Message",
    summary: "Put your partner's needs ahead of your own today.",
    action_prompt: "Put your partner's needs ahead of your own today.",
    journal_question: "How did you express humility with your partner today?"
  },
  {
    day_number: 4,
    title: "Day 4: Forgiveness",
    scripture: "Colossians 3:13",
    scripture_text: "Be even-tempered, content with second place, quick to forgive an offense. Forgive as quickly and completely as the Master forgave you.",
    translation: "The Message",
    summary: "Forgive a small offense quickly and without resentment.",
    action_prompt: "Forgive a small offense quickly and without resentment.",
    journal_question: "How did you express forgiveness with your partner today?"
  },
  {
    day_number: 5,
    title: "Day 5: Encouragement",
    scripture: "1 Thessalonians 5:11",
    scripture_text: "So speak encouraging words to one another. Build up hope so you'll all be together in this, no one left out, no one left behind.",
    translation: "The Message",
    summary: "Speak words that lift your partner up today.",
    action_prompt: "Speak words that lift your partner up today.",
    journal_question: "How did you express encouragement with your partner today?"
  },
  {
    day_number: 6,
    title: "Day 6: Gratitude",
    scripture: "1 Thessalonians 5:18",
    scripture_text: "Be cheerful no matter what; pray all the time; thank God no matter what happens. This is the way God wants you who belong to Christ Jesus to live.",
    translation: "The Message",
    summary: "Thank your partner for something specific they've done.",
    action_prompt: "Thank your partner for something specific they've done.",
    journal_question: "How did you express gratitude with your partner today?"
  },
  {
    day_number: 7,
    title: "Day 7: Servanthood",
    scripture: "Matthew 20:28",
    scripture_text: "That is what the Son of Man has done: He came to serve, not to be served—and then to give away his life in exchange for many who are held hostage.",
    translation: "The Message",
    summary: "Find a way to serve your partner without being asked.",
    action_prompt: "Find a way to serve your partner without being asked.",
    journal_question: "How did you express servanthood with your partner today?"
  },
  {
    day_number: 8,
    title: "Day 8: Peace",
    scripture: "Romans 12:18",
    scripture_text: "If you've got it in you, get along with everybody. Don't insist on getting even; that's not for you to do. 'I'll do the judging,' says God. 'I'll take care of it.'",
    translation: "The Message",
    summary: "Create a peaceful atmosphere in your home today.",
    action_prompt: "Create a peaceful atmosphere in your home today.",
    journal_question: "How did you express peace with your partner today?"
  },
  {
    day_number: 9,
    title: "Day 9: Self-Control",
    scripture: "Proverbs 29:11",
    scripture_text: "A fool lets it all hang out; a sage quietly mulls it over.",
    translation: "The Message",
    summary: "Hold back a criticism you're tempted to share.",
    action_prompt: "Hold back a criticism you're tempted to share.",
    journal_question: "How did you express self-control with your partner today?"
  },
  {
    day_number: 10,
    title: "Day 10: Unity",
    scripture: "Ephesians 4:3",
    scripture_text: "Make every effort to keep the unity of the Spirit through the bond of peace.",
    translation: "The Message",
    summary: "Work together on a project or goal today.",
    action_prompt: "Work together on a project or goal today.",
    journal_question: "How did you express unity with your partner today?"
  },
  {
    day_number: 11,
    title: "Day 11: Understanding",
    scripture: "Proverbs 2:2-5",
    scripture_text: "Tune your ears to the world of Wisdom; set your heart on a life of Understanding. That's right—if you make Insight your priority, and won't take no for an answer, Searching for it like a prospector panning for gold, like an adventurer on a treasure hunt, Believe me, before you know it Fear-of-God will be yours; you'll have come upon the Knowledge of God.",
    translation: "The Message",
    summary: "Listen to understand, not to reply, in today's conversations.",
    action_prompt: "Listen to understand, not to reply, in today's conversations.",
    journal_question: "How did you express understanding with your partner today?"
  },
  {
    day_number: 12,
    title: "Day 12: Respect",
    scripture: "1 Peter 3:7",
    scripture_text: "The same goes for you husbands: Be good husbands to your wives. Honor them, delight in them. As women they lack some of your advantages. But in the new life of God's grace, you're equals. Treat your wives, then, as equals so your prayers don't run aground.",
    translation: "The Message",
    summary: "Speak about your partner with respect to others today.",
    action_prompt: "Speak about your partner with respect to others today.",
    journal_question: "How did you express respect with your partner today?"
  },
  {
    day_number: 13,
    title: "Day 13: Sacrifice",
    scripture: "John 15:13",
    scripture_text: "This is the very best way to love. Put your life on the line for your friends.",
    translation: "The Message",
    summary: "Give up something you enjoy for your partner's benefit.",
    action_prompt: "Give up something you enjoy for your partner's benefit.",
    journal_question: "How did you express sacrifice with your partner today?"
  },
  {
    day_number: 14,
    title: "Day 14: Trust",
    scripture: "Proverbs 31:11",
    scripture_text: "Her husband trusts her without reserve, and never has reason to regret it.",
    translation: "The Message",
    summary: "Share a vulnerability with your partner today.",
    action_prompt: "Share a vulnerability with your partner today.",
    journal_question: "How did you express trust with your partner today?"
  },
  {
    day_number: 15,
    title: "Day 15: Joy",
    scripture: "Proverbs 17:22",
    scripture_text: "A cheerful disposition is good for your health; gloom and doom leave you bone-tired.",
    translation: "The Message",
    summary: "Do something fun together that makes you both laugh.",
    action_prompt: "Do something fun together that makes you both laugh.",
    journal_question: "How did you express joy with your partner today?"
  },
  {
    day_number: 16,
    title: "Day 16: Compassion",
    scripture: "Colossians 3:12",
    scripture_text: "So, chosen by God for this new life of love, dress in the wardrobe God picked out for you: compassion, kindness, humility, quiet strength, discipline.",
    translation: "The Message",
    summary: "Show tenderness toward a struggle your partner is facing.",
    action_prompt: "Show tenderness toward a struggle your partner is facing.",
    journal_question: "How did you express compassion with your partner today?"
  },
  {
    day_number: 17,
    title: "Day 17: Commitment",
    scripture: "Matthew 19:6",
    scripture_text: "Because God created this organic union of the two sexes, no one should desecrate his art by cutting them apart.",
    translation: "The Message",
    summary: "Reaffirm your commitment to your relationship today.",
    action_prompt: "Reaffirm your commitment to your relationship today.",
    journal_question: "How did you express commitment with your partner today?"
  },
  {
    day_number: 18,
    title: "Day 18: Hope",
    scripture: "Hebrews 11:1",
    scripture_text: "The fundamental fact of existence is that this trust in God, this faith, is the firm foundation under everything that makes life worth living. It's our handle on what we can't see.",
    translation: "The Message",
    summary: "Share a dream or hope for your future together.",
    action_prompt: "Share a dream or hope for your future together.",
    journal_question: "How did you express hope with your partner today?"
  },
  {
    day_number: 19,
    title: "Day 19: Protection",
    scripture: "Song of Songs 2:4",
    scripture_text: "He brought me to the banquet hall, and his banner over me is love.",
    translation: "The Message",
    summary: "Protect your partner's reputation and feelings today.",
    action_prompt: "Protect your partner's reputation and feelings today.",
    journal_question: "How did you express protection with your partner today?"
  },
  {
    day_number: 20,
    title: "Day 20: Celebration",
    scripture: "Proverbs 5:18",
    scripture_text: "Enjoy the wife you married as a young man! Lovely as an angel, beautiful as a rose—don't ever quit taking delight in her body.",
    translation: "The Message",
    summary: "Celebrate something about your partner today.",
    action_prompt: "Celebrate something about your partner today.",
    journal_question: "How did you express celebration with your partner today?"
  },
  {
    day_number: 21,
    title: "Day 21: Gentleness",
    scripture: "Galatians 5:22-23",
    scripture_text: "But what happens when we live God's way? He brings gifts into our lives, much the same way that fruit appears in an orchard—things like affection for others, exuberance about life, serenity. We develop a willingness to stick with things, a sense of compassion in the heart, and a conviction that a basic holiness permeates things and people.",
    translation: "The Message",
    summary: "Be extra gentle in your words and actions today.",
    action_prompt: "Be extra gentle in your words and actions today.",
    journal_question: "How did you express gentleness with your partner today?"
  },
  {
    day_number: 22,
    title: "Day 22: Wisdom",
    scripture: "James 1:5",
    scripture_text: "If you don't know what you're doing, pray to the Father. He loves to help. You'll get his help, and won't be condescended to when you ask for it.",
    translation: "The Message",
    summary: "Seek wisdom before responding to a challenge today.",
    action_prompt: "Seek wisdom before responding to a challenge today.",
    journal_question: "How did you express wisdom with your partner today?"
  },
  {
    day_number: 23,
    title: "Day 23: Generosity",
    scripture: "2 Corinthians 9:7",
    scripture_text: "I want each of you to take plenty of time to think it over, and make up your own mind what you will give. That will protect you against sob stories and arm-twisting. God loves it when the giver delights in the giving.",
    translation: "The Message",
    summary: "Be generous with your time and attention today.",
    action_prompt: "Be generous with your time and attention today.",
    journal_question: "How did you express generosity with your partner today?"
  },
  {
    day_number: 24,
    title: "Day 24: Presence",
    scripture: "Ecclesiastes 3:1",
    scripture_text: "There's an opportune time to do things, a right time for everything on the earth.",
    translation: "The Message",
    summary: "Be fully present during your time together today.",
    action_prompt: "Be fully present during your time together today.",
    journal_question: "How did you express presence with your partner today?"
  },
  {
    day_number: 25,
    title: "Day 25: Reconciliation",
    scripture: "Matthew 5:23-24",
    scripture_text: "This is how I want you to conduct yourself in these matters. If you enter your place of worship and, about to make an offering, you suddenly remember a grudge a friend has against you, abandon your offering, leave immediately, go to this friend and make things right. Then and only then, come back and work things out with God.",
    translation: "The Message",
    summary: "Make the first move to heal any tension between you.",
    action_prompt: "Make the first move to heal any tension between you.",
    journal_question: "How did you express reconciliation with your partner today?"
  },
  {
    day_number: 26,
    title: "Day 26: Faithfulness",
    scripture: "Proverbs 3:3-4",
    scripture_text: "Don't lose your grip on Love and Loyalty. Tie them around your neck; carve their initials on your heart. Earn a reputation for living well in God's eyes and the eyes of the people.",
    translation: "The Message",
    summary: "Demonstrate loyalty in thought, word, and deed today.",
    action_prompt: "Demonstrate loyalty in thought, word, and deed today.",
    journal_question: "How did you express faithfulness with your partner today?"
  },
  {
    day_number: 27,
    title: "Day 27: Creativity",
    scripture: "Genesis 1:27",
    scripture_text: "God created human beings; he created them godlike, Reflecting God's nature. He created them male and female.",
    translation: "The Message",
    summary: "Find a creative way to express your love today.",
    action_prompt: "Find a creative way to express your love today.",
    journal_question: "How did you express creativity with your partner today?"
  },
  {
    day_number: 28,
    title: "Day 28: Courage",
    scripture: "Joshua 1:9",
    scripture_text: "Haven't I commanded you? Strength! Courage! Don't be timid; don't get discouraged. God, your God, is with you every step you take.",
    translation: "The Message",
    summary: "Have the courage to address something difficult with love.",
    action_prompt: "Have the courage to address something difficult with love.",
    journal_question: "How did you express courage with your partner today?"
  },
  {
    day_number: 29,
    title: "Day 29: Honesty",
    scripture: "Ephesians 4:15",
    scripture_text: "God wants us to grow up, to know the whole truth and tell it in love—like Christ in everything.",
    translation: "The Message",
    summary: "Share an honest thought with love and kindness.",
    action_prompt: "Share an honest thought with love and kindness.",
    journal_question: "How did you express honesty with your partner today?"
  },
  {
    day_number: 30,
    title: "Day 30: Playfulness",
    scripture: "Proverbs 15:13",
    scripture_text: "A cheerful heart brings a smile to your face; a sad heart makes it hard to get through the day.",
    translation: "The Message",
    summary: "Be playful and lighthearted with your partner today.",
    action_prompt: "Be playful and lighthearted with your partner today.",
    journal_question: "How did you express playfulness with your partner today?"
  },
  {
    day_number: 31,
    title: "Day 31: Acceptance",
    scripture: "Romans 15:7",
    scripture_text: "So reach out and welcome one another to God's glory. Jesus did it; now you do it!",
    translation: "The Message",
    summary: "Accept your partner exactly as they are today.",
    action_prompt: "Accept your partner exactly as they are today.",
    journal_question: "How did you express acceptance with your partner today?"
  },
  {
    day_number: 32,
    title: "Day 32: Partnership",
    scripture: "Ecclesiastes 4:9-10",
    scripture_text: "It's better to have a partner than go it alone. Share the work, share the wealth. And if one falls down, the other helps, But if there's no one to help, tough!",
    translation: "The Message",
    summary: "Work as true partners in a task or decision today.",
    action_prompt: "Work as true partners in a task or decision today.",
    journal_question: "How did you express partnership with your partner today?"
  },
  {
    day_number: 33,
    title: "Day 33: Perseverance",
    scripture: "Galatians 6:9",
    scripture_text: "So let's not allow ourselves to get fatigued doing good. At the right time we will harvest a good crop if we don't give up, or quit.",
    translation: "The Message",
    summary: "Don't give up on working through a challenge together.",
    action_prompt: "Don't give up on working through a challenge together.",
    journal_question: "How did you express perseverance with your partner today?"
  },
  {
    day_number: 34,
    title: "Day 34: Blessing",
    scripture: "Numbers 6:24-26",
    scripture_text: "God bless you and keep you, God smile on you and gift you, God look you full in the face and make you prosper.",
    translation: "The Message",
    summary: "Speak a blessing over your partner today.",
    action_prompt: "Speak a blessing over your partner today.",
    journal_question: "How did you express blessing with your partner today?"
  },
  {
    day_number: 35,
    title: "Day 35: Friendship",
    scripture: "Proverbs 17:17",
    scripture_text: "Friends love through all kinds of weather, and families stick together in all kinds of trouble.",
    translation: "The Message",
    summary: "Be your partner's best friend today.",
    action_prompt: "Be your partner's best friend today.",
    journal_question: "How did you express friendship with your partner today?"
  },
  {
    day_number: 36,
    title: "Day 36: Restoration",
    scripture: "Joel 2:25",
    scripture_text: "I'll make up for the years of the locust, the great locust devastation—Locusts savage, locusts deadly, fierce locusts, locusts of doom, That great locust invasion I sent your way.",
    translation: "The Message",
    summary: "Work to restore something that's been neglected.",
    action_prompt: "Work to restore something that's been neglected.",
    journal_question: "How did you express restoration with your partner today?"
  },
  {
    day_number: 37,
    title: "Day 37: Vision",
    scripture: "Proverbs 29:18",
    scripture_text: "If people can't see what God is doing, they stumble all over themselves; But when they attend to what he reveals, they are most blessed.",
    translation: "The Message",
    summary: "Share your vision for your relationship's future.",
    action_prompt: "Share your vision for your relationship's future.",
    journal_question: "How did you express vision with your partner today?"
  },
  {
    day_number: 38,
    title: "Day 38: Nurture",
    scripture: "1 Thessalonians 2:7",
    scripture_text: "We were never patronizing, never condescending, but we cared for you the way a mother cares for her children.",
    translation: "The Message",
    summary: "Nurture your partner's growth in some way today.",
    action_prompt: "Nurture your partner's growth in some way today.",
    journal_question: "How did you express nurture with your partner today?"
  },
  {
    day_number: 39,
    title: "Day 39: Legacy",
    scripture: "Psalm 78:4",
    scripture_text: "We're not keeping this to ourselves, we're passing it along to the next generation—God's fame and fortune, the marvelous things he has done.",
    translation: "The Message",
    summary: "Consider the legacy your relationship is creating.",
    action_prompt: "Consider the legacy your relationship is creating.",
    journal_question: "How did you express legacy with your partner today?"
  },
  {
    day_number: 40,
    title: "Day 40: Love",
    scripture: "1 Corinthians 13:13",
    scripture_text: "But for right now, until that completeness, we have three things to do to lead us toward that consummation: Trust steadily in God, hope unswervingly, love extravagantly. And the best of the three is love.",
    translation: "The Message",
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
        scriptureText: challenge.scripture_text,
        translation: challenge.translation,
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