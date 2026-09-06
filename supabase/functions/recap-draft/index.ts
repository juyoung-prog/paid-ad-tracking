// POST /recap-draft — Recap(캠페인 종료 후 결과 보고)의 문장 초안과 번역 (Build Plan Phase 6).
//
// 숫자는 프론트가 이미 계산해서 보낸다(지표·벤치마크·판정 제안). 이 함수는 그
// 숫자를 읽고 **사람이 다듬을 초안**을 돌려줄 뿐이다 — 저장하지 않는다. 최종
// 문장은 사람이 에디터에서 고치고 Save를 눌러야 DB에 들어간다.
//
// mode 'draft'   : 비어 있는 캠페인 코멘트(장점·아쉬운 점·이유)와 요약·배운 점·
//                  다음 제언의 초안을 target 언어 하나로 만든다. 이미 사람이 쓴
//                  문장은 그대로 두라고 지시한다(프론트도 빈 칸에만 채운다).
// mode 'translate': en 문장을 나머지 언어(ko, zh-Hant)로 옮긴다.
//
// 인증: verify_jwt(기본값 true)가 Supabase JWT를 검사하고, 여기서 다시 role이
// 'authenticated'인지 본다 — anon key도 JWT라 verify_jwt만으로는 링크만 가진
// 사람이 이 함수를 부를 수 있다. 쓰기 권한과 같은 기준(로그인)으로 막는다.
//
// 필요한 시크릿: ANTHROPIC_API_KEY (npx supabase secrets set ANTHROPIC_API_KEY=...)
import Anthropic from 'npm:@anthropic-ai/sdk';
import { z } from 'npm:zod';
import { zodOutputFormat } from 'npm:@anthropic-ai/sdk/helpers/zod';
import { corsHeaders } from '../_shared/cors.ts';

const LANG_NAME: Record<string, string> = { en: 'English', ko: 'Korean', 'zh-Hant': 'Traditional Chinese (Taiwan)' };

const LocalizedNote = z.object({
  campaignId: z.string(),
  strength: z.string(),
  weakness: z.string(),
  reason: z.string(),
});
const LanguageBlock = z.object({
  lang: z.string(),
  summary: z.string(),
  nextSteps: z.string(),
  learnings: z.array(z.object({ title: z.string(), body: z.string() })),
  notes: z.array(LocalizedNote),
});
const Output = z.object({ languages: z.array(LanguageBlock) });

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

/** JWT payload의 role — 서명은 게이트웨이(verify_jwt)가 이미 검사했다 */
function jwtRole(req: Request): string | null {
  const auth = req.headers.get('Authorization') ?? '';
  const token = auth.replace(/^Bearer\s+/i, '');
  const parts = token.split('.');
  if (parts.length < 2) return null;
  try {
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    return payload?.role ?? null;
  } catch {
    return null;
  }
}

const SYSTEM = `You write short post-campaign recap notes for a beauty retail chain's paid social ads (Meta, TikTok).
Audience: the owner, reading a one-page report. Plain, concrete, no marketing jargon, no exclamation marks.
Each comment is one or two sentences. Judge only from the numbers given — benchmarks say how a campaign compares with similar past campaigns. When a metric says "not enough data", do not claim a comparison.
Keep any text that is already written; only fill what is empty. Never invent numbers that are not in the input.`;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);
  if (jwtRole(req) !== 'authenticated') return json({ error: 'Sign in to use AI drafts.' }, 401);

  const apiKey = Deno.env.get('ANTHROPIC_API_KEY');
  if (!apiKey) return json({ error: 'ANTHROPIC_API_KEY secret is not set.' }, 500);

  const body = await req.json().catch(() => null);
  if (!body || !['draft', 'translate'].includes(body.mode)) return json({ error: 'mode must be draft or translate' }, 400);

  const mode: 'draft' | 'translate' = body.mode;
  const targets: string[] = mode === 'draft' ? [body.lang ?? 'en'] : (body.targets ?? ['ko', 'zh-Hant']);
  const unknown = targets.filter((l) => !LANG_NAME[l]);
  if (unknown.length > 0) return json({ error: `unknown language: ${unknown.join(', ')}` }, 400);

  const task = mode === 'draft'
    ? `Write the recap in ${LANG_NAME[targets[0]]} (lang "${targets[0]}"). For every campaign in "rows", write strength, weakness and reason unless the existing note already has that field. Write a 2–3 sentence summary, 2–4 learnings (title + body) and a short "next time" paragraph, unless they already exist. Return exactly one language block.`
    : `Translate the existing English text into ${targets.map((l) => `${LANG_NAME[l]} (lang "${l}")`).join(' and ')}. Keep meaning and tone; keep campaign names, store codes and metric names as they are. Return one language block per target language, in the same order. If an English field is empty, return an empty string for it.`;

  const client = new Anthropic({ apiKey });
  try {
    const response = await client.messages.parse({
      model: 'claude-opus-5',
      max_tokens: 16000,
      output_config: { effort: 'medium', format: zodOutputFormat(Output) },
      system: SYSTEM,
      messages: [
        {
          role: 'user',
          content: `${task}\n\nInput (JSON):\n${JSON.stringify({ event: body.event, rows: body.rows, recap: body.recap, notes: body.notes }, null, 1)}`,
        },
      ],
    });

    if (response.stop_reason === 'refusal') {
      return json({ error: 'The model declined this request.', detail: response.stop_details?.explanation ?? null }, 422);
    }
    if (!response.parsed_output) return json({ error: 'The model returned no structured output.' }, 502);
    return json({ mode, languages: response.parsed_output.languages, usage: response.usage });
  } catch (error) {
    if (error instanceof Anthropic.AuthenticationError) return json({ error: 'ANTHROPIC_API_KEY is invalid.' }, 500);
    if (error instanceof Anthropic.RateLimitError) return json({ error: 'Rate limited — try again in a minute.' }, 429);
    if (error instanceof Anthropic.APIError) return json({ error: `Claude API error ${error.status}: ${error.message}` }, 502);
    console.error('recap-draft failed', error);
    return json({ error: 'Unexpected error.' }, 500);
  }
});
