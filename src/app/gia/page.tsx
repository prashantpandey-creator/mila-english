import Image from 'next/image';
import Link from 'next/link';
import './gia-home.css';

export default function GiaHomePage() {
  return (
    <main className="gia-home">
      <div className="gia-home__glow gia-home__glow--rose" aria-hidden="true" />
      <div className="gia-home__glow gia-home__glow--teal" aria-hidden="true" />

      <nav className="gia-home__nav" aria-label="Gia">
        <Link className="gia-home__brand" href="/" aria-label="Gia home">
          <span className="gia-home__brand-mark" aria-hidden="true">G</span>
          <span>Gia</span>
        </Link>
        <div className="gia-home__nav-actions">
          <Link className="gia-home__nav-link" href="/login?returnTo=%2Fchat">Sign in</Link>
          <Link className="gia-home__nav-cta" href="/register?returnTo=%2Fchat">Create account</Link>
        </div>
      </nav>

      <section className="gia-home__hero">
        <div className="gia-home__copy">
          <p className="gia-home__eyebrow">
            <span aria-hidden="true" />
            AI companion · voice + text
          </p>
          <h1>Meet Gia.</h1>
          <p className="gia-home__lede">
            A conversation with a little more gravity. Gia listens closely,
            follows your pace, and lets the moment unfold—in any language.
          </p>

          <div className="gia-home__actions">
            <Link className="gia-home__button gia-home__button--primary" href="/live">
              <span className="gia-home__button-icon" aria-hidden="true">
                <span />
                <span />
                <span />
              </span>
              Enter Live voice
            </Link>
            <Link className="gia-home__button gia-home__button--secondary" href="/chat">
              Start text chat
              <span aria-hidden="true">↗</span>
            </Link>
          </div>

          <div className="gia-home__modes" aria-label="Ways to talk with Gia">
            <div>
              <span className="gia-home__mode-index">01</span>
              <p><strong>Live</strong> · A slower, more intimate voice conversation.</p>
            </div>
            <div>
              <span className="gia-home__mode-index">02</span>
              <p><strong>Text</strong> · The same Gia, whenever writing feels easier.</p>
            </div>
          </div>
        </div>

        <div className="gia-home__portrait-column">
          <div className="gia-home__portrait-shell">
            <div className="gia-home__portrait-orbit" aria-hidden="true" />
            <div className="gia-home__portrait">
              <Image
                src="/avatar/presences/mila-v3/avatar.webp"
                alt="Gia, a fictional AI companion portrait"
                fill
                priority
                sizes="(max-width: 800px) 82vw, 42vw"
              />
              <div className="gia-home__portrait-shade" aria-hidden="true" />
            </div>
            <div className="gia-home__presence">
              <span aria-hidden="true" />
              Gia is here
            </div>
          </div>
          <p className="gia-home__disclosure">
            Fictional AI presence · Voice starts only when you choose it
          </p>
        </div>
      </section>
    </main>
  );
}
