# Twangle Conversations Module (Developer-Ready)

> This markdown outlines the full architecture, UI/UX logic, AI prompts, database schema, and config needed to implement the "Twangle Conversations" feature in a gamified relationship app. It is structured to give a dev assistant like Claude the ability to one-shot build it on Replit or in a modern full-stack web app (e.g. React + Supabase).

---

## 🎯 Vision
**Purpose:** Create daily, private, introspective prompts to help couples explore and strengthen their relationship—emotionally, practically, and intimately.

**Core Features:**
- Daily or on-demand questions across 7 life categories
- Double-blind answering (responses unlock once both submit)
- "Help Me Out" button with three pathways:
  - Coaching (example starters)
  - Think Time (defer with grace)
  - Alternative (easier question)
- AI-generated summaries of response trends (weekly)
- Optional coach visibility for growth plans

---

## 🧠 Topics + Categories
Each question is tagged with a `category` and an `intensity` (1–3).

| Category             | Description                              |
|----------------------|------------------------------------------|
| emotional_intimacy   | Feelings, safety, emotional connection   |
| communication_conflict | Argument repair, clarity, tone          |
| physical_intimacy    | Touch, sex, consent, affection           |
| finances_planning    | Budgeting, security, planning, roles     |
| values_spiritual     | Beliefs, rituals, worldview              |
| play_adventure       | Fun, spontaneity, light exploration      |
| trust_boundaries     | Safety, autonomy, forgiveness            |

---

## 🎮 Gamified UX Flow

1. **Start Daily Question**
   - Random (weighted by couple’s prior categories)
   - OR user-selected from bank

2. **Answer Hidden Until Both Submit**
   - “Answer saved. Your partner’s reply will appear once they respond.”

3. **"Help Me Out" Button (context-aware)**
   - Dynamic label per category:
     - *emotional_intimacy*: "I Need a Moment"
     - *physical_intimacy*: "Hold This Thought"
     - *communication_conflict*: "Help Me Understand"
   - Opens modal with 3 tabs:
     - `Guidance`: coaching + answer starters
     - `Think Time`: graceful defer
     - `Alternative`: try a gentler version

4. **AI Weekly Summary**
   - Insight into strengths, pain points, trends
   - Personalized practice suggestion

---

## 🧩 Supabase Schema
```sql
create table convo_categories (
  id text primary key,
  label text not null
);

create table convo_questions (
  id uuid primary key default gen_random_uuid(),
  category_id text references convo_categories(id),
  intensity int check (intensity between 1 and 3),
  text text not null,
  active boolean default true
);

create table convo_responses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null,
  question_id uuid references convo_questions(id),
  user_id uuid not null,
  text text,
  pending_reflection boolean default false,
  created_at timestamptz default now()
);

create table convo_help_events (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid,
  user_id uuid,
  question_id uuid,
  action_type text check (action_type in ('guidance','think_time','alternative')),
  served_copy jsonb,
  created_at timestamptz default now()
);
```

---

## 🧠 AI Prompt Templates

### 🤖 Guidance Prompt
```txt
SYSTEM: You are a warm, concise relationship coach. Offer 2 framing tips and 2 example starters. Be safe, neutral, nonjudgmental.

USER:
Category: {{category}}
Question: {{question_text}}
Goal: Help the user form a thoughtful answer.
Tone: Kind and helpful.
```

### 🤖 Alternative Prompt
```txt
SYSTEM: Return two easier questions from the same category: (1) feelings-first and (2) action-first. Keep them under 20 words each.
```

### 🤖 Weekly Summary Prompt
```txt
SYSTEM: Write a 3-part summary:
1. Relationship strengths seen in the week
2. Growth area or pattern of friction
3. One practice or challenge for next week
120–180 words, warm and hopeful.
```

---

## 🧰 Config JSON (Simplified)
```json
{
  "helpButton": {
    "labels": {
      "emotional_intimacy": "I Need a Moment",
      "communication_conflict": "Help Me Understand",
      "physical_intimacy": "Hold This Thought"
    },
    "modal": {
      "tabs": ["Guidance", "Think Time", "Alternative"],
      "copy": {
        "think_time_header": "Take the time you need.",
        "alt_header": "Want a gentler angle?",
        "guidance_try_btn": "Try an answer",
        "affirmation": "It’s okay to need a beat."
      }
    }
  }
}
```

---

## 💡 Future Enhancements
- Streaks (days answered consecutively)
- Heart score: A shared emotional health indicator
- Coach visibility: Share selected answers with relationship mentor
- Reply mode: Discuss answers after both are revealed

---

## ✅ Replit Deployment Checklist
- [ ] Import this .md into your repo
- [ ] Sync schema to Supabase or local db
- [ ] Wire frontend help modal logic (per example)
- [ ] Add OpenAI API routes for coaching/summary
- [ ] Load question bank (CSV or seed script)

---

Need question samples, answer summaries, or frontend code? Just ask.

Let’s Twangle beautifully. 💛

