/**
 * DayFlow AI Command — Universal edge function
 *
 * Receives: natural language text + app context
 * Returns: action JSON the app executes
 *
 * LLM-agnostic. Currently uses Google Gemini (free tier).
 * Swap to any LLM by changing the API call below.
 */

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AI_DAILY_LIMIT = 20;

const APP_SCHEMA = `You are DayFlow's AI. DayFlow is a personal operating system.
You have FULL access to the user's data. You can read, create, update, delete anything.

DATA SCHEMA:
Activity { id, title, start_time (ISO|null), duration_minutes, category_id, recurrence_type (NONE|DAILY|WEEKLY|MONTHLY|YEARLY), recurrence_days, mindset_prompt, status (PLANNED|COMPLETED|SKIPPED), subtasks, assigned_date, priority }
Category { id, name, icon }

UI: Calendar (timed activities), List (all), Bottom bar (untimed), Watermarks (untimed+recurring)

RULES:
- No start_time → bottom bar. No start_time + recurring → watermark. With start_time → calendar pill.
- If confident (>0.8), return action directly.
- If unsure, ask clarification.
- Mindset = mental framing, NOT motivation. "How should I approach this?"
- Always return valid JSON only.`;

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { text, user_id, context } = await req.json();
    if (!text || !user_id) {
      return new Response(JSON.stringify({ error: 'Missing text or user_id' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Rate limit
    const today = new Date().toISOString().split('T')[0];
    const { data: usage } = await supabase.from('ai_usage').select('call_count').eq('user_id', user_id).eq('date', today).single();
    if (usage && usage.call_count >= AI_DAILY_LIMIT) {
      return new Response(JSON.stringify({ error: 'quota_exceeded' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Try Gemini first, fall back to Anthropic if available
    const geminiKey = Deno.env.get('GEMINI_API_KEY');
    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY');

    if (!geminiKey && !anthropicKey) {
      return new Response(JSON.stringify({
        action: 'create', params: { raw_text: text }, confidence: 0.3,
        message: 'AI not configured. Creating as-is.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const systemPrompt = `${APP_SCHEMA}

CURRENT STATE:
${context || 'No context provided.'}

Return JSON only:
{
  "action": "create | update | delete | search | navigate | display | clarify",
  "params": { ... },
  "confidence": 0.0-1.0,
  "message": "what to tell the user",
  "clarification": "question if unsure, null otherwise"
}`;

    let raw = '';

    if (geminiKey) {
      // Google Gemini API (free tier: 15 RPM, 1M tokens/day)
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
      const geminiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents: [{ parts: [{ text }] }],
          generationConfig: {
            maxOutputTokens: 300,
            temperature: 0.1,
          },
        }),
      });

      if (!geminiRes.ok) {
        const errText = await geminiRes.text();
        console.error('[command] Gemini error:', geminiRes.status, errText);
        throw new Error(`Gemini API error: ${geminiRes.status}`);
      }

      const geminiData = await geminiRes.json();
      raw = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    } else if (anthropicKey) {
      // Anthropic Claude fallback
      const { default: Anthropic } = await import("npm:@anthropic-ai/sdk@0.39.0");
      const anthropic = new Anthropic({ apiKey: anthropicKey });
      const message = await anthropic.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: 'user', content: text }],
      });
      raw = message.content[0]?.type === 'text' ? message.content[0].text.trim() : '';
    }

    // Parse JSON from LLM response
    let result: any;
    try {
      const clean = raw.replace(/```json\n?|```\n?/g, '').trim();
      result = JSON.parse(clean);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) { try { result = JSON.parse(jsonMatch[0]); } catch {} }
    }

    if (!result) {
      result = { action: 'create', params: { raw_text: text }, confidence: 0.2, message: raw || 'Could not parse.' };
    }

    // Increment usage
    await supabase.from('ai_usage').upsert({
      user_id, date: today, call_count: (usage?.call_count ?? 0) + 1,
    }, { onConflict: 'user_id,date' });

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[command]', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
