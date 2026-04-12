interface SetupGatewayProps {
  onChooseLocal: () => void;
  onChooseOnline: () => void;
}

export function SetupGateway({ onChooseLocal, onChooseOnline }: SetupGatewayProps): JSX.Element {
  const setupHeroVideoUrl = import.meta.env.VITE_SETUP_HERO_VIDEO_URL?.trim() ?? "";
  const setupHeroImageUrl = "/setup/landing-bg.png";

  return (
    <main className="setup-gateway">
      <div className="setup-gateway__media" aria-hidden="true">
        <div
          className="setup-gateway__fallback"
          style={{
            ["--setup-gateway-image" as string]: `url("${setupHeroImageUrl}")`
          }}
        />
        {setupHeroVideoUrl ? (
          <video
            className="setup-gateway__video"
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
          >
            <source src={setupHeroVideoUrl} type="video/mp4" />
          </video>
        ) : null}
      </div>
      <div className="setup-gateway__veil" aria-hidden="true" />

      <section className="setup-gateway__content">
        <div className="setup-gateway__masthead">
          <p className="setup-gateway__eyebrow">NYC / NJ transit strategy</p>
          <h1>Hudson Hustle</h1>
          <p className="setup-gateway__lead">Choose your line.</p>
        </div>

        <div className="setup-gateway__choice-band">
          <button
            type="button"
            className="setup-gateway__choice setup-gateway__choice--local"
            onClick={onChooseLocal}
            data-testid="gateway-local"
            aria-label="Choose Local mode"
          >
            <strong className="setup-gateway__choice-title">Local</strong>
            <span className="setup-gateway__choice-meta">One screen</span>
          </button>

          <button
            type="button"
            className="setup-gateway__choice setup-gateway__choice--online"
            onClick={onChooseOnline}
            data-testid="gateway-online"
            aria-label="Choose Online mode"
          >
            <strong className="setup-gateway__choice-title">Online</strong>
            <span className="setup-gateway__choice-meta">Room code</span>
          </button>
        </div>
      </section>
    </main>
  );
}
