import type { EnvironmentConfig } from "../types";

/** UAT environment — data only. Credentials via OCE_* env vars or .env. */
const uatConfig: EnvironmentConfig = {
  baseUrl: "https://revance-loyalty-uat.vercel.app",
  otp: "112233",
  oceBaseUrl: "https://revance-oce--fulluat.sandbox.my.site.com/s/login/",
  oceBaseUrlnew: "https://revance-oce--fulluat.sandbox.my.site.com/s/login/",
  headlessUrl: "https://revance-oce--fulluat.sandbox.my.site.com/s/login/",
  cdpUrl: "https://revance-loyalty-uat.vercel.app/welcome",
  oceUsername: process.env.OCE_USERNAME?.trim() || "",
  ocePassword: process.env.OCE_PASSWORD?.trim() || "",
  ocePractice: process.env.OCE_PRACTICE?.trim() || "Dauwe Plastic Surgery",
  oceLocation: process.env.OCE_LOCATION?.trim() || "Dallas-TX-10707",
  // UAT Convex deployment slug — set when provisioned, or override via CONVEX_DEPLOYMENT in .env.
  convexDeployment: "secret-nightingale-707",
};

export default uatConfig;
