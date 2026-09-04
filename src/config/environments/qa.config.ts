import type { EnvironmentConfig } from "../types";

/** QA environment — data only. Credentials via OCE_* env vars or .env. */
const qaConfig: EnvironmentConfig = {
  baseUrl: "https://revance-loyalty-env-qa-revances-projects.vercel.app",
  otp: "112233",
  oceBaseUrl: "https://revance-oce--fulldev.sandbox.my.site.com/s/login/",
  oceBaseUrlnew: "https://revance-oce--fulldev.sandbox.my.site.com/s/login/",
  headlessUrl: "https://revance-oce--fulldev.sandbox.my.site.com/s/login/",
  cdpUrl: "https://revance-loyalty-env-qa-revances-projects.vercel.app/welcome",
  oceUsername: process.env.OCE_USERNAME?.trim() || "",
  ocePassword: process.env.OCE_PASSWORD?.trim() || "",
  ocePractice: process.env.OCE_PRACTICE?.trim() || "Pleasanton Dermatology",
  oceLocation: process.env.OCE_LOCATION?.trim() || "Pleasanton - CA",
  // TODO: set from Convex dashboard → QA deployment name (Settings → deployment slug).
  convexDeployment: "dev/abhimanu-sharma",
};

export default qaConfig;
