/**
 * UX/UI & Accessibility Audit Database — Unified TypeScript Schema (2026 Standards)
 * Covers WCAG 2.2 / 3.0 Draft, Apple HIG (iOS 26 / Liquid Glass), Material Design 3,
 * IBM Carbon, ISO 9241-110:2020, Laws of UX, Baymard 2026, Microsoft HAX, Google PAIR v3,
 * and Core Web Vitals.
 */

export const StandardFamily = {
  WCAG_2_2: "WCAG_2_2",
  WCAG_3_0_DRAFT: "WCAG_3_0_DRAFT",
  MATERIAL_3: "MATERIAL_3",
  APPLE_HIG_26: "APPLE_HIG_26",
  IBM_CARBON: "IBM_CARBON",
  ISO_9241_110: "ISO_9241_110",
  LAWS_OF_UX: "LAWS_OF_UX",
  BAYMARD_2026: "BAYMARD_2026",
  MICROSOFT_HAX: "MICROSOFT_HAX",
  GOOGLE_PAIR_V3: "GOOGLE_PAIR_V3",
  CORE_WEB_VITALS: "CORE_WEB_VITALS",
} as const;

export type StandardFamily =
  (typeof StandardFamily)[keyof typeof StandardFamily];

export const RuleCategory = {
  ACCESSIBILITY: "Accessibility",
  VISUAL_HIERARCHY: "Visual_Hierarchy",
  TOUCH_ERGONOMICS: "Touch_Ergonomics",
  FORMS_CHECKOUT: "Forms_Checkout",
  NAVIGATION_SEARCH: "Navigation_Search",
  ACCOUNT_SELFSERVICE: "Account_SelfService",
  HUMAN_AI_INTERACTION: "Human_AI_Interaction",
  RUNTIME_PERFORMANCE: "Runtime_Performance",
  COGNITIVE_LOAD: "Cognitive_Load",
} as const;

export type RuleCategory = (typeof RuleCategory)[keyof typeof RuleCategory];

export const LegalOrBusinessRisk = {
  CRITICAL_LEGAL_EAA_ADA: "CRITICAL_LEGAL_EAA_ADA",
  HIGH_CONVERSION_BLOCKER: "HIGH_CONVERSION_BLOCKER",
  MEDIUM_UX_FRICTION: "MEDIUM_UX_FRICTION",
  BEST_PRACTICE_ENHANCEMENT: "BEST_PRACTICE_ENHANCEMENT",
} as const;

export type LegalOrBusinessRisk =
  (typeof LegalOrBusinessRisk)[keyof typeof LegalOrBusinessRisk];

export type TargetState =
  | "default"
  | "hover"
  | "focus-visible"
  | "active"
  | "disabled"
  | "loading_skeleton"
  | "error"
  | "zoom_200"
  | "viewport_320px"
  | "dark_mode"
  | "reduced_motion";

export const VerificationModality = {
  AUTOMATED_DOM: "AUTOMATED_DOM",
  AUTOMATED_RUNTIME_PERF: "AUTOMATED_RUNTIME_PERF",
  AI_MULTIMODAL_VISION: "AI_MULTIMODAL_VISION",
  MANUAL_INTERACTIVE: "MANUAL_INTERACTIVE",
} as const;

export type VerificationModality =
  (typeof VerificationModality)[keyof typeof VerificationModality];

export type EvaluationOutcome =
  | "APPLIED_PASS"
  | "VIOLATED_FAIL"
  | "DOES_NOT_APPLY";

export type Wcag3ScoringTier = "BRONZE" | "SILVER" | "GOLD";

export type Iso9241Principle =
  | "SUITABILITY_FOR_TASK"
  | "SELF_DESCRIPTIVENESS"
  | "CONFORMITY_WITH_USER_EXPECTATIONS"
  | "LEARNER_SUPPORT"
  | "CONTROLLABILITY"
  | "USE_ERROR_ROBUSTNESS"
  | "USER_ENGAGEMENT";

export interface QuantitativeThreshold {
  /** Hard minimum target size in CSS pixels (e.g., 24 for WCAG 2.5.8) */
  min_target_px?: number;
  /** Recommended touch target size in points (e.g., 44 for Apple HIG) */
  recommended_pt?: number;
  /** Recommended touch target size in dp (e.g., 48 for Material 3) */
  recommended_dp?: number;
  /** Minimum spacing gap between interactive targets in CSS pixels (e.g., 8) */
  min_gap_px?: number;
  /** Minimum body font size in pt/px (e.g., 17 for Apple HIG legibility floor) */
  min_body_font_px?: number;
  /** Maximum Dynamic Type / browser zoom scale percentage without clipping (e.g., 200) */
  max_zoom_scale_pct?: number;
  /** Largest Contentful Paint threshold in milliseconds (e.g., 2500) */
  max_lcp_ms?: number;
  /** Interaction to Next Paint threshold in milliseconds (e.g., 200) */
  max_inp_ms?: number;
  /** Cumulative Layout Shift score ceiling (e.g., 0.1) */
  max_cls?: number;
  /** Doherty Threshold maximum response latency in milliseconds (e.g., 400) */
  max_doherty_ms?: number;
  /** Minimum WCAG AA contrast ratio for normal body text (e.g., 4.5) */
  min_contrast_text?: number;
  /** Minimum WCAG AA contrast ratio for UI components and focus indicators (e.g., 3.0) */
  min_contrast_ui?: number;
  /** WCAG 1.4.12 line height multiplier (e.g., 1.5) */
  line_height_multiplier?: number;
  /** WCAG 1.4.12 paragraph spacing multiplier (e.g., 2.0) */
  paragraph_spacing_multiplier?: number;
  /** WCAG 1.4.12 letter spacing in em (e.g., 0.12) */
  letter_spacing_em?: number;
  /** WCAG 1.4.12 word spacing in em (e.g., 0.16) */
  word_spacing_em?: number;
  /** Maximum visually dominant Primary CTAs per viewport/card region (Von Restorff = 1) */
  max_primary_cta_per_viewport?: number;
  /** Maximum ratio of label-to-input distance vs inter-field distance (Gestalt Proximity = 0.5) */
  max_label_to_field_distance_ratio?: number;
  /** Credit card / numeric chunking group size (e.g., 4) */
  chunk_size_digits?: number;
  /** Additional rule-specific measurable thresholds */
  [key: string]: number | string | boolean | undefined;
}

export interface UxAuditRule {
  /** Unique rule identifier (e.g., "WCAG-2.4.11", "BAYMARD-CHK-01", "HIG-TOUCH-01", "HAX-G14") */
  id: string;
  /** Normative standard or research family */
  standard_family: StandardFamily;
  /** Functional UX/UI audit domain */
  category: RuleCategory;
  /** Concise normative rule title */
  title: string;
  /** Detailed normative requirement and ergonomic/business rationale */
  description: string;
  /** Legal compliance or conversion severity level */
  legal_or_business_risk: LegalOrBusinessRisk;
  /** Component and viewport states in which this rule must be verified (IBM Carbon matrix) */
  target_states: TargetState[];
  /** Explicit measurable thresholds used by automated DOM/Perf assertions */
  quantitative_threshold: QuantitativeThreshold;
  /** Primary verification engine modality */
  verification_modality: VerificationModality;
  /** Allowed Microsoft HAX 3-state evaluation outcomes */
  evaluation_outcomes:
    | ["APPLIED_PASS", "VIOLATED_FAIL", "DOES_NOT_APPLY"]
    | EvaluationOutcome[];
  /** Executable Playwright JS/TS assertion snippet for DOM/CSS/Perf verification */
  playwright_check_snippet: string;
  /** Structured heuristic instruction for Gemini Multimodal Vision evaluation on screenshots */
  vision_prompt_heuristic: string;
  /** Actionable code and UI design remediation guide */
  remediation_guide: string;
  /** Optional WCAG 3.0 Draft outcome scoring tier (Bronze / Silver / Gold) */
  wcag_3_0_tier?: Wcag3ScoringTier;
  /** Optional ISO 9241-110:2020 dialogue principle mapping */
  iso_9241_110_principle?: Iso9241Principle;
}

/**
 * Audit Execution & Reporting Types (Phase 4 Hybrid Runner & MCP Server)
 */
export interface ViewportConfig {
  name: "mobile_375" | "wcag_reflow_320" | "desktop_1440";
  width: number;
  height: number;
  deviceScaleFactor: number;
  isMobile: boolean;
}

export interface RuleEvaluationResult {
  rule_id: string;
  standard_family: StandardFamily;
  category: RuleCategory;
  title: string;
  legal_or_business_risk: LegalOrBusinessRisk;
  verification_modality: VerificationModality;
  outcome: EvaluationOutcome;
  viewport: ViewportConfig["name"] | "all";
  measured_value?: Record<string, number | string | boolean>;
  affected_selectors?: string[];
  vision_confidence?: number;
  vision_reasoning?: string;
  screenshot_path?: string;
  remediation_guide: string;
}

export interface RuntimeWebVitalsMetrics {
  lcp_ms: number | null;
  cls_score: number;
  inp_ms: number | null;
  ttfb_ms: number | null;
  fcp_ms: number | null;
}

export interface AuditReport {
  report_id: string;
  target_url: string;
  timestamp_iso: string;
  viewports_tested: ViewportConfig[];
  web_vitals_by_viewport: Record<
    ViewportConfig["name"],
    RuntimeWebVitalsMetrics
  >;
  summary: {
    total_rules_evaluated: number;
    applied_pass_count: number;
    violated_fail_count: number;
    does_not_apply_count: number;
    critical_legal_failures: number;
    high_conversion_blockers: number;
    wcag_3_0_tier_achieved: Wcag3ScoringTier | "NON_CONFORMANT";
  };
  results: RuleEvaluationResult[];
  artifacts: {
    screenshots: Record<string, string>;
    json_report_path: string;
    markdown_report_path: string;
  };
}
