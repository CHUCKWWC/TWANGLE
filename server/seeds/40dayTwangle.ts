import { storage } from "../storage";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ChallengeData {
  day_number: number;
  title: string;
  scripture: string;
  summary: string;
  action_prompt: string;
  journal_question: string;
  completed: boolean;
}

const challengesDataPath = join(__dirname, "../../attached_assets/40dayTwangle_Christian_Challenges_1762442158214.json");
const challengesData: ChallengeData[] = JSON.parse(readFileSync(challengesDataPath, "utf-8"));

export async function seed40dayTwangle() {
  console.log("Seeding 40dayTwangle challenges...");
  
  try {
    // Check if challenges already exist
    const existing = await storage.getAllChallenges();
    
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

// Run the seed if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seed40dayTwangle()
    .then(() => {
      console.log("Seeding complete!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}
