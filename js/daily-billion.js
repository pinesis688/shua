/**
 * 每日亿题 — 随机刷题 · TikTok风格
 * v3: 纯Supabase · 无限刷题 · 停止统计 · 全量审查修复
 */
(function() {
  'use strict';

  var SUPABASE_URL = 'https://pgkjpuowpxngmxjjlfil.supabase.co';
  var SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBna2pwdW93cHhuZ214ampsZmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MzIsImV4cCI6MjA5NjI1OTYzMn0.lgfxN9htgo1i4tX_KwEehW47uqOwj3Jfwy-ljsjQnx4';

  // ========== 状态管理 ==========
  var state = {
    questions: [],
    loadedIds: {},           // 已加载的题目ID集合，防重复
    totalAnswered: 0,
    totalCorrect: 0,
    totalSubQuestions: 0,
    isLoading: false,
    hasMore: true,
    totalPoolSize: 0,        // Supabase中MTF题目总数
    answeredMap: {},
    submittedMap: {},
    favorites: {},           // 收藏 {questionId: true}
    feedback: {},            // 反馈 {questionId: 'like'|'dislike'}
    error: null,
    // 刷太快检测
    lastSubmitTime: 0,
    speedWarnCount: 0
  };

  var targetEl = null;
  var pageEl = null;
  var topBarEl = null;
  var scrollObserver = null;
  var _destroyed = false;
  var _sbClient = null;
  var _touchStartY = 0;
  var _touchStartTime = 0;
  var _progressTimer = null;
  var _progressStart = 0;
  var _toastTimer = null;

  // ========== 工具函数 ==========
  function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function getSupabaseClient() {
    if (_sbClient) return _sbClient;
    if (typeof getSupabase === 'function' && typeof window.supabase !== 'undefined') {
      try { _sbClient = getSupabase(); return _sbClient; } catch(e) {}
    }
    if (typeof window.supabase !== 'undefined') {
      try {
        _sbClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
          auth: { autoRefreshToken: true, persistSession: true, detectSessionInUrl: true }
        });
        return _sbClient;
      } catch(e) {}
    }
    return null;
  }

  // ========== 随机加载题目 ==========
  async function loadQuestionsFromSupabase(limit) {
    var sb = getSupabaseClient();
    if (!sb) return null;

    try {
      // 首次获取总数
      if (state.totalPoolSize === 0) {
        var countResult = await sb.from('questions').select('id', { count: 'exact', head: true }).eq('type', 'mtf');
        if (!countResult.error && countResult.count !== null) {
          state.totalPoolSize = countResult.count;
        }
      }

      // 如果已加载完所有题目，从头循环
      if (Object.keys(state.loadedIds).length >= state.totalPoolSize && state.totalPoolSize > 0) {
        state.loadedIds = {};
        state.hasMore = true;
      }

      // 随机偏移
      var poolSize = state.totalPoolSize > 0 ? state.totalPoolSize : 100;
      var maxOffset = Math.max(0, poolSize - limit);
      var randomOffset = Math.floor(Math.random() * maxOffset);

      var result = await sb.from('questions')
        .select('id,question,sub_questions,explanation,subject')
        .eq('type', 'mtf')
        .range(randomOffset, randomOffset + limit - 1);

      if (result.error) {
        console.warn('[每日亿题] Supabase查询失败:', result.error.message);
        return null;
      }

      if (!result.data || result.data.length === 0) return [];

      // 过滤已加载的ID
      var freshQuestions = result.data.filter(function(q) { return !state.loadedIds[q.id]; });

      // 如果过滤后不够，再随机拉一批
      if (freshQuestions.length < limit && state.totalPoolSize > limit) {
        var retryOffset = Math.floor(Math.random() * Math.max(0, poolSize - limit));
        var retryResult = await sb.from('questions')
          .select('id,question,sub_questions,explanation,subject')
          .eq('type', 'mtf')
          .range(retryOffset, retryOffset + limit - 1);
        if (retryResult.data) {
          var more = retryResult.data.filter(function(q) { return !state.loadedIds[q.id]; });
          var seen = {};
          freshQuestions.forEach(function(q) { seen[q.id] = true; });
          more.forEach(function(q) {
            if (!seen[q.id]) { seen[q.id] = true; freshQuestions.push(q); }
          });
        }
      }

      return freshQuestions.map(function(q) {
        var subQuestions = [];
        try {
          var raw = q.sub_questions;
          if (typeof raw === 'string') raw = JSON.parse(raw);
          if (Array.isArray(raw)) {
            subQuestions = raw.map(function(sq, i) {
              return { label: sq.label || String.fromCharCode(65 + i), text: sq.text || '', answer: Boolean(sq.answer) };
            });
          }
        } catch(e) {}
        return { id: q.id, question: q.question || '', subQuestions: subQuestions, explanation: q.explanation || '', subject: q.subject || '' };
      });
    } catch(e) {
      console.warn('[每日亿题] Supabase请求异常:', e.message);
      return null;
    }
  }

  // ========== 加载题目（仅 Supabase，无限循环） ==========
  async function loadQuestions(limit) {
    if (state.isLoading) return;
    state.isLoading = true;
    state.error = null;

    startProgressBar();

    var newQuestions = await loadQuestionsFromSupabase(limit);

    if (newQuestions === null) {
      if (state.questions.length === 0) {
        state.error = '无法连接服务器，请检查网络后重试';
      } else {
        state.error = '网络连接失败，无法加载更多题目';
      }
      state.isLoading = false;
      finishProgressBar();
      return;
    }

    if (newQuestions.length === 0) {
      if (state.questions.length === 0) {
        state.error = '题库暂无题目，请联系管理员添加MTF类型题目';
      }
      state.isLoading = false;
      finishProgressBar();
      return;
    }

    newQuestions.forEach(function(q) { state.loadedIds[q.id] = true; });
    state.questions = state.questions.concat(newQuestions);
    state.isLoading = false;
    finishProgressBar();
  }

  // ========== 进度条 ==========
  function startProgressBar() {
    _progressStart = Date.now();
    var bar = targetEl && targetEl.querySelector('#dbProgressBar');
    if (bar) {
      bar.style.width = '0%';
      bar.style.opacity = '1';
      bar.style.transition = 'none';
    }
    if (_progressTimer) clearInterval(_progressTimer);
    _progressTimer = setInterval(function() {
      var bar2 = targetEl && targetEl.querySelector('#dbProgressBar');
      if (!bar2) { clearInterval(_progressTimer); _progressTimer = null; return; }
      var elapsed = Date.now() - _progressStart;
      // 模拟进度：前2秒到60%，之后缓慢增长到90%
      var pct = Math.min(90, elapsed < 2000 ? (elapsed / 2000) * 60 : 60 + (elapsed - 2000) / 8000 * 30);
      bar2.style.transition = 'width 0.3s ease-out';
      bar2.style.width = pct + '%';
    }, 300);
  }

  function finishProgressBar() {
    if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    var bar = targetEl && targetEl.querySelector('#dbProgressBar');
    if (bar) {
      bar.style.transition = 'width 0.2s ease-out, opacity 0.3s ease-out';
      bar.style.width = '100%';
      setTimeout(function() {
        if (bar) { bar.style.opacity = '0'; bar.style.width = '0%'; }
      }, 250);
    }
  }

  // ========== Toast提示 ==========
  function showToast(msg) {
    if (_toastTimer) clearTimeout(_toastTimer);
    var existing = targetEl && targetEl.querySelector('#dbToast');
    if (existing) existing.remove();
    if (!targetEl) return;
    var toast = document.createElement('div');
    toast.id = 'dbToast';
    toast.className = 'db-toast';
    toast.textContent = msg;
    targetEl.appendChild(toast);
    requestAnimationFrame(function() { toast.classList.add('show'); });
    _toastTimer = setTimeout(function() {
      toast.classList.remove('show');
      setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
    }, 2000);
  }

  // ========== 刷太快检测 ==========
  function checkSpeedWarn() {
    var now = Date.now();
    if (state.lastSubmitTime > 0) {
      var elapsed = now - state.lastSubmitTime;
      if (elapsed < 3000) {
        state.speedWarnCount++;
        if (state.speedWarnCount === 1) {
          showToast('慢一点，想想再答');
        } else if (state.speedWarnCount === 2) {
          showToast('刷太快了，仔细审题');
        } else if (state.speedWarnCount >= 3) {
          showToast('每题至少花3秒思考，质量比数量重要');
        }
      } else if (elapsed > 10000) {
        state.speedWarnCount = Math.max(0, state.speedWarnCount - 1);
      }
    }
    state.lastSubmitTime = now;
  }

  // ========== 渲染顶部栏 ==========
  function renderTopBar() {
    if (!targetEl || _destroyed) return;
    var html = '';
    html += '<div class="db-progress-wrap"><div class="db-progress-bar" id="dbProgressBar"></div></div>';
    html += '<div class="db-top-bar" id="dbTopBar">';
    html += '<div class="db-top-bar-left">';
    html += '<a class="db-back-btn" href="#/" onclick="event.preventDefault();window.location.hash=\'#/\';">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>';
    html += '</a>';
    html += '<span class="db-top-bar-title">每日亿题</span>';
    html += '</div>';
    html += '<div class="db-top-bar-right">';
    html += '<button class="db-stop-btn" data-action="stop" title="结束刷题">结束</button>';
    html += '<div class="db-counter-badge" id="dbCounterBadge">';
    html += '<span>已刷</span><span class="db-counter-num" id="dbCounterNum">' + state.totalAnswered + '</span><span>题</span>';
    html += '</div>';
    html += '</div>';
    html += '</div>';

    var existing = targetEl.querySelector('#dbTopBar');
    if (existing) existing.remove();
    var existingProgress = targetEl.querySelector('.db-progress-wrap');
    if (existingProgress) existingProgress.remove();
    targetEl.insertAdjacentHTML('afterbegin', html);
    topBarEl = targetEl.querySelector('#dbTopBar');
  }

  // ========== 渲染右侧操作栏 ==========
  function renderActionBar(q) {
    var fid = 'fav-' + q.id;
    var isFav = state.favorites[q.id];
    var fb = state.feedback[q.id];
    var html = '';
    html += '<div class="db-action-bar">';
    // 收藏
    html += '<button class="db-action-btn db-fav-btn' + (isFav ? ' active' : '') + '" data-action="fav" data-qid="' + escapeHtml(q.id) + '" title="收藏">';
    html += '<svg viewBox="0 0 24 24" fill="' + (isFav ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>';
    html += '</button>';
    // 赞
    html += '<button class="db-action-btn db-like-btn' + (fb === 'like' ? ' active' : '') + '" data-action="like" data-qid="' + escapeHtml(q.id) + '" title="赞">';
    html += '<svg viewBox="0 0 24 24" fill="' + (fb === 'like' ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/></svg>';
    html += '</button>';
    // 踩
    html += '<button class="db-action-btn db-dislike-btn' + (fb === 'dislike' ? ' active' : '') + '" data-action="dislike" data-qid="' + escapeHtml(q.id) + '" title="踩">';
    html += '<svg viewBox="0 0 24 24" fill="' + (fb === 'dislike' ? 'currentColor' : 'none') + '" stroke="currentColor" stroke-width="2"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3H10z"/></svg>';
    html += '</button>';
    // 分享
    html += '<button class="db-action-btn db-share-btn" data-action="share" data-qid="' + escapeHtml(q.id) + '" title="分享">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>';
    html += '</button>';
    // 题目ID
    html += '<span class="db-qid">#' + escapeHtml(q.id) + '</span>';
    html += '</div>';
    return html;
  }

  // ========== 渲染单张题目卡片 ==========
  function renderQuestionCard(q, index) {
    var submitted = state.submittedMap[q.id];
    var answers = state.answeredMap[q.id] || {};
    var allAnswered = q.subQuestions.every(function(_, i) { return answers[i] !== undefined; });

    var html = '';
    html += '<div class="db-card" data-question-id="' + escapeHtml(q.id) + '" data-index="' + index + '">';
    html += '<div class="db-card-inner">';

    html += '<div class="db-card-header">';
    html += '<span class="db-card-num">' + (index + 1) + '</span>';
    if (q.subject) html += '<span class="db-card-subject">' + escapeHtml(q.subject) + '</span>';
    html += '</div>';

    html += '<div class="db-question-text">' + escapeHtml(q.question) + '</div>';

    html += '<div class="db-sub-list">';
    for (var i = 0; i < q.subQuestions.length; i++) {
      var sq = q.subQuestions[i];
      var userAnswer = answers[i];
      var correctAnswer = sq.answer;
      var itemCls = 'db-sub-item';
      var resultIcon = '';
      if (submitted) {
        itemCls += ' submitted';
        if (userAnswer === correctAnswer) { itemCls += ' result-correct'; resultIcon = '<span class="db-sub-result-icon">&#10003;</span>'; }
        else { itemCls += ' result-wrong'; resultIcon = '<span class="db-sub-result-icon">&#10007;</span>'; }
      }
      html += '<div class="' + itemCls + '" data-sub-idx="' + i + '">';
      html += '<div class="db-sub-head">';
      html += '<span class="db-sub-label">' + escapeHtml(sq.label) + '</span>';
      html += '<span class="db-sub-text">' + escapeHtml(sq.text) + '</span>';
      if (submitted && resultIcon) html += resultIcon;
      html += '</div>';
      html += '<div class="db-sub-toggle">';
      html += '<button class="db-tf-btn' + (userAnswer === true ? ' selected' : '') + '" data-value="true" data-sub-idx="' + i + '">正确</button>';
      html += '<button class="db-tf-btn' + (userAnswer === false ? ' selected' : '') + '" data-value="false" data-sub-idx="' + i + '">错误</button>';
      html += '</div></div>';
    }
    html += '</div>';

    html += '<button class="db-submit-btn" data-action="submit" data-card-idx="' + index + '"' + (allAnswered && !submitted ? '' : ' disabled') + '>';
    html += submitted ? '已提交' : '提交判断';
    html += '</button>';

    if (submitted) {
      var correctCount = 0;
      for (var j = 0; j < q.subQuestions.length; j++) {
        if (answers[j] === q.subQuestions[j].answer) correctCount++;
      }
      var totalSub = q.subQuestions.length;
      var allCorrect = correctCount === totalSub;
      var allWrong = correctCount === 0;
      var summaryCls = 'db-result-summary';
      var summaryIcon = '', summaryText = '';
      if (allCorrect) { summaryCls += ' all-correct'; summaryIcon = '\u2713'; summaryText = '全部正确 ' + correctCount + '/' + totalSub; }
      else if (allWrong) { summaryCls += ' all-wrong'; summaryIcon = '\u2717'; summaryText = '全部错误 ' + correctCount + '/' + totalSub; }
      else { summaryCls += ' partial'; summaryIcon = '\u25D0'; summaryText = '部分正确 ' + correctCount + '/' + totalSub; }

      html += '<div class="db-result">';
      html += '<div class="' + summaryCls + '"><span class="db-result-icon">' + summaryIcon + '</span><span>' + summaryText + '</span></div>';
      if (q.explanation) {
        html += '<div class="db-explanation"><div class="db-explanation-title">解析</div><div class="db-explanation-text">' + escapeHtml(q.explanation) + '</div></div>';
      }
      html += '<div class="db-swipe-hint"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg><span>上滑下一题</span></div>';
      html += '</div>';
    }

    html += '</div>';
    // 右侧操作栏
    html += renderActionBar(q);
    html += '</div>';
    return html;
  }

  function renderLoadingCard() {
    return '<div class="db-loading-card"><div class="db-loading-content"><div class="db-spinner"></div><span>加载题目中...</span></div></div>';
  }

  function renderStopOverlay() {
    var accuracy = state.totalSubQuestions > 0 ? Math.round(state.totalCorrect / state.totalSubQuestions * 100) : 0;
    return '<div class="db-stop-overlay" id="dbStopOverlay">' +
      '<div class="db-stop-card">' +
      '<div class="db-stop-icon">' + (accuracy >= 80 ? '&#9733;' : accuracy >= 60 ? '&#9679;' : '&#9675;') + '</div>' +
      '<div class="db-stop-title">刷题统计</div>' +
      '<div class="db-stop-stats">' +
      '<div class="db-stop-stat"><div class="db-stop-stat-val">' + state.totalAnswered + '</div><div class="db-stop-stat-lbl">刷题数</div></div>' +
      '<div class="db-stop-stat"><div class="db-stop-stat-val">' + state.totalSubQuestions + '</div><div class="db-stop-stat-lbl">总判断</div></div>' +
      '<div class="db-stop-stat"><div class="db-stop-stat-val">' + accuracy + '%</div><div class="db-stop-stat-lbl">正确率</div></div>' +
      '</div>' +
      '<div class="db-stop-actions">' +
      '<button class="db-stop-continue-btn" data-action="continue">继续刷题</button>' +
      '<button class="db-stop-restart-btn" data-action="restart">重新开始</button>' +
      '</div>' +
      '</div></div>';
  }

  function renderErrorCard() {
    return '<div class="db-error-card"><div class="db-error-content">' +
      '<div class="db-error-icon">&#128565;</div>' +
      '<div class="db-error-title">加载失败</div>' +
      '<div class="db-error-desc">' + (state.error || '题目加载出错，请检查网络连接后重试') + '</div>' +
      '<button class="db-error-retry-btn" data-action="retry">重试</button>' +
      '</div></div>';
  }

  // ========== 渲染整页 ==========
  function renderPage() {
    if (!pageEl || _destroyed) return;
    var html = '';
    for (var i = 0; i < state.questions.length; i++) {
      html += renderQuestionCard(state.questions[i], i);
    }
    if (state.isLoading) html += renderLoadingCard();
    else if (state.error && state.questions.length === 0) html += renderErrorCard();
    else if (state.questions.length === 0) html += renderLoadingCard();
    pageEl.innerHTML = html;
    setupScrollObserver();
    updateCounter();
  }

  // ========== 更新计数器 ==========
  function updateCounter() {
    var numEl = targetEl && targetEl.querySelector('#dbCounterNum');
    if (numEl) numEl.textContent = state.totalAnswered;
  }

  function pulseCounter() {
    var badge = targetEl && targetEl.querySelector('#dbCounterBadge');
    if (badge) { badge.classList.remove('pulse'); void badge.offsetWidth; badge.classList.add('pulse'); }
  }

  // ========== 事件委托 ==========
  // 绑定到 targetEl（而非 pageEl），因为 stop 按钮在 topBar 中，是 targetEl 的直接子元素
  function setupGlobalDelegation() {
    if (!targetEl || _destroyed) return;
    targetEl.removeEventListener('click', globalClickHandler);
    targetEl.addEventListener('click', globalClickHandler);
  }

  function globalClickHandler(e) {
    var target = e.target;
    if (target.classList.contains('db-tf-btn')) { handleTFClickDelegated(target); return; }
    if (target.hasAttribute('data-action')) {
      var action = target.getAttribute('data-action');
      if (action === 'submit') { handleSubmitDelegated(target); return; }
      if (action === 'stop') { handleStop(); return; }
      if (action === 'continue') { handleContinue(); return; }
      if (action === 'restart') { handleRestart(); return; }
      if (action === 'retry') { handleRetry(); return; }
      if (action === 'fav') { handleFav(target); return; }
      if (action === 'like') { handleFeedback(target, 'like'); return; }
      if (action === 'dislike') { handleFeedback(target, 'dislike'); return; }
      if (action === 'share') { handleShare(target); return; }
    }
  }

  function handleTFClickDelegated(btn) {
    var subIdx = parseInt(btn.dataset.subIdx, 10);
    var value = btn.dataset.value === 'true';
    var cardEl = btn.closest('.db-card');
    if (!cardEl) return;
    var questionId = cardEl.dataset.questionId;
    var cardIdx = parseInt(cardEl.dataset.index, 10);
    var q = state.questions[cardIdx];
    if (!q || q.id !== questionId) return;
    if (state.submittedMap[q.id]) return;

    if (!state.answeredMap[q.id]) state.answeredMap[q.id] = {};
    state.answeredMap[q.id][subIdx] = value;

    var subItem = btn.closest('.db-sub-item');
    if (subItem) {
      var trueBtn = subItem.querySelector('.db-tf-btn[data-value="true"]');
      var falseBtn = subItem.querySelector('.db-tf-btn[data-value="false"]');
      if (trueBtn) trueBtn.classList.remove('selected');
      if (falseBtn) falseBtn.classList.remove('selected');
    }
    btn.classList.add('selected');

    var answers = state.answeredMap[q.id];
    var allAnswered = q.subQuestions.every(function(_, k) { return answers[k] !== undefined; });
    var submitBtn = cardEl.querySelector('.db-submit-btn');
    if (submitBtn && allAnswered) { submitBtn.disabled = false; submitBtn.textContent = '提交判断'; }
    saveState();
  }

  function handleSubmitDelegated(btn) {
    var cardIdx = parseInt(btn.dataset.cardIdx, 10);
    var q = state.questions[cardIdx];
    if (!q) return;
    var cardEl = pageEl.querySelector('.db-card[data-index="' + cardIdx + '"]');
    if (!cardEl) return;

    var answers = state.answeredMap[q.id] || {};
    var allAnswered = q.subQuestions.every(function(_, i) { return answers[i] !== undefined; });
    if (!allAnswered) return;
    if (state.submittedMap[q.id]) return;

    checkSpeedWarn();

    state.submittedMap[q.id] = true;
    state.totalAnswered++;

    var correctCount = 0;
    for (var i = 0; i < q.subQuestions.length; i++) {
      if (answers[i] === q.subQuestions[i].answer) correctCount++;
    }
    state.totalCorrect += correctCount;
    state.totalSubQuestions += q.subQuestions.length;

    saveState();
    updateCounter();
    pulseCounter();

    if (typeof window.recordDailyCheckIn === 'function') { try { window.recordDailyCheckIn(); } catch(e) {} }
    if (typeof window.checkAchievement === 'function') { try { window.checkAchievement('practice', 1); } catch(e) {} }

    cardEl.outerHTML = renderQuestionCard(q, cardIdx);

    setTimeout(function() {
      if (_destroyed || !pageEl) return;
      var newCard = pageEl.querySelector('.db-card[data-index="' + cardIdx + '"]');
      if (newCard) {
        var result = newCard.querySelector('.db-result');
        if (result) result.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
  }

  // ========== 收藏 ==========
  function handleFav(btn) {
    var qid = btn.dataset.qid;
    if (state.favorites[qid]) {
      delete state.favorites[qid];
      btn.classList.remove('active');
      var svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'none');
    } else {
      state.favorites[qid] = true;
      btn.classList.add('active');
      var svg2 = btn.querySelector('svg');
      if (svg2) svg2.setAttribute('fill', 'currentColor');
      showToast('已收藏');
    }
    saveState();
  }

  // ========== 赞/踩反馈 ==========
  function handleFeedback(btn, type) {
    var qid = btn.dataset.qid;
    // 切换：再次点击取消
    if (state.feedback[qid] === type) {
      delete state.feedback[qid];
      btn.classList.remove('active');
      var svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', 'none');
      // 同时取消另一边的active
      var cardEl = btn.closest('.db-card');
      if (cardEl) {
        var other = cardEl.querySelector('.db-action-btn[data-action="' + (type === 'like' ? 'dislike' : 'like') + '"]');
        if (other) other.classList.remove('active');
        var otherSvg = other && other.querySelector('svg');
        if (otherSvg) otherSvg.setAttribute('fill', 'none');
      }
    } else {
      state.feedback[qid] = type;
      btn.classList.add('active');
      var svg2 = btn.querySelector('svg');
      if (svg2) svg2.setAttribute('fill', 'currentColor');
      // 取消另一边
      var cardEl2 = btn.closest('.db-card');
      if (cardEl2) {
        var other2 = cardEl2.querySelector('.db-action-btn[data-action="' + (type === 'like' ? 'dislike' : 'like') + '"]');
        if (other2) { other2.classList.remove('active'); var os = other2.querySelector('svg'); if (os) os.setAttribute('fill', 'none'); }
      }
      showToast(type === 'like' ? '感谢反馈' : '已记录');
    }
    saveState();
  }

  // ========== 分享 ==========
  function handleShare(btn) {
    var qid = btn.dataset.qid;
    var url = window.location.origin + window.location.pathname + '#/daily-billion?q=' + qid;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(function() {
        showToast('链接已复制');
      }).catch(function() {
        showToast('分享链接: ' + url);
      });
    } else {
      showToast('分享链接: ' + url);
    }
  }

  // ========== 滚动监听（懒加载） ==========
  function setupScrollObserver() {
    if (!pageEl || _destroyed) return;
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    var cards = pageEl.querySelectorAll('.db-card');
    if (cards.length === 0) return;
    var preloadIdx = Math.max(0, cards.length - 3);
    var preloadCard = cards[preloadIdx];
    if (preloadCard && !state.isLoading) {
      scrollObserver = new IntersectionObserver(function(entries) {
        if (entries[0].isIntersecting && !state.isLoading) lazyLoadMore();
      }, { root: pageEl, threshold: 0.1 });
      scrollObserver.observe(preloadCard);
    }
  }

  async function lazyLoadMore() {
    if (state.isLoading || _destroyed) return;
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    var oldLen = state.questions.length;
    await loadQuestions(3);
    if (_destroyed) return;
    if (state.questions.length > oldLen) {
      var loadingCard = pageEl.querySelector('.db-loading-card');
      if (loadingCard) {
        var newHtml = '';
        for (var i = oldLen; i < state.questions.length; i++) newHtml += renderQuestionCard(state.questions[i], i);
        if (state.isLoading) newHtml += renderLoadingCard();
        loadingCard.insertAdjacentHTML('beforebegin', newHtml);
        loadingCard.remove();
      } else {
        var newHtml2 = '';
        for (var k = oldLen; k < state.questions.length; k++) newHtml2 += renderQuestionCard(state.questions[k], k);
        if (state.isLoading) newHtml2 += renderLoadingCard();
        pageEl.insertAdjacentHTML('beforeend', newHtml2);
      }
    } else if (state.error) {
      showToast(state.error);
      state.error = null;
    }
    setupScrollObserver();
  }

  // ========== 触摸滑动 ==========
  function handleTouchStart(e) {
    if (e.touches.length !== 1) return;
    _touchStartY = e.touches[0].clientY;
    _touchStartTime = Date.now();
  }

  function handleTouchEnd(e) {
    if (!pageEl || _destroyed || !_touchStartY) return;
    var dy = e.changedTouches[0].clientY - _touchStartY;
    var dt = Date.now() - _touchStartTime;
    _touchStartY = 0;
    if (dt > 500 || Math.abs(dy) < 50) return;
    if (e.target.closest('.db-tf-btn') || e.target.closest('.db-submit-btn') || e.target.closest('.db-action-btn')) return;
    if (dy < 0) scrollToNextCard();
    else scrollToPrevCard();
  }

  // ========== 停止 / 继续 / 重启 ==========
  function handleStop() {
    if (_destroyed || !targetEl) return;
    var existing = targetEl.querySelector('#dbStopOverlay');
    if (existing) return;
    var overlayHtml = renderStopOverlay();
    targetEl.insertAdjacentHTML('beforeend', overlayHtml);
    var actionBars = targetEl.querySelectorAll('.db-action-bar');
    for (var i = 0; i < actionBars.length; i++) actionBars[i].style.display = 'none';
  }

  function handleContinue() {
    if (_destroyed || !targetEl) return;
    var overlay = targetEl.querySelector('#dbStopOverlay');
    if (overlay) overlay.remove();
    var actionBars = targetEl.querySelectorAll('.db-action-bar');
    for (var i = 0; i < actionBars.length; i++) actionBars[i].style.display = '';
  }

  function handleRestart() {
    if (_destroyed || !targetEl) return;
    var overlay = targetEl.querySelector('#dbStopOverlay');
    if (overlay) overlay.remove();
    resetState();
    initDailyBillionCore();
  }

  function handleRetry() {
    if (_destroyed || !targetEl) return;
    resetState();
    targetEl.innerHTML = '';
    pageEl = null;
    initDailyBillionCore();
  }

  function resetState() {
    state.questions = [];
    state.loadedIds = {};
    state.totalAnswered = 0;
    state.totalCorrect = 0;
    state.totalSubQuestions = 0;
    state.isLoading = false;
    state.hasMore = true;
    state.totalPoolSize = 0;
    state.answeredMap = {};
    state.submittedMap = {};
    state.favorites = {};
    state.feedback = {};
    state.error = null;
    state.lastSubmitTime = 0;
    state.speedWarnCount = 0;
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    try { localStorage.removeItem('bioquest_billion_v3'); } catch(e) {}
  }

  // ========== 状态持久化 ==========
  var _saveTimer = null;
  function saveState() {
    if (_saveTimer) clearTimeout(_saveTimer);
    _saveTimer = setTimeout(function() {
      _saveTimer = null;
      try {
        var data = {
          totalAnswered: state.totalAnswered,
          totalCorrect: state.totalCorrect,
          totalSubQuestions: state.totalSubQuestions,
          answeredMap: state.answeredMap,
          submittedMap: state.submittedMap,
          favorites: state.favorites,
          feedback: state.feedback
        };
        localStorage.setItem('bioquest_billion_v3', JSON.stringify(data));
      } catch(e) {}
    }, 300);
  }

  function loadPersistedState() {
    try {
      var raw = localStorage.getItem('bioquest_billion_v3');
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data.totalAnswered !== undefined) state.totalAnswered = data.totalAnswered;
      if (data.totalCorrect !== undefined) state.totalCorrect = data.totalCorrect;
      if (data.totalSubQuestions !== undefined) state.totalSubQuestions = data.totalSubQuestions;
      if (data.answeredMap) state.answeredMap = data.answeredMap;
      if (data.submittedMap) state.submittedMap = data.submittedMap;
      if (data.favorites) state.favorites = data.favorites;
      if (data.feedback) state.feedback = data.feedback;
    } catch(e) {}
  }

  // ========== 键盘快捷键 ==========
  function handleKeyDown(e) {
    if (!pageEl || _destroyed) return;
    if (!targetEl || !document.body.contains(targetEl)) return;
    if (!pageEl.closest('body')) return;
    var activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA' || activeEl.isContentEditable)) return;
    if (e.key === 'ArrowDown' || e.key === 'j') { e.preventDefault(); scrollToNextCard(); }
    else if (e.key === 'ArrowUp' || e.key === 'k') { e.preventDefault(); scrollToPrevCard(); }
  }

  function scrollToNextCard() {
    if (!pageEl || _destroyed) return;
    var cards = pageEl.querySelectorAll('.db-card');
    if (cards.length === 0) return;
    var currentIdx = -1;
    for (var i = 0; i < cards.length; i++) {
      var rect = cards[i].getBoundingClientRect();
      if (rect.top >= -50 && rect.top < window.innerHeight * 0.6) { currentIdx = i; break; }
    }
    if (currentIdx === -1) currentIdx = 0;
    var nextIdx = Math.min(currentIdx + 1, cards.length - 1);
    if (nextIdx !== currentIdx) cards[nextIdx].scrollIntoView({ behavior: 'instant' });
  }

  function scrollToPrevCard() {
    if (!pageEl || _destroyed) return;
    var cards = pageEl.querySelectorAll('.db-card');
    if (cards.length === 0) return;
    var currentIdx = -1;
    for (var i = 0; i < cards.length; i++) {
      var rect = cards[i].getBoundingClientRect();
      if (rect.top >= -50 && rect.top < window.innerHeight * 0.6) { currentIdx = i; break; }
    }
    if (currentIdx === -1) currentIdx = 0;
    var prevIdx = Math.max(currentIdx - 1, 0);
    if (prevIdx !== currentIdx) cards[prevIdx].scrollIntoView({ behavior: 'instant' });
  }

  // ========== 初始化 ==========
  async function initDailyBillionCore() {
    if (_destroyed || !targetEl) return;
    loadPersistedState();
    targetEl.innerHTML = '';
    targetEl.style.cssText = 'position:relative;';

    pageEl = document.createElement('div');
    pageEl.className = 'db-page';
    pageEl.id = 'dbPageScroll';
    targetEl.appendChild(pageEl);

    renderTopBar();
    setupGlobalDelegation();
    pageEl.innerHTML = renderLoadingCard();

    await loadQuestions(3);
    if (_destroyed) return;
    renderPage();

    if (state.questions.length > 0) {
      var firstUnsubmittedIdx = -1;
      for (var i = 0; i < state.questions.length; i++) {
        if (!state.submittedMap[state.questions[i].id]) { firstUnsubmittedIdx = i; break; }
      }
      if (firstUnsubmittedIdx > 0) {
        setTimeout(function() {
          var card = pageEl.querySelector('.db-card[data-index="' + firstUnsubmittedIdx + '"]');
          if (card) card.scrollIntoView({ behavior: 'instant' });
        }, 100);
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    pageEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    pageEl.addEventListener('touchend', handleTouchEnd, { passive: true });
  }

  // ========== 公开接口 ==========
  function init(target) {
    if (_destroyed) return;
    if (targetEl) { saveState(); destroy(); }
    targetEl = target;
    _destroyed = false;
    initDailyBillionCore();
  }

  function destroy() {
    _destroyed = true;
    document.removeEventListener('keydown', handleKeyDown);
    if (targetEl) {
      targetEl.removeEventListener('click', globalClickHandler);
    }
    if (pageEl) {
      pageEl.removeEventListener('touchstart', handleTouchStart);
      pageEl.removeEventListener('touchend', handleTouchEnd);
    }
    if (scrollObserver) { scrollObserver.disconnect(); scrollObserver = null; }
    if (_saveTimer) { clearTimeout(_saveTimer); _saveTimer = null; }
    if (_progressTimer) { clearInterval(_progressTimer); _progressTimer = null; }
    if (_toastTimer) { clearTimeout(_toastTimer); _toastTimer = null; }
    try {
      var data = {
        totalAnswered: state.totalAnswered,
        totalCorrect: state.totalCorrect,
        totalSubQuestions: state.totalSubQuestions,
        answeredMap: state.answeredMap,
        submittedMap: state.submittedMap,
        favorites: state.favorites,
        feedback: state.feedback
      };
      localStorage.setItem('bioquest_billion_v3', JSON.stringify(data));
    } catch(e) {}
    if (targetEl) { targetEl.innerHTML = ''; targetEl.style.cssText = ''; }
    pageEl = null;
    topBarEl = null;
    targetEl = null;
    _sbClient = null;
    _touchStartY = 0;
    _touchStartTime = 0;
  }

  window.initDailyBillion = function(target) { init(target); };

  function checkAutoInit() {
    if (document.readyState === 'loading') return;
    var hash = window.location.hash.slice(1);
    if (hash === '/daily-billion' || hash.startsWith('/daily-billion')) {
      var main = document.getElementById('app-main') || document.getElementById('page-content');
      if (main && !targetEl) init(main);
    }
  }

  if (document.readyState !== 'loading') checkAutoInit();

  window.addEventListener('hashchange', function() {
    var hash = window.location.hash.slice(1);
    if (hash === '/daily-billion' || hash.startsWith('/daily-billion')) {
      var main = document.getElementById('app-main') || document.getElementById('page-content');
      if (main && !targetEl) init(main);
    } else if (targetEl) { saveState(); destroy(); }
  });

})();