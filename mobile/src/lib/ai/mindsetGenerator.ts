/**
 * Local Mindset Generator
 *
 * Generates "how should I approach this?" framing — NOT motivation.
 * Mindset = mental framing, approach strategy, what to keep in mind.
 *
 * Examples of GOOD mindset:
 *   "Connect emotionally. Listen to her, don't fix."
 *   "Focus on calmness. One task at a time. No Slack."
 *   "Focus on the breath. Let thoughts pass."
 *
 * Examples of BAD mindset (too motivational):
 *   "You got this! Push through!"
 *   "Believe in yourself!"
 *   "Every step counts!"
 *
 * RULES:
 * 1. Always REPLACE, never append
 * 2. Keep to 2-3 lines (unless user explicitly asks for longer)
 * 3. If user typed something, REFRAME it (improve framing, keep meaning)
 * 4. Use the activity title to generate context-specific framing
 * 5. LLM-parsable: the output can be fed to Claude for further refinement
 *
 * This file grows over time as we learn what good mindsets look like.
 */

// =====================================================================
// ACTIVITY-SPECIFIC MINDSET DATABASE
// Keyed by lowercase keywords found in the title
// =====================================================================

const ACTIVITY_MINDSETS: Record<string, string[]> = {
  // Physical
  'gym': ['Focus on form over speed. Listen to your body. Start with stretches.', 'Warm up fully. Breathe through each rep. Cool down.', 'Compound movements first. Don\'t skip the stretch.'],
  'workout': ['Focus on form over speed. Listen to your body.', 'Breathe through each rep. Stay present in the movement.'],
  'sunlight': ['Stand still. Feel the warmth. Let it reset your circadian rhythm.', 'Face the light. Close your eyes. 15 minutes of stillness.'],
  'swim': ['Focus on the rhythm of your strokes. Let the water carry you.', 'Breathe bilaterally. Feel the water, don\'t fight it.'],
  'yoga': ['Follow the breath, not the pose. Flexibility comes from surrender.', 'Move slowly. Hold longer than comfortable. Breathe.'],
  'walk': ['Walk without destination. Notice what you see. Breathe deeply.', 'No phone. Just walk, observe, breathe.'],

  // Work
  'work': ['Focus on calmness. One task at a time. Block distractions.', 'Start with the hardest thing. Momentum follows.', 'Be serious about intent, playful in execution.'],
  'deep work': ['Close everything. One tab. One task. No Slack until the draft is done.', 'Architecture first, details follow. Ship something ugly.'],
  'meeting': ['Listen more than you speak. Ask questions, don\'t present answers.', 'Take notes. Clarify expectations. Follow up within the hour.'],
  'standup': ['Be brief. What you did, what you\'ll do, what blocks you. That\'s it.', 'Listen to others. Offer help if you can.'],
  'problem solving': ['Break it down. What\'s the smallest piece you can solve right now?', 'Think on paper. Write before you code. Diagram before you build.'],

  // Learning
  'read': ['Read actively. Take notes. Ask yourself: what changes because of this?', 'Focus on understanding, not finishing. One idea well understood beats a chapter skimmed.'],
  'learn': ['Stay curious. Ask why, not just what. Take notes in your own words.', 'Connect new knowledge to what you already know.'],
  'study': ['Active recall over passive reading. Test yourself.', 'Pomodoro: 25 minutes focused, 5 minutes rest. Repeat.'],
  'course': ['Take notes as if you\'ll teach this to someone tomorrow.', 'Pause after each section. What was the key insight?'],

  // Family / Social
  'call': ['Connect emotionally. Listen first. Don\'t try to fix, just be present.', 'Ask how they\'re really doing. Share something real about your day.'],
  'mummy': ['Connect emotionally. Listen to her stories. She carries you in her heart.', 'Be patient. Ask about her day. Share your feelings.'],
  'bhabhi': ['Be present. Listen without judgment. Don\'t give advice unless asked.', 'Be warm. Ask about her world. Show genuine interest.'],
  'bhaiya': ['Be equal. No one is above or below. Find common ground.', 'Listen first. Understand his perspective before sharing yours.'],
  'family': ['Be present. Put the phone away. Ask questions. Listen.', 'Connect on feelings, not tasks. How is everyone really doing?'],
  'friends': ['Go for connectedness. Ask them more about them than about you.', 'Be light. Laugh. Don\'t try to impress. Just be.'],

  // Spiritual / Self
  'meditat': ['Focus on the breath. When thoughts come, let them pass like clouds.', 'Sit still. Don\'t judge the quality. Just sit.'],
  'pray': ['Surrender to the moment. You are part of something larger.', 'Let go of control. Trust the process. Be grateful.'],
  'mudra': ['Channel the energy. Feel it in your fingertips. Breathe slowly.', 'Stay with the practice. Don\'t rush. Let the energy flow.'],
  'journal': ['Write without editing. What went well? What surprised you? What did you learn?', 'Be honest on the page. No one else reads this.'],
  'affirm': ['Speak slowly. Feel each word. I am enough and I love the way I am.', 'Mean it. Not performance. Feel it in your body.'],
  'self love': ['Look at yourself with compassion. You are doing your best.', 'Mirror work: say what you appreciate about yourself. Mean it.'],
  'routine': ['Check each item. Not as a chore, but as care for tomorrow\'s you.', 'Review the day. What went well? What would you do differently?'],

  // Creative
  'write': ['Start messy. Edit later. The blank page is the hardest part.', 'Write as if no one will read it. Free the ideas first.'],
  'humour': ['Make situations lighter. Find the absurd. Improv mindset: yes, and.', 'Don\'t try to be funny. Be truthful. Humor follows honesty.'],
  'music': ['Let it flow. Don\'t judge. Feel the rhythm in your body.', 'Play what you feel, not what you think you should play.'],

  // Rest
  'leisure': ['This is not wasted time. Rest is productive. Enjoy fully.', 'No guilt. You\'ve earned this. Be in the moment.'],
  'rest': ['Recharge without guilt. Your body needs this.', 'Do nothing with intention. That\'s different from doing nothing.'],
  'sleep': ['Wind down. No screens. Let the day go.', 'Tomorrow is handled. Right now, just rest.'],

  // Food
  'breakfast': ['Eat mindfully. Taste each bite. No phone at the table.', 'Be grateful for the food. Fuel your body with care.'],
  'lunch': ['Take a real break. Step away from work. Eat slowly.', 'Nourish your body. This meal powers your afternoon.'],
  'dinner': ['Eat together if you can. Share the day. No rush.', 'Gratitude for the meal. Close the kitchen of the day.'],
};

// =====================================================================
// CATEGORY FALLBACKS (when no title keyword matches)
// =====================================================================

const CATEGORY_MINDSETS: Record<string, string[]> = {
  'Health': ['Listen to your body. Move with intention, not just motion.', 'Focus on how it feels, not how it looks. Breathe.'],
  'Personal': ['Be present. Whatever this is, give it your full attention.', 'This is your time. Use it with intention.'],
  'Learning': ['Approach with curiosity. Understanding > memorizing.', 'What can you learn here that changes how you think?'],
  'Rest': ['Rest with intention. This is not wasted time.', 'Let your mind wander. Creativity needs space.'],
  'Family': ['Be present. Put the phone away. Connect on feelings.', 'Listen first. Ask how they\'re really doing.'],
  'Social': ['Be curious about others. Ask good questions. Listen.', 'Go for connectedness, not performance.'],
  'Finance': ['Be clear-headed. Check the numbers, not the emotions.', 'Review objectively. What\'s the trend? What needs action?'],
};

// =====================================================================
// GENERATOR
// =====================================================================

/**
 * Generate a mindset framing for an activity.
 * ALWAYS replaces, never appends.
 * If user typed something, reframe it (improve, keep meaning).
 */
export function generateLocalMindset(
  activityTitle: string,
  categoryName: string,
  existingText: string
): string {
  const titleLower = activityTitle.toLowerCase();

  // If user typed something, reframe it
  if (existingText && existingText.trim().length > 5) {
    return reframeMindset(existingText.trim(), titleLower, categoryName);
  }

  // Try to match activity title keywords
  for (const [keyword, options] of Object.entries(ACTIVITY_MINDSETS)) {
    if (titleLower.includes(keyword)) {
      return options[Math.floor(Math.random() * options.length)];
    }
  }

  // Fall back to category
  const catOptions = CATEGORY_MINDSETS[categoryName];
  if (catOptions) {
    return catOptions[Math.floor(Math.random() * catOptions.length)];
  }

  // Ultimate fallback
  return 'Approach this with full attention. What matters most right now?';
}

/**
 * Reframe user's text into better mindset framing.
 * Keeps the meaning but improves the structure.
 */
function reframeMindset(
  userText: string,
  titleLower: string,
  categoryName: string
): string {
  // If user's text is already well-formed (has period, decent length), keep it mostly
  if (userText.length > 30 && userText.includes('.')) {
    // Just clean it up — ensure it ends with period, trim excess
    let cleaned = userText.trim();
    if (!cleaned.endsWith('.') && !cleaned.endsWith('!') && !cleaned.endsWith('?')) {
      cleaned += '.';
    }
    return cleaned;
  }

  // Short user input — expand into a proper framing
  // Try to find relevant context from the activity database
  let contextLine = '';
  for (const [keyword, options] of Object.entries(ACTIVITY_MINDSETS)) {
    if (titleLower.includes(keyword)) {
      // Pick a complementary line that doesn't repeat what user said
      const complement = options.find(o => !o.toLowerCase().includes(userText.toLowerCase().split(' ')[0]));
      if (complement) {
        contextLine = complement.split('.')[0] + '.';
        break;
      }
    }
  }

  // Reframe: user's text + context
  let reframed = userText.trim();
  if (!reframed.endsWith('.') && !reframed.endsWith('!') && !reframed.endsWith('?')) {
    reframed += '.';
  }

  if (contextLine && reframed.length < 60) {
    reframed += ' ' + contextLine;
  }

  return reframed;
}
