# Руководство по участию в разработке (Contributing Guide)

Спасибо за интерес к развитию **2026 UX/UI & Accessibility Audit Database & Hybrid Testing Engine**!

## Как добавить новое правило UX/UI в базу знаний

Все правила хранятся в модульных JSON-файлах в директории `/database/seed_rules/` и подчиняются строгой схеме `/schema/ux_rules_schema.json` и интерфейсу `UxAuditRule` в `/schema/types.ts`.

### Шаг 1. Выберите соответствующий модуль
1. `01_wcag_2_2_and_3_0.json` — критерии доступности WCAG 2.2 и WCAG 3.0 Draft.
2. `02_platform_design_systems.json` — Apple HIG (iOS 26 / Liquid Glass), Material Design 3, IBM Carbon.
3. `03_ergonomics_and_laws_of_ux.json` — законы эргономики ISO 9241-110:2020 и 30 Laws of UX.
4. `04_baymard_ecommerce_benchmarks.json` — паттерны электронной коммерции и чекаута Baymard Institute.
5. `05_human_ai_interaction.json` — паттерны взаимодействия человек-ИИ (Microsoft HAX, Google PAIR v3, GenAI).
6. `06_core_web_vitals_2026.json` — метрики производительности во времени выполнения (Core Web Vitals).

### Шаг 2. Заполните все обязательные поля правила
Каждое правило обязано содержать:
- `id`: уникальный идентификатор в формате `ПРЕФИКС-КОД` (например, `WCAG-2.4.11`, `BAYMARD-CHK-01`).
- `standard_family` и `category`: строго из перечислений в `/schema/types.ts`.
- `title_ru` и `description_ru`: емкое название и подробное нормативное обоснование на русском языке.
- `legal_or_business_risk`: уровень юридического (EAA/ADA) или конверсионного риска.
- `target_states`: состояния из матрицы IBM Carbon (`default`, `focus-visible`, `viewport_320px`, `dark_mode` и т.д.).
- `quantitative_threshold`: измеримые числовые лимиты (`min_target_px`, `max_lcp_ms`, `min_contrast_text` и т.д.).
- `verification_modality`: `AUTOMATED_DOM`, `AUTOMATED_RUNTIME_PERF`, `AI_MULTIMODAL_VISION` или `MANUAL_INTERACTIVE`.
- `evaluation_outcomes`: `["APPLIED_PASS", "VIOLATED_FAIL", "DOES_NOT_APPLY"]`.
- `playwright_check_snippet`: исполняемый JS-сниппет, возвращающий одно из трех состояний.
- `vision_prompt_heuristic`: четкая инструкция для мультимодальной модели Gemini Vision.
- `remediation_guide_ru`: конкретное руководство по исправлению в коде и дизайне на русском языке.

### Шаг 3. Проверьте схему и пересоберите SQLite-базу
Перед созданием Pull Request выполните:

```bash
npm run validate:schema
npm run seed:db
npm run mcp:test
npm run audit -- --self-test
```

Все четыре команды должны завершиться с кодом `0` без ошибок валидации.
