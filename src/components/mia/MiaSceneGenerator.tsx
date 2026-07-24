'use client';

import Image from 'next/image';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from 'react';
import MilaIcon from '@/components/ui/MilaIcon';
import {
  MIA_DESTINATION_GUIDES,
  MIA_SCENE_DESTINATIONS,
  MIA_SCENE_MEDIA,
  buildFallbackMiaScene,
  miaSceneRequestSchema,
  miaSceneResponseSchema,
  type MiaSceneRequest,
  type MiaSceneResponse,
  type MiaSceneSituation,
} from '@/lib/miaScenes';

const situations: Array<{ id: MiaSceneSituation; en: string; ru: string }> = [
  { id: 'cafe', en: 'Café', ru: 'Кафе' },
  { id: 'directions', en: 'Find the way', ru: 'Найти дорогу' },
  { id: 'arrival', en: 'Arrival', ru: 'Прибытие' },
  { id: 'market', en: 'Local market', ru: 'Местный рынок' },
  { id: 'evening', en: 'Evening out', ru: 'Вечер в городе' },
];

const confidenceLevels: Array<{ id: MiaSceneRequest['level']; en: string; ru: string }> = [
  { id: 'first-words', en: 'I need the first words', ru: 'Мне нужны первые слова' },
  { id: 'conversational', en: 'I can keep it going', ru: 'Я могу поддержать разговор' },
  { id: 'confident', en: 'Make it feel local', ru: 'Хочу звучать естественно' },
];

const DEFAULT_DESTINATION = MIA_DESTINATION_GUIDES[0];
const SCENE_STORAGE_NAMESPACE = 'mia:last-scene';
const SCENE_STORAGE_VERSION = 1 as const;
const SCENE_REQUEST_TIMEOUT_MS = 12_000;

type SceneSource = 'generated' | 'curated';
type MotionMode = 'pending' | 'on' | 'off';

type StoredMiaScene = {
  version: typeof SCENE_STORAGE_VERSION;
  uiLanguage: MiaSceneRequest['uiLanguage'];
  request: MiaSceneRequest;
  response: MiaSceneResponse;
  source: SceneSource;
};

function sceneStorageKey(lang: MiaSceneRequest['uiLanguage']): string {
  return `${SCENE_STORAGE_NAMESPACE}:${lang}`;
}

const momentAliases: Record<string, MiaSceneSituation> = {
  cafe: 'cafe',
  café: 'cafe',
  chai: 'cafe',
  coffee: 'cafe',
  directions: 'directions',
  direction: 'directions',
  station: 'directions',
  arrival: 'arrival',
  arrive: 'arrival',
  hotel: 'arrival',
  market: 'market',
  bazaar: 'market',
  evening: 'evening',
  night: 'evening',
  music: 'evening',
};

function defaultRequest(lang: MiaSceneRequest['uiLanguage']): MiaSceneRequest {
  return {
    destination: DEFAULT_DESTINATION.destination,
    situation: DEFAULT_DESTINATION.situation,
    level: 'first-words',
    uiLanguage: lang,
  };
}

function normalizePlace(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('en')
    .replace(/[^a-z0-9\u0400-\u04ff]+/g, ' ')
    .trim();
}

function guideForDestination(destination: string) {
  const normalized = normalizePlace(destination);
  return MIA_DESTINATION_GUIDES.find((guide) => (
    normalized === normalizePlace(guide.destination)
    || normalized === normalizePlace(guide.id)
    || normalized === normalizePlace(guide.place)
    || normalized === normalizePlace(guide.placeRu)
  ));
}

function parseLinkedSituation(value: string | null): MiaSceneSituation | null {
  if (!value) return null;
  return momentAliases[value.trim().toLocaleLowerCase('en')] ?? null;
}

function persistenceMatchesRequest(request: MiaSceneRequest, response: MiaSceneResponse): boolean {
  const requested = normalizePlace(request.destination);
  const expected = normalizePlace(buildFallbackMiaScene(request).destination);
  const received = normalizePlace(response.destination);
  const requestedGuide = guideForDestination(request.destination);
  const receivedGuide = guideForDestination(response.destination);
  const namesTheRequestedPlace = requested.length >= 4
    && ` ${received} `.includes(` ${requested} `);
  return (
    received === requested
    || received === expected
    || (requestedGuide !== undefined && requestedGuide.id === receivedGuide?.id)
    || namesTheRequestedPlace
  );
}

function readStoredScene(lang: MiaSceneRequest['uiLanguage']): StoredMiaScene | null {
  try {
    const raw = window.localStorage.getItem(sceneStorageKey(lang));
    if (!raw) return null;
    const decoded: unknown = JSON.parse(raw);
    if (!decoded || typeof decoded !== 'object') return null;
    const record = decoded as Record<string, unknown>;
    if (
      record.version !== SCENE_STORAGE_VERSION
      || record.uiLanguage !== lang
      || (record.source !== 'generated' && record.source !== 'curated')
    ) {
      return null;
    }

    const requestResult = miaSceneRequestSchema.safeParse(record.request);
    const responseResult = miaSceneResponseSchema.safeParse(record.response);
    if (
      !requestResult.success
      || !responseResult.success
      || requestResult.data.uiLanguage !== lang
      || !persistenceMatchesRequest(requestResult.data, responseResult.data)
    ) {
      return null;
    }

    return {
      version: SCENE_STORAGE_VERSION,
      uiLanguage: lang,
      request: requestResult.data,
      response: responseResult.data,
      source: record.source,
    };
  } catch {
    return null;
  }
}

function persistScene(record: StoredMiaScene): void {
  try {
    window.localStorage.setItem(sceneStorageKey(record.uiLanguage), JSON.stringify(record));
  } catch {
    // Storage can be unavailable in private or constrained contexts. The scene
    // itself remains successful and useful even when it cannot be remembered.
  }
}

export default function MiaSceneGenerator({ lang }: { lang: 'en' | 'ru' }) {
  const initialRequest = useMemo(() => defaultRequest(lang), [lang]);
  const [draftRequest, setDraftRequest] = useState<MiaSceneRequest>(initialRequest);
  const [committedRequest, setCommittedRequest] = useState<MiaSceneRequest>(initialRequest);
  const [scene, setScene] = useState<MiaSceneResponse>(() => buildFallbackMiaScene(initialRequest));
  const [busy, setBusy] = useState(false);
  const [sceneSource, setSceneSource] = useState<SceneSource>('curated');
  const [notice, setNotice] = useState('');
  const [canSpeak, setCanSpeak] = useState(false);
  const [motionMode, setMotionMode] = useState<MotionMode>('pending');
  const [videoPlaying, setVideoPlaying] = useState(true);
  const sceneCardRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const requestControllerRef = useRef<AbortController | null>(null);
  const requestSequenceRef = useRef(0);
  const initializedForRef = useRef('');

  const copy = useMemo(() => lang === 'ru'
    ? {
        label: 'MIA SCENE STUDIO',
        title: 'Окажись внутри момента.',
        intro: 'Я Mia. Скажи, куда ты едешь и какой момент хочешь отрепетировать. Я подготовлю твою фразу, вероятный ответ и один местный нюанс.',
        destination: 'Куда ты едешь?',
        destinationPlaceholder: 'Например, Лиссабон',
        moment: 'Какой момент?',
        confidence: 'Насколько уверенно?',
        generate: 'Создать мою сцену',
        generating: 'Переносим тебя туда…',
        surprise: 'Удиви меня',
        scene: 'ТВОЯ СЦЕНА',
        generated: 'СОЗДАНО ВМЕСТЕ С MIA',
        curated: 'ГОТОВО С MIA',
        say: 'Скажи это',
        hear: 'Ты можешь услышать',
        culture: 'Между строк',
        mission: 'Твой ход',
        fromMia: 'СЛЕДУЮЩИЙ ШАГ ОТ MIA',
        nextAction: 'Послушай обе реплики, произнеси свою вслух, а затем выполни маленькое задание. Я буду рядом для следующей сцены.',
        listenPhrase: 'Твоя фраза',
        listenReply: 'Ответ собеседника',
        pauseVideo: 'Остановить фон',
        playVideo: 'Включить фон',
        copy: 'Скопировать сцену',
        copied: 'Сцена скопирована',
        copyUnavailable: 'Не удалось скопировать автоматически. Выдели текст сцены и скопируй его вручную.',
        ready: 'Я открыла готовую сцену. Можно начинать с первой реплики.',
        unavailable: 'Мне не удалось обновить сцену онлайн, поэтому я сохранила готовую версию — с ней можно продолжать.',
        timedOut: 'Онлайн-сцена загружалась слишком долго, поэтому я оставила готовую версию — можно практиковаться прямо сейчас.',
        destinationsLabel: 'ПОПУЛЯРНЫЕ МЕСТА',
        destinationsTitle: 'Выбери место. Почувствуй его ритм.',
        destinationsIntro: 'Каждое направление открывается не списком слов, а атмосферой, языком и маленьким правилом, которое помогает войти в настоящий разговор.',
        featured: 'В фокусе',
        enter: 'Открыть',
        feel: 'Почувствуй место',
      }
    : {
        label: 'MIA SCENE STUDIO',
        title: 'Step inside the moment.',
        intro: 'I’m Mia. Tell me where you’re going and which moment you want to rehearse. I’ll prepare your line, the likely reply, and one local cue.',
        destination: 'Where are you going?',
        destinationPlaceholder: 'Try Lisbon',
        moment: 'What kind of moment?',
        confidence: 'How confident do you feel?',
        generate: 'Generate my scene',
        generating: 'Taking you there…',
        surprise: 'Surprise me',
        scene: 'YOUR SCENE',
        generated: 'MADE WITH MIA',
        curated: 'READY WITH MIA',
        say: 'Say this',
        hear: 'You may hear',
        culture: 'Between the lines',
        mission: 'Your move',
        fromMia: 'MIA’S NEXT STEP',
        nextAction: 'Play both lines, say yours out loud, then try the small mission. I’ll be here when you want the next scene.',
        listenPhrase: 'Play your phrase',
        listenReply: 'Play their reply',
        pauseVideo: 'Pause background',
        playVideo: 'Play background',
        copy: 'Copy scene',
        copied: 'Scene copied',
        copyUnavailable: 'I couldn’t copy automatically. Select the scene text and copy it manually.',
        ready: 'I’ve opened a ready-to-practice scene. Start with your first line.',
        unavailable: 'I couldn’t refresh this scene online, so I’ve kept the ready-to-use version. You can continue.',
        timedOut: 'The live scene took a little too long, so I’ve kept the ready-to-use version. You can practise now.',
        destinationsLabel: 'PLACES PEOPLE ARE EXPLORING',
        destinationsTitle: 'Choose a place. Feel its rhythm.',
        destinationsIntro: 'Every destination opens with atmosphere, language, and one small local cue—not a generic list of words.',
        featured: 'Featured',
        enter: 'Enter',
        feel: 'Feel the place',
      }, [lang]);

  const media = useMemo(() => MIA_SCENE_MEDIA[scene.visual], [scene.visual]);
  const activeGuide = useMemo(
    () => guideForDestination(scene.destination) ?? guideForDestination(committedRequest.destination),
    [committedRequest.destination, scene.destination],
  );

  const focusScene = useCallback(() => {
    window.requestAnimationFrame(() => {
      const card = sceneCardRef.current;
      if (!card) return;
      card.scrollIntoView({ block: 'start' });
      card.focus({ preventScroll: true });
    });
  }, []);

  const commitCuratedScene = useCallback((
    request: MiaSceneRequest,
    options: { focus?: boolean; announce?: boolean } = {},
  ) => {
    const validated = miaSceneRequestSchema.safeParse(request);
    if (!validated.success) return;
    const nextRequest = validated.data;
    const nextScene = buildFallbackMiaScene(nextRequest);

    requestSequenceRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);
    setDraftRequest(nextRequest);
    setCommittedRequest(nextRequest);
    setScene(nextScene);
    setSceneSource('curated');
    setNotice(options.announce === false ? '' : copy.ready);
    persistScene({
      version: SCENE_STORAGE_VERSION,
      uiLanguage: nextRequest.uiLanguage,
      request: nextRequest,
      response: nextScene,
      source: 'curated',
    });
    if (options.focus !== false) focusScene();
  }, [copy.ready, focusScene]);

  const generateScene = useCallback(async (request: MiaSceneRequest) => {
    const validated = miaSceneRequestSchema.safeParse(request);
    if (!validated.success) return;
    const nextRequest = validated.data;
    const preview = buildFallbackMiaScene(nextRequest);
    const requestSequence = requestSequenceRef.current + 1;
    requestSequenceRef.current = requestSequence;
    requestControllerRef.current?.abort();
    const controller = new AbortController();
    requestControllerRef.current = controller;
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, SCENE_REQUEST_TIMEOUT_MS);

    setDraftRequest(nextRequest);
    setCommittedRequest(nextRequest);
    setScene(preview);
    setSceneSource('curated');
    setBusy(true);
    setNotice('');
    persistScene({
      version: SCENE_STORAGE_VERSION,
      uiLanguage: nextRequest.uiLanguage,
      request: nextRequest,
      response: preview,
      source: 'curated',
    });
    focusScene();

    try {
      const response = await fetch('/api/mia/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nextRequest),
        signal: controller.signal,
      });
      if (!response.ok) throw new Error('scene unavailable');
      const decoded: unknown = await response.json();
      const nextResult = miaSceneResponseSchema.safeParse(decoded);
      if (!nextResult.success || !persistenceMatchesRequest(nextRequest, nextResult.data)) {
        throw new Error('invalid scene');
      }
      if (requestSequenceRef.current !== requestSequence) return;

      const source: SceneSource = response.headers.get('X-Mia-Scene-Source') === 'generated'
        ? 'generated'
        : 'curated';
      setCommittedRequest(nextRequest);
      setScene(nextResult.data);
      setSceneSource(source);
      setNotice(source === 'generated' ? '' : copy.unavailable);
      persistScene({
        version: SCENE_STORAGE_VERSION,
        uiLanguage: nextRequest.uiLanguage,
        request: nextRequest,
        response: nextResult.data,
        source,
      });
    } catch {
      if (requestSequenceRef.current !== requestSequence) return;
      // The curated preview is already displayed and safely persisted. A
      // network or provider failure should never replace it with an error UI.
      setNotice(timedOut ? copy.timedOut : copy.unavailable);
    } finally {
      window.clearTimeout(timeout);
      if (requestSequenceRef.current === requestSequence) {
        requestControllerRef.current = null;
        setBusy(false);
      }
    }
  }, [copy.timedOut, copy.unavailable, focusScene]);

  useEffect(() => {
    setCanSpeak('speechSynthesis' in window);
  }, []);

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const connection = (navigator as Navigator & {
      connection?: {
        saveData?: boolean;
        addEventListener?: (type: string, callback: () => void) => void;
        removeEventListener?: (type: string, callback: () => void) => void;
      };
    }).connection;
    const syncMotion = () => {
      const allowMotion = !query.matches && !connection?.saveData;
      setMotionMode(allowMotion ? 'on' : 'off');
      if (!allowMotion) setVideoPlaying(false);
    };

    syncMotion();
    query.addEventListener?.('change', syncMotion);
    connection?.addEventListener?.('change', syncMotion);
    return () => {
      query.removeEventListener?.('change', syncMotion);
      connection?.removeEventListener?.('change', syncMotion);
    };
  }, []);

  useEffect(() => {
    if (motionMode !== 'on') return;
    const video = videoRef.current;
    if (!video) return;
    if (!videoPlaying) {
      video.pause();
      return;
    }
    void video.play().catch(() => setVideoPlaying(false));
  }, [media.video, motionMode, videoPlaying]);

  useEffect(() => {
    const initializationKey = `${lang}:${window.location.search}`;
    if (initializedForRef.current === initializationKey) return;
    initializedForRef.current = initializationKey;
    requestSequenceRef.current += 1;
    requestControllerRef.current?.abort();
    requestControllerRef.current = null;
    setBusy(false);

    const params = new URLSearchParams(window.location.search);
    const linkedPlace = params.get('place')?.trim() ?? '';
    const linkedMoment = parseLinkedSituation(params.get('moment'));
    const hasSceneLink = params.has('place') || params.has('moment');
    if (hasSceneLink) {
      const destination = linkedPlace.length >= 2 && linkedPlace.length <= 80
        ? linkedPlace
        : DEFAULT_DESTINATION.destination;
      const guide = guideForDestination(destination);
      commitCuratedScene({
        destination,
        situation: linkedMoment ?? guide?.situation ?? DEFAULT_DESTINATION.situation,
        level: 'first-words',
        uiLanguage: lang,
      });
      return;
    }

    const stored = readStoredScene(lang);
    if (stored) {
      setDraftRequest(stored.request);
      setCommittedRequest(stored.request);
      setScene(stored.response);
      setSceneSource(stored.source);
      setNotice('');
      return;
    }

    commitCuratedScene(defaultRequest(lang), { focus: false, announce: false });
  }, [commitCuratedScene, lang]);

  useEffect(() => () => {
    requestSequenceRef.current += 1;
    requestControllerRef.current?.abort();
    window.speechSynthesis?.cancel();
  }, []);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (busy) return;
    void generateScene({
      ...draftRequest,
      destination: draftRequest.destination.trim(),
      uiLanguage: lang,
    });
  };

  const surprise = () => {
    if (busy) return;
    const destinationIndex = Math.floor(Math.random() * MIA_SCENE_DESTINATIONS.length);
    const situationIndex = Math.floor(Math.random() * situations.length);
    void generateScene({
      destination: MIA_SCENE_DESTINATIONS[destinationIndex],
      situation: situations[situationIndex].id,
      level: draftRequest.level,
      uiLanguage: lang,
    });
  };

  const selectDestination = (destination: string, situation: MiaSceneSituation) => {
    if (busy) return;
    commitCuratedScene({
      destination,
      situation,
      level: draftRequest.level,
      uiLanguage: lang,
    });
  };

  const speak = (text: string) => {
    if (!canSpeak) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = scene.speechLocale;
    utterance.rate = 0.82;
    window.speechSynthesis.speak(utterance);
  };

  const copyScene = async () => {
    const text = [
      `${scene.destination} · ${scene.language}`,
      scene.title,
      `${scene.phrase}${scene.pronunciation ? ` (${scene.pronunciation})` : ''}`,
      scene.translation,
      `${scene.reply}${scene.replyPronunciation ? ` (${scene.replyPronunciation})` : ''}`,
      scene.replyTranslation,
      scene.cultureNote,
      scene.mission,
    ].join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setNotice(copy.copied);
    } catch {
      setNotice(copy.copyUnavailable);
    }
  };

  const toggleVideo = () => {
    setVideoPlaying((playing) => !playing);
  };

  return (
    <section className="mia-scene-studio" id="scene-studio" aria-labelledby="mia-scene-title">
      <header className="mia-scene-studio__header">
        <div>
          <p className="mia-boho__section-label">{copy.label}</p>
          <h2 id="mia-scene-title">{copy.title}</h2>
        </div>
        <p>{copy.intro}</p>
      </header>

      <section className="mia-destinations" id="destinations" aria-labelledby="mia-destinations-title">
        <header>
          <div>
            <p className="mia-boho__section-label">{copy.destinationsLabel}</p>
            <h3 id="mia-destinations-title">{copy.destinationsTitle}</h3>
          </div>
          <p>{copy.destinationsIntro}</p>
        </header>
        <div className="mia-destinations__rail">
          {MIA_DESTINATION_GUIDES.map((guide) => {
            const active = activeGuide?.id === guide.id;
            return (
              <button
                type="button"
                className={active ? 'is-active' : ''}
                aria-pressed={active}
                onClick={() => selectDestination(guide.destination, guide.situation)}
                disabled={busy}
                key={guide.id}
              >
                <span className="mia-destinations__image" aria-hidden="true">
                  <Image src={guide.poster} alt="" fill sizes="(max-width: 700px) 78vw, 330px" />
                </span>
                <span className="mia-destinations__topline">
                  <span>{lang === 'ru' ? guide.placeRu : guide.place}</span>
                  {guide.featured ? <em>{copy.featured}</em> : null}
                </span>
                <strong>{guide.languages}</strong>
                <small>{lang === 'ru' ? guide.atmosphereRu : guide.atmosphere}</small>
                <span className="mia-destinations__enter">
                  {copy.enter} <MilaIcon name="arrow" size={15} />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <div className="mia-scene-studio__grid">
        <form
          className="mia-scene-studio__controls"
          onSubmit={submit}
          style={{
            backgroundImage: `linear-gradient(rgba(255, 250, 242, .93), rgba(255, 250, 242, .93)), url('${media.poster}')`,
          }}
        >
          <label className="mia-scene-studio__field">
            <span>{copy.destination}</span>
            <input
              value={draftRequest.destination}
              onChange={(event) => setDraftRequest((current) => ({
                ...current,
                destination: event.target.value,
              }))}
              list="mia-destination-options"
              placeholder={copy.destinationPlaceholder}
              minLength={2}
              maxLength={80}
              required
            />
            <datalist id="mia-destination-options">
              {MIA_SCENE_DESTINATIONS.map((place) => <option value={place} key={place} />)}
            </datalist>
          </label>

          <fieldset className="mia-scene-studio__moments">
            <legend>{copy.moment}</legend>
            <div>
              {situations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={draftRequest.situation === item.id ? 'is-active' : ''}
                  aria-pressed={draftRequest.situation === item.id}
                  onClick={() => setDraftRequest((current) => ({
                    ...current,
                    situation: item.id,
                  }))}
                >
                  {lang === 'ru' ? item.ru : item.en}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mia-scene-studio__field">
            <span>{copy.confidence}</span>
            <select
              value={draftRequest.level}
              onChange={(event) => setDraftRequest((current) => ({
                ...current,
                level: event.target.value as MiaSceneRequest['level'],
              }))}
            >
              {confidenceLevels.map((item) => (
                <option value={item.id} key={item.id}>{lang === 'ru' ? item.ru : item.en}</option>
              ))}
            </select>
          </label>

          <div className="mia-scene-studio__actions">
            <button
              className="mia-scene-studio__generate"
              type="submit"
              disabled={busy || draftRequest.destination.trim().length < 2}
            >
              <MilaIcon name="sparkle" size={18} />
              {busy ? copy.generating : copy.generate}
            </button>
            <button className="mia-scene-studio__surprise" type="button" onClick={surprise} disabled={busy}>
              {copy.surprise}
            </button>
          </div>
        </form>

        <article
          ref={sceneCardRef}
          className="mia-scene-card"
          aria-live="polite"
          aria-busy={busy}
          aria-labelledby="mia-current-scene-title"
          tabIndex={-1}
        >
          {motionMode === 'on' ? (
            <video
              ref={videoRef}
              key={media.video}
              className="mia-scene-card__media"
              autoPlay={videoPlaying}
              muted
              loop
              playsInline
              preload="metadata"
              poster={media.poster}
              style={{ objectPosition: media.position }}
              aria-hidden="true"
            >
              <source src={media.video} type="video/mp4" />
            </video>
          ) : (
            <Image
              key={media.poster}
              className="mia-scene-card__media"
              src={media.poster}
              alt=""
              fill
              sizes="(max-width: 960px) 100vw, 60vw"
              style={{ objectFit: 'cover', objectPosition: media.position }}
              aria-hidden="true"
            />
          )}
          <div className="mia-scene-card__shade" aria-hidden="true" />
          <div className="mia-scene-card__topline">
            <span>{copy.scene} · {sceneSource === 'generated' ? copy.generated : copy.curated}</span>
            <span>{scene.destination} · {scene.language}</span>
          </div>
          <div className="mia-scene-card__body">
            {activeGuide ? (
              <aside className="mia-scene-card__sense">
                <span>{copy.feel}</span>
                <strong>{lang === 'ru' ? activeGuide.atmosphereRu : activeGuide.atmosphere}</strong>
                <p>{lang === 'ru' ? activeGuide.cueRu : activeGuide.cue}</p>
              </aside>
            ) : null}
            <p>{scene.setting}</p>
            <h3 id="mia-current-scene-title">{scene.title}</h3>
            <div className="mia-scene-card__exchange">
              <section>
                <span>{copy.say}</span>
                <strong lang={scene.speechLocale}>{scene.phrase}</strong>
                {scene.pronunciation ? <small>{scene.pronunciation}</small> : null}
                <p>{scene.translation}</p>
              </section>
              <section>
                <span>{copy.hear}</span>
                <strong lang={scene.speechLocale}>{scene.reply}</strong>
                {scene.replyPronunciation ? <small>{scene.replyPronunciation}</small> : null}
                <p>{scene.replyTranslation}</p>
              </section>
            </div>
            <div className="mia-scene-card__notes">
              <p><span>{copy.culture}</span>{scene.cultureNote}</p>
              <p><span>{copy.mission}</span>{scene.mission}</p>
              <p><span>{copy.fromMia}</span>{copy.nextAction}</p>
            </div>
            <div className="mia-scene-card__buttons">
              <button type="button" onClick={() => speak(scene.phrase)} disabled={!canSpeak}>
                <MilaIcon name="volume" size={17} />{copy.listenPhrase}
              </button>
              <button type="button" onClick={() => speak(scene.reply)} disabled={!canSpeak}>
                <MilaIcon name="volume" size={17} />{copy.listenReply}
              </button>
              {motionMode === 'on' ? (
                <button type="button" onClick={toggleVideo} aria-pressed={videoPlaying}>
                  {videoPlaying ? copy.pauseVideo : copy.playVideo}
                </button>
              ) : null}
              <button type="button" onClick={copyScene}>
                <MilaIcon name="conversation" size={17} />{copy.copy}
              </button>
            </div>
          </div>
        </article>
      </div>
      {notice ? <p className="mia-scene-studio__notice" role="status">{notice}</p> : null}
    </section>
  );
}
