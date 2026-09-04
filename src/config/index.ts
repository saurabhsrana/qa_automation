export {
  DEFAULT_TEST_ENV,
  getEnvironmentConfig,
  logEnvironmentStartup,
  resolveTestEnvironment,
} from "./environmentResolver";
export type {
  EnvironmentConfig,
  ResolvedEnvironmentConfig,
  TestEnvironment,
} from "./types";

import { getEnvironmentConfig } from "./environmentResolver";

/** @deprecated Prefer getEnvironmentConfig() — default export kept for existing imports. */
export default getEnvironmentConfig();
