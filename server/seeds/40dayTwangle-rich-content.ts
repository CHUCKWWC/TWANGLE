import { db } from "../db";
import { challenges } from "@shared/schema";
import { eq } from "drizzle-orm";

const richChallenges = [
  {
    dayNumber: 1,
    title: "Day 1: Patience",
    scripture: "1 Corinthians 13:4",
    summary: "Love is patient, love is kind. These opening words of 1 Corinthians 13 remind us that patience is the foundation of love. In your relationship, patience means giving your partner grace when they're struggling, waiting without frustration, and choosing understanding over irritation. Today's focus is on cultivating patience in the small moments - when your partner is late, when they forget something, or when communication feels challenging.",
    actionPrompt: "Today, practice the 'pause before response' technique. When your partner does something that might normally frustrate you, take a deep breath and count to five before responding. Choose to respond with gentleness rather than frustration. Look for at least three opportunities today to show patience in your interactions.",
    journalQuestion: "Reflect on a moment today when you chose patience over frustration. How did it change the interaction with your partner? What did you learn about yourself and your capacity for patience?",
  },
  {
    dayNumber: 2,
    title: "Day 2: Kindness",
    scripture: "Ephesians 4:32",
    summary: "Be kind and compassionate to one another, forgiving each other, just as in Christ God forgave you. Kindness in marriage is more than being polite - it's actively looking for ways to bless and serve your partner. It's the small gestures, the thoughtful words, the gentle touch that says 'I see you, I value you, I choose you.' Today, focus on intentional acts of kindness that show your partner they are cherished.",
    actionPrompt: "Do three unexpected acts of kindness for your partner today. These could be: making their favorite meal, leaving a loving note, doing a chore they usually handle, bringing them their favorite treat, or simply giving them your undivided attention for 20 minutes. Make these gestures without expecting anything in return.",
    journalQuestion: "What acts of kindness did you extend to your partner today? How did they respond? How did showing kindness affect your own heart and attitude toward your relationship?",
  },
  {
    dayNumber: 3,
    title: "Day 3: Humility",
    scripture: "Philippians 2:3-4",
    summary: "Do nothing out of selfish ambition or vain conceit. Rather, in humility value others above yourselves, not looking to your own interests but each of you to the interests of the others. Humility in marriage means putting your partner's needs ahead of your own preferences. It's choosing to serve rather than be served, to listen rather than be heard first, to consider their perspective as valuable as your own.",
    actionPrompt: "Today, ask your partner: 'What's one thing I could do today that would make your day better?' Then do it, even if it's inconvenient for you. Also, practice listening without interrupting when your partner speaks, truly seeking to understand their perspective before sharing your own.",
    journalQuestion: "When did you put your partner's needs ahead of your own today? What did you sacrifice or adjust? How did this act of humility impact your relationship and your own sense of purpose?",
  },
];

export async function seedRichContent() {
  console.log("Updating challenges with rich devotional content...");
  
  try {
    for (const challenge of richChallenges) {
      await db
        .update(challenges)
        .set({
          summary: challenge.summary,
          actionPrompt: challenge.actionPrompt,
          journalQuestion: challenge.journalQuestion,
        })
        .where(eq(challenges.dayNumber, challenge.dayNumber));
      
      console.log(`Updated Day ${challenge.dayNumber} with rich content`);
    }
    
    console.log("Successfully updated challenges with rich content!");
  } catch (error) {
    console.error("Error updating challenges:", error);
    throw error;
  }
}

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedRichContent()
    .then(() => {
      console.log("Content update complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Content update failed:", error);
      process.exit(1);
    });
}
