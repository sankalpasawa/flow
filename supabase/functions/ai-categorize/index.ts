import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SYSTEM_CATEGORIES = [
  { id: '00000000-0000-0000-0000-000000000001', name: 'Deep Work' },
  { id: '00000000-0000-0000-0000-000000000002', name: 'Meetings' },
  { id: '00000000-0000-0000-0000-000000000003', name: 'Admin' },
  { id: '00000000-0000-0000-0000-000000000004', name: 'Health' },
  { id: '00000000-0000-0000-0000-000000000005', name: 'Learning' },
  { id: '00000000-0000-0000-0000-000000000006', name: 'Personal' },
  { id: '00000000-0000-0000-0000-000000000007', name: 'Creative' },
  { id: '00000000-0000-0000-0000-000000000008', name: 'Rest' },
];

const AI_DAILY_LIMIT = 20;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { title, user_id } = await req.json();

    if (!title || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing title or user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Circuit breaker: check daily call count
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

    const categoryList = SYSTEM_CATEGORIES.map(c => `- ${c.name} (id: ${c.id})`).join('\n');

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 100,
      system: 'You are a productivity assistant that categorizes activities. Respond with valid JSON only.',
      messages: [{
        role: 'user',
        content: `Categorize this activity into the best matching category.

Activity title: [${title}]

Available categories:
${categoryList}

Respond with JSON: {"category_id": "<id>", "confidence": <0.0-1.0>}`,
      }],
    });

    const responseText = message.content[0]?.type === 'text' ? message.content[0].text : '';
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      // Fallback to Deep Work if parsing fails
      result = { category_id: '00000000-0000-0000-0000-000000000001', confidence: 0.5 };
    }

    // Validate category_id is in our list
    const validCat = SYSTEM_CATEGORIES.find(c => c.id === result.category_id);
    if (!validCat) {
      result = { category_id: '00000000-0000-0000-0000-000000000001', confidence: 0.5 };
    }

    // Increment usage counter
    await supabase.from('ai_usage').upsert({
      user_id, date: today,
      call_count: (usage?.call_count ?? 0) + 1,
    }, { onConflict: 'user_id,date' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai-categorize] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error', fallback: { category_id: '00000000-0000-0000-0000-000000000001', confidence: 0 } }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
