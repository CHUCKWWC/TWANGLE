# Twangle Design Guidelines

## Design Approach
**Reference-Based: Modern Wellness + Relationship Focus**

Drawing inspiration from Calm (warmth, trust), Notion (organized clarity), and modern therapy platforms like BetterHelp (approachable professionalism). The design must feel safe, intimate, and hopeful—not clinical or transactional.

## Core Design Principles
1. **Warmth Over Clinical**: Use soft, organic shapes and warm colors to create emotional safety
2. **Progressive Intimacy**: Interface deepens as users engage (welcome → assessment → personal insights → coaching)
3. **Celebration of Growth**: Visualize progress positively, avoid judgmental language or stark warning colors
4. **Couples-First**: Design for shared experiences while respecting individual privacy

## Color Palette

**Light Mode:**
- Primary: 340 45% 55% (Warm rose/mauve - trust, romance, maturity)
- Secondary: 25 50% 60% (Terracotta - grounding, warmth)
- Neutral Base: 30 8% 96% (Warm off-white)
- Text: 25 15% 25% (Warm dark brown)
- Success: 145 40% 50% (Sage green - growth)
- Accent: 200 40% 92% (Soft blue backgrounds)

**Dark Mode:**
- Primary: 340 40% 65%
- Background: 25 12% 12% (Deep warm brown)
- Surface: 25 10% 18%
- Text: 30 5% 92%

## Typography
**Fonts (Google Fonts):**
- Display/Headings: 'Poppins' (600, 500) - modern, friendly, confident
- Body: 'Inter' (400, 500) - excellent readability for assessments and coaching text
- Accent: 'Quicksand' (500) for playful elements like badges and retreat titles

**Scale:**
- Hero: text-5xl to text-7xl (mobile to desktop)
- Section Headings: text-3xl to text-4xl
- Card Titles: text-xl to text-2xl
- Body: text-base to text-lg
- Metadata: text-sm

## Layout System
**Spacing Primitives:** Use Tailwind units of 3, 4, 6, 8, 12, 16, 24 for consistent rhythm

**Container Strategy:**
- Full-width sections: max-w-7xl centered
- Content sections: max-w-4xl for readability
- Chat/Assessment: max-w-2xl for focus
- Mobile padding: px-4 to px-6
- Desktop padding: px-8 to px-12

**Section Padding:**
- Mobile: py-12 to py-16
- Desktop: py-20 to py-24
- Compact sections: py-8

## Component Library

**Navigation:**
- Sticky header with gradient blur background
- Logo + tagline "Two Tangled Together"
- Profile avatar (individual or couple indicator)
- Progress indicator when in assessment flow

**Cards:**
- Rounded-2xl with subtle shadow (shadow-sm)
- Hover: slight scale (hover:scale-102) and shadow lift
- Assessment questions: Large touch targets (min-h-16)
- Result cards: Gradient backgrounds with icons

**Buttons:**
- Primary: Solid fill with primary color, rounded-xl, py-3 px-6
- Secondary: Outline with hover background fill
- Ghost: Text with icon, used for "Skip" or "Back"
- Floating Action: Fixed bottom-right for "Continue" in assessments

**Forms & Inputs:**
- Rounded-lg with focus ring in primary color
- Labels above inputs, helper text below
- Multi-step forms: Progress dots at top

**Chat Interface:**
- User messages: Align right, primary color background
- AI messages: Align left, warm neutral background with avatar
- Suggested prompts: Pill-shaped buttons in grid layout
- Typing indicator: Animated dots
- Session summary card: Expandable accordion

**Data Visualization:**
- Attachment Style Meter: Radial progress or segmented bar
- Color-coded by type: Secure (sage green), Anxious (warm orange), Avoidant (cool blue), Fearful (soft purple)
- Tooltips on hover for definitions
- Red flag indicators: Gentle amber badge, not alarming red

**Retreat Builder:**
- Timeline view with morning/afternoon/evening blocks
- Activity cards with icons (spiritual: prayer hands, emotional: heart, fun: stars)
- Drag-to-reorder capability (visual feedback)
- Export preview modal before save

**Badges & Gamification:**
- Soft gradient circles with icons
- Progress rings around profile avatar
- Milestone celebrations: Confetti animation (very subtle)

## Images
**Hero Section:** 
Large full-width hero image (h-96 to h-screen on desktop) showing an intimate, warm moment between a diverse couple—holding hands, sitting together, or gentle embrace. Image should have a subtle gradient overlay (from primary color at 40% opacity) to ensure text readability. Place call-to-action and tagline over the image with blurred background buttons.

**Placement:**
- Welcome screen: Hero image with overlay
- Results dashboard: Small illustrative icon (no photo)
- Retreat builder: Optional location-based imagery (nature, cozy interior) as section backgrounds
- Coach chat: AI avatar (abstract, warm illustration—not robot-like)
- Testimonials/community (Phase 2): Real couple photos with permission

**Style:** Photography should be authentic, diverse (age, ethnicity, body types), and show genuine connection. Avoid stock photo clichés of overly posed couples. Prefer natural lighting and intimate framing.

## Animations
**Sparingly Used:**
- Page transitions: Subtle fade-in (200ms)
- Assessment progress: Smooth bar fill
- Results reveal: Gentle scale-in for attachment meter
- Button interactions: Default hover/active states only
- Success states: Single confetti burst for milestones

## Accessibility
- Maintain WCAG AA contrast ratios in both modes
- Focus indicators on all interactive elements (ring-2 ring-primary)
- Keyboard navigation throughout assessment
- Screen reader labels for visualizations
- Dark mode consistently applied to all inputs and modals

## Screen-Specific Treatments

**Welcome/Onboarding:** Hero image with gradient overlay, centered CTA, testimonial count below ("Join 10,000+ couples growing together")

**Assessment:** Clean, focused single-question view with progress bar, minimal distractions, large touch targets

**Results Dashboard:** Visual celebration of completion, attachment meter prominent, encouraging language, multiple CTAs (Coach, Retreat, Share)

**AI Coach:** Conversational, spacious chat with suggested prompts grid, persistent input at bottom, session summary always accessible

**Retreat Builder:** Interactive timeline editor, visual activity categories, preview modal before save, inspirational imagery for location types