import { Component, type ErrorInfo, type ReactNode } from "react";
import { storageRemove } from "./safeStorage";

/** The local game and its settings, as written by local play. A broken save is the likeliest cause of a crash on resume. */
const LOCAL_SAVE_KEYS = ["hudson-hustle-save-v1", "hudson-hustle-save-meta-v1"];

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/** Catches a crash anywhere in the app and offers a way out instead of a blank page. */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render(): ReactNode {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }
    return (
      <main className="crash-screen" role="alert">
        <h1 className="crash-screen__title">The game hit a problem</h1>
        <p className="crash-screen__copy">Reloading usually fixes it. An online seat is kept, so you can rejoin your room after a reload.</p>
        <div className="crash-screen__actions">
          <button type="button" className="system-button primary-button" onClick={() => window.location.reload()}>
            <span className="system-button__content">Reload</span>
          </button>
          <button type="button" className="system-button secondary-button" onClick={() => window.location.assign("/")}>
            <span className="system-button__content">Back to start</span>
          </button>
        </div>
        <button
          type="button"
          className="crash-screen__discard"
          onClick={() => {
            LOCAL_SAVE_KEYS.forEach(storageRemove);
            window.location.assign("/");
          }}
        >
          Still broken? Discard the saved local game and start over
        </button>
        {import.meta.env.DEV ? (
          <details className="crash-screen__details">
            <summary>{error.message}</summary>
            <pre>{error.stack}</pre>
          </details>
        ) : null}
      </main>
    );
  }
}
