const CHEVRON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

function difficultyClass(difficulty) {
  return 'difficulty-' + difficulty.toLowerCase();
}

function renderChips(items, className) {
  return items.map((item) => `<span class="${className}">${item}</span>`).join('');
}

function renderPatternCard(pattern) {
  const article = document.createElement('article');
  article.className = 'p-card';
  article.dataset.difficulty = pattern.difficulty;
  article.style.setProperty('--card-accent', accentForDifficulty(pattern.difficulty));

  const detailId = `detail-${pattern.id}`;

  article.innerHTML = `
    <div class="p-card-top">
      <div class="p-card-icon">
        <svg viewBox="0 0 24 24">${pattern.icon}</svg>
      </div>
      <div>
        <span class="difficulty-badge ${difficultyClass(pattern.difficulty)}">${pattern.difficulty}</span>
        <h3 class="p-card-title">${pattern.title}</h3>
      </div>
    </div>
    <div class="p-card-body">
      <p class="p-card-summary">${pattern.summary}</p>
      <p class="p-card-catches"><strong>Catches:</strong> ${pattern.failureMode}</p>
      <div class="chip-row">${renderChips(pattern.tags, 'chip')}</div>
      <div class="chip-row">${renderChips(pattern.tools, 'tool-chip')}</div>
      <button class="expand-btn" type="button" aria-expanded="false" aria-controls="${detailId}">
        How it works ${CHEVRON_ICON}
      </button>
      <div class="p-card-detail" id="${detailId}" hidden>
        <p><strong>How it works:</strong> ${pattern.howItWorks}</p>
        <p><strong>Best for:</strong> ${pattern.whenToUse}</p>
        <p><strong>Limitation:</strong> ${pattern.limitation}</p>
      </div>
    </div>
  `;

  const btn = article.querySelector('.expand-btn');
  const detail = article.querySelector('.p-card-detail');
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!expanded));
    detail.hidden = expanded;
  });

  return article;
}

function accentForDifficulty(difficulty) {
  if (difficulty === 'Beginner') return 'var(--accent-2)';
  if (difficulty === 'Advanced') return 'var(--accent-3)';
  return 'var(--accent-1)';
}

function initFilterBar(grid) {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;

  bar.addEventListener('click', (e) => {
    const btn = e.target.closest('.filter-btn');
    if (!btn) return;

    bar.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    const filter = btn.dataset.filter;
    grid.querySelectorAll('.p-card').forEach((card) => {
      card.style.display = filter === 'all' || card.dataset.difficulty === filter ? '' : 'none';
    });
  });
}

function injectStructuredData(patterns) {
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'AI Benchmarks — Eval Pattern Catalog',
    itemListElement: patterns.map((pattern, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'CreativeWork',
        name: pattern.title,
        description: pattern.summary,
      },
    })),
  };

  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(ld);
  document.head.appendChild(script);
}

function currentTheme() {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'light' || attr === 'dark') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const SUN_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>';
const MOON_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>';

function initThemeToggle() {
  const btn = document.getElementById('theme-toggle');
  if (!btn) return;

  function paint(theme) {
    btn.innerHTML = theme === 'dark' ? SUN_ICON : MOON_ICON;
    btn.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  paint(currentTheme());

  btn.addEventListener('click', () => {
    const next = currentTheme() === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', next);
    try {
      localStorage.setItem('theme', next);
    } catch (e) {
      /* localStorage unavailable — theme just won't persist */
    }
    paint(next);
  });
}

async function init() {
  initThemeToggle();

  const grid = document.getElementById('catalog-grid');
  try {
    const res = await fetch('patterns.json', { cache: 'no-store' });
    const data = await res.json();
    data.patterns.forEach((pattern) => grid.appendChild(renderPatternCard(pattern)));
    initFilterBar(grid);
    injectStructuredData(data.patterns);
  } catch (err) {
    grid.innerHTML = '<p class="load-error">Couldn\'t load the pattern catalog. Try refreshing.</p>';
    console.error('Failed to load patterns.json', err);
  }
}

init();
