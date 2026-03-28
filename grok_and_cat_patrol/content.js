// ===== Grok 垢分析 - サクラ・商材チェッカー v2.0 =====
// タイムライン版：各ツイートにワンポチ分析ボタンを追加するにゃ

// ===== デフォルト設定 =====
const GCK_DEFAULTS = {
  lang: 'ja',
  buttonEmoji: '🐱',
  clickMode: 'instant',        // 'instant' = 即Grok起動 / 'modal' = モーダル先表示
  iconClickMode: 'settings',   // 'settings' = 設定画面 / 'manual' = 手動入力（popup側で制御）
  cacheExpireMs: 60 * 60 * 1000, // 1時間
  promptTemplate: 'You are an expert OSINT investigator and grifter detector on X. Analyze this account for: AI grifters, engagement farmers, clickbait merchants, hype merchants, fake gurus, rage baiters, doom merchants, crisis mongers, affiliate spam bloggers.\n\nAccount: @{handle}\nURL: {url}\n\nStep-by-step analysis:\n1. Profile check: bio, join date, follower/following config, profile pic.\n2. Recent posts: repetitive hype, templates, low original content.\n3. Engagement check: anomaly vs followers?\n4. Red flags: DM誘導, fear tactics, paid product links.\n5. Coordinated behavior?\n6. Verdict (日本語): カテゴリ・疑惑度(0-100%)・即ブロック推奨度・根拠\n{checked_items}\n安全第一！ヤバそうなら即ブロック＆通報にゃ！',
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

const I18N = {
  ja: {
    modalTitle: '🔍 @{handle} を詳しく調べる',
    btnSubmit: '🔍 Grokで調べるにゃ！',
    userCheckedHeader: '\n\n【ユーザーが指摘した不審点】\n',
    cat1: '投資・商材勧誘',
    cat2: '煽り・インプレ稼ぎ',
    cat3: 'AI量産・誤認誘導',
    cat4: 'なりすまし・偽装アカ',
    cat1_desc: ['AI副業・高額スクール・情報商材の勧誘', '誘導リンクやアフィ投稿の連投', '「月収◯◯万」「不労所得」などの過大訴求', '根拠不明の投資・FX・暗号資産への誘導'],
    cat2_desc: ['インプレ稼ぎ目的のコピペ・低品質連投', '海外情勢や事件の過度な誇張', '怒り・不安を煽るレイジベイト投稿', '釣り見出しや不快動画へのクリック誘導'],
    cat3_desc: ['AI生成コンテンツの大量投稿（スロップ）', 'AI生成であることを隠した投稿', '「AIで即収益化」系の誇大ノウハウ販売', 'AIツール紹介を装った高額アフィ誘導'],
    cat4_desc: ['AI画像・素材写真の使い回しプロフィール', '有名人・企業・専門家を装う偽アカウント', '反応率に対して不自然なフォロワー規模', '短期間での急激なフォロワー増加']
  },
  en: {
    modalTitle: '🔍 Deep Dive into @{handle}',
    btnSubmit: '🔍 Analyze with Grok!',
    userCheckedHeader: '\n\n[User-flagged suspicious points]\n',
    cat1: 'Grifters/Scams',
    cat2: 'Engagement/Rage Bait',
    cat3: 'AI Grifters',
    cat4: 'Fake/Impersonation',
    cat1_desc: ['Selling AI side-hustles, expensive courses, or info products', 'Affiliate spammer posting excessive redirect links', '"Easy money" or "Make $XX,000/month" claims', 'Endless crypto/Forex/investing "how-to" threads'],
    cat2_desc: ['Exaggerating news for "global crisis/doom" mongering', 'Rage bait (posts to incite fear/anger)', 'Low-effort engagement farming/spam posting', 'Using clickbait headlines to redirect off-platform'],
    cat3_desc: ['Mass-posting AI generated content (Slop farming)', 'Passing off ChatGPT/Grok content as human-written', '"Make $1M with AI! Anyone can do it" hype', 'Promoting AI tools purely for high-comm affiliate links'],
    cat4_desc: ['AI-generated profile pic or looks like a stock model', 'Impersonating celebrities or official titles', 'Suspiciously low engagement relative to follower count', 'Rapid, unnatural follower growth in a short time']
  }
};

// ===== ストレージ =====
let gckSettings = { ...GCK_DEFAULTS };
let gckCache = {};

function saveSettings() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ gck_sakura_settings: gckSettings });
  }
}

function saveCache() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ gck_sakura_cache: gckCache });
  }
}

function initSettings(cb) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.get(['gck_sakura_settings', 'gck_sakura_cache'], (res) => {
      if (res.gck_sakura_settings) {
        gckSettings = { ...GCK_DEFAULTS, ...res.gck_sakura_settings };
        // ネストしたオブジェクトのマージ
        if (res.gck_sakura_settings.categories) {
          gckSettings.categories = { ...GCK_DEFAULTS.categories, ...res.gck_sakura_settings.categories };
        }

        // Legacy category migration
        if (gckSettings.categories['商材系'] !== undefined) {
          gckSettings.categories.cat1 = gckSettings.categories['商材系'];
          gckSettings.categories.cat2 = gckSettings.categories['煽り・エンゲージメント系'];
          gckSettings.categories.cat3 = gckSettings.categories['AI Grifter系'];
          gckSettings.categories.cat4 = gckSettings.categories['サクラ・なりすまし系'];
          delete gckSettings.categories['商材系'];
          delete gckSettings.categories['煽り・エンゲージメント系'];
          delete gckSettings.categories['AI Grifter系'];
          delete gckSettings.categories['サクラ・なりすまし系'];
        }
      }
      if (res.gck_sakura_cache) gckCache = res.gck_sakura_cache;
      if (cb) cb();
    });
  } else {
    if (cb) cb();
  }
}

// 設定変更メッセージをリッスン（popupからのリアルタイム反映）
if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'GCK_SETTINGS_UPDATED') {
      gckSettings = { ...GCK_DEFAULTS, ...msg.settings };
      if (msg.settings.categories) {
        gckSettings.categories = { ...GCK_DEFAULTS.categories, ...msg.settings.categories };
      }
    }
  });
}

// ===== キャッシュ =====
function isRecentlyChecked(handle) {
  const t = gckCache[handle];
  return t && (Date.now() - t) < gckSettings.cacheExpireMs;
}

function markChecked(handle) {
  gckCache[handle] = Date.now();
  saveCache();
}

// ===== ハンドルのサニタイズ =====
function sanitizeHandle(h) {
  if (!h) return '';
  return h.replace(/^@/, '').replace(/[^A-Za-z0-9_]/g, '').substring(0, 50);
}

// ===== ツイートarticleからハンドル取得 =====
function getHandleFromArticle(article) {
  // data-testid="User-Name" 内のリンクを優先
  const userNameEl = article.querySelector('[data-testid="User-Name"] a[href]');
  if (userNameEl) {
    const m = userNameEl.href.match(/x\.com\/([A-Za-z0-9_]+)/);
    if (m) return sanitizeHandle(m[1]);
  }
  // フォールバック: article内の@ハンドルリンク
  const links = article.querySelectorAll('a[href]');
  for (const link of links) {
    const m = link.href.match(/x\.com\/([A-Za-z0-9_]+)$/);
    if (m && !['messages', 'home', 'explore', 'notifications', 'settings', 'i', 'search', 'following', 'followers'].includes(m[1])) {
      return sanitizeHandle(m[1]);
    }
  }
  return null;
}

// ===== ツイートarticleからプロフィール情報を取得 =====
function getMetaFromArticle(article) {
  const nameEl = article.querySelector('[data-testid="User-Name"]');
  const displayName = nameEl?.querySelector('span')?.innerText || '';

  // フォロワー数はタイムラインには出てないので空欄でOK
  return { displayName };
}

// ===== Grokプロンプト組み立て =====
function buildPrompt(handle, meta, checkedItems = []) {
  const lang = gckSettings.lang || 'ja';
  const i18n = I18N[lang] || I18N.ja;

  const checkSection = checkedItems.length > 0
    ? `${i18n.userCheckedHeader}${checkedItems.map(i => `- ${i}`).join('\n')}`
    : '';

  const template = gckSettings.promptTemplate || GCK_DEFAULTS.promptTemplate;

  return template
    .replaceAll('{handle}', handle)
    .replaceAll('{url}', `https://x.com/${handle}`)
    .replaceAll('{name}', meta.displayName || handle)
    .replaceAll('{checked_items}', checkSection);
}

// ===== ミニモーダル =====
let currentModal = null;

function removeModal() {
  if (currentModal) {
    currentModal.remove();
    currentModal = null;
  }
}

function showMiniModal(handle, meta, anchorEl) {
  removeModal();

  const overlay = document.createElement('div');
  overlay.className = 'gck2-overlay';

  const modal = document.createElement('div');
  modal.className = 'gck2-modal';

  // 閉じるボタン
  const closeBtn = document.createElement('button');
  closeBtn.className = 'gck2-close';
  closeBtn.textContent = '✕';
  closeBtn.addEventListener('click', removeModal);

  const lang = gckSettings.lang || 'ja';
  const i18n = I18N[lang] || I18N.ja;

  // タイトル
  const title = document.createElement('div');
  title.className = 'gck2-title';
  title.textContent = i18n.modalTitle.replace('{handle}', handle);

  // チェックボックスエリア
  const checkArea = document.createElement('div');
  checkArea.className = 'gck2-check-area';

  const activeCategories = Object.entries(gckSettings.categories)
    .filter(([, on]) => on)
    .map(([cat]) => cat);

  activeCategories.forEach(catKey => {
    let catName = i18n[catKey] || catKey;
    let items = i18n[catKey + '_desc'];

    if (gckSettings.useCustomCategories) {
      if (gckSettings.customCatNames && gckSettings.customCatNames[catKey]) {
        catName = gckSettings.customCatNames[catKey];
      }
      if (gckSettings.customCatItems && gckSettings.customCatItems[catKey] && gckSettings.customCatItems[catKey].length > 0) {
        items = gckSettings.customCatItems[catKey];
      }
    }

    if (!items || items.length === 0) return;

    const catLabel = document.createElement('div');
    catLabel.className = 'gck2-cat-label';
    catLabel.textContent = catName;
    checkArea.appendChild(catLabel);

    items.forEach(item => {
      const label = document.createElement('label');
      label.className = 'gck2-check-label';
      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'gck2-checkbox';
      cb.value = item;
      label.appendChild(cb);
      label.appendChild(document.createTextNode(' ' + item));
      checkArea.appendChild(label);
    });
  });

  // 実行ボタン
  const submitBtn = document.createElement('button');
  submitBtn.className = 'gck2-submit';
  submitBtn.textContent = i18n.btnSubmit;
  submitBtn.addEventListener('click', () => {
    const checked = [...modal.querySelectorAll('input.gck2-checkbox:checked')].map(c => c.value);
    const prompt = buildPrompt(handle, meta, checked);
    markChecked(handle);
    removeModal();
    window.open(`https://x.com/i/grok?text=${encodeURIComponent(prompt.slice(0, 2000))}`, '_blank');
  });

  modal.append(closeBtn, title, checkArea, submitBtn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);
  currentModal = overlay;

  // クリックアウトで閉じる
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) removeModal();
  });

  // 画面内に収まるように位置調整
  requestAnimationFrame(() => {
    const rect = anchorEl.getBoundingClientRect();
    const mH = modal.offsetHeight;
    const top = rect.bottom + 8 + window.scrollY;
    const left = Math.min(rect.left + window.scrollX, window.innerWidth - modal.offsetWidth - 16);
    modal.style.position = 'absolute';
    modal.style.top = `${top}px`;
    modal.style.left = `${Math.max(left, 8)}px`;
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    modal.style.position = 'fixed';
    modal.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - mH - 16)}px`;
    modal.style.left = `${Math.max(Math.min(rect.left, window.innerWidth - modal.offsetWidth - 16), 8)}px`;
  });
}

// ===== ボタン生成・注入 =====
const INJECTED_ATTR = 'data-gck2-injected';

function injectButton(article) {
  if (article.hasAttribute(INJECTED_ATTR)) return;
  article.setAttribute(INJECTED_ATTR, '1');

  const handle = getHandleFromArticle(article);
  if (!handle) return;

  // システムツイート等を除外
  const systemExcludes = ['x', 'twitter', 'XDevelopers', 'Support'];
  if (systemExcludes.includes(handle)) return;

  // アクションバーを探す
  const actionBar = article.querySelector('[role="group"]');
  if (!actionBar) return;

  const meta = getMetaFromArticle(article);
  const alreadyChecked = isRecentlyChecked(handle);

  // ボタンラッパー（Xの既存ボタンと同じ構造に合わせる）
  const wrapper = document.createElement('div');
  wrapper.className = 'gck2-btn-wrapper';

  const btn = document.createElement('button');
  btn.className = 'gck2-btn' + (alreadyChecked ? ' gck2-btn--checked' : '');
  btn.setAttribute('data-gck2-handle', handle);
  // Optional: localizing the title hover text of the button
  const lang = gckSettings.lang || 'ja';
  btn.title = lang === 'en' ? `Analyze @${handle} with Grok & Cat Patrol` : `@${handle} を垢分析するにゃ`;

  const emoji = document.createElement('span');
  emoji.className = 'gck2-btn-emoji';
  emoji.textContent = alreadyChecked ? '✅' : gckSettings.buttonEmoji;
  btn.appendChild(emoji);

  // 長押し検出
  let pressTimer = null;
  let isLongPress = false;

  const startPress = () => {
    isLongPress = false;
    pressTimer = setTimeout(() => {
      isLongPress = true;
      showMiniModal(handle, meta, btn);
    }, 300);
  };

  const cancelPress = () => {
    clearTimeout(pressTimer);
  };

  btn.addEventListener('mousedown', startPress);
  btn.addEventListener('touchstart', startPress, { passive: true });
  btn.addEventListener('mouseup', cancelPress);
  btn.addEventListener('mouseleave', cancelPress);
  btn.addEventListener('touchend', cancelPress);

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (isLongPress) return; // 長押しはモーダルで処理済み

    // Shiftクリックもモーダル表示
    if (e.shiftKey) {
      showMiniModal(handle, meta, btn);
      return;
    }

    // 即起動 or モーダル
    if (gckSettings.clickMode === 'modal') {
      showMiniModal(handle, meta, btn);
    } else {
      const prompt = buildPrompt(handle, meta);
      markChecked(handle);
      emoji.textContent = '✅';
      btn.classList.add('gck2-btn--checked');
      window.open(`https://x.com/i/grok?text=${encodeURIComponent(prompt.slice(0, 2000))}`, '_blank');
    }
  });

  wrapper.appendChild(btn);
  actionBar.appendChild(wrapper);
}

// ===== MutationObserver でタイムライン監視 =====
function processArticles() {
  document.querySelectorAll('article[data-testid="tweet"]:not([data-gck2-injected])').forEach(injectButton);
}

const observer = new MutationObserver(() => {
  processArticles();
});

// ===== 初期化 =====
initSettings(() => {
  observer.observe(document.body, { childList: true, subtree: true });
  processArticles();
});
