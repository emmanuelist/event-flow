import z from "zod";
import type { AppConfig as ClientAppConfig } from "./client";
import clientConfig, { envSchema as clientEnvSchema } from "./client";

const envSchema = z.object({}).extend(clientEnvSchema.shape);

export type AppConfig = ClientAppConfig & {};

const unparsedEnv = {};

const parsed = envSchema.safeParse(unparsedEnv);

if (!parsed.success) {
  let message = "Invalid environment variables:";
  for (const issue of parsed.error.issues) {
    message += `\n${issue.path.join(".")}: ${issue.message}`;
  }
  throw new Error(message);
}

const config: AppConfig = {
  ...clientConfig,
};

export default config;
