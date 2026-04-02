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
    const { text, categories, recent_titles, user_id } = await req.json();

    if (!text || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Circuit breaker — daily limit (shared with ai-mindset-prompt)
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

    // Build category listing for the system prompt
    const categoryList = Array.isArray(categories) && categories.length > 0
      ? categories.map((c: { id: string; name: string }) => `${c.id} → ${c.name}`).join('\n')
      : 'No categories available';

    const recentTitlesList = Array.isArray(recent_titles) && recent_titles.length > 0
      ? `\nRecent activity titles for context: ${recent_titles.join(', ')}`
      : '';

    const systemPrompt = `You are a scheduling assistant. Parse the user's text into a structured activity.

Available categories (id → name):
${categoryList}

Return JSON only, no explanation:
{
  "title": "extracted title",
  "date": "yyyy-MM-dd or null",
  "time": "HH:mm or null",
  "duration": minutes_number_or_null,
  "category_id": "matched_category_id or null",
  "recurrence": "NONE|DAILY|WEEKLY|MONTHLY|YEARLY",
  "mindset_prompt": "short intention or null",
  "confidence": 0.0_to_1.0
}

Rules:
- "morning" = 07:00, "afternoon" = 13:00, "evening" = 18:00, "night" = 21:00
- "every day"/"daily" = DAILY, "every week"/"weekly" = WEEKLY
- If no time mentioned, time is null (it will be saved as a task)
- Mindset should be 1 sentence, personal, direct (not generic motivational)
- Confidence: 1.0 if all fields clear, lower if ambiguous
- Match category by name similarity. If no match, category_id is null
- Recurrence defaults to NONE if not mentioned${recentTitlesList}`;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      system: systemPrompt,
      messages: [{ role: 'user', content: text }],
    });

    const rawText = message.content[0]?.type === 'text'
      ? message.content[0].text.trim()
      : null;

    if (!rawText) {
      // Fallback: return just the title
      return new Response(JSON.stringify({
        parsed: { title: text, date: null, time: null, duration: null, category_id: null, recurrence: 'NONE', mindset_prompt: null },
        confidence: 0.1,
        action: 'create',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse JSON response — handle malformed JSON gracefully
    let parsed;
    try {
      // Strip markdown code fences if present
      const cleaned = rawText.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
      parsed = JSON.parse(cleaned);
    } catch {
      // Try to extract JSON from the response text
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          parsed = JSON.parse(jsonMatch[0]);
        } catch {
          // Complete parse failure — fallback with just the title
          await incrementUsage(supabase, user_id, today, usage?.call_count ?? 0);
          return new Response(JSON.stringify({
            parsed: { title: text, date: null, time: null, duration: null, category_id: null, recurrence: 'NONE', mindset_prompt: null },
            confidence: 0.1,
            action: 'create',
          }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
      } else {
        await incrementUsage(supabase, user_id, today, usage?.call_count ?? 0);
        return new Response(JSON.stringify({
          parsed: { title: text, date: null, time: null, duration: null, category_id: null, recurrence: 'NONE', mindset_prompt: null },
          confidence: 0.1,
          action: 'create',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // Normalize the parsed result with safe defaults
    const confidence = typeof parsed.confidence === 'number'
      ? Math.max(0, Math.min(1, parsed.confidence))
      : 0.5;

    const result = {
      parsed: {
        title: parsed.title || text,
        date: parsed.date || null,
        time: parsed.time || null,
        duration: typeof parsed.duration === 'number' ? parsed.duration : null,
        category_id: parsed.category_id || null,
        recurrence: ['NONE', 'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY'].includes(parsed.recurrence)
          ? parsed.recurrence
          : 'NONE',
        mindset_prompt: parsed.mindset_prompt || null,
      },
      confidence,
      action: 'create' as const,
    };

    // Increment usage counter
    await incrementUsage(supabase, user_id, today, usage?.call_count ?? 0);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[parse-activity] Error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function incrementUsage(
  supabase: ReturnType<typeof createClient>,
  user_id: string,
  date: string,
  currentCount: number
) {
  await supabase.from('ai_usage').upsert({
    user_id,
    date,
    call_count: currentCount + 1,
  }, { onConflict: 'user_id,date' });
}
