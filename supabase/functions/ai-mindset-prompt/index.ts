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
    const { title, category, user_id } = await req.json();

    if (!title || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Circuit breaker
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

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 80,
      system: `You are a mindset coach for a productivity app. Generate a brief, personal,
actionable mindset prompt (under 60 characters) to help someone approach an activity with intention.
Be warm, direct, and specific. Never generic. Respond with ONLY the prompt text, no quotes.`,
      messages: [{
        role: 'user',
        content: `Activity: [${title}]
Category: [${category ?? 'General'}]

Write a mindset prompt for this activity:`,
      }],
    });

    const prompt = message.content[0]?.type === 'text'
      ? message.content[0].text.trim().slice(0, 120)
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

    return new Response(JSON.stringify({ prompt }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai-mindset-prompt] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
