import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const compose = readFileSync('docker-compose.prod.yml', 'utf8');
const workflow = readFileSync('.github/workflows/deploy.yml', 'utf8');
const giaProxy = readFileSync('scripts/configure-gia-proxy.sh', 'utf8');

test('production has one compact local model and no runnable 20B service', () => {
  assert.match(compose, /LOCAL_LLM_URL=http:\/\/mila-voice-llm:11434/);
  assert.match(compose, /LOCAL_LLM_MODEL=\$\{LOCAL_VOICE_LLM_MODEL:-qwen3:4b-instruct-2507-q4_K_M\}/);
  assert.doesNotMatch(compose, /^\s{2}mila-llm:\s*$/m);
  assert.match(compose, /^\s{2}mila-voice-llm:\s*$/m);
  assert.match(workflow, /docker stop mila-llm/);
});

test('production services and ordinary deploy builds stay bounded', () => {
  for (const limit of ['mem_limit: 1g', 'mem_limit: 2g', 'mem_limit: 6g']) {
    assert.match(compose, new RegExp(limit));
  }
  assert.match(workflow, /docker compose -f docker-compose\.prod\.yml build mila$/m);
  assert.match(workflow, /speech_build_required=false/);
  assert.match(workflow, /git diff --quiet "\$previous_sha" HEAD -- pron-service asr-service tts-service/);
  assert.doesNotMatch(workflow, /docker compose -f docker-compose\.prod\.yml build\s*$/m);
});

test('production provisions Gia and Mia while preserving the legacy hostname in the app', () => {
  assert.match(workflow, /bash scripts\/configure-gia-proxy\.sh/);
  assert.match(workflow, /https:\/\/gia\.purangpt\.com\/login/);
  assert.match(workflow, /mia_status=.*https:\/\/mia\.purangpt\.com\//);
  assert.match(workflow, /Gia companion and Mia traveler routes are live/);
  assert.match(giaProxy, /gia\.purangpt\.com/);
  assert.match(giaProxy, /mia\.purangpt\.com/);
  assert.doesNotMatch(giaProxy, /miachat\.purangpt\.com/);
});
