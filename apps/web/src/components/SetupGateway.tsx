interface SetupGatewayProps {
  onChooseLocal: () => void;
  onChooseOnline: () => void;
}

export function SetupGateway({ onChooseLocal, onChooseOnline }: SetupGatewayProps): JSX.Element {
  const setupHeroVideoUrl = import.meta.env.VITE_SETUP_HERO_VIDEO_URL?.trim() ?? "";

  return (
    <main className="setup-gateway">
      <div className="setup-gateway__media" aria-hidden="true">
        <div className="setup-gateway__fallback" />
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

      <section className="setup-gateway__panel">
        <div className="setup-gateway__intro">
          <h1>Hudson Hustle</h1>
        </div>

        <div className="setup-gateway__choices">
          <button
            type="button"
            className="setup-gateway__choice setup-gateway__choice--local"
            onClick={onChooseLocal}
            data-testid="gateway-local"
            aria-label="Choose Local mode"
          >
            <strong className="setup-gateway__choice-title">Local</strong>
          </button>

          <button
            type="button"
            className="setup-gateway__choice setup-gateway__choice--online"
            onClick={onChooseOnline}
            data-testid="gateway-online"
            aria-label="Choose Online mode"
          >
            <strong className="setup-gateway__choice-title">Online</strong>
          </button>
        </div>
      </section>
    </main>
  );
}
