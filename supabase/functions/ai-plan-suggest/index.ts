import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { user_id, date } = await req.json();

    if (!user_id || !date) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Fetch recent activity history for context (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const { data: recentActivities } = await supabase
      .from('activities')
      .select('title, category_id, status, duration_minutes')
      .eq('user_id', user_id)
      .gte('start_time', sevenDaysAgo.toISOString())
      .order('start_time', { ascending: false })
      .limit(20);

    const activityContext = recentActivities
      ? recentActivities.map(a => `- ${a.title} (${a.duration_minutes}m, ${a.status})`).join('\n')
      : 'No recent activity history';

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 200,
      system: `You are a productivity planning assistant. Suggest 3 activities for tomorrow based on the user's history.
Respond with JSON: {"suggestions": ["activity 1", "activity 2", "activity 3"]}`,
      messages: [{
        role: 'user',
        content: `Plan suggestions for ${date}

Recent activities:
${activityContext}

Suggest 3 meaningful activities for tomorrow. Keep each under 50 characters.`,
      }],
    });

    const text = message.content[0]?.type === 'text' ? message.content[0].text : '{}';
    let result;
    try {
      result = JSON.parse(text);
    } catch {
      result = { suggestions: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[ai-plan-suggest] Error:', err);
    return new Response(JSON.stringify({ suggestions: [] }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
