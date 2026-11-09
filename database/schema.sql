-- =============================================================================
-- UX/UI & Accessibility Audit Database — SQLite 3 Schema (2026 Standards)
-- Supports FTS5 full-text search in Russian/English, JSON1 threshold queries,
-- and relational audit run telemetry.
-- =============================================================================

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS ux_audit_rules (
    id TEXT PRIMARY KEY,
    standard_family TEXT NOT NULL CHECK (
        standard_family IN (
            'WCAG_2_2',
            'WCAG_3_0_DRAFT',
            'MATERIAL_3',
            'APPLE_HIG_26',
            'IBM_CARBON',
            'ISO_9241_110',
            'LAWS_OF_UX',
            'BAYMARD_2026',
            'MICROSOFT_HAX',
            'GOOGLE_PAIR_V3',
            'CORE_WEB_VITALS'
        )
    ),
    category TEXT NOT NULL CHECK (
        category IN (
            'Accessibility',
            'Visual_Hierarchy',
            'Touch_Ergonomics',
            'Forms_Checkout',
            'Navigation_Search',
            'Account_SelfService',
            'Human_AI_Interaction',
            'Runtime_Performance',
            'Cognitive_Load'
        )
    ),
    title_ru TEXT NOT NULL,
    description_ru TEXT NOT NULL,
    legal_or_business_risk TEXT NOT NULL CHECK (
        legal_or_business_risk IN (
            'CRITICAL_LEGAL_EAA_ADA',
            'HIGH_CONVERSION_BLOCKER',
            'MEDIUM_UX_FRICTION',
            'BEST_PRACTICE_ENHANCEMENT'
        )
    ),
    target_states_json TEXT NOT NULL,           -- JSON array of TargetState
    quantitative_threshold_json TEXT NOT NULL,  -- JSON object of QuantitativeThreshold
    verification_modality TEXT NOT NULL CHECK (
        verification_modality IN (
            'AUTOMATED_DOM',
            'AUTOMATED_RUNTIME_PERF',
            'AI_MULTIMODAL_VISION',
            'MANUAL_INTERACTIVE'
        )
    ),
    evaluation_outcomes_json TEXT NOT NULL DEFAULT '["APPLIED_PASS","VIOLATED_FAIL","DOES_NOT_APPLY"]',
    playwright_check_snippet TEXT NOT NULL,
    vision_prompt_heuristic TEXT NOT NULL,
    remediation_guide_ru TEXT NOT NULL,
    wcag_3_0_tier TEXT CHECK (wcag_3_0_tier IN ('BRONZE', 'SILVER', 'GOLD') OR wcag_3_0_tier IS NULL),
    iso_9241_110_principle TEXT CHECK (
        iso_9241_110_principle IN (
            'SUITABILITY_FOR_TASK',
            'SELF_DESCRIPTIVENESS',
            'CONFORMITY_WITH_USER_EXPECTATIONS',
            'LEARNER_SUPPORT',
            'CONTROLLABILITY',
            'USE_ERROR_ROBUSTNESS',
            'USER_ENGAGEMENT'
        ) OR iso_9241_110_principle IS NULL
    ),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rules_standard_family ON ux_audit_rules(standard_family);
CREATE INDEX IF NOT EXISTS idx_rules_category ON ux_audit_rules(category);
CREATE INDEX IF NOT EXISTS idx_rules_risk ON ux_audit_rules(legal_or_business_risk);
CREATE INDEX IF NOT EXISTS idx_rules_modality ON ux_audit_rules(verification_modality);

-- Full-Text Search (FTS5) virtual table for fast MCP semantic/keyword queries in Russian & English
CREATE VIRTUAL TABLE IF NOT EXISTS ux_audit_rules_fts USING fts5(
    id,
    standard_family,
    category,
    title_ru,
    description_ru,
    remediation_guide_ru,
    content='ux_audit_rules',
    content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS ux_audit_rules_ai AFTER INSERT ON ux_audit_rules BEGIN
    INSERT INTO ux_audit_rules_fts(rowid, id, standard_family, category, title_ru, description_ru, remediation_guide_ru)
    VALUES (new.rowid, new.id, new.standard_family, new.category, new.title_ru, new.description_ru, new.remediation_guide_ru);
END;

-- Audit Runs & Rule Outcomes History
CREATE TABLE IF NOT EXISTS audit_runs (
    report_id TEXT PRIMARY KEY,
    target_url TEXT NOT NULL,
    timestamp_iso TEXT NOT NULL,
    total_rules INTEGER NOT NULL,
    applied_pass_count INTEGER NOT NULL,
    violated_fail_count INTEGER NOT NULL,
    does_not_apply_count INTEGER NOT NULL,
    critical_legal_failures INTEGER NOT NULL,
    high_conversion_blockers INTEGER NOT NULL,
    wcag_3_0_tier_achieved TEXT NOT NULL,
    web_vitals_json TEXT NOT NULL,
    json_report_path TEXT NOT NULL,
    markdown_report_path TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_rule_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    report_id TEXT NOT NULL REFERENCES audit_runs(report_id) ON DELETE CASCADE,
    rule_id TEXT NOT NULL REFERENCES ux_audit_rules(id),
    viewport TEXT NOT NULL,
    outcome TEXT NOT NULL CHECK (outcome IN ('APPLIED_PASS', 'VIOLATED_FAIL', 'DOES_NOT_APPLY')),
    measured_value_json TEXT,
    affected_selectors_json TEXT,
    vision_confidence REAL,
    vision_reasoning_ru TEXT,
    screenshot_path TEXT
);

CREATE INDEX IF NOT EXISTS idx_audit_results_report ON audit_rule_results(report_id);
CREATE INDEX IF NOT EXISTS idx_audit_results_outcome ON audit_rule_results(outcome);

