/**
 * Schema Validator for the 2026 UX/UI & Accessibility Knowledge Base
 * Validates all 6 modular JSON files in /database/seed_rules/ against /schema/ux_rules_schema.json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import type { UxAuditRule } from "./types.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, "..");
const SCHEMA_PATH = path.join(ROOT_DIR, "schema", "ux_rules_schema.json");
const SEED_DIR = path.join(ROOT_DIR, "database", "seed_rules");

export interface ValidationSummary {
  valid: boolean;
  filesChecked: number;
  totalRules: number;
  byStandardFamily: Record<string, number>;
  byCategory: Record<string, number>;
  errors: string[];
}

export function validateAllSeedRules(): ValidationSummary {
  const schemaRaw = JSON.parse(fs.readFileSync(SCHEMA_PATH, "utf-8"));
  const ruleDef = schemaRaw.$defs.UxAuditRule;

  const allowedFamilies = new Set<string>(ruleDef.properties.standard_family.enum);
  const allowedCategories = new Set<string>(ruleDef.properties.category.enum);
  const allowedRisks = new Set<string>(ruleDef.properties.legal_or_business_risk.enum);
  const allowedStates = new Set<string>(ruleDef.properties.target_states.items.enum);
  const allowedModalities = new Set<string>(ruleDef.properties.verification_modality.enum);
  const allowedOutcomes = new Set<string>(ruleDef.properties.evaluation_outcomes.items.enum);
  const requiredFields: string[] = ruleDef.required;

  const seedFiles = fs
    .readdirSync(SEED_DIR)
    .filter((f) => f.endsWith(".json"))
    .sort();

  const seenIds = new Set<string>();
  const byStandardFamily: Record<string, number> = {};
  const byCategory: Record<string, number> = {};
  const errors: string[] = [];
  let totalRules = 0;

  for (const file of seedFiles) {
    const filePath = path.join(SEED_DIR, file);
    let rules: UxAuditRule[];
    try {
      rules = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (err) {
      errors.push(`[${file}] Invalid JSON syntax: ${(err as Error).message}`);
      continue;
    }

    if (!Array.isArray(rules) || rules.length === 0) {
      errors.push(`[${file}] Root must be a non-empty array of UxAuditRule objects.`);
      continue;
    }

    for (const [idx, rule] of rules.entries()) {
      totalRules++;
      const prefix = `[${file}#${idx} (${rule.id || "MISSING_ID"})]`;

      for (const req of requiredFields) {
        if (!(req in rule) || (rule as Record<string, unknown>)[req] === undefined) {
          errors.push(`${prefix} Missing required field: '${req}'`);
        }
      }

      if (seenIds.has(rule.id)) {
        errors.push(`${prefix} Duplicate rule id '${rule.id}'`);
      }
      seenIds.add(rule.id);

      if (!allowedFamilies.has(rule.standard_family)) {
        errors.push(`${prefix} Invalid standard_family '${rule.standard_family}'`);
      } else {
        byStandardFamily[rule.standard_family] =
          (byStandardFamily[rule.standard_family] || 0) + 1;
      }

      if (!allowedCategories.has(rule.category)) {
        errors.push(`${prefix} Invalid category '${rule.category}'`);
      } else {
        byCategory[rule.category] = (byCategory[rule.category] || 0) + 1;
      }

      if (!allowedRisks.has(rule.legal_or_business_risk)) {
        errors.push(`${prefix} Invalid legal_or_business_risk '${rule.legal_or_business_risk}'`);
      }

      if (!Array.isArray(rule.target_states) || rule.target_states.length === 0) {
        errors.push(`${prefix} target_states must be a non-empty array`);
      } else {
        for (const st of rule.target_states) {
          if (!allowedStates.has(st)) {
            errors.push(`${prefix} Invalid target_state '${st}'`);
          }
        }
      }

      if (
        typeof rule.quantitative_threshold !== "object" ||
        rule.quantitative_threshold === null
      ) {
        errors.push(`${prefix} quantitative_threshold must be an object`);
      }

      if (!allowedModalities.has(rule.verification_modality)) {
        errors.push(`${prefix} Invalid verification_modality '${rule.verification_modality}'`);
      }

      if (
        !Array.isArray(rule.evaluation_outcomes) ||
        rule.evaluation_outcomes.length !== 3 ||
        !rule.evaluation_outcomes.every((o) => allowedOutcomes.has(o))
      ) {
        errors.push(
          `${prefix} evaluation_outcomes must contain ["APPLIED_PASS", "VIOLATED_FAIL", "DOES_NOT_APPLY"]`
        );
      }

      if (!rule.title_ru || rule.title_ru.trim().length < 5) {
        errors.push(`${prefix} title_ru must be at least 5 characters`);
      }
      if (!rule.description_ru || rule.description_ru.trim().length < 20) {
        errors.push(`${prefix} description_ru must be at least 20 characters`);
      }
      if (!rule.remediation_guide_ru || rule.remediation_guide_ru.trim().length < 15) {
        errors.push(`${prefix} remediation_guide_ru must be at least 15 characters`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    filesChecked: seedFiles.length,
    totalRules,
    byStandardFamily,
    byCategory,
    errors,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  const result = validateAllSeedRules();
  console.log("=== 2026 UX/UI Knowledge Base Schema Validation ===");
  console.log(`Seed Modules Checked : ${result.filesChecked}`);
  console.log(`Total Rules Validated: ${result.totalRules}`);
  console.log("By Standard Family   :", result.byStandardFamily);
  console.log("By Category          :", result.byCategory);
  if (!result.valid) {
    console.error("Validation Errors:", result.errors);
    process.exit(1);
  }
  console.log("STATUS: ALL SEED MODULES CONFORM STRICTLY TO ux_rules_schema.json");
}
