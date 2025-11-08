import { storage } from "../storage";
import { readFileSync, existsSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join, resolve } from "path";

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

// Try multiple possible paths for the JSON file (production vs development)
function loadChallengesData(): ChallengeData[] {
  const filename = "40dayTwangle_Christian_Challenges_1762442158214.json";
  
  const possiblePaths = [
    // Try relative to current file location
    join(__dirname, "../../attached_assets", filename),
    // Try relative to project root (development)
    resolve(process.cwd(), "attached_assets", filename),
    // Try relative to workspace root
    resolve("/home/runner/workspace", "attached_assets", filename),
    // Try relative to /home/runner (Replit production path with project name)
    resolve("/home/runner", "attached_assets", filename),
    // Try relative to __dirname with different levels
    resolve(__dirname, "..", "..", "attached_assets", filename),
    resolve(__dirname, "..", "..", "..", "attached_assets", filename),
  ];

  console.log(`Current working directory: ${process.cwd()}`);
  console.log(`__dirname: ${__dirname}`);
  
  for (const path of possiblePaths) {
    console.log(`Checking path: ${path}`);
    if (existsSync(path)) {
      console.log(`✅ Found challenges file at: ${path}`);
      const data = readFileSync(path, "utf-8");
      const parsed = JSON.parse(data);
      console.log(`Loaded ${parsed.length} challenges from file`);
      return parsed;
    }
  }

  // If no file found, throw error with helpful message
  const errorMessage = `Could not find challenges JSON file "${filename}".
    Tried paths:
    ${possiblePaths.map(p => `  - ${p}`).join('\n')}
    
    Current working directory: ${process.cwd()}
    __dirname: ${__dirname}`;
  
  console.error(errorMessage);
  throw new Error(errorMessage);
}

export async function seed40dayTwangle() {
  console.log("Seeding 40dayTwangle challenges...");
  
  // Load challenges data when function is called, not at module load time
  const challengesData: ChallengeData[] = loadChallengesData();
  
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
