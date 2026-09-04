/** Allowed values for process.env.TEST_ENV */
export type TestEnvironment = "dev" | "qa" | "uat";

/** Data-only environment profile — every env file must satisfy this shape. */
export interface EnvironmentConfig {
  baseUrl: string;
  otp: string;
  oceBaseUrl: string;
  oceBaseUrlnew: string;
  headlessUrl: string;
  cdpUrl: string;
  oceUsername: string;
  ocePassword: string;
  ocePractice: string;
  oceLocation: string;
  /** Convex deployment name (dashboard slug, e.g. industrious-trout-712). */
  convexDeployment: string;
}

/** Resolved config returned to tests (includes selector metadata). */
export interface ResolvedEnvironmentConfig extends EnvironmentConfig {
  env: TestEnvironment;
  /** baseUrl from the selected env file before BASE_URL override. */
  defaultBaseUrl: string;
  /** True when process.env.BASE_URL overrides the env file default. */
  baseUrlOverrideActive: boolean;
}
