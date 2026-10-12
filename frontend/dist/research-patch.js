(() => {
  const API = 'http://127.0.0.1:8000';
  const TOKEN_KEY = 'diglit-access-token';
  const fmt = (value, digits = 1) => value == null || Number.isNaN(Number(value)) ? '—' : Number(value).toFixed(digits);
  const pct = (value) => value == null ? '—' : `${(Number(value) * 100).toFixed(1)}%`;

  async function post(path) {
    const token = localStorage.getItem(TOKEN_KEY);
    const response = await fetch(`${API}${path}`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) {
      let detail = `HTTP ${response.status}`;
      try { detail = (await response.json()).detail || detail; } catch (_) {}
      throw new Error(detail);
    }
    return response.json();
  }

  function shell() {
    const pageHeader = [...document.querySelectorAll('.page-header')].find((node) => node.textContent.includes('Диагностика'));
    if (!pageHeader || document.getElementById('research-masterymetric-patch')) return;
    const parent = pageHeader.parentElement;
    if (!parent) return;
    const section = document.createElement('section');
    section.id = 'research-masterymetric-patch';
    section.className = 'research-final-patch';
    section.innerHTML = `
      <h2>Ключевая исследовательская проверка</h2>
      <p>Главная метрика ВКР — количество заданий до порога мастерства. Здесь же запускается сравнение с Elo, IRT-2PL, BKT и PFA.</p>
      <div class="research-final-actions">
        <button data-action="mastery">Адаптивность: порог мастерства</button>
        <button data-action="baselines">Elo / IRT / BKT / PFA</button>
      </div>
      <div data-result></div>
    `;
    pageHeader.insertAdjacentElement('afterend', section);

    const result = section.querySelector('[data-result]');
    const buttons = [...section.querySelectorAll('button')];
    const busy = (state) => buttons.forEach((button) => { button.disabled = state; });

    section.querySelector('[data-action="mastery"]').addEventListener('click', async () => {
      busy(true); result.innerHTML = '<p>Выполняется paired policy simulation…</p>';
      try {
        const data = await post('/research/policy-simulation?learners=60&steps=90&mastery_threshold=0.70&minimum_skill_mastery=0.50');
        const endpoint = data.primary_endpoint || {};
        const policies = data.policies || [];
        result.innerHTML = `
          <div class="research-final-grid">
            <div class="research-final-metric"><span>ML-адаптивный</span><strong>${fmt(endpoint.adaptive_restricted_mean_tasks)}</strong></div>
            <div class="research-final-metric"><span>Случайный</span><strong>${fmt(endpoint.random_restricted_mean_tasks)}</strong></div>
            <div class="research-final-metric"><span>Экономия</span><strong>${fmt(endpoint.tasks_saved?.estimate)} (${pct(endpoint.relative_task_reduction)})</strong></div>
            <div class="research-final-metric"><span>p-value</span><strong>${fmt(endpoint.p_value_one_sided_random_slower, 4)}</strong></div>
          </div>
          <p><strong>Итог:</strong> ML-адаптивный подбор достигает порога мастерства за ${fmt(endpoint.adaptive_restricted_mean_tasks)} задания против ${fmt(endpoint.random_restricted_mean_tasks)} при случайном подборе. 95% CI экономии: ${fmt(endpoint.tasks_saved?.lower)}–${fmt(endpoint.tasks_saved?.upper)}.</p>
          <p class="research-final-note">Синтетическая симуляция подтверждает алгоритмическую адаптивность, но не заменяет эксперимент на реальных студентах.</p>
          <table class="research-final-table"><thead><tr><th>Политика</th><th>Прирост мастерства</th><th>До порога</th><th>Достигли порога</th></tr></thead><tbody>${policies.map((row) => `<tr><td>${row.policy}</td><td>${fmt(row.mastery_gain?.estimate,3)}</td><td>${fmt(row.restricted_steps_to_mastery?.estimate)}</td><td>${pct(row.mastery_reach_rate)}</td></tr>`).join('')}</tbody></table>
        `;
      } catch (error) {
        result.innerHTML = `<p class="research-final-error">${error.message}</p>`;
      } finally { busy(false); }
    });

    section.querySelector('[data-action="baselines"]').addEventListener('click', async () => {
      busy(true); result.innerHTML = '<p>Выполняется benchmark классических моделей…</p>';
      try {
        const data = await post('/research/classical-baselines');
        const rows = data.models || [];
        const max = Math.max(...rows.map((row) => Number(row.metrics?.brier || 0)), 0.001);
        result.innerHTML = `
          <p><strong>Предметные baseline:</strong> Elo, IRT-2PL, BKT, PFA. Brier ниже — лучше. Сравнение использует тот же group-holdout по пользователям.</p>
          <div class="research-final-bars">${rows.map((row) => `<div class="research-final-bar"><span>${row.name}</span><div class="research-final-track"><div class="research-final-fill" style="width:${Math.max(4,Number(row.metrics?.brier || 0)/max*100)}%"></div></div><strong>${fmt(row.metrics?.brier,3)}</strong></div>`).join('')}</div>
          <table class="research-final-table"><thead><tr><th>Модель</th><th>ROC-AUC</th><th>PR-AUC</th><th>Brier</th><th>Log Loss</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${row.name}</td><td>${fmt(row.metrics?.roc_auc,3)}</td><td>${fmt(row.metrics?.pr_auc,3)}</td><td>${fmt(row.metrics?.brier,3)}</td><td>${fmt(row.metrics?.log_loss,3)}</td></tr>`).join('')}</tbody></table>
          <p class="research-final-note">На текущем learner-disjoint synthetic holdout ML имеет наименьший Brier; вклад работы при этом оценивается не одной predictive metric, а совокупностью baseline-сравнения, adaptive policy и time-to-mastery.</p>
        `;
      } catch (error) {
        result.innerHTML = `<p class="research-final-error">${error.message}</p>`;
      } finally { busy(false); }
    });
  }

  const observer = new MutationObserver(shell);
  observer.observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('load', shell);
  setInterval(shell, 1200);
})();
