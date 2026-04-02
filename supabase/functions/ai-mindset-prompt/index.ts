import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_DAILY_LIMIT = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, category, user_id, existing_text, duration_minutes, time } = await req.json();

    if (!title || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Circuit breaker — daily limit
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase
      .from('ai_usage')
      .select('call_count')
      .eq('user_id', user_id)
      .eq('date', today)
      .single();

    if (usage && usage.call_count >= AI_DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'quota_exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch context: last 5 mindset prompts for the same category
    const { data: pastPrompts } = await supabase
      .from('activities')
      .select('title, mindset_prompt')
      .eq('user_id', user_id)
      .eq('category_id', category ?? '')
      .not('mindset_prompt', 'is', null)
      .order('created_at', { ascending: false })
      .limit(5);

    const pastContext = pastPrompts && pastPrompts.length > 0
      ? pastPrompts.map((p: any) => `- "${p.title}": ${p.mindset_prompt}`).join('\n')
      : 'No past mindset prompts for this category.';

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    // Two modes: generate fresh or enhance existing
    const isEnhance = existing_text && existing_text.trim().length > 0;

    const systemPrompt = isEnhance
      ? `You are reframing a mindset for a productivity app user.
Mindset = how to approach this activity. Mental framing, not motivation.

GOOD: "Connect emotionally. Listen to her, don't fix." / "Focus on calmness. One task at a time."
BAD: "You got this!" / "Believe in yourself!" / "Every step counts!"

The user typed a rough mindset. REFRAME it: improve the framing, keep the meaning.
Keep to 2-3 short sentences. Sound like their inner voice. Direct.
If their text is already good, just clean it up.
Respond with ONLY the reframed text. No quotes, no explanation.`
      : `You are generating a mindset for a productivity app user.
Mindset = how to approach this activity. Mental framing. What to keep in mind.

GOOD: "Focus on form, not speed. Breathe through each rep."
GOOD: "Listen more than you speak. Ask why before suggesting how."
BAD: "You can do it!" / "Stay positive!" / "Push through!"

Generate 2-3 short sentences. Direct, personal, practical.
Sound like their inner voice reminding them HOW to approach this.
Use past prompts to match their voice.
Respond with ONLY the mindset text. No quotes, no explanation.`;

    const userMessage = isEnhance
      ? `Activity: "${title}"
Category: ${category ?? 'General'}
${time ? `Time: ${time}` : ''}${duration_minutes ? `, Duration: ${duration_minutes}min` : ''}

User's draft intention: "${existing_text}"

Past mindset prompts for similar activities:
${pastContext}

Refine their draft into a cleaner intention:`
      : `Activity: "${title}"
Category: ${category ?? 'General'}
${time ? `Time: ${time}` : ''}${duration_minutes ? `, Duration: ${duration_minutes}min` : ''}

Past mindset prompts for similar activities:
${pastContext}

Generate a personal intention for this activity:`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });

    const prompt = message.content[0]?.type === 'text'
      ? message.content[0].text.trim().slice(0, 150)
      : null;

    if (!prompt) {
      return new Response(JSON.stringify({ error: 'Empty response' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Increment usage
    await supabase.from('ai_usage').upsert({
      user_id, date: today,
      call_count: (usage?.call_count ?? 0) + 1,
    }, { onConflict: 'user_id,date' });

    return new Response(JSON.stringify({ prompt, mode: isEnhance ? 'enhanced' : 'generated' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai-mindset-prompt] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
