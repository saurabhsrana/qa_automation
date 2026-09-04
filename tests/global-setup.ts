import { logEnvironmentStartup } from "../src/config/environmentResolver";

export default async function globalSetup(): Promise<void> {
  logEnvironmentStartup();
}
