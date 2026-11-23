import { useCallback, useEffect, useRef, useState } from "react";
import { useRoute } from "./app/routes";
import { useOnlineRoom } from "./components/online/useOnlineRoom";
import { GuidebookScreen } from "./components/screens/GuidebookScreen";
import { LobbyScreen } from "./components/screens/LobbyScreen";
import { LocalPlayScreen } from "./components/screens/LocalPlayScreen";
import { OnlineGameScreen } from "./components/screens/OnlineGameScreen";
import { OnlineSetupScreen } from "./components/screens/OnlineSetupScreen";
import { SetupGateway } from "./components/screens/SetupGateway";
import type { GameplayNotification } from "./components/ui/game";

const NOTICE_LIFETIME_MS = 4000;

const realtimeMessages = {
  connecting: "Realtime connection is still being established. Ready and start stay disabled until the live room link is confirmed.",
  failed: "Realtime connection failed. Seat presence and ready/start controls are disabled until the live room link recovers.",
  idle: null,
  subscribed: null
} as const;

/** Chooses the screen for the current address and room state. Screens own everything else. */
export default function App(): JSX.Element {
  const [route, navigate] = useRoute();
  const [notices, setNotices] = useState<GameplayNotification[]>([]);
  const noticeIdRef = useRef(0);

  const showNotice = useCallback((message: string, tone: "warning" | "success") => {
    noticeIdRef.current += 1;
    const id = `notice-${noticeIdRef.current}`;
    setNotices((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setNotices((current) => current.filter((notice) => notice.id !== id)), NOTICE_LIFETIME_MS);
  }, []);

  // A saved seat is picked up again unless the address asks for something that is not online play.
  const room = useOnlineRoom({
    reconnectOnMount: route.name !== "local" && route.name !== "guide",
    onNotice: showNotice
  });
  const { snapshot, credentials } = room;
  const roomCode = credentials?.roomCode ?? null;

  // Being seated in a room puts its code in the address, so the link can be shared.
  useEffect(() => {
    if (roomCode) {
      navigate({ name: "room", roomCode }, { replace: true });
    }
  }, [navigate, roomCode]);

  // A reconnect attempt belongs to online setup, where its progress and any failure are shown.
  useEffect(() => {
    if (room.reconnectState === "attempting-reconnect" && route.name === "gateway") {
      navigate({ name: "online" }, { replace: true });
    }
    // Only a change in reconnect state should move the player; later visits to the gateway are their own choice.
  }, [room.reconnectState]);

  async function leaveRoom() {
    if (await room.leaveRoom()) {
      navigate({ name: "gateway" });
    }
  }

  if (snapshot && credentials) {
    const playerId = snapshot.privateState?.playerId;
    if (snapshot.room.status === "lobby" || !snapshot.game || !playerId) {
      return (
        <LobbyScreen
          room={snapshot.room}
          localSeatId={credentials.seatId}
          onReadyChange={room.sendReady}
          onStart={() => void room.startRoom()}
          onLeaveRoom={() => void leaveRoom()}
          timer={room.timer}
          isStarting={room.pendingRequest === "start"}
          error={room.error}
          realtimeReady={room.realtimeStatus === "subscribed"}
          realtimeMessage={realtimeMessages[room.realtimeStatus]}
        />
      );
    }
    return (
      <OnlineGameScreen
        room={room}
        snapshot={{ ...snapshot, game: snapshot.game }}
        playerId={playerId}
        notices={notices}
        onLeave={() => void leaveRoom()}
      />
    );
  }

  if (route.name === "guide") {
    return <GuidebookScreen onBack={() => navigate({ name: "gateway" })} />;
  }

  if (route.name === "local") {
    return <LocalPlayScreen onReturnToGateway={() => navigate({ name: "gateway" })} />;
  }

  if (route.name === "gateway") {
    return (
      <SetupGateway
        onChooseLocal={() => navigate({ name: "local" })}
        onChooseOnline={() => {
          room.clearError();
          navigate({ name: "online" });
        }}
        onOpenGuide={() => navigate({ name: "guide" })}
      />
    );
  }

  return (
    <OnlineSetupScreen
      releasedConfigs={room.releasedConfigs}
      reconnectState={room.reconnectState}
      roomPreview={room.roomPreview}
      error={room.error}
      isCreatingRoom={room.isCreatingRoom}
      pendingRequest={room.pendingRequest}
      initialJoinRoomCode={route.name === "room" ? route.roomCode : undefined}
      onOpenLocal={() => {
        room.clearError();
        navigate({ name: "local" });
      }}
      onBack={() => {
        room.clearError();
        navigate({ name: "gateway" });
      }}
      onClearRoomPreview={room.clearRoomPreview}
      onPreviewRoom={(code) => void room.previewRoom(code)}
      onCreateRoom={(form) => void room.createRoom(form)}
      onJoinRoom={(form) => void room.joinRoom(form)}
    />
  );
}
