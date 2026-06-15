import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

const sampleTransitionSqlPaths = [
  "templates/base-express/db/tests-pgtap/app_sample_transition.test.sql",
  "templates/base-fastify/db/tests-pgtap/app_sample_transition.test.sql",
] as const;

describe("pgTAP app_sample_transition.test.sql templates", () => {
  it.each(sampleTransitionSqlPaths)(
    "%s accesses jsonb column aliases with -> operators",
    async (relativePath) => {
      const sql = await readFile(join(process.cwd(), relativePath), "utf8");

      expect(sql).toContain("dashboard -> 'project' ->> 'name'");
      expect(sql).toContain("jsonb_typeof(dashboard -> 'releases')");
      expect(sql).toContain("dashboard ->> 'canTransitionReleases'");
      expect(sql).toContain("transition -> 'release' ->> 'status'");

      expect(sql).not.toMatch(/dashboard\.project/);
      expect(sql).not.toMatch(/dashboard\.releases/);
      expect(sql).not.toMatch(/transition\.release/);
    },
  );
});
