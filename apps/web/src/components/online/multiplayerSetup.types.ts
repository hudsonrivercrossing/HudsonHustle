export interface CreateRoomForm {
  hostName: string;
  playerCount: 2 | 3 | 4;
  configId: string;
  turnTimeLimitSeconds: number;
  botSeatIds: string[];
}

export type OnlineSetupStage = "gateway" | "create" | "join";
export type SetupFlowStep = 0 | 1 | 2 | 3;

export function getStepStatus(index: number, currentStep: SetupFlowStep): "current" | "complete" | "upcoming" {
  if (index < currentStep) return "complete";
  if (index === currentStep) return "current";
  return "upcoming";
}
