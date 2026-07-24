import { fileURLToPath } from 'node:url';

const SURFACES = ['chat', 'voice'];
const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

function clean(value) {
  return typeof value === 'string' ? value.trim() : '';
}

/**
 * Mirror src/app/api/chat/route.ts: OpenRouter wins only when the selected
 * surface has a model, otherwise OpenAI is the selected provider.
 */
export function cloudTarget(surface, env = process.env) {
  if (!SURFACES.includes(surface)) throw new Error(`Unknown cloud surface: ${surface}`);

  const openRouterKey = clean(env.OPENROUTER_API_KEY);
  const openRouterModel = surface === 'voice'
    ? clean(env.OPENROUTER_VOICE_MODEL) || 'openai/gpt-4o-mini'
    : clean(env.OPENROUTER_CHAT_MODEL);
  if (openRouterKey && openRouterModel) {
    return {
      provider: 'OpenRouter',
      url: OPENROUTER_URL,
      apiKey: openRouterKey,
      model: openRouterModel,
      extraHeaders: {
        'HTTP-Referer': clean(env.APP_URL) || 'https://mila.purangpt.com',
        'X-Title': 'Mila English',
      },
    };
  }

  const openAIKey = clean(env.OPENAI_API_KEY);
  if (openAIKey) {
    return {
      provider: 'OpenAI',
      url: OPENAI_URL,
      apiKey: openAIKey,
      model: clean(surface === 'voice' ? env.OPENAI_VOICE_MODEL : env.OPENAI_CHAT_MODEL) || 'gpt-4o-mini',
      extraHeaders: {},
    };
  }

  return null;
}

export async function checkCloudSurface(surface, env = process.env, fetchImpl = globalThis.fetch, logger = console) {
  const target = cloudTarget(surface, env);
  if (!target) {
    throw new Error(`No production cloud ${surface} provider is configured`);
  }

  const response = await fetchImpl(target.url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${target.apiKey}`,
      ...target.extraHeaders,
    },
    body: JSON.stringify({
      model: target.model,
      messages: [{ role: 'user', content: 'Reply with OK.' }],
      max_tokens: 3,
    }),
    signal: AbortSignal.timeout(20_000),
  });

  if (!response.ok) {
    throw new Error(`Cloud ${surface} check failed via ${target.provider} (${target.model}): HTTP ${response.status}`);
  }

  logger.log(`cloud ${surface} ready via ${target.provider} (${target.model})`);
  return { surface, provider: target.provider, model: target.model };
}

/** Run sequentially: deploy verification must never create overlapping loads. */
export async function checkCloudBrains(env = process.env, fetchImpl = globalThis.fetch, logger = console) {
  const results = [];
  for (const surface of SURFACES) {
    results.push(await checkCloudSurface(surface, env, fetchImpl, logger));
  }
  return results;
}

function printPlan(env = process.env, logger = console) {
  for (const surface of SURFACES) {
    const target = cloudTarget(surface, env);
    if (!target) throw new Error(`No production cloud ${surface} provider is configured`);
    logger.log(`cloud ${surface}: ${target.provider} (${target.model})`);
  }
}

async function main() {
  if (process.argv.includes('--plan')) printPlan();
  else await checkCloudBrains();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
