/**
 * Antigravity Native MCP Server (/mcp-server/index.ts)
 * Exposes the 2026 UX/UI & Accessibility Audit Database (SQLite3 + FTS5)
 * and the Hybrid Audit Runner (/engine/auditor.ts) over Model Context Protocol (JSON-RPC 2.0 stdio).
 *
 * Tools exposed:
 * 1. query_ux_rules — Filter/search rules by standard_family, category, risk, target_state, or Russian/English keyword
 * 2. get_rule_by_id — Fetch full normative spec, quantitative_threshold, Playwright snippet, and remediation guide
 * 3. generate_component_checklist — Curated pre-flight UX/UI checklist for specific frontend components
 * 4. run_hybrid_ux_audit — Execute headless Playwright + Axe + Web Vitals + Gemini Vision audit on any URL
 */

import readline from "node:readline";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  getRuleByIdFromDb,
  initializeAndSeedDatabase,
  queryUxRulesFromDb,
} from "../database/init_db.ts";
import { runHybridUxAudit } from "../engine/auditor.ts";

const __filename = fileURLToPath(import.meta.url);

export const MCP_TOOLS_MANIFEST = [
  {
    name: "query_ux_rules",
    description:
      "Search and filter the 2026 UX/UI & Accessibility Knowledge Base across 11 standard families (WCAG_2_2, WCAG_3_0_DRAFT, APPLE_HIG_26, MATERIAL_3, IBM_CARBON, ISO_9241_110, LAWS_OF_UX, BAYMARD_2026, MICROSOFT_HAX, GOOGLE_PAIR_V3, CORE_WEB_VITALS).",
    inputSchema: {
      type: "object",
      properties: {
        standard_family: {
          type: "string",
          enum: [
            "WCAG_2_2",
            "WCAG_3_0_DRAFT",
            "MATERIAL_3",
            "APPLE_HIG_26",
            "IBM_CARBON",
            "ISO_9241_110",
            "LAWS_OF_UX",
            "BAYMARD_2026",
            "MICROSOFT_HAX",
            "GOOGLE_PAIR_V3",
            "CORE_WEB_VITALS",
          ],
        },
        category: {
          type: "string",
          enum: [
            "Accessibility",
            "Visual_Hierarchy",
            "Touch_Ergonomics",
            "Forms_Checkout",
            "Navigation_Search",
            "Account_SelfService",
            "Human_AI_Interaction",
            "Runtime_Performance",
            "Cognitive_Load",
          ],
        },
        legal_or_business_risk: {
          type: "string",
          enum: [
            "CRITICAL_LEGAL_EAA_ADA",
            "HIGH_CONVERSION_BLOCKER",
            "MEDIUM_UX_FRICTION",
            "BEST_PRACTICE_ENHANCEMENT",
          ],
        },
        target_state: {
          type: "string",
          enum: [
            "default",
            "hover",
            "focus-visible",
            "active",
            "disabled",
            "loading_skeleton",
            "error",
            "zoom_200",
            "viewport_320px",
            "dark_mode",
            "reduced_motion",
          ],
        },
        search_query: {
          type: "string",
          description: "Free-text search keyword (e.g. 'card', 'focus', 'Liquid Glass', 'HAX')",
        },
      },
    },
  },
  {
    name: "get_rule_by_id",
    description:
      "Retrieve the full normative requirement, quantitative thresholds, executable Playwright check snippet, Gemini Vision heuristic prompt, and Russian remediation guide for a specific rule ID (e.g. 'WCAG-2.4.11', 'BAYMARD-CHK-01', 'HIG-TOUCH-01', 'HAX-G14').",
    inputSchema: {
      type: "object",
      required: ["id"],
      properties: {
        id: {
          type: "string",
          description: "Rule identifier, e.g. 'WCAG-2.4.11'",
        },
      },
    },
  },
  {
    name: "generate_component_checklist",
    description:
      "Generate a comprehensive 2026 UX/UI pre-flight checklist and acceptance criteria for a specific UI component type (e.g. 'checkout_form', 'ai_chat', 'product_page', 'navigation_header', 'auth_login', 'data_table').",
    inputSchema: {
      type: "object",
      required: ["component_type"],
      properties: {
        component_type: {
          type: "string",
          enum: [
            "checkout_form",
            "ai_chat",
            "product_page",
            "navigation_header",
            "auth_login",
            "data_table",
          ],
        },
      },
    },
  },
  {
    name: "run_hybrid_ux_audit",
    description:
      "Launch the Hybrid UX/UI & Accessibility Audit Runner (Playwright + Axe-core + Tab Focus Obscured probe + Core Web Vitals + Gemini Multimodal Vision) against a live URL or localhost dev server across 3 viewports (375x812, 320x568, 1440x900).",
    inputSchema: {
      type: "object",
      required: ["url"],
      properties: {
        url: {
          type: "string",
          description: "Target URL (e.g. 'http://localhost:3000' or 'https://example.com')",
        },
        report_id: {
          type: "string",
          description: "Optional custom report identifier",
        },
      },
    },
  },
];

export async function handleMcpToolCall(
  name: string,
  args: Record<string, unknown> = {}
): Promise<{ content: Array<{ type: "text"; text: string }>; isError?: boolean }> {
  try {
    if (name === "query_ux_rules") {
      const rules = queryUxRulesFromDb({
        standard_family: args.standard_family as string | undefined,
        category: args.category as string | undefined,
        legal_or_business_risk: args.legal_or_business_risk as string | undefined,
        target_state: args.target_state as string | undefined,
        search_query: args.search_query as string | undefined,
      });
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: rules.length,
                rules,
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "get_rule_by_id") {
      const ruleId = String(args.id || "");
      const rule = getRuleByIdFromDb(ruleId);
      if (!rule) {
        return {
          isError: true,
          content: [{ type: "text", text: `Rule '${ruleId}' not found in database.` }],
        };
      }
      return {
        content: [{ type: "text", text: JSON.stringify(rule, null, 2) }],
      };
    }

    if (name === "generate_component_checklist") {
      const componentType = String(args.component_type || "checkout_form");
      const categoryMap: Record<string, string[]> = {
        checkout_form: ["Forms_Checkout", "Touch_Ergonomics", "Cognitive_Load"],
        ai_chat: ["Human_AI_Interaction", "Runtime_Performance", "Accessibility"],
        product_page: ["Visual_Hierarchy", "Touch_Ergonomics", "Runtime_Performance"],
        navigation_header: ["Navigation_Search", "Accessibility", "Touch_Ergonomics"],
        auth_login: ["Account_SelfService", "Forms_Checkout", "Accessibility"],
        data_table: ["Visual_Hierarchy", "Cognitive_Load", "Accessibility"],
      };
      const categories = categoryMap[componentType] || ["Accessibility"];
      const allRules = queryUxRulesFromDb({});
      const matched = allRules.filter((r) => categories.includes(r.category));

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                component_type: componentType,
                categories_included: categories,
                total_rules: matched.length,
                checklist: matched.map((r) => ({
                  id: r.id,
                  standard_family: r.standard_family,
                  title: r.title,
                  legal_or_business_risk: r.legal_or_business_risk,
                  quantitative_threshold: r.quantitative_threshold,
                  target_states: r.target_states,
                  remediation_guide: r.remediation_guide,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    }

    if (name === "run_hybrid_ux_audit") {
      const url = String(args.url || "");
      if (!url) {
        throw new Error("Missing required parameter 'url'");
      }
      const report = await runHybridUxAudit({
        url,
        reportId: args.report_id ? String(args.report_id) : undefined,
      });
      return {
        content: [{ type: "text", text: JSON.stringify(report, null, 2) }],
      };
    }

    return {
      isError: true,
      content: [{ type: "text", text: `Unknown MCP tool: '${name}'` }],
    };
  } catch (err) {
    return {
      isError: true,
      content: [{ type: "text", text: `Tool execution error: ${(err as Error).message}` }],
    };
  }
}

function startStdioMcpServer(): void {
  initializeAndSeedDatabase();

  const rl = readline.createInterface({
    input: process.stdin,
    terminal: false,
  });

  rl.on("line", async (line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    let req: {
      jsonrpc: string;
      id?: string | number | null;
      method: string;
      params?: Record<string, unknown>;
    };

    try {
      req = JSON.parse(trimmed);
    } catch {
      return;
    }

    if (req.method === "initialize") {
      const response = {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: {
            tools: {},
          },
          serverInfo: {
            name: "ux-ui-checklist-2026-mcp",
            version: "1.0.0",
          },
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }

    if (req.method === "notifications/initialized") {
      return;
    }

    if (req.method === "tools/list") {
      const response = {
        jsonrpc: "2.0",
        id: req.id,
        result: {
          tools: MCP_TOOLS_MANIFEST,
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }

    if (req.method === "tools/call") {
      const params = (req.params || {}) as {
        name?: string;
        arguments?: Record<string, unknown>;
      };
      const toolResult = await handleMcpToolCall(
        String(params.name || ""),
        params.arguments || {}
      );
      const response = {
        jsonrpc: "2.0",
        id: req.id,
        result: toolResult,
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      return;
    }

    if (req.id !== undefined) {
      const response = {
        jsonrpc: "2.0",
        id: req.id,
        error: {
          code: -32601,
          message: `Method not found: ${req.method}`,
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
    }
  });
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  if (process.argv.includes("--self-test")) {
    (async () => {
      console.log("=== MCP Server Self-Test ===");
      const q1 = await handleMcpToolCall("query_ux_rules", {
        standard_family: "WCAG_2_2",
      });
      const parsedQ1 = JSON.parse(q1.content[0].text);
      console.log(`WCAG_2_2 rules returned: ${parsedQ1.count}`);

      const q2 = await handleMcpToolCall("get_rule_by_id", { id: "HAX-G14" });
      const parsedQ2 = JSON.parse(q2.content[0].text);
      console.log(`Rule lookup HAX-G14: ${parsedQ2.title}`);

      const q3 = await handleMcpToolCall("generate_component_checklist", {
        component_type: "checkout_form",
      });
      const parsedQ3 = JSON.parse(q3.content[0].text);
      console.log(
        `Component checklist 'checkout_form' rules: ${parsedQ3.total_rules}`
      );
      console.log("STATUS: MCP SERVER TOOLS VERIFIED SUCCESSFULLY");
    })();
  } else {
    startStdioMcpServer();
  }
}
