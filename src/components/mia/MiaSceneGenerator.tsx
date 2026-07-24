'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import MilaIcon from '@/components/ui/MilaIcon';
import {
  MIA_DESTINATION_GUIDES,
  MIA_SCENE_DESTINATIONS,
  MIA_SCENE_MEDIA,
  buildFallbackMiaScene,
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

export default function MiaSceneGenerator({ lang }: { lang: 'en' | 'ru' }) {
  const [destination, setDestination] = useState(DEFAULT_DESTINATION.destination);
  const [situation, setSituation] = useState<MiaSceneSituation>(DEFAULT_DESTINATION.situation);
  const [level, setLevel] = useState<MiaSceneRequest['level']>('first-words');
  const [scene, setScene] = useState<MiaSceneResponse>(() => buildFallbackMiaScene({
    destination: DEFAULT_DESTINATION.destination,
    situation: DEFAULT_DESTINATION.situation,
    level: 'first-words',
    uiLanguage: lang,
  }));
  const [busy, setBusy] = useState(false);
  const [sceneSource, setSceneSource] = useState<'generated' | 'curated'>('curated');
  const [notice, setNotice] = useState('');
  const [canSpeak, setCanSpeak] = useState(false);

  const copy = lang === 'ru'
    ? {
        label: 'MIA SCENE STUDIO',
        title: 'Окажись внутри момента.',
        intro: 'Выбери место и ситуацию. Mia создаст живую сцену: что сказать, что ты услышишь в ответ и какой культурный нюанс поможет.',
        destination: 'Куда ты едешь?',
        destinationPlaceholder: 'Например, Лиссабон',
        moment: 'Какой момент?',
        confidence: 'Насколько уверенно?',
        generate: 'Создать мою сцену',
        generating: 'Переносим тебя туда…',
        surprise: 'Удиви меня',
        scene: 'ТВОЯ СЦЕНА',
        generated: 'СОЗДАНО ДЛЯ ТЕБЯ',
        curated: 'НАДЁЖНАЯ СЦЕНА',
        say: 'Скажи это',
        hear: 'Ты можешь услышать',
        culture: 'Между строк',
        mission: 'Твой ход',
        listen: 'Послушать',
        copy: 'Скопировать сцену',
        copied: 'Сцена скопирована',
        unavailable: 'Сейчас показываем надёжную офлайн-сцену. Можно продолжать.',
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
        intro: 'Choose a place and situation. Mia builds the scene: what to say, what may come back, and the cultural cue that changes the exchange.',
        destination: 'Where are you going?',
        destinationPlaceholder: 'Try Lisbon',
        moment: 'What kind of moment?',
        confidence: 'How confident do you feel?',
        generate: 'Generate my scene',
        generating: 'Taking you there…',
        surprise: 'Surprise me',
        scene: 'YOUR SCENE',
        generated: 'GENERATED FOR YOU',
        curated: 'CURATED FALLBACK',
        say: 'Say this',
        hear: 'You may hear',
        culture: 'Between the lines',
        mission: 'Your move',
        listen: 'Hear it',
        copy: 'Copy scene',
        copied: 'Scene copied',
        unavailable: 'Showing a reliable offline scene for now. You can keep going.',
        destinationsLabel: 'PLACES PEOPLE ARE EXPLORING',
        destinationsTitle: 'Choose a place. Feel its rhythm.',
        destinationsIntro: 'Every destination opens with atmosphere, language, and one small local cue—not a generic list of words.',
        featured: 'Featured',
        enter: 'Enter',
        feel: 'Feel the place',
      };

  const media = useMemo(() => MIA_SCENE_MEDIA[scene.visual], [scene.visual]);
  const activeGuide = useMemo(() => {
    const normalized = destination.toLocaleLowerCase('en');
    return MIA_DESTINATION_GUIDES.find((guide) => (
      normalized.includes(guide.destination.toLocaleLowerCase('en'))
      || normalized.includes(guide.id)
    ));
  }, [destination]);

  useEffect(() => {
    setCanSpeak('speechSynthesis' in window);
    try {
      const saved = window.localStorage.getItem('mia:last-scene');
      if (!saved) return;
      const parsed = JSON.parse(saved) as MiaSceneResponse;
      if (parsed && typeof parsed.phrase === 'string' && typeof parsed.destination === 'string' && parsed.visual in MIA_SCENE_MEDIA) {
        setScene(parsed);
        setDestination(parsed.destination);
      }
    } catch {
      // A corrupt local draft should never block the studio.
    }
  }, []);

  const createScene = async (overrides?: Partial<Pick<MiaSceneRequest, 'destination' | 'situation'>>) => {
    const requestedDestination = overrides?.destination?.trim() || destination.trim();
    const requestedSituation = overrides?.situation || situation;
    if (requestedDestination.length < 2 || busy) return;

    setDestination(requestedDestination);
    setSituation(requestedSituation);
    setBusy(true);
    setNotice('');
    const request: MiaSceneRequest = {
      destination: requestedDestination,
      situation: requestedSituation,
      level,
      uiLanguage: lang,
    };
    const preview = buildFallbackMiaScene(request);

    setScene(preview);
    setSceneSource('curated');
    try {
      const response = await fetch('/api/mia/scene', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!response.ok) throw new Error('scene unavailable');
      const next = await response.json() as MiaSceneResponse;
      if (!next?.phrase || !next?.destination || !(next.visual in MIA_SCENE_MEDIA)) throw new Error('invalid scene');
      setScene(next);
      setSceneSource(response.headers.get('X-Mia-Scene-Source') === 'generated' ? 'generated' : 'curated');
      window.localStorage.setItem('mia:last-scene', JSON.stringify(next));
    } catch {
      const fallback = buildFallbackMiaScene(request);
      setScene(fallback);
      setSceneSource('curated');
      window.localStorage.setItem('mia:last-scene', JSON.stringify(fallback));
      setNotice(copy.unavailable);
    } finally {
      setBusy(false);
    }
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    void createScene();
  };

  const surprise = () => {
    const destinationIndex = Math.floor(Math.random() * MIA_SCENE_DESTINATIONS.length);
    const situationIndex = Math.floor(Math.random() * situations.length);
    void createScene({
      destination: MIA_SCENE_DESTINATIONS[destinationIndex],
      situation: situations[situationIndex].id,
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
      setNotice(copy.unavailable);
    }
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
                onClick={() => void createScene({
                  destination: guide.destination,
                  situation: guide.situation,
                })}
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
              value={destination}
              onChange={(event) => setDestination(event.target.value)}
              list="mia-destinations"
              placeholder={copy.destinationPlaceholder}
              minLength={2}
              maxLength={80}
              required
            />
            <datalist id="mia-destinations">
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
                  className={situation === item.id ? 'is-active' : ''}
                  aria-pressed={situation === item.id}
                  onClick={() => setSituation(item.id)}
                >
                  {lang === 'ru' ? item.ru : item.en}
                </button>
              ))}
            </div>
          </fieldset>

          <label className="mia-scene-studio__field">
            <span>{copy.confidence}</span>
            <select value={level} onChange={(event) => setLevel(event.target.value as MiaSceneRequest['level'])}>
              {confidenceLevels.map((item) => (
                <option value={item.id} key={item.id}>{lang === 'ru' ? item.ru : item.en}</option>
              ))}
            </select>
          </label>

          <div className="mia-scene-studio__actions">
            <button className="mia-scene-studio__generate" type="submit" disabled={busy || destination.trim().length < 2}>
              <MilaIcon name="sparkle" size={18} />
              {busy ? copy.generating : copy.generate}
            </button>
            <button className="mia-scene-studio__surprise" type="button" onClick={surprise} disabled={busy}>
              {copy.surprise}
            </button>
          </div>
        </form>

        <article className="mia-scene-card" aria-live="polite" aria-busy={busy}>
          <video
            key={media.video}
            className="mia-scene-card__media"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster={media.poster}
            style={{ objectPosition: media.position }}
          >
            <source src={media.video} type="video/mp4" />
          </video>
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
            <h3>{scene.title}</h3>
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
            </div>
            <div className="mia-scene-card__buttons">
              <button type="button" onClick={() => speak(scene.phrase)} disabled={!canSpeak}>
                <MilaIcon name="volume" size={17} />{copy.listen}
              </button>
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
