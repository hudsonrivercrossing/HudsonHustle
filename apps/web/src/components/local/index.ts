export { HandoffModal } from "./HandoffModal";
export {
  LOCAL_SAVE_KEY,
  botPlayerIdsFromSavedGame,
  botPlayerIdsFromSeatIds,
  configIdForSavedMap,
  type LocalStartSetup,
  type VisibilityMode
} from "./localGame.utils";
export {
  readLastLocalSetup,
  readLocalSaveMeta,
  saveLastLocalSetup,
  saveLocalSaveMeta,
  type LastLocalSetup,
  type LocalSaveMeta
} from "./localSetupStorage";
export { useLocalGame } from "./useLocalGame";
export { isBotTurn, type LocalSession } from "./localSession";
