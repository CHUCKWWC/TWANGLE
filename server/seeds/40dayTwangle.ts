import { storage } from "../storage";
import challengesData from "../../attached_assets/40dayTwangle_Christian_Challenges_1762442158214.json";

export async function seed40dayTwangle() {
  console.log("Seeding 40dayTwangle challenges...");
  
  try {
    // Check if challenges already exist
    const existing = await storage.db.select().from(storage.schema.challenges).limit(1);
    
    if (existing.length > 0) {
      console.log("Challenges already seeded, skipping...");
      return;
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
  } catch (error) {
    console.error("Error seeding challenges:", error);
    throw error;
  }
}
