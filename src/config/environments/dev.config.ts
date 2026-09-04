import type { EnvironmentConfig } from "../types";

/** Dev environment — data only. Credentials via OCE_* env vars or .env. */
const devConfig: EnvironmentConfig = {
  baseUrl: "https://revance-loyalty-git-dev-revances-projects.vercel.app",
  otp: "",
  oceBaseUrl:
    "https://revance-oce--parcopy.sandbox.my.site.com/s/login/?ec=302&startURL=%2Fs%2F",
  oceBaseUrlnew: "https://revance-oce--fulldev.sandbox.my.site.com/s/login/",
  headlessUrl:
    "https://revance-oce--parcopy.sandbox.my.site.com/s/login/?ec=302&startURL=%2Fs%2F",
  cdpUrl: "https://revance-loyalty-git-dev-revances-projects.vercel.app/welcome",
  oceUsername: process.env.OCE_USERNAME?.trim() || "",
  ocePassword: process.env.OCE_PASSWORD?.trim() || "",
  ocePractice: process.env.OCE_PRACTICE?.trim() || "Pleasanton Dermatology",
  oceLocation: process.env.OCE_LOCATION?.trim() || "Pleasanton - CA",
  // Teammate's dev deployment — update if your local Convex project differs.
  convexDeployment: "industrious-trout-712",
};

export default devConfig;
