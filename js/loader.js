/**
 * BioQuest — 智能题库加载器
 * 特性：IndexedDB 缓存、模块级按需加载、流式进度回调、断点续传
 */
var _questionCache = {};
var _loadingPromises = {};
var _dbReady = null;
var _abortControllers = {};

/* ============================================================
 * IndexedDB 持久化缓存
 * ============================================================ */

function _openDB() {
  if (_dbReady) return _dbReady;
  if (!window.indexedDB) {
    _dbReady = Promise.resolve(null);
    return _dbReady;
  }
  _dbReady = new Promise(function (resolve) {
    var req = indexedDB.open('BioQuestCache', 2);
    req.onupgradeneeded = function (e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('modules')) {
        var store = db.createObjectStore('modules', { keyPath: 'key' });
        store.createIndex('updated', 'updated', { unique: false });
      }
    };
    req.onsuccess = function (e) { resolve(e.target.result); };
    req.onerror = function () { resolve(null); };
  });
  return _dbReady;
}

var MODULE_CACHE_TTL = 30 * 60 * 1000; // 缓存有效期 30 分钟
var ALL_CACHE_TTL = 30 * 60 * 1000;
var MIN_VALID_CACHE_SIZE = 50; // 缓存少于 50 题视为无效

function _loadFromDB(moduleKey) {
  return _openDB().then(function (db) {
    if (!db) return null;
    return new Promise(function (resolve) {
      var tx = db.transaction('modules', 'readonly');
      var store = tx.objectStore('modules');
      var req = store.get(moduleKey);
      req.onsuccess = function () { resolve(req.result || null); };
      req.onerror = function () { resolve(null); };
    });
  });
}

function _saveToDB(moduleKey, data) {
  return _openDB().then(function (db) {
    if (!db) return;
    return new Promise(function (resolve) {
      try {
        var tx = db.transaction('modules', 'readwrite');
        var store = tx.objectStore('modules');
        store.put({ key: moduleKey, data: data, updated: Date.now() });
        tx.oncomplete = function () { resolve(); };
        tx.onerror = function () { resolve(); };
        tx.onabort = function () { resolve(); };
      } catch (e) { resolve(); }
    });
  });
}

function _isCacheRecordValid(record, ttl) {
  if (!record || !Array.isArray(record.data)) return false;
  if (record.data.length < MIN_VALID_CACHE_SIZE) return false;
  var age = Date.now() - (record.updated || 0);
  return age >= 0 && age < ttl;
}

function _hasCached(moduleKey) {
  return _questionCache[moduleKey] !== undefined;
}

function _getCached(moduleKey) {
  return _questionCache[moduleKey] || null;
}

function _setCached(moduleKey, data) {
  _questionCache[moduleKey] = data;
}

/* ============================================================
 * 中止加载
 * ============================================================ */

function abortLoading(moduleKey) {
  if (_abortControllers[moduleKey]) {
    _abortControllers[moduleKey].abort();
    delete _abortControllers[moduleKey];
  }
}

function abortAllLoading() {
  for (var key in _abortControllers) {
    if (_abortControllers.hasOwnProperty(key)) {
      _abortControllers[key].abort();
    }
  }
  _abortControllers = {};
  _loadingPromises = {};
}

/* ============================================================
 * 核心加载函数
 * ============================================================ */

/**
 * P0-4: 题库防御性过滤 — 排除被隔离的污染题目
 * 隔离标志：
 *   - _needs_review: true  （quiz_auto_generated.json 选项污染）
 *   - _unverified: true    （crawled_competition.json 无答案/无解析）
 *   - _quarantined: true   （通用隔离标志）
 * 即使这些数据被误并入题库或通过 Supabase 同步，本函数也能确保它们不会展示给用户
 * @param {Array} items - 原始题目数组
 * @returns {Array} 过滤后的题目数组
 */
function _filterQuarantinedQuestions(items) {
  if (!Array.isArray(items)) return [];
  var removed = 0;
  var result = [];
  for (var i = 0; i < items.length; i++) {
    var q = items[i];
    if (!q || typeof q !== 'object') { removed++; continue; }
    if (q._needs_review === true) { removed++; continue; }
    if (q._unverified === true) { removed++; continue; }
    if (q._quarantined === true) { removed++; continue; }
    result.push(q);
  }
  if (removed > 0) {

  }
  return result;
}

// 暴露到全局，供 practice.js / quiz.js / exam.js 共用
window._filterQuarantinedQuestions = _filterQuarantinedQuestions;

function loadQuestions(moduleFilter, options) {
  options = options || {};
  var onProgress = options.onProgress || null;
  var signal = options.signal || null;
  var forceRefresh = options.forceRefresh || false;

  if (forceRefresh) clearQuestionCache();

  if (moduleFilter && Array.isArray(moduleFilter) && moduleFilter.length > 0) {
    return _loadByModules(moduleFilter, onProgress, signal, forceRefresh);
  }
  return _loadAll(onProgress, signal, forceRefresh);
}

/**
 * 流式加载：逐个模块加载，每完成一个模块立即回调
 * 返回一个 Promise，resolve 时传入全部数据
 */
function loadQuestionsStream(moduleFilter, options) {
  options = options || {};
  var onModuleReady = options.onModuleReady || null;
  var onProgress = options.onProgress || null;
  var signal = options.signal || null;
  var forceRefresh = options.forceRefresh || false;

  if (forceRefresh) clearQuestionCache();

  var modules = (moduleFilter && Array.isArray(moduleFilter) && moduleFilter.length > 0)
    ? moduleFilter
    : [1, 2, 3, 4];

  var allResults = [];
  var completed = 0;
  var total = modules.length;

  function loadNext(index) {
    if (index >= modules.length) {
      return Promise.resolve(allResults);
    }
    var m = modules[index];
    if (signal && signal.aborted) return Promise.resolve(allResults);

    // 如果已缓存且不强刷，直接从内存读取
    if (!forceRefresh && _hasCached('module_' + m)) {
      var cached = _getCached('module_' + m);
      if (cached && cached.length > 0) {
        allResults.push(cached);
        completed++;
        if (onProgress) onProgress(completed, total, m, cached.length);
        if (onModuleReady) onModuleReady(m, cached);
      }
      return loadNext(index + 1);
    }

    return _fetchModule(m, null, signal).then(function (items) {
      completed++;
      if (onProgress) onProgress(completed, total, m, items.length);
      allResults.push(items);
      if (onModuleReady) onModuleReady(m, items);
      return loadNext(index + 1);
    }).catch(function (err) {
      console.error('[Loader] 模块 ' + m + ' 加载失败:', err);
      completed++;
      if (onProgress) onProgress(completed, total, m, 0);
      return loadNext(index + 1);
    });
  }

  return loadNext(0).then(function () {
    return allResults.reduce(function (acc, arr) { return acc.concat(arr); }, []);
  });
}

function _loadByModules(modules, onProgress, signal, forceRefresh) {
  var needed = [];
  for (var i = 0; i < modules.length; i++) {
    var m = modules[i];
    if (forceRefresh || !_hasCached('module_' + m)) {
      needed.push(m);
    }
  }

  if (needed.length === 0) {
    var result = [];
    for (var i = 0; i < modules.length; i++) {
      var cached = _getCached('module_' + modules[i]);
      if (cached) result = result.concat(cached);
    }
    return Promise.resolve(result);
  }

  // 顺序加载模块，避免并发请求被浏览器/SDK abort
  var chain = Promise.resolve();
  needed.forEach(function (m) {
    chain = chain.then(function () {
      return _fetchModule(m, onProgress, signal);
    });
  });

  return chain.then(function () {
    var result = [];
    for (var i = 0; i < modules.length; i++) {
      var cached = _getCached('module_' + modules[i]);
      if (cached) result = result.concat(cached);
    }
    return result;
  });
}

function _fetchModuleAndCache(dbKey, moduleNum, signal) {
  return _fetchFromSupabase(moduleNum)
    .then(function (items) {
      if (items && items.length > 0) {
        // P0-4: 防御性过滤，确保 Supabase 数据也不会包含污染题目
        items = _filterQuarantinedQuestions(items);
        _saveToDB(dbKey, items);
        return { source: 'supabase', data: items };
      }
      // Supabase 返回空数据，回退到本地 JSON
      return _fetchJSON('data/quiz_m' + moduleNum + '.json', signal).then(function (data) {
        var items = _filterQuarantinedQuestions(data.题库 || []);
        _saveToDB(dbKey, items);
        return { source: 'fetch', data: items };
      });
    })
    .catch(function () {
      // Supabase 不可用，回退到本地 JSON
      return _fetchJSON('data/quiz_m' + moduleNum + '.json', signal).then(function (data) {
        var items = _filterQuarantinedQuestions(data.题库 || []);
        _saveToDB(dbKey, items);
        return { source: 'fetch', data: items };
      });
    });
}

function _loadModuleFromDBOrFetch(moduleNum, signal) {
  var dbKey = 'quiz_module_' + moduleNum;
  return _loadFromDB(dbKey).then(function (record) {
    if (_isCacheRecordValid(record, MODULE_CACHE_TTL)) {

      return { source: 'db', data: record.data };
    }
    // 缓存无效或过期，优先从 Supabase 直连获取
    return _fetchModuleAndCache(dbKey, moduleNum, signal);
  });
}

function _fetchFromSupabase(moduleNum) {
  var sb = typeof window.getSupabase === 'function' ? window.getSupabase() : null;
  var SUPABASE_URL = typeof window.SUPABASE_URL !== 'undefined' ? window.SUPABASE_URL :
    (sb && sb.supabaseUrl) || 'https://pgkjpuowpxngmxjjlfil.supabase.co';
  var SUPABASE_ANON_KEY = typeof window.SUPABASE_ANON_KEY !== 'undefined' ? window.SUPABASE_ANON_KEY :
    (sb && sb.supabaseKey) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBna2pwdW93cHhuZ214ampsZmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MzIsImV4cCI6MjA5NjI1OTYzMn0.lgfxN9htgo1i4tX_KwEehW47uqOwj3Jfwy-ljsjQnx4';

  var moduleLabel = (moduleNum !== null && moduleNum !== undefined) ? 'module_' + moduleNum : null;
  var pageSize = 500;

  // 使用直接 REST API fetch 替代 SDK 查询，避免 SDK 内部自动取消并发请求导致 ERR_ABORTED
  function fetchPage(start, signal) {
    var url = SUPABASE_URL + '/rest/v1/questions?select=*&offset=' + start + '&limit=' + pageSize;
    if (moduleLabel) url += '&module=eq.' + moduleLabel;

    return fetch(url, {
      signal: signal,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    }).then(function(r) {
      if (!r.ok) throw new Error('Supabase REST HTTP ' + r.status);
      return r.json();
    }).then(function(rows) {
      return rows || [];
    });
  }

  function fetchAll(signal) {
    var all = [];
    function next(start) {
      return fetchPage(start, signal).then(function(rows) {
        if (!rows || rows.length === 0) return all;
        all = all.concat(rows);
        if (rows.length < pageSize) return all;
        return next(start + pageSize);
      });
    }
    return next(0);
  }

  // 30秒超时：分页加载整库需要更多时间；使用 AbortController 取消挂起请求
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 30000);

  return Promise.race([
    fetchAll(controller.signal).then(function(rows) {
      clearTimeout(timer);

      return rows.map(function(q) { return _normalizeQuestion(q); });
    }).catch(function(err) {
      clearTimeout(timer);
      console.error('[Loader] Supabase 查询失败:', err);
      return [];
    }),
    new Promise(function(resolve) {
      setTimeout(function() { resolve([]); }, 30000);
    })
  ]);
}

/**
 * 按条件从 Supabase 拉取一小批题目（用于按需练习）
 * options: { modules, difficulties, targets, concept, count }
 * 使用直接 REST API fetch 替代 SDK 查询，避免 SDK 内部自动取消并发请求导致 ERR_ABORTED
 */
function fetchQuestionsBatch(options) {
  options = options || {};
  var sb = typeof window.getSupabase === 'function' ? window.getSupabase() : null;
  var SUPABASE_URL = typeof window.SUPABASE_URL !== 'undefined' ? window.SUPABASE_URL :
    (sb && sb.supabaseUrl) || 'https://pgkjpuowpxngmxjjlfil.supabase.co';
  var SUPABASE_ANON_KEY = typeof window.SUPABASE_ANON_KEY !== 'undefined' ? window.SUPABASE_ANON_KEY :
    (sb && sb.supabaseKey) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBna2pwdW93cHhuZ214ampsZmlsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA2ODM2MzIsImV4cCI6MjA5NjI1OTYzMn0.lgfxN9htgo1i4tX_KwEehW47uqOwj3Jfwy-ljsjQnx4';

  var modules = options.modules || ['module_1', 'module_2', 'module_3', 'module_4'];
  var difficulties = options.difficulties || [];
  var targets = options.targets || [];
  var concept = options.concept || null;
  var count = Math.min(Math.max(options.count || 10, 1), 50);

  // 难度映射：前端 easy/medium/hard 兼容后端 basic/league/national
  var diffAlias = {
    easy: ['easy', 'basic'],
    medium: ['medium', 'league'],
    hard: ['hard', 'national']
  };
  var acceptedDiffs = [];
  difficulties.forEach(function(d) {
    (diffAlias[d] || [d]).forEach(function(v) {
      if (acceptedDiffs.indexOf(v) < 0) acceptedDiffs.push(v);
    });
  });

  // 目标群体：'both' 表示不限制目标
  var acceptedTargets = targets.filter(function(t) { return t !== 'both'; });

  // 构建 REST API URL
  var url = SUPABASE_URL + '/rest/v1/questions?select=*';

  // 模块过滤
  if (modules.length === 1) {
    url += '&module=eq.' + modules[0];
  } else if (modules.length > 1) {
    url += '&module=in.(' + modules.join(',') + ')';
  }

  // 目标群体过滤
  if (acceptedTargets.length === 1) {
    url += '&target=eq.' + acceptedTargets[0];
  } else if (acceptedTargets.length > 1) {
    url += '&target=in.(' + acceptedTargets.join(',') + ')';
  }

  // 随机偏移 + 分页
  var offset = Math.floor(Math.random() * Math.max(1, 100));
  url += '&order=id.desc&offset=' + offset + '&limit=' + (count * 3);

  // 20秒超时，使用 AbortController 取消挂起请求
  var controller = new AbortController();
  var timer = setTimeout(function() { controller.abort(); }, 20000);

  return Promise.race([
    fetch(url, {
      signal: controller.signal,
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': 'Bearer ' + SUPABASE_ANON_KEY
      }
    }).then(function(r) {
      if (!r.ok) throw new Error('Supabase REST HTTP ' + r.status);
      return r.json();
    }).then(function(rows) {
      clearTimeout(timer);
      if (!rows || rows.length === 0) return [];
      var normalized = rows.map(function(q) { return _normalizeQuestion(q); }).filter(Boolean);

      // 客户端过滤难度与概念
      var filtered = normalized.filter(function(q) {
        if (!q || !q.subQuestions || q.subQuestions.length < 2) return false;
        if (acceptedDiffs.length > 0 && acceptedDiffs.indexOf(q.difficulty) < 0) return false;
        if (concept) {
          var inConcept = q.concept === concept;
          var inTags = q.tags && q.tags.indexOf(concept) >= 0;
          var inQuestion = q.question && q.question.indexOf(concept) >= 0;
          var inExplanation = q.explanation && q.explanation.indexOf(concept) >= 0;
          if (!inConcept && !inTags && !inQuestion && !inExplanation) return false;
        }
        return true;
      });

      return filtered.slice(0, count);
    }).catch(function(err) {
      clearTimeout(timer);
      console.error('[Loader] 批量拉取失败:', err);
      return [];
    }),
    new Promise(function(resolve) {
      setTimeout(function() { resolve([]); }, 20000);
    })
  ]);
}

window.fetchQuestionsBatch = fetchQuestionsBatch;

function _normalizeQuestion(q) {
  // 兼容两种后端格式：
  // 1) 前端本地格式：type, question, subQuestions, explanation, subject, concept, difficulty, chart, year
  // 2) server.py 生成格式：stem, options, answer, analysis, knowledge, module, difficulty, target, subject, concept, tags
  if (!q) return null;

  // server.py 格式（单选/判断/多重判断）-> 转前端 MTF 兼容格式
  if (q.stem && q.options) {
    var labels = Object.keys(q.options).sort();
    // 兼容两种 answer 格式：单选 "A" 或 多重判断 {"A": true, "B": false, ...}
    var isMultiJudge = (typeof q.answer === 'object' && q.answer !== null);
    var subQuestions = labels.map(function(label) {
      return {
        label: label,
        text: q.options[label],
        answer: isMultiJudge ? (q.answer[label] === true) : (q.answer === label)
      };
    });
    // module 归一化：数字转字符串
    var mod = q.module;
    if (typeof mod === 'number') mod = 'module_' + mod;
    return {
      id: q.id || null,
      type: q.type || (isMultiJudge ? 'multi_judge' : 'mtf'),
      question: q.stem,
      subQuestions: subQuestions,
      explanation: q.analysis || q.explanation || '',
      subject: q.subject || (q.knowledge && q.knowledge[0]) || '',
      concept: q.concept || (q.knowledge && q.knowledge[1]) || '',
      difficulty: q.difficulty || 'medium',
      chart: q.chart || null,
      year: q.year || null,
      module: mod,
      target: q.target || _inferTarget(q),
      tags: q.tags || [],
      source: 'supabase'
    };
  }

  // 原生前端格式：没有 target 字段时按难度推断
  var diff0 = String(q.difficulty || 'easy').toLowerCase();
  return {
    id: q.id || null,
    type: q.type, question: q.question,
    subQuestions: q.sub_questions || q.subQuestions || [],
    explanation: q.explanation || '', subject: q.subject || '',
    concept: q.concept || '',
    difficulty: q.difficulty || 'easy',
    chart: q.chart || null, year: q.year || null,
    module: q.module,
    target: q.target || (diff0 === 'easy' ? 'high_school' : (diff0 === 'hard' ? 'competition' : 'both')),
    source: 'local'
  };
}

// 根据题目难度推断目标群体（缺失 target 字段时使用）
function _inferTarget(q) {
  if (!q) return 'both';
  var d = String(q.difficulty || 'easy').toLowerCase();
  if (d === 'basic' || d === 'easy') return 'high_school';
  if (d === 'national' || d === 'league' || d === 'hard') return 'competition';
  return 'both';
}

function _fetchJSON(url, signal) {
  return fetch(url, { signal: signal }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + url);
    return r.json();
  });
}

function _fetchAPI(path, signal) {
  return fetch(path, { signal: signal }).then(function (r) {
    if (!r.ok) throw new Error('HTTP ' + r.status + ': ' + path);
    return r.json();
  });
}

function _fetchModule(moduleNum, onProgress, signal) {
  var key = 'module_' + moduleNum;
  if (_loadingPromises[key]) return _loadingPromises[key];

  _loadingPromises[key] = _loadModuleFromDBOrFetch(moduleNum, signal)
    .then(function (result) {
      var items = result.data;
      _setCached(key, items);
      if (onProgress) onProgress(moduleNum, items.length);
      _loadingPromises[key] = null;
      return items;
    })
    .catch(function (err) {
      _loadingPromises[key] = null;
      throw err;
    });

  return _loadingPromises[key];
}

function _loadAll(onProgress, signal, forceRefresh) {
  if (!forceRefresh && _hasCached('_all')) return Promise.resolve(_getCached('_all'));

  return _loadFromDB('quiz_all').then(function (record) {
    if (!forceRefresh && _isCacheRecordValid(record, ALL_CACHE_TTL)) {

      _setCached('_all', record.data);
      return record.data;
    }
    // 优先从 Supabase 直连获取
    return _fetchFromSupabase(null)
      .then(function (items) {
        if (items && items.length > 0) {
          // P0-4: 防御性过滤
          items = _filterQuarantinedQuestions(items);
          _setCached('_all', items);
          _saveToDB('quiz_all', items);
          if (onProgress) onProgress(0, items.length);
          return items;
        }
        // Supabase 返回空数据，回退到本地 JSON
        return _fetchJSON('data/quiz.json', signal).then(function (data) {
          var items = _filterQuarantinedQuestions(data.题库 || []);
          _setCached('_all', items);
          _saveToDB('quiz_all', items);
          if (onProgress) onProgress(0, items.length);
          return items;
        });
      })
      .catch(function () {
        // Supabase 不可用，回退到本地 JSON
        return _fetchJSON('data/quiz.json', signal).then(function (data) {
          var items = _filterQuarantinedQuestions(data.题库 || []);
          _setCached('_all', items);
          _saveToDB('quiz_all', items);
          if (onProgress) onProgress(0, items.length);
          return items;
        });
      });
  });
}

/* ============================================================
 * 缓存管理
 * ============================================================ */

function clearQuestionCache() {
  _questionCache = {};
  _loadingPromises = {};
}

function _clearIndexedDB() {
  return _openDB().then(function (db) {
    if (!db) return;
    try {
      var tx = db.transaction('modules', 'readwrite');
      var store = tx.objectStore('modules');
      store.clear();
    } catch (e) {}
  });
}

function clearAllCaches() {
  clearQuestionCache();
  return _clearIndexedDB();
}

function getCachedModule(moduleNum) {
  return _getCached('module_' + moduleNum) || null;
}

function getCachedAll() {
  return _getCached('_all') || null;
}

function isModuleCached(moduleNum) {
  return _hasCached('module_' + moduleNum);
}

window.loadQuestions = loadQuestions;
window.loadQuestionsStream = loadQuestionsStream;
window.clearQuestionCache = clearQuestionCache;
window.clearAllCaches = clearAllCaches;
window.abortLoading = abortLoading;
window.abortAllLoading = abortAllLoading;
window.isModuleCached = isModuleCached;