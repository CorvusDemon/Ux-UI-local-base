/**
 * SQLite Database Compiler & Query Layer (/database/init_db.ts)
 * Uses Node.js built-in `node:sqlite` (DatabaseSync) to compile /database/schema.sql
 * and all 6 modular seed files in /database/seed_rules/ into /database/ux_checklist_2026.sqlite.
 */

import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";
import type { AuditReport, UxAuditRule } from "../schema/types.ts";
import { validateAllSeedRules } from "../schema/validate_seeds.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");

export const DB_PATH = path.join(ROOT_DIR, "database", "ux_checklist_2026.sqlite");
const SCHEMA_SQL_PATH = path.join(ROOT_DIR, "database", "schema.sql");
const SEED_DIR = path.join(ROOT_DIR, "database", "seed_rules");

export function loadAllSeedRulesFromJson(): UxAuditRule[] {
  const files = fs
    .readdirSync(SEED_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();
  const allRules: UxAuditRule[] = [];
  for (const file of files) {
    const raw = fs.readFileSync(path.join(SEED_DIR, file), "utf-8");
    const parsed: UxAuditRule[] = JSON.parse(raw);
    allRules.push(...parsed);
  }
  return allRules;
}

export function initializeAndSeedDatabase(dbPath: string = DB_PATH): {
  dbPath: string;
  insertedCount: number;
} {
  const validation = validateAllSeedRules();
  if (!validation.valid) {
    throw new Error(
      `Seed validation failed before DB initialization:\n${validation.errors.join("\n")}`
    );
  }

  const db = new DatabaseSync(dbPath);
  const schemaSql = fs.readFileSync(SCHEMA_SQL_PATH, "utf-8");
  db.exec(schemaSql);

  db.exec("DELETE FROM ux_audit_rules;");
  db.exec("DELETE FROM ux_audit_rules_fts;");

  const insertStmt = db.prepare(`
    INSERT INTO ux_audit_rules (
      id,
      standard_family,
      category,
      title_ru,
      description_ru,
      legal_or_business_risk,
      target_states_json,
      quantitative_threshold_json,
      verification_modality,
      evaluation_outcomes_json,
      playwright_check_snippet,
      vision_prompt_heuristic,
      remediation_guide_ru,
      wcag_3_0_tier,
      iso_9241_110_principle
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const rules = loadAllSeedRulesFromJson();
  db.exec("BEGIN TRANSACTION;");
  try {
    for (const rule of rules) {
      insertStmt.run(
        rule.id,
        rule.standard_family,
        rule.category,
        rule.title_ru,
        rule.description_ru,
        rule.legal_or_business_risk,
        JSON.stringify(rule.target_states),
        JSON.stringify(rule.quantitative_threshold),
        rule.verification_modality,
        JSON.stringify(rule.evaluation_outcomes),
        rule.playwright_check_snippet,
        rule.vision_prompt_heuristic,
        rule.remediation_guide_ru,
        rule.wcag_3_0_tier ?? null,
        rule.iso_9241_110_principle ?? null
      );
    }
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    db.close();
    throw err;
  }

  db.close();
  return { dbPath, insertedCount: rules.length };
}

function hydrateRuleRow(row: Record<string, unknown>): UxAuditRule {
  return {
    id: String(row.id),
    standard_family: String(row.standard_family) as UxAuditRule["standard_family"],
    category: String(row.category) as UxAuditRule["category"],
    title_ru: String(row.title_ru),
    description_ru: String(row.description_ru),
    legal_or_business_risk: String(
      row.legal_or_business_risk
    ) as UxAuditRule["legal_or_business_risk"],
    target_states: JSON.parse(String(row.target_states_json)),
    quantitative_threshold: JSON.parse(String(row.quantitative_threshold_json)),
    verification_modality: String(
      row.verification_modality
    ) as UxAuditRule["verification_modality"],
    evaluation_outcomes: JSON.parse(String(row.evaluation_outcomes_json)),
    playwright_check_snippet: String(row.playwright_check_snippet),
    vision_prompt_heuristic: String(row.vision_prompt_heuristic),
    remediation_guide_ru: String(row.remediation_guide_ru),
    ...(row.wcag_3_0_tier ? { wcag_3_0_tier: String(row.wcag_3_0_tier) as UxAuditRule["wcag_3_0_tier"] } : {}),
    ...(row.iso_9241_110_principle
      ? {
          iso_9241_110_principle: String(
            row.iso_9241_110_principle
          ) as UxAuditRule["iso_9241_110_principle"],
        }
      : {}),
  };
}

export function queryUxRulesFromDb(filters: {
  standard_family?: string;
  category?: string;
  legal_or_business_risk?: string;
  verification_modality?: string;
  target_state?: string;
  search_query?: string;
}): UxAuditRule[] {
  if (!fs.existsSync(DB_PATH)) {
    initializeAndSeedDatabase(DB_PATH);
  }
  const db = new DatabaseSync(DB_PATH);
  try {
    const conditions: string[] = [];
    const params: (string | number)[] = [];

    if (filters.standard_family) {
      conditions.push("r.standard_family = ?");
      params.push(filters.standard_family);
    }
    if (filters.category) {
      conditions.push("r.category = ?");
      params.push(filters.category);
    }
    if (filters.legal_or_business_risk) {
      conditions.push("r.legal_or_business_risk = ?");
      params.push(filters.legal_or_business_risk);
    }
    if (filters.verification_modality) {
      conditions.push("r.verification_modality = ?");
      params.push(filters.verification_modality);
    }
    if (filters.target_state) {
      conditions.push("r.target_states_json LIKE ?");
      params.push(`%"${filters.target_state}"%`);
    }
    if (filters.search_query && filters.search_query.trim()) {
      const q = `%${filters.search_query.trim()}%`;
      conditions.push(
        "(r.id LIKE ? OR r.title_ru LIKE ? OR r.description_ru LIKE ? OR r.remediation_guide_ru LIKE ?)"
      );
      params.push(q, q, q, q);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const sql = `SELECT r.* FROM ux_audit_rules r ${whereClause} ORDER BY r.id ASC`;
    const rows = db.prepare(sql).all(...params) as Record<string, unknown>[];
    return rows.map(hydrateRuleRow);
  } finally {
    db.close();
  }
}

export function getRuleByIdFromDb(id: string): UxAuditRule | null {
  if (!fs.existsSync(DB_PATH)) {
    initializeAndSeedDatabase(DB_PATH);
  }
  const db = new DatabaseSync(DB_PATH);
  try {
    const row = db
      .prepare("SELECT * FROM ux_audit_rules WHERE UPPER(id) = UPPER(?)")
      .get(id) as Record<string, unknown> | undefined;
    return row ? hydrateRuleRow(row) : null;
  } finally {
    db.close();
  }
}

export function persistAuditReportToDb(report: AuditReport): void {
  if (!fs.existsSync(DB_PATH)) {
    initializeAndSeedDatabase(DB_PATH);
  }
  const db = new DatabaseSync(DB_PATH);
  try {
    db.exec("BEGIN TRANSACTION;");
    db.prepare(`
      INSERT OR REPLACE INTO audit_runs (
        report_id,
        target_url,
        timestamp_iso,
        total_rules,
        applied_pass_count,
        violated_fail_count,
        does_not_apply_count,
        critical_legal_failures,
        high_conversion_blockers,
        wcag_3_0_tier_achieved,
        web_vitals_json,
        json_report_path,
        markdown_report_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      report.report_id,
      report.target_url,
      report.timestamp_iso,
      report.summary.total_rules_evaluated,
      report.summary.applied_pass_count,
      report.summary.violated_fail_count,
      report.summary.does_not_apply_count,
      report.summary.critical_legal_failures,
      report.summary.high_conversion_blockers,
      report.summary.wcag_3_0_tier_achieved,
      JSON.stringify(report.web_vitals_by_viewport),
      report.artifacts.json_report_path,
      report.artifacts.markdown_report_path
    );

    const insertResult = db.prepare(`
      INSERT INTO audit_rule_results (
        report_id,
        rule_id,
        viewport,
        outcome,
        measured_value_json,
        affected_selectors_json,
        vision_confidence,
        vision_reasoning_ru,
        screenshot_path
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const res of report.results) {
      insertResult.run(
        report.report_id,
        res.rule_id,
        res.viewport,
        res.outcome,
        res.measured_value ? JSON.stringify(res.measured_value) : null,
        res.affected_selectors ? JSON.stringify(res.affected_selectors) : null,
        res.vision_confidence ?? null,
        res.vision_reasoning_ru ?? null,
        res.screenshot_path ?? null
      );
    }
    db.exec("COMMIT;");
  } catch (err) {
    db.exec("ROLLBACK;");
    throw err;
  } finally {
    db.close();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const { dbPath, insertedCount } = initializeAndSeedDatabase();
  console.log(`=== SQLite 2026 UX/UI Knowledge Base Initialized ===`);
  console.log(`Database Path : ${dbPath}`);
  console.log(`Seeded Rules  : ${insertedCount}`);
}
