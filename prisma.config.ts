import { readFileSync } from "node:fs";
import { join } from "node:path";
import { defineConfig, env } from "prisma/config";

const loadLocalEnv = () => {
  try {
    const envFile = readFileSync(join(process.cwd(), ".env"), "utf8");

    envFile.split(/\r?\n/).forEach((line) => {
      const trimmedLine = line.trim();

      if (!trimmedLine || trimmedLine.startsWith("#")) {
        return;
      }

      const separatorIndex = trimmedLine.indexOf("=");

      if (separatorIndex === -1) {
        return;
      }

      const key = trimmedLine.slice(0, separatorIndex).trim();
      const value = trimmedLine
        .slice(separatorIndex + 1)
        .trim()
        .replace(/^['"]|['"]$/g, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
  } catch {
    // Prisma will report missing DATABASE_URL/DIRECT_URL when needed.
  }
};

loadLocalEnv();

export default defineConfig({
  datasource: {
    directUrl: env("DIRECT_URL"),
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "prisma/migrations",
  },
  schema: "prisma/schema.prisma",
});
