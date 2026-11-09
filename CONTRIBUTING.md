# Contributing Guide

Thank you for contributing to the **2026 UX/UI & Accessibility Audit Database & Hybrid Testing Engine**!

## How to Add a New UX/UI Rule

All normative rules live in modular JSON files inside `/database/seed_rules/` and are strictly validated against `/schema/ux_rules_schema.json` and the `UxAuditRule` interface in `/schema/types.ts`.

### Step 1. Choose the Target Seed Module
1. `01_wcag_2_2_and_3_0.json` — WCAG 2.2 Level A/AA/AAA and WCAG 3.0 Draft criteria.
2. `02_platform_design_systems.json` — Apple HIG (iOS 26 / Liquid Glass), Material Design 3, and IBM Carbon.
3. `03_ergonomics_and_laws_of_ux.json` — ISO 9241-110:2020 dialogue principles and Laws of UX.
4. `04_baymard_ecommerce_benchmarks.json` — Baymard Institute e-commerce, checkout, PDP, and self-service rules.
5. `05_human_ai_interaction.json` — Microsoft HAX 18 Guidelines, Google PAIR v3, and GenAI UX patterns.
6. `06_core_web_vitals_2026.json` — Runtime Core Web Vitals (`LCP`, `INP`, `CLS`).

### Step 2. Populate Required Rule Properties
Every rule object must include:
- `id`: Unique identifier in `PREFIX-CODE` format (e.g., `WCAG-2.4.11`, `BAYMARD-CHK-01`).
- `standard_family` and `category`: Valid enum values from `/schema/types.ts`.
- `title` and `description`: Clear normative title and detailed ergonomic/business rationale.
- `legal_or_business_risk`: Severity tier (`CRITICAL_LEGAL_EAA_ADA`, `HIGH_CONVERSION_BLOCKER`, `MEDIUM_UX_FRICTION`, `BEST_PRACTICE_ENHANCEMENT`).
- `target_states`: Applicable UI/viewport states from the 11-state IBM Carbon matrix.
- `quantitative_threshold`: Measurable numeric limits (`min_target_px`, `max_lcp_ms`, `min_contrast_text`, etc.).
- `verification_modality`: `AUTOMATED_DOM`, `AUTOMATED_RUNTIME_PERF`, `AI_MULTIMODAL_VISION`, or `MANUAL_INTERACTIVE`.
- `evaluation_outcomes`: `["APPLIED_PASS", "VIOLATED_FAIL", "DOES_NOT_APPLY"]`.
- `playwright_check_snippet`: Executable JS/TS assertion returning one of the 3 evaluation outcomes.
- `vision_prompt_heuristic`: Specific evaluation prompt for Gemini Multimodal Vision on screenshots.
- `remediation_guide`: Actionable code and design fix.

### Step 3. Validate Schema & Rebuild SQLite
Before opening a Pull Request, run all verification scripts:

```bash
npm run validate:schema
npm run seed:db
npm run mcp:test
npm run audit -- --self-test
```

All four commands must exit with code `0`.
