import * as dotenv from "dotenv";
import * as path from "path";

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
dotenv.config({ path: path.join(process.cwd(), envFile) });

import { defineConfig } from "prisma/config";

export default defineConfig({
  // Using schema folder for multi-file schema support
  schema: "prisma/schema",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node prisma/seed.ts",
  },
  datasource: {
    url: process.env["DATABASE_URL"],
  },
});
