import { spawnSync } from "node:child_process";
import path from "node:path";
import { getEnvironmentConfig } from "../config/environmentResolver";

/** Enrollment flow requires this Convex env var during test execution. */
export const ENROLLMENT_AUTOMATION_FLAG = "FEATURE_AUTOMATION_ENABLED";

const CONVEX_CLI = path.join(
  process.cwd(),
  "node_modules",
  "convex",
  "bin",
  "main.js",
);
const UNKNOWN_EXIT = "unknown";
const UNKNOWN_ERROR = "unknown error";

function resolveDeploymentLabel(): string {
  const config = getEnvironmentConfig();
  const fromEnv = process.env.CONVEX_DEPLOYMENT?.trim();
  const deployment = fromEnv || config.convexDeployment.trim();

  if (!deployment) {
    throw new Error(
      `[convex] Deployment is not configured for TEST_ENV=${config.env}. ` +
        `Set convexDeployment in src/config/environments/${config.env}.config.ts ` +
        `or CONVEX_DEPLOYMENT in .env (Convex dashboard → deployment name, e.g. industrious-trout-712).`,
    );
  }

  return deployment;
}

/**
 * Env passed to the Convex CLI.
 *
 * Auth (per Convex docs):
 * - Local: `npx convex login` (interactive) — no CONVEX_DEPLOY_KEY required.
 * - CI/scripts: set CONVEX_DEPLOY_KEY — CLI auto-detects it (no separate flag).
 *   https://docs.convex.dev/cli/deploy-key-types
 *
 * Target deployment: `--deployment <name>` on each command, plus CONVEX_DEPLOYMENT
 * for local sessions. When CONVEX_DEPLOY_KEY is set, it must belong to the same
 * deployment as convexDeployment / CONVEX_DEPLOYMENT or CLI calls will fail.
 */
function convexProcessEnv(): NodeJS.ProcessEnv {
  const deployment = resolveDeploymentLabel();
  return {
    ...process.env,
    CONVEX_DEPLOYMENT: deployment,
  };
}

function formatCliFailure(
  operation: string,
  deployment: string,
  status: number | null,
  detail: string,
): string {
  return `[convex] ${operation} failed on ${deployment} (exit ${status ?? UNKNOWN_EXIT}): ${detail || UNKNOWN_ERROR}`;
}

function runConvexCli(
  args: string[],
  operation: string,
): { stdout: string; stderr: string; status: number | null } {
  const deployment = resolveDeploymentLabel();
  const cliArgs = [...args, "--deployment", deployment];

  const result = spawnSync(process.execPath, [CONVEX_CLI, ...cliArgs], {
    cwd: process.cwd(),
    env: convexProcessEnv(),
    encoding: "utf8",
  });

  if (result.error) {
    throw new Error(
      `[convex] ${operation} failed to spawn CLI on ${deployment}: ${result.error.message}`,
    );
  }

  return {
    stdout: (result.stdout ?? "").trim(),
    stderr: (result.stderr ?? "").trim(),
    status: result.status,
  };
}

function isUnsetVariableError(stderr: string, stdout: string): boolean {
  const combined = `${stderr}\n${stdout}`;
  return /not found|does not exist|no environment variable|is not set/i.test(
    combined,
  );
}

/** Reads the current Convex env var value via the Convex CLI `env get`. */
export async function getFeatureFlag(name: string): Promise<string> {
  const deployment = resolveDeploymentLabel();
  const { stdout, stderr, status } = runConvexCli(
    ["env", "get", name],
    `getFeatureFlag(${name})`,
  );

  if (status === 0) {
    return stdout;
  }

  if (isUnsetVariableError(stderr, stdout)) {
    return "";
  }

  throw new Error(
    formatCliFailure(
      `getFeatureFlag(${name})`,
      deployment,
      status,
      stderr || stdout,
    ),
  );
}

/** Sets a Convex env var via the Convex CLI `env set`. */
export async function setFeatureFlag(
  name: string,
  value: string,
): Promise<void> {
  const deployment = resolveDeploymentLabel();
  const { stderr, status } = runConvexCli(
    ["env", "set", name, value],
    `setFeatureFlag(${name})`,
  );

  if (status !== 0) {
    throw new Error(
      formatCliFailure(
        `setFeatureFlag(${name}=${value})`,
        deployment,
        status,
        stderr,
      ),
    );
  }
}

/** Unsets a Convex env var via the Convex CLI `env remove` (restore prior unset state). */
export async function removeFeatureFlag(name: string): Promise<void> {
  const deployment = resolveDeploymentLabel();
  const { stderr, status } = runConvexCli(
    ["env", "remove", name],
    `removeFeatureFlag(${name})`,
  );

  if (status !== 0) {
    throw new Error(
      formatCliFailure(
        `removeFeatureFlag(${name})`,
        deployment,
        status,
        stderr,
      ),
    );
  }
}

/**
 * Enables FEATURE_AUTOMATION_ENABLED for an enrollment test scope.
 * Returns restore() — must run in finally/teardown (pass or fail).
 */
export async function enableEnrollmentAutomationForRun(): Promise<{
  originalValue: string;
  restore: () => Promise<void>;
}> {
  const deployment = resolveDeploymentLabel();
  const originalValue = await getFeatureFlag(ENROLLMENT_AUTOMATION_FLAG);

  console.warn(
    `Setting ${ENROLLMENT_AUTOMATION_FLAG}=true on ${deployment} before enrollment tests (original=${originalValue || "(unset)"})`,
  );
  await setFeatureFlag(ENROLLMENT_AUTOMATION_FLAG, "true");

  return {
    originalValue,
    restore: async () => {
      if (originalValue === "") {
        console.warn(
          `Restored ${ENROLLMENT_AUTOMATION_FLAG}=(unset) on ${deployment} after enrollment tests`,
        );
        await removeFeatureFlag(ENROLLMENT_AUTOMATION_FLAG);
        return;
      }

      console.warn(
        `Restored ${ENROLLMENT_AUTOMATION_FLAG}=${originalValue} on ${deployment} after enrollment tests`,
      );
      await setFeatureFlag(ENROLLMENT_AUTOMATION_FLAG, originalValue);
    },
  };
}
