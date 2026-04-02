import currentPointer from "../../../configs/hudson-hustle/current.json" with { type: "json" };
import type { CurrentConfigPointer, RegisteredConfigBundle } from "./config-types.js";
import { generatedHudsonHustleConfigRegistry } from "./generated-config-registry.js";

const pointer = currentPointer as CurrentConfigPointer;
const registry = generatedHudsonHustleConfigRegistry as Record<string, RegisteredConfigBundle>;
const activeConfig = registry[pointer.activeConfigId];

if (!activeConfig) {
  throw new Error(`Unknown Hudson Hustle config id: ${pointer.activeConfigId}`);
}

if (activeConfig.configPath !== pointer.activeConfigPath) {
  throw new Error(
    `Hudson Hustle current.json path mismatch for ${pointer.activeConfigId}: expected ${activeConfig.configPath}, received ${pointer.activeConfigPath}`
  );
}

if (activeConfig.mode !== pointer.mode) {
  throw new Error(
    `Hudson Hustle current.json mode mismatch for ${pointer.activeConfigId}: expected ${activeConfig.mode}, received ${pointer.mode}`
  );
}

export const hudsonHustleCurrentPointer = pointer;
export const hudsonHustleConfigRegistry = registry;
export const activeHudsonHustleConfig = activeConfig;
