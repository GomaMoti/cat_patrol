// ===== Grok 垢分析チェッカー - 設定ポップアップ =====

const I18N = {
  ja: {
    appTitle: 'グロックと猫のパトロール',
    secIconClick: '🖱 アイコンクリックの動作',
    optIconSettings: 'この設定画面を開く（デフォルト）',
    optIconManual: '手動でハンドル入力して調べる',
    secManual: '🔍 手動検索',
    lblManualInput: '@ハンドル or URL を入力して調べる',
    btnManualSearch: '調べる',
    secEmoji: '😺 ツイートボタン絵文字',
    lblEmoji: 'タイムライン上のボタン文字',
    secClickMode: '⚡ ツイートボタンのクリック動作',
    optClickInstant: '即Grok起動（シングルクリックで即分析）',
    optClickModal: 'チェックボックスを先に表示してから分析',
    noteClick: '※ 長押し（300ms）またはShiftクリックは常にチェックボックスを表示',
    secPrompt: '📝 Grokプロンプトテンプレート',
    lblPromptTemplate: 'プロンプト全体（{handle} などの変数が使えます）',
    btnReset: 'デフォルトに戻す',
    secCategories: '🚩 チェックカテゴリ',
    secCache: '🗂 キャッシュ管理',
    lblCacheExpiry: '調査済み有効期限',
    optMin30: '30分',
    optHour1: '1時間',
    optHour3: '3時間',
    optHour24: '24時間',
    btnClearCache: '🗑 キャッシュをすべてクリア',
    footerText: '🔒 設定・キャッシュはローカルに保存。外部送信なし。<br>分析データはGrok（x.com）にのみ送信されます。',
    toastSaved: '保存しました ✓',
    cat1: '投資・商材勧誘',
    cat2: '煽り・インプレ稼ぎ',
    cat3: 'AI量産・誤認誘導',
    cat4: 'なりすまし・偽装アカ',
    secCustomList: '📝 カスタムチェックリスト',
    optUseCustom: 'カスタムリストを使用する',
    placeholderCatName: 'カテゴリ名',
    placeholderCatItems: '項目（改行区切りで最大4行推奨）',
    defaultPromptTemplate: 'You are an expert OSINT investigator and grifter detector on X. Analyze this account for: AI grifters, engagement farmers, clickbait merchants, hype merchants, fake gurus, rage baiters, doom merchants, crisis mongers, affiliate spam bloggers.\n\nAccount: @{handle}\nURL: {url}\n\nStep-by-step analysis:\n1. Profile check: bio, join date, follower/following config, profile pic.\n2. Recent posts: repetitive hype, templates, low original content.\n3. Engagement check: anomaly vs followers?\n4. Red flags: DM誘導, fear tactics, paid product links.\n5. Coordinated behavior?\n6. Verdict (日本語): カテゴリ・疑惑度(0-100%)・即ブロック推奨度・根拠\n{checked_items}\n安全第一！ヤバそうなら即ブロック＆通報にゃ！',
    confirmClear: '調査済みキャッシュをすべてクリアしますにゃ？'
  },
  en: {
    appTitle: 'Grok & Cat Patrol',
    secIconClick: '🖱 Icon Click Action',
    optIconSettings: 'Open Settings (Default)',
    optIconManual: 'Manual Handle Input',
    secManual: '🔍 Manual Search',
    lblManualInput: 'Enter @handle or URL',
    btnManualSearch: 'Analyze',
    secEmoji: '😺 Tweet Button Emoji',
    lblEmoji: 'Button Emoji on Timeline',
    secClickMode: '⚡ Button Click Action',
    optClickInstant: 'Instant Grok (Single click to analyze)',
    optClickModal: 'Show Checkboxes first',
    noteClick: '* Long press (300ms) or Shift+Click always shows checkboxes',
    secPrompt: '📝 Grok Prompt Template',
    lblPromptTemplate: 'Full Prompt Template (supports variables like {handle})',
    btnReset: 'Reset to Default',
    secCategories: '🚩 Check Categories',
    secCache: '🗂 Cache Management',
    lblCacheExpiry: 'Checked Cache Expiry',
    optMin30: '30 min',
    optHour1: '1 hour',
    optHour3: '3 hours',
    optHour24: '24 hours',
    btnClearCache: '🗑 Clear All Cache',
    footerText: '🔒 Settings/Cache saved locally. No external tracking.<br>Analysis data is only sent to Grok (x.com).',
    toastSaved: 'Saved ✓',
    cat1: 'Grifters/Scams',
    cat2: 'Engagement/Rage Bait',
    cat3: 'AI Grifters',
    cat4: 'Fake/Impersonation',
    secCustomList: '📝 Custom Checklist',
    optUseCustom: 'Use custom checklist',
    placeholderCatName: 'Category Name',
    placeholderCatItems: 'Items (1 per line, max 4 lines)',
    defaultPromptTemplate: 'You are an expert OSINT investigator and grifter detector on X. Analyze this account for: AI grifters, engagement farmers, clickbait merchants, hype merchants, fake gurus, rage baiters, doom merchants, crisis mongers, affiliate spam bloggers.\n\nAccount: @{handle}\nURL: {url}\n\nStep-by-step analysis:\n1. Profile check: bio, join date, follower/following config, profile pic.\n2. Recent posts: repetitive hype, templates, low original content.\n3. Engagement check: anomaly vs followers?\n4. Red flags: DM redirects, fear tactics, paid product links.\n5. Coordinated behavior?\n6. Verdict (in English): Category, Suspicion level(0-100%), Block recommendation, Key evidence\n{checked_items}\nBe brutally honest and precise.',
    confirmClear: 'Are you sure you want to clear all checked cache?'
  }
};

const DEFAULTS = {
  lang: 'ja',
  buttonEmoji: '🐱',
  clickMode: 'instant',
  iconClickMode: 'settings',
  cacheExpireMs: 3600000,
  promptTemplate: I18N.ja.defaultPromptTemplate,
  categories: {
    'cat1': true,
    'cat2': true,
    'cat3': true,
    'cat4': true,
  },
  useCustomCategories: false,
  customCatNames: { cat1: '', cat2: '', cat3: '', cat4: '' },
  customCatItems: { cat1: [], cat2: [], cat3: [], cat4: [] }
};

let settings = { ...DEFAULTS };
let cacheData = {};

// ===== ストレージ読み込み =====
chrome.storage.local.get(['gck_sakura_settings', 'gck_sakura_cache'], (res) => {
  if (res.gck_sakura_settings) {
    settings = { ...DEFAULTS, ...res.gck_sakura_settings };
    if (res.gck_sakura_settings.categories) {
      settings.categories = { ...DEFAULTS.categories, ...res.gck_sakura_settings.categories };
    }
  }
  if (!settings.lang) settings.lang = 'ja';
  
  // Legacy prompt migration
  if (settings.promptPrefix && !settings.promptTemplate) {
    settings.promptTemplate = settings.promptPrefix + "\n\nAccount: @{handle}\nURL: {url}\n\n" + (settings.lang === 'en' ? "Step-by-step analysis:\n1. Profile check: bio, join date, follower/following config, profile pic.\n2. Recent posts: repetitive hype, templates, low original content.\n3. Engagement check: anomaly vs followers?\n4. Red flags: DM redirects, fear tactics, paid product links.\n5. Coordinated behavior?\n6. Verdict (in English): Category, Suspicion level(0-100%), Block recommendation, Key evidence\n{checked_items}" : "Step-by-step analysis:\n1. Profile check: bio, join date, follower/following config, profile pic.\n2. Recent posts: repetitive hype, templates, low original content.\n3. Engagement check: anomaly vs followers?\n4. Red flags: DM誘導, fear tactics, paid product links.\n5. Coordinated behavior?\n6. Verdict (日本語): カテゴリ・疑惑度(0-100%)・即ブロック推奨度・根拠\n{checked_items}") + "\n\n" + settings.promptSuffix;
    delete settings.promptPrefix;
    delete settings.promptSuffix;
    save();
  }
  
  // Legacy category migration
  if (settings.categories['商材系'] !== undefined) {
    settings.categories.cat1 = settings.categories['商材系'];
    settings.categories.cat2 = settings.categories['煽り・エンゲージメント系'];
    settings.categories.cat3 = settings.categories['AI Grifter系'];
    settings.categories.cat4 = settings.categories['サクラ・なりすまし系'];
    delete settings.categories['商材系'];
    delete settings.categories['煽り・エンゲージメント系'];
    delete settings.categories['AI Grifter系'];
    delete settings.categories['サクラ・なりすまし系'];
    save();
  }
  
  if (res.gck_sakura_cache) cacheData = res.gck_sakura_cache;
  applyLocalization();
  renderSettings();
});

// ===== UI描画 =====
function applyLocalization() {
  const lang = settings.lang || 'ja';
  document.getElementById('lang-select').value = lang;
  
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    if (I18N[lang] && I18N[lang][key]) {
      if (key === 'footerText') {
        el.innerHTML = I18N[lang][key];
      } else {
        el.textContent = I18N[lang][key];
      }
    }
  });

  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    const key = el.getAttribute('data-i18n-placeholder');
    if (I18N[lang] && I18N[lang][key]) {
      el.placeholder = I18N[lang][key];
    }
  });
}

function renderSettings() {
  const lang = settings.lang || 'ja';
  
  // [0] アイコンクリックモード
  const icoVal = settings.iconClickMode || 'settings';
  document.querySelector(`input[name="iconClickMode"][value="${icoVal}"]`).checked = true;
  toggleManualSection(icoVal === 'manual');

  // [1] 絵文字
  document.getElementById('button-emoji').value = settings.buttonEmoji || '🐱';

  // [2] クリックモード
  const clickVal = settings.clickMode || 'instant';
  document.querySelector(`input[name="clickMode"][value="${clickVal}"]`).checked = true;

  // [3] プロンプト
  document.getElementById('prompt-template').value = settings.promptTemplate || I18N[lang].defaultPromptTemplate;

  // [4] カテゴリ
  const catList = document.getElementById('categories-list');
  catList.innerHTML = '';
  Object.entries(settings.categories).forEach(([catKey, enabled]) => {
    const label = document.createElement('label');
    label.className = 'check-label';
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = !!enabled;
    cb.dataset.cat = catKey;
    cb.addEventListener('change', () => {
      settings.categories[catKey] = cb.checked;
      save();
    });
    label.appendChild(cb);
    label.appendChild(document.createTextNode(' ' + (I18N[lang][catKey] || catKey)));
    catList.appendChild(label);
  });

  // [4.5] カスタム
  const useCust = !!settings.useCustomCategories;
  document.getElementById('use-custom-categories').checked = useCust;
  document.getElementById('custom-list-area').style.display = useCust ? 'flex' : 'none';
  
  for (let i = 1; i <= 4; i++) {
    document.getElementById(`cust-cat${i}-name`).value = (settings.customCatNames && settings.customCatNames[`cat${i}`]) || '';
    const items = (settings.customCatItems && settings.customCatItems[`cat${i}`]) || [];
    document.getElementById(`cust-cat${i}-items`).value = items.join('\n');
  }

  // [5] キャッシュ有効期限
  document.getElementById('cache-expire').value = String(settings.cacheExpireMs || 3600000);
}

// ===== 手動セクションの表示切り替え =====
function toggleManualSection(show) {
  document.getElementById('manual-section').style.display = show ? '' : 'none';
}

// ===== 保存 =====
let saveTimer = null;
function save() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    chrome.storage.local.set({ gck_sakura_settings: settings }, () => {
      // content scriptに変更を通知
      chrome.tabs.query({ url: ['*://x.com/*', '*://twitter.com/*'] }, (tabs) => {
        tabs.forEach(tab => {
          chrome.tabs.sendMessage(tab.id, { type: 'GCK_SETTINGS_UPDATED', settings }).catch(() => {});
        });
      });
      showToast();
    });
  }, 300);
}

function showToast() {
  const toast = document.getElementById('toast');
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 1800);
}

// ===== イベントリスナー =====

// 言語切替
document.getElementById('lang-select').addEventListener('change', (e) => {
  settings.lang = e.target.value;
  // プロンプトがデフォルトのままなら言語に合わせて切り替える
  const oldLang = settings.lang === 'ja' ? 'en' : 'ja';
  if (settings.promptTemplate === I18N[oldLang].defaultPromptTemplate) {
    settings.promptTemplate = I18N[settings.lang].defaultPromptTemplate;
  }
  save();
  applyLocalization();
  renderSettings();
});

// [0] アイコンクリックモード
document.querySelectorAll('input[name="iconClickMode"]').forEach(rb => {
  rb.addEventListener('change', () => {
    settings.iconClickMode = rb.value;
    toggleManualSection(rb.value === 'manual');
    save();
  });
});

// 手動検索
document.getElementById('manual-submit').addEventListener('click', () => {
  const raw = document.getElementById('manual-handle').value.trim();
  if (!raw) return;
  const handle = raw.replace(/^@/, '').replace(/https?:\/\/x\.com\//, '').replace(/[^A-Za-z0-9_]/g, '').substring(0, 50);
  if (!handle) return;

  const prompt = (settings.promptTemplate || I18N[settings.lang].defaultPromptTemplate)
    .replaceAll('{handle}', handle)
    .replaceAll('{url}', `https://x.com/${handle}`)
    .replaceAll('{name}', handle)
    .replaceAll('{checked_items}', '');

  chrome.tabs.create({ url: `https://x.com/i/grok?text=${encodeURIComponent(prompt.slice(0, 2000))}` });
});

// [1] 絵文字
document.getElementById('button-emoji').addEventListener('input', (e) => {
  settings.buttonEmoji = e.target.value || '🐱';
  save();
});

// [2] クリックモード
document.querySelectorAll('input[name="clickMode"]').forEach(rb => {
  rb.addEventListener('change', () => {
    settings.clickMode = rb.value;
    save();
  });
});

// [3] プロンプト
document.getElementById('prompt-template').addEventListener('input', (e) => {
  settings.promptTemplate = e.target.value;
  save();
});
document.getElementById('reset-prompt').addEventListener('click', () => {
  const lang = settings.lang || 'ja';
  settings.promptTemplate = I18N[lang].defaultPromptTemplate;
  document.getElementById('prompt-template').value = I18N[lang].defaultPromptTemplate;
  save();
});

// [4.5] カスタムチェックリスト
document.getElementById('use-custom-categories').addEventListener('change', (e) => {
  settings.useCustomCategories = e.target.checked;
  document.getElementById('custom-list-area').style.display = settings.useCustomCategories ? 'flex' : 'none';
  save();
});

for (let i = 1; i <= 4; i++) {
  document.getElementById(`cust-cat${i}-name`).addEventListener('input', (e) => {
    if (!settings.customCatNames) settings.customCatNames = { cat1:'', cat2:'', cat3:'', cat4:'' };
    settings.customCatNames[`cat${i}`] = e.target.value;
    save();
  });
  document.getElementById(`cust-cat${i}-items`).addEventListener('input', (e) => {
    if (!settings.customCatItems) settings.customCatItems = { cat1:[], cat2:[], cat3:[], cat4:[] };
    settings.customCatItems[`cat${i}`] = e.target.value.split('\n').map(s => s.trim()).filter(Boolean);
    save();
  });
}

// [5] キャッシュ
document.getElementById('cache-expire').addEventListener('change', (e) => {
  settings.cacheExpireMs = parseInt(e.target.value);
  save();
});
document.getElementById('clear-cache').addEventListener('click', () => {
  const lang = settings.lang || 'ja';
  if (!confirm(I18N[lang].confirmClear)) return;
  chrome.storage.local.remove('gck_sakura_cache', showToast);
});
