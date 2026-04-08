import {
  cardColorPalette,
  hudsonHustleBackdrop,
  hudsonHustleCurrentBackdropMode,
  hudsonHustleCurrentBoardLabelMode,
  hudsonHustleMap,
  playerColorPalette
} from "@hudson-hustle/game-data";
import { BoardMap } from "./BoardMap";

interface SetupGatewayProps {
  onChooseLocal: () => void;
  onChooseOnline: () => void;
}

const gatewayPreviewGame = {
  players: [{ id: "gateway-preview", name: "Preview", color: "red" }],
  activePlayerIndex: 0,
  routeClaims: [],
  stations: []
};

export function SetupGateway({ onChooseLocal, onChooseOnline }: SetupGatewayProps): JSX.Element {
  return (
    <main className="setup-gateway">
      <div className="setup-gateway__map" aria-hidden="true">
        <BoardMap
          config={hudsonHustleMap}
          backdrop={hudsonHustleBackdrop}
          backdropMode={hudsonHustleCurrentBackdropMode}
          boardLabelMode={hudsonHustleCurrentBoardLabelMode}
          cardPalette={cardColorPalette}
          playerPalette={playerColorPalette}
          viewerPlayerId={null}
          game={gatewayPreviewGame}
          selectedRouteId={null}
          selectedCityId={null}
          onSelectRoute={() => undefined}
          onSelectCity={() => undefined}
        />
      </div>
      <div className="setup-gateway__veil" aria-hidden="true" />

      <section className="setup-gateway__panel">
        <div className="setup-gateway__intro">
          <p className="eyebrow">New York / New Jersey strategy board</p>
          <h1>Hudson Hustle</h1>
          <p className="setup-gateway__copy">
            Choose one shared laptop or one device per player. The route map stays front and center; setup comes after the mode decision.
          </p>
        </div>

        <div className="setup-gateway__choices">
          <button
            type="button"
            className="setup-gateway__choice setup-gateway__choice--local"
            onClick={onChooseLocal}
            data-testid="gateway-local"
          >
            <span className="setup-gateway__choice-eyebrow">Shared laptop</span>
            <strong className="setup-gateway__choice-title">Local</strong>
            <span className="setup-gateway__choice-copy">Pass-and-play on one computer, with hidden handoff moments between turns.</span>
          </button>

          <button
            type="button"
            className="setup-gateway__choice setup-gateway__choice--online"
            onClick={onChooseOnline}
            data-testid="gateway-online"
          >
            <span className="setup-gateway__choice-eyebrow">Separate devices</span>
            <strong className="setup-gateway__choice-title">Online</strong>
            <span className="setup-gateway__choice-copy">Create a room, share a code, and let the server hold the authoritative game state.</span>
          </button>
        </div>
      </section>
    </main>
  );
}
