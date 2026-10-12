# Final QA report

Дата финальной проверки: **17.09.2026**.

## 1. Backend and automated tests

- `python -m pytest -q -m "not slow"` — **175 passed, 1 deselected**.
- `python -m pytest -q -m slow` — **1 passed, 175 deselected**.
- Итого подтверждено: **176 passing tests**.

Тесты приведены в соответствие с расширенным банком из 120 заданий и текущим experiment space из 8 ML-конфигураций.

## 2. Python integrity and source audit

- `python -m compileall -q app scripts tests` — **PASS**.
- source files: **117**;
- source lines: **11 214** (**9 643** non-empty);
- backend lines: **7 896**;
- frontend lines: **1 269**;
- tests lines: **2 049**;
- Python functions: **484**;
- Python classes: **75**;
- syntax errors: **0**;
- suspicious template/AI markers reported by project audit: **0**;
- итог: **PASS**.

## 3. Dataset quality

Synthetic bootstrap dataset:

- rows: **14 400**;
- users: **180**;
- tasks: **120**;
- skills: **6**;
- positive rate: **0.6049**;
- feature schema: **PASS**;
- finite numeric values: **PASS**;
- constant numeric features: **0**;
- duplicate attempt ids: **0**;
- timestamps: **PASS**;
- итог data-quality gate: **PASS**.

Данные явно отделены от реального педагогического эксперимента и используются для воспроизводимой алгоритмической проверки.

## 4. Active model

Active model: **hgb_regularized-20260917105441-b6e211** (`HistGradientBoosting`).

Learner-disjoint holdout выбранной конфигурации:

- ROC-AUC: **0.7764**;
- PR-AUC: **0.8173**;
- Brier: **0.1891**;
- Log Loss: **0.5592**;
- F1: **0.7651**;
- ECE: **0.0222**.

Train/validation split: **10 800 / 3 600 строк**, **135 / 45 обучаемых**, user overlap = **0**.

## 5. Primary research endpoint: adaptive policy

Matched synthetic simulation:

- learners: **60**;
- horizon: **90 заданий**;
- mastery criterion: mean latent mastery ≥ **0.70**, каждый skill ≥ **0.50**;
- ML-adaptive restricted mean tasks to mastery: **73.3**;
- random: **84.6**;
- экономия: **11.3 задания (13.35%)**;
- 95% CI: **8.2–14.6**;
- paired randomization: **p < 0.001**;
- Cohen's dz: **0.90**;
- mastery reach rate: **70% vs 25%**.

Дополнительная метрика прироста мастерства:

- ML-adaptive: **0.211**;
- random: **0.162**;
- advantage: **0.048**;
- 95% CI: **0.044–0.053**;
- **p < 0.001**;
- Cohen's dz: **2.58**.

## 6. Multi-seed robustness

Пять независимых simulation seed: **11, 23, 37, 53, 71**.

- положительное преимущество time-to-mastery: **5/5**;
- статистически значимое преимущество time-to-mastery: **5/5**;
- средняя экономия: **8.14 задания**;
- диапазон экономии: **6.88–9.54 задания**;
- положительное и статистически значимое преимущество mastery gain: **5/5**.

## 7. Classical educational baselines

На том же learner-disjoint holdout:

| Model | ROC-AUC | Brier ↓ |
|---|---:|---:|
| ML adaptive predictor | 0.7764 | 0.1891 |
| IRT-2PL online | 0.7542 | 0.2016 |
| Elo | 0.7424 | 0.2019 |
| PFA | 0.7090 | 0.2184 |
| BKT | 0.6256 | 0.2483 |

Paired user-level Brier comparisons выполняются на уровне обучаемого. После Holm-коррекции ML имеет статистически меньший Brier относительно всех четырёх baseline в текущем synthetic holdout (`adjusted p < 0.001`).

## 8. Research artifacts

В релиз включены:

- `backend/data/reports/policy_simulation_final.json`;
- `backend/data/reports/policy_robustness_final.json`;
- `backend/data/reports/classical_baselines_final.json`;
- `backend/data/reports/evaluation-hgb_regularized-20260917105441-b6e211.json`;
- `docs/RESEARCH_METHODS_AND_RESULTS.md`;
- `docs/HUMAN_VALIDATION_PROTOCOL.md`;
- `docs/DEFENSE_SLIDE_DATA.md`;
- пять актуализированных SVG-графиков в `docs/figures/`.

Все SVG прошли XML parse validation. `frontend/dist/research-patch.js` прошёл `node --check`.

## 9. Итог

Критические замечания к исследовательской части закрыты: адаптивность проверяется по time-to-mastery и mastery gain, увеличены датасет и банк заданий, добавлены Elo/IRT/BKT/PFA, статистические сравнения и multi-seed robustness, сформулирована научная новизна и подготовлен протокол внешней проверки на реальных обучаемых.
