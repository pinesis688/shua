/**
 * ============================================================
 * BioQuest — 工具函数集合
 * 提供常用的通用工具函数
 * ============================================================
 */

/**
 * Fisher-Yates 洗牌算法
 * 原地随机打乱数组顺序
 * @template T
 * @param {T[]} array - 需要打乱的数组
 * @returns {T[]} 原数组引用（已原地打乱）
 */
function shuffle(array) {
  if (!Array.isArray(array)) {
    console.warn('[BioQuest Utils] shuffle 需要数组参数');
    return array;
  }

  const arr = array;
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * 格式化秒数为 HH:MM:SS 格式
 * @param {number} seconds - 总秒数
 * @param {Object} [options] - 格式化选项
 * @param {boolean} [options.showHours=true] - 是否始终显示小时
 * @param {boolean} [options.padHours=false] - 是否补零小时
 * @returns {string} 格式化后的时间字符串
 */
function formatTime(seconds, options = {}) {
  const { showHours = true, padHours = false } = options;

  if (typeof seconds !== 'number' || seconds < 0 || !isFinite(seconds)) {
    return showHours ? '00:00:00' : '00:00';
  }

  const totalSeconds = Math.floor(seconds);
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');

  if (showHours || hrs > 0) {
    const hoursStr = padHours || hrs > 0 ? pad(hrs) : String(hrs);
    return `${hoursStr}:${pad(mins)}:${pad(secs)}`;
  }

  return `${pad(mins)}:${pad(secs)}`;
}

/**
 * 防抖函数
 * 在连续调用时只执行最后一次，适用于搜索输入、窗口调整等场景
 * @param {Function} fn - 需要防抖的函数
 * @param {number} delay - 延迟时间（毫秒）
 * @returns {Function} 防抖后的函数
 */
function debounce(fn, delay) {
  if (typeof fn !== 'function') {
    throw new TypeError('[BioQuest Utils] debounce 需要函数作为第一个参数');
  }

  let timer = null;

  function debounced(...args) {
    if (timer) {
      clearTimeout(timer);
    }

    timer = setTimeout(() => {
      timer = null;
      fn.apply(this, args);
    }, delay);
  }

  debounced.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  return debounced;
}

/**
 * 节流函数
 * 在指定时间间隔内只执行一次，适用于滚动、鼠标移动等高频事件
 * @param {Function} fn - 需要节流的函数
 * @param {number} delay - 节流间隔（毫秒）
 * @returns {Function} 节流后的函数
 */
function throttle(fn, delay) {
  if (typeof fn !== 'function') {
    throw new TypeError('[BioQuest Utils] throttle 需要函数作为第一个参数');
  }

  let lastTime = 0;
  let timer = null;

  function throttled(...args) {
    const now = Date.now();
    const remaining = delay - (now - lastTime);

    if (remaining <= 0) {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      lastTime = now;
      fn.apply(this, args);
    } else if (!timer) {
      timer = setTimeout(() => {
        lastTime = Date.now();
        timer = null;
        fn.apply(this, args);
      }, remaining);
    }
  }

  throttled.cancel = function () {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
    lastTime = 0;
  };

  return throttled;
}

/**
 * 生成唯一标识符
 * 使用时间戳 + 随机数组合生成
 * @param {Object} [options] - 生成选项
 * @param {string} [options.prefix=''] - ID 前缀
 * @param {number} [options.length=10] - 随机部分的长度
 * @returns {string} 生成的唯一ID
 */
function generateId(options = {}) {
  const { prefix = '', length = 10 } = options;

  const timestamp = Date.now().toString(36);
  const randomPart = Math.random()
    .toString(36)
    .slice(2, 2 + length);

  return `${prefix}${timestamp}_${randomPart}`;
}

/**
 * 防 XSS 攻击 — HTML 转义
 * 将特殊字符转换为 HTML 实体
 * @param {string} str - 需要转义的字符串
 * @returns {string} 转义后的安全字符串
 */
function escapeHtml(str) {
  if (typeof str !== 'string') {
    return String(str ?? '');
  }

  const entityMap = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;'
  };

  return str.replace(/[&<>"'/`=]/g, (char) => entityMap[char]);
}

/**
 * 模块编号转中文名称
 * 将数字编号映射为对应的竞赛生物学科目名称
 * @param {number|string} num - 模块编号
 * @returns {string} 模块中文名称
 */
function moduleName(num) {
  const MODULE_MAP = {
    1: '植物学',
    2: '动物学',
    3: '生物化学',
    4: '细胞生物学',
    5: '分子生物学',
    6: '遗传学',
    7: '微生物学',
    8: '生态学',
    9: '进化生物学',
    10: '动物生理学',
    11: '植物生理学',
    12: '实验技术',
    13: '生物信息学',
    14: '通用'
  };

  const key = String(num);
  return MODULE_MAP[key] || `模块${num}`;
}

/**
 * 深拷贝对象
 * 使用结构化克隆算法复制复杂对象
 * @template T
 * @param {T} obj - 需要拷贝的对象
 * @returns {T} 深拷贝后的新对象
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  try {
    return structuredClone(obj);
  } catch (e) {
    return JSON.parse(JSON.stringify(obj));
  }
}

/**
 * 截断文本并添加省略号
 * @param {string} text - 原始文本
 * @param {number} maxLength - 最大长度
 * @param {string} [ellipsis='...'] - 省略符号
 * @returns {string} 截断后的文本
 */
function truncateText(text, maxLength, ellipsis = '...') {
  if (typeof text !== 'string') return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - ellipsis.length) + ellipsis;
}

/**
 * 计算正确率百分比
 * @param {number} correct - 正确数
 * @param {number} total - 总数
 * @returns {number} 百分比整数 (0-100)
 */
function calcAccuracy(correct, total) {
  if (!total || total <= 0) return 0;
  return Math.round((correct / total) * 100);
}

/**
 * 获取数组中随机一个元素
 * @template T
 * @param {T[]} array - 源数组
 * @returns {T|undefined} 随机元素
 */
function randomPick(array) {
  if (!Array.isArray(array) || array.length === 0) return undefined;
  return array[Math.floor(Math.random() * array.length)];
}

/**
 * 从数组中随机选取 N 个不重复元素
 * @template T
 * @param {T[]} array - 源数组
 * @param {number} count - 选取数量
 * @returns {T[]} 选取的元素数组
 */
function randomSample(array, count) {
  if (!Array.isArray(array) || array.length === 0) return [];
  if (count >= array.length) return shuffle([...array]);

  const indices = new Set();
  while (indices.size < count) {
    indices.add(Math.floor(Math.random() * array.length));
  }

  return [...indices].map((i) => array[i]);
}

/**
 * 渲染题目图表/图片
 * 支持 data URI、外部 URL、Markdown 表格、ASCII 表格和纯文本描述
 * @param {string} chart - 图表内容
 * @returns {string} 图表 HTML
 */
function renderChart(chart) {
  if (chart === null || chart === undefined) return '';
  if (chart === '' || (typeof chart === 'string' && chart.trim() === '')) return '';

  // 兼容对象/数组格式
  if (typeof chart !== 'string') {
    try {
      if (chart && typeof chart.url === 'string' && chart.url) {
        chart = chart.url;
      } else if (Array.isArray(chart) && chart.length > 0) {
        if (typeof chart[0] === 'string') {
          chart = chart.join('\n');
        } else if (Array.isArray(chart[0])) {
          // 二维数组：[['列1','列2'], ['A','B']]
          var html2 = '<div class="question-chart-wrapper chart-table" style="margin:12px 0;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid var(--border-light);font-size:0.92rem;">';
          for (var rx = 0; rx < chart.length; rx++) {
            html2 += '<tr>';
            for (var cx = 0; cx < chart[rx].length; cx++) {
              var tag2 = rx === 0 ? 'th' : 'td';
              html2 += `<${tag2} style="padding:10px 14px;border:1px solid var(--border-light);background:${rx === 0 ? 'var(--surface-secondary)' : 'var(--surface-tertiary)'};text-align:center;">${escapeHtml(String(chart[rx][cx]))}</${tag2}>`;
            }
            html2 += '</tr>';
          }
          html2 += '</table></div>';
          return html2;
        } else {
          chart = JSON.stringify(chart);
        }
      } else {
        chart = JSON.stringify(chart);
      }
    } catch(e) {
      chart = String(chart);
    }
  }

  const s = String(chart).trim();
  if (!s) return '';

  // 真实图片：data URI 或 http(s) URL；增加 onerror 兜底与懒加载
  if (s.startsWith('data:image') || /^https?:\/\//.test(s)) {
    const src = s.split(/\s+/)[0];
    return `<div class="question-chart-wrapper" style="margin:12px 0;">
      <img src="${escapeHtml(src)}" alt="题目图表" loading="lazy" decoding="async"
        style="max-width:100%;border-radius:12px;border:1px solid var(--border-light);background:var(--surface-tertiary);padding:8px;box-shadow:0 2px 8px rgba(0,0,0,0.06);display:block;"
        onerror="if(!this.dataset.retried){this.dataset.retried='1';this.style.display='none';var note=document.createElement('div');note.style.cssText='margin-top:8px;padding:10px 14px;border-radius:8px;border:1px dashed var(--border-light);color:var(--text-muted);font-size:0.82rem;background:var(--surface-tertiary);';note.textContent='图表/图片加载失败，请检查网络或稍后重试。';this.parentNode.appendChild(note);}">
    </div>`;
  }

  // Markdown 表格（多行）：| 列1 | 列2 |
  if (s.startsWith('|') && s.includes('\n')) {
    var rows = s.split('\n').map(function(r){ return r.trim(); }).filter(function(r){ return r.length > 0; });
    var allTable = rows.every(function(r){ return r.startsWith('|') && r.endsWith('|'); });
    if (allTable) {
      var html = '<div class="question-chart-wrapper chart-table" style="margin:12px 0;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid var(--border-light);font-size:0.92rem;">';
      for (var i = 0; i < rows.length; i++) {
        if (/^\|[-:\|\s]+\|$/.test(rows[i])) continue;
        var cells = rows[i].split('|').map(function(c){ return c.trim(); }).filter(function(c){ return c.length > 0; });
        if (cells.length === 0) continue;
        var tag = i === 0 ? 'th' : 'td';
        html += '<tr>';
        for (var j = 0; j < cells.length; j++) {
          html += `<${tag} style="padding:10px 14px;border:1px solid var(--border-light);background:${i === 0 ? 'var(--surface-secondary)' : 'var(--surface-tertiary)'};text-align:center;">${escapeHtml(cells[j])}</${tag}>`;
        }
        html += '</tr>';
      }
      html += '</table></div>';
      return html;
    }
  }

  // 单个 Markdown 表头行：| 组别 | 对照组 | 实验组A |
  if (s.startsWith('|') && s.endsWith('|') && s.indexOf('|') !== s.lastIndexOf('|')) {
    var cells2 = s.split('|').map(function(c){ return c.trim(); }).filter(function(c){ return c.length > 0; });
    if (cells2.length >= 2) {
      return `<div class="question-chart-wrapper chart-table" style="margin:12px 0;overflow-x:auto;"><table style="width:100%;border-collapse:collapse;border-radius:8px;overflow:hidden;border:1px solid var(--border-light);font-size:0.92rem;"><tr>${cells2.map(function(c){ return `<th style="padding:10px 14px;border:1px solid var(--border-light);background:var(--surface-secondary);text-align:center;">${escapeHtml(c)}</th>`; }).join('')}</tr></table></div>`;
    }
  }

  // 纯文本描述：使用等宽字体保留缩进/换行
  return `<div class="question-chart-wrapper chart-text" style="margin:12px 0;background:var(--surface-tertiary);padding:16px;border-radius:12px;border:1px dashed var(--border-light);font-family:ui-monospace,SFMono-Regular,Menlo,Monaco,Consolas,monospace;font-size:0.9rem;line-height:1.6;white-space:pre-wrap;overflow-x:auto;">${escapeHtml(s)}</div>`;
}

/**
 * 判断是否为移动设备
 * @returns {boolean} 是否为移动设备
 */
function isMobile() {
  return /Android|iPhone|iPad|iPod|webOS/i.test(navigator.userAgent)
    || window.innerWidth < 768;
}

/**
 * 获取 URL 查询参数
 * @param {string} [url] - URL 字符串，默认为当前页面 URL
 * @returns {Object} 查询参数键值对
 */
function getQueryParams(url) {
  const search = url
    ? new URL(url).search
    : window.location.search;

  const params = {};
  const searchParams = new URLSearchParams(search);

  for (const [key, value] of searchParams) {
    params[key] = value;
  }

  return params;
}

/**
 * 平滑滚动到指定元素
 * @param {string|HTMLElement} target - 目标元素或选择器
 * @param {Object} [options] - 滚动选项
 * @param {number} [options.offset=0] - 偏移量（像素）
 */
function scrollToElement(target, options = {}) {
  const { offset = 0 } = options;

  const element = typeof target === 'string'
    ? document.querySelector(target)
    : target;

  if (!element) return;

  const top = element.getBoundingClientRect().top + window.scrollY - offset;

  window.scrollTo({
    top,
    behavior: 'smooth'
  });
}

/**
 * 复制文本到剪贴板
 * @param {string} text - 需要复制的文本
 * @returns {Promise<boolean>} 是否复制成功
 */
async function copyToClipboard(text) {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const success = document.execCommand('copy');
    document.body.removeChild(textarea);
    return success;
  } catch (e) {
    console.warn('[BioQuest Utils] 复制失败:', e.message);
    return false;
  }
}

/**
 * 相对时间格式化
 * @param {number|string|Date} date - 日期
 * @returns {string} 相对时间描述
 */
function timeAgo(date) {
  const now = Date.now();
  const then = new Date(date).getTime();
  const diff = now - then;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return '刚刚';
  if (minutes < 60) return `${minutes} 分钟前`;
  if (hours < 24) return `${hours} 小时前`;
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  if (days < 365) return `${Math.floor(days / 30)} 个月前`;

  return `${Math.floor(days / 365)} 年前`;
}