/**
 * ============================================================
 * BioQuest — 前端 AI 客户端（纯前端，无 server.py 依赖）
 * 默认使用智谱 GLM-4-Flash（免费），支持 Metaso 知识库作为备选
 * 支持 DeepSeek/智谱/通义/Kimi/NVIDIA/SiliconFlow 作为备选
 * ============================================================
 */
(function () {
  'use strict';

  // 知识库 ID（从 .env 注入，由 server.py 读取并注入到前端）
  var METASO_SUBJECT_ID = '2045811707737636864';

  // 服务商 → base_url + 默认模型
  var PROVIDER_MAP = {
    zhipu:       { base: 'https://open.bigmodel.cn/api/paas/v4', defaultModel: 'glm-4-flash', name: '智谱 GLM' },
    metaso:      { base: 'https://metaso.cn/api/v1', defaultModel: 'gpt-3.5-turbo', name: '秘塔 Metaso' },
    deepseek:    { base: 'https://api.deepseek.com/v1', defaultModel: 'deepseek-chat', name: 'DeepSeek' },
    qwen:        { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-turbo', name: '通义千问' },
    moonshot:    { base: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k', name: 'Kimi' },
    nvidia:      { base: 'https://integrate.api.nvidia.com/v1', defaultModel: 'meta/llama-3.3-70b-instruct', name: 'NVIDIA NIM' },
    siliconflow: { base: 'https://api.siliconflow.cn/v1', defaultModel: 'Qwen/Qwen2.5-7B-Instruct', name: '硅基流动' }
  };

  // 服务商 → 文生图模型（用于生成题目配图）
  var IMAGE_MODELS = {
    zhipu:       { base: 'https://open.bigmodel.cn/api/paas/v4', model: 'cogview-3-flash', name: '智谱 CogView-3-Flash（免费）' },
    siliconflow: { base: 'https://api.siliconflow.cn/v1', model: 'stabilityai/stable-diffusion-3-medium', name: '硅基流动 SD3' }
  };

  // 服务商 → 视觉多模态模型（用于图片 OCR、识图等）
  // 按优先级排序：1. 智谱 GLM-4V（中文 OCR 最强）2. 通义 Qwen-VL 3. SiliconFlow Qwen2-VL 4. NVIDIA Llama-Vision
  var VISION_MODELS = {
    zhipu:       { base: 'https://open.bigmodel.cn/api/paas/v4', model: 'glm-4v-flash', name: '智谱 GLM-4V' },
    qwen:        { base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-vl-plus', name: '通义 Qwen-VL' },
    siliconflow: { base: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2-VL-72B-Instruct', name: '硅基 Qwen2-VL' },
    nvidia:      { base: 'https://integrate.api.nvidia.com/v1', model: 'meta/llama-3.2-90b-vision-instruct', name: 'NVIDIA Llama-Vision' }
  };

  // P0-2 修复：移除硬编码 API Key，遵守 PRD §8.2 安全规范
  // 默认推荐 provider/model（用户须在「我的 → 设置」配置自有 Key，
  // 或开发期通过 .env + server.py 代理使用）
  var DEFAULT_PROVIDER = 'zhipu';
  var DEFAULT_MODEL = 'glm-4-flash';

  // 加载用户配置（与 user.js 共享 localStorage key）
  function loadConfig() {
    try {
      var raw = localStorage.getItem('bioquest_ai_key_config');
      if (raw) {
        var cfg = JSON.parse(raw);
        // 用户已配置自有 Key → 优先使用
        if (cfg.apiKey) return cfg;
      }
    } catch (e) {}
    // 无用户配置 → 返回空 apiKey，触发 server.py 后端回退或提示用户配置
    return { provider: DEFAULT_PROVIDER, apiKey: '', model: DEFAULT_MODEL };
  }

  // 检查每日用量上限
  function getUsage() {
    try {
      var raw = localStorage.getItem('bioquest_ai_usage');
      var data = raw ? JSON.parse(raw) : {};
      var today = new Date().toISOString().slice(0, 10);
      if (data.date !== today) {
        data = { date: today, count: 0 };
        localStorage.setItem('bioquest_ai_usage', JSON.stringify(data));
      }
      return data;
    } catch (e) { return { date: new Date().toISOString().slice(0, 10), count: 0 }; }
  }

  function incrementUsage() {
    var data = getUsage();
    if (data.count >= 100) return false;
    data.count += 1;
    try { localStorage.setItem('bioquest_ai_usage', JSON.stringify(data)); } catch (e) {}
    return true;
  }

  function canUse() {
    var cfg = loadConfig();
    var data = getUsage();
    // 即使无自定义 Key（使用后端），也检查每日上限
    if (data.count >= 100) return { ok: false, reason: '今日 AI 调用已达上限（100 次），明日 0:00 重置' };
    if (!cfg.apiKey) {
      // 无自定义 Key 时，若后端 server.py 在运行则用之，否则提示配置
      return { ok: true, useBackend: true };
    }
    return { ok: true, useBackend: false, config: cfg };
  }

  /**
   * 流式对话（SSE）
   * @param {Object} opts - { messages, temperature, maxTokens, onChunk, onDone, onError, signal }
   * @returns {Promise<void>}
   */
  function streamChat(opts) {
    var check = canUse();
    if (!check.ok) {
      if (opts.onError) opts.onError(new Error(check.reason));
      return Promise.reject(new Error(check.reason));
    }

    // 无自定义 Key → 回退到 server.py 后端
    if (check.useBackend) {
      return _streamViaBackend(opts);
    }

    var cfg = check.config;
    var prov = PROVIDER_MAP[cfg.provider] || PROVIDER_MAP.deepseek;
    var model = cfg.model || prov.defaultModel;
    var url = prov.base + '/chat/completions';

    var body = {
      model: model,
      messages: opts.messages,
      temperature: opts.temperature != null ? opts.temperature : 0.7,
      max_tokens: opts.maxTokens || 2048,
      stream: true
    };
    // 秘塔知识库：注入 subject_id
    if (cfg.provider === 'metaso' && METASO_SUBJECT_ID) {
      body.subject_id = METASO_SUBJECT_ID;
    }

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey,
        'Accept': 'text/event-stream'
      },
      body: JSON.stringify(body),
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          var msg = 'HTTP ' + resp.status;
          try { var j = JSON.parse(txt); if (j.error && j.error.message) msg += '：' + j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      incrementUsage();
      return _pumpSse(resp, opts);
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      // 流式失败 → 自动回退非流式
      console.warn('[ai-client] 流式失败，回退非流式:', err.message);
      _streamFallbackToChat(opts, cfg, model);
    });
  }

  // 流式失败时回退到非流式（Metaso 等API流式不稳定时使用）
  function _streamFallbackToChat(opts, cfg, model) {
    var prov = PROVIDER_MAP[cfg.provider] || PROVIDER_MAP.metaso;
    var url = prov.base + '/chat/completions';
    var body = {
      model: model || cfg.model || prov.defaultModel,
      messages: opts.messages,
      temperature: opts.temperature != null ? opts.temperature : 0.7,
      max_tokens: opts.maxTokens || 2048,
      stream: false
    };
    if (cfg.provider === 'metaso' && METASO_SUBJECT_ID) {
      body.subject_id = METASO_SUBJECT_ID;
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          var msg = 'HTTP ' + resp.status;
          try { var j = JSON.parse(txt); if (j.message) msg += '：' + j.message; if (j.error && j.error.message) msg += '：' + j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      return resp.json();
    }).then(function (data) {
      // 检查 Metaso 错误格式
      if (data.code && data.code !== 200) {
        throw new Error(data.message || 'API 返回错误码 ' + data.code);
      }
      var content = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if (!content) {
        throw new Error('API 返回内容为空');
      }
      if (opts.onChunk) opts.onChunk(content);
      if (opts.onDone) opts.onDone();
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      if (opts.onError) opts.onError(err);
    });
  }

  /**
   * 非流式对话（一次性返回完整结果）
   */
  function chat(opts) {
    var check = canUse();
    if (!check.ok) return Promise.reject(new Error(check.reason));

    if (check.useBackend) return _chatViaBackend(opts);

    var cfg = check.config;
    var prov = PROVIDER_MAP[cfg.provider] || PROVIDER_MAP.deepseek;
    var model = cfg.model || prov.defaultModel;
    var url = prov.base + '/chat/completions';

    var body = {
        model: model,
        messages: opts.messages,
        temperature: opts.temperature != null ? opts.temperature : 0.3,
        max_tokens: opts.maxTokens || 1024,
        stream: false
      };
      if (cfg.provider === 'metaso' && METASO_SUBJECT_ID) {
        body.subject_id = METASO_SUBJECT_ID;
      }

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          throw new Error('HTTP ' + resp.status + ': ' + txt.slice(0, 200));
        });
      }
      incrementUsage();
      return resp.json();
    }).catch(function (err) {
      if (err.name === 'AbortError') throw err;
      // 纯前端项目无后端，直连失败直接抛错
      throw err;
    });
  }

  // ====== SSE 解析（fetch + ReadableStream，兼容性强） ======
  function _pumpSse(resp, opts) {
    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var buffer = '';
    var IDLE_TIMEOUT = 60000;
    var idleTimer = null;
    var aborted = false;
    var firstChunk = true;

    function clearIdle() {
      if (idleTimer) { clearTimeout(idleTimer); idleTimer = null; }
    }
    function resetIdle() {
      clearIdle();
      idleTimer = setTimeout(function () {
        if (!aborted) {
          console.warn('[ai-client] 流式空闲超时(60s)，自动结束');
          aborted = true;
          try { reader.cancel(); } catch (e) {}
          if (opts.onDone) opts.onDone();
        }
      }, IDLE_TIMEOUT);
    }
    resetIdle();

    function pump() {
      return reader.read().then(function (result) {
        if (aborted) return;
        resetIdle();
        if (result.done) {
          clearIdle();
          if (opts.onDone) opts.onDone();
          return;
        }
        buffer += decoder.decode(result.value, { stream: true });

        // 首次收到数据时检测非 SSE 错误响应
        if (firstChunk) {
          firstChunk = false;
          var peek = buffer.trim();
          // 检测 JSON 错误响应（如 {"code":5000,"message":"..."}）
          if (peek.charAt(0) === '{') {
            try {
              var errObj = JSON.parse(peek);
              if (errObj.code || errObj.error) {
                var errMsg = errObj.message || (errObj.error && errObj.error.message) || 'API 返回错误';
                aborted = true;
                try { reader.cancel(); } catch (e) {}
                if (opts.onError) opts.onError(new Error(errMsg));
                return;
              }
            } catch (e) { /* 不是完整 JSON，继续 SSE 解析 */ }
          }
        }

        var lines = buffer.split('\n');
        buffer = lines.pop();

        for (var i = 0; i < lines.length; i++) {
          var line = lines[i].trim();
          if (!line || line === 'data: [DONE]') continue;
          if (line.indexOf('data: ') !== 0) continue;
          try {
            var obj = JSON.parse(line.slice(6));
            var delta = obj.choices && obj.choices[0] && obj.choices[0].delta;
            if (!delta) continue;
            if (delta.content && opts.onChunk) {
              opts.onChunk(delta.content);
            }
          } catch (e) { /* 忽略解析错误 */ }
        }
        return pump();
      }).catch(function (err) {
        clearIdle();
        if (aborted) return;
        if (err && err.name === 'AbortError') return;
        if (opts.onDone) opts.onDone();
      });
    }
    return pump();
  }

  // ====== 后端回退（仅当 server.py 在运行时） ======
  function _backendAvailable() {
    // 通过端口探测：localhost:8000 是否响应
    // 这里简单返回 true，让 fetch 失败时尝试回退；若后端不在则回退也失败，前端报错
    return true;
  }

  function _streamViaBackend(opts) {
    // 兼容旧 /chat 端点（server.py 提供）
    return fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: opts.messages[opts.messages.length - 1].content,
        mode: opts.mode || 'general',
        history: opts.messages.slice(0, -1).map(function (m) {
          return { role: m.role, content: m.content };
        })
      }),
      signal: opts.signal
    }).then(function (resp) {
      // 后端不在运行（Python http.server 返回 404 HTML 错误页）
      // 必须检查 resp.ok，否则会把 HTML 错误页当作 SSE 流解析，导致 AI 无声失败
      if (!resp.ok) {
        var err = new Error('AI 后端不可用（/chat 返回 HTTP ' + resp.status + '）。请前往「我的 → 设置」配置 AI API Key 以使用 AI 功能。');
        err.code = 'BACKEND_UNAVAILABLE';
        if (opts.onError) opts.onError(err);
        return;
      }
      // 检查 Content-Type 是否为 SSE 流
      var ct = resp.headers.get('content-type') || '';
      if (ct.indexOf('text/event-stream') < 0 && ct.indexOf('application/json') < 0 && ct.indexOf('text/plain') < 0) {
        var err2 = new Error('AI 后端未正确响应（Content-Type: ' + ct + '）。请前往「我的 → 设置」配置 AI API Key。');
        err2.code = 'BACKEND_UNAVAILABLE';
        if (opts.onError) opts.onError(err2);
        return;
      }
      incrementUsage();
      var reader = resp.body.getReader();
      var decoder = new TextDecoder();
      var buf = '';
      var idleTimer = null;
      var aborted = false;
      function resetIdle() {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(function () {
          if (!aborted) {
            aborted = true;
            try { reader.cancel(); } catch (e) {}
            if (opts.onDone) opts.onDone();
          }
        }, 60000);
      }
      resetIdle();
      function pump() {
        return reader.read().then(function (result) {
          if (aborted) return;
          resetIdle();
          if (result.done) { if (idleTimer) clearTimeout(idleTimer); if (opts.onDone) opts.onDone(); return; }
          buf += decoder.decode(result.value, { stream: true });
          var lines = buf.split('\n');
          buf = lines.pop();
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i].trim();
            if (!line || line === 'data: [DONE]' || line.indexOf('data: ') !== 0) continue;
            try {
              var obj = JSON.parse(line.slice(6));
              if (obj.content && opts.onChunk) opts.onChunk(obj.content);
              if (obj.error && opts.onError) opts.onError(new Error(obj.error));
            } catch (e) {}
          }
          return pump();
        }).catch(function (err) {
          if (idleTimer) clearTimeout(idleTimer);
          if (aborted) return;
          if (err && err.name === 'AbortError') return;
          if (opts.onDone) opts.onDone();
        });
      }
      return pump();
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      if (opts.onError) opts.onError(err);
    });
  }

  function _chatViaBackend(opts) {
    return fetch('/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: opts.messages[opts.messages.length - 1].content,
        mode: opts.mode || 'general',
        history: opts.messages.slice(0, -1).map(function (m) {
          return { role: m.role, content: m.content };
        })
      }),
      signal: opts.signal
    }).then(function (r) {
      // 后端不在运行（Python http.server 返回 404 HTML 错误页）
      // 必须检查 resp.ok 和 Content-Type，否则 r.json() 解析 HTML 会抛 "Unexpected token '<'"
      if (!r.ok) {
        throw new Error('AI 后端不可用（/chat 返回 HTTP ' + r.status + '）。请前往「我的 → 设置」配置 AI API Key 以使用 AI 功能。');
      }
      var ct = r.headers.get('content-type') || '';
      if (ct.indexOf('application/json') < 0 && ct.indexOf('text/plain') < 0) {
        throw new Error('AI 后端未正确响应（Content-Type: ' + ct + '）。请前往「我的 → 设置」配置 AI API Key。');
      }
      incrementUsage();
      return r.json();
    }).then(function (data) {
      // 归一化为 OpenAI 格式，保持与 chat() 直连路径返回类型一致
      if (data && data.choices && data.choices[0] && data.choices[0].message) return data;
      if (data && typeof data.content === 'string') {
        return { choices: [{ message: { role: 'assistant', content: data.content } }] };
      }
      return { choices: [{ message: { role: 'assistant', content: '' } }] };
    });
  }

  // ====== 视觉多模态 OCR（识别图片中的中英文文字，支持斜体） ======
  /**
   * 使用用户配置的视觉模型识别图片文字（OCR）
   * @param {Object} opts - { image, prompt, onDone, onError, signal }
   *   image: dataURL（如 data:image/jpeg;base64,...）
   *   prompt: 提示词（默认要求保留斜体标记）
   * @returns {Promise<void>}
   */
  function visionRecognize(opts) {
    var cfg = loadConfig();
    if (!cfg.apiKey) {
      if (opts.onError) opts.onError(new Error('未配置 AI API Key，无法使用视觉 OCR'));
      return Promise.reject(new Error('未配置 AI API Key'));
    }

    // 选择视觉模型：优先使用用户当前服务商的视觉模型；若当前服务商不支持视觉，按优先级回退
    var visionProvider = null;
    if (VISION_MODELS[cfg.provider]) {
      visionProvider = VISION_MODELS[cfg.provider];
      visionProvider.key = cfg.provider;
    } else {
      // DeepSeek / Kimi 暂无视觉，回退到智谱
      visionProvider = VISION_MODELS.zhipu;
      visionProvider.key = 'zhipu';
    }

    var url = visionProvider.base + '/chat/completions';
    var prompt = opts.prompt || '请识别图片中的所有文字（包括中文、英文、数字、符号）。要求：\n1. 完整保留原文，按从上到下、从左到右的阅读顺序输出\n2. 数学公式用 LaTeX 语法输出（如 $x^2$ 、$\\frac{1}{2}$）\n3. 若文字为斜体，用 *斜体文字* 的 Markdown 语法标记\n4. 不要添加任何解释、说明或前后缀，只输出识别到的纯文字内容\n5. 表格用 Markdown 表格语法输出\n6. 图片中的图形、装饰、水印等非文字内容请忽略';

    var body = JSON.stringify({
      model: visionProvider.model,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          { type: 'image_url', image_url: { url: opts.image } }
        ]
      }],
      temperature: 0.1,
      max_tokens: 2048,
      stream: false
    });

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: body,
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          var msg = 'HTTP ' + resp.status;
          try { var j = JSON.parse(txt); if (j.error && j.error.message) msg += '：' + j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      incrementUsage();
      return resp.json();
    }).then(function (data) {
      var text = '';
      try {
        text = data.choices[0].message.content || '';
      } catch (e) {}
      // 清理模型可能加的代码块包裹
      text = text.replace(/^```[\w]*\n?/, '').replace(/\n?```$/, '').trim();
      if (opts.onDone) opts.onDone(text);
      return text;
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      if (opts.onError) opts.onError(err);
      throw err;
    });
  }

  // 检查当前配置是否支持视觉 OCR
  function hasVisionSupport() {
    var cfg = loadConfig();
    // 必须有 API Key 且当前服务商在视觉模型表中（避免 DeepSeek/Kimi 误用智谱端点导致 401）
    return !!cfg.apiKey && !!VISION_MODELS[cfg.provider];
  }

  // 检查当前配置是否支持文生图
  function hasImageGenSupport() {
    var cfg = loadConfig();
    return !!cfg.apiKey && !!IMAGE_MODELS[cfg.provider];
  }

  /**
   * 文生图：根据提示词生成图片
   * @param {Object} opts - { prompt, size, onDone, onError, signal }
   *   prompt: 图片描述提示词
   *   size: 图片尺寸，默认 '1024x1024'
   * @returns {Promise<{url: string}>} 返回图片URL（智谱直接返回URL）
   */
  function generateImage(opts) {
    opts = opts || {};
    var cfg = loadConfig();
    if (!cfg.apiKey) {
      var err = new Error('未配置 AI API Key，无法使用文生图功能');
      if (opts.onError) opts.onError(err);
      return Promise.reject(err);
    }

    // 选择文生图模型：优先用户当前服务商，否则回退智谱（免费）
    var imgProvider = null;
    if (IMAGE_MODELS[cfg.provider]) {
      imgProvider = IMAGE_MODELS[cfg.provider];
      imgProvider.key = cfg.provider;
    } else {
      imgProvider = IMAGE_MODELS.zhipu;
      imgProvider.key = 'zhipu';
    }

    var url = imgProvider.base + '/images/generations';
    var body = {
      model: imgProvider.model,
      prompt: opts.prompt || '生物学科教学插图',
      size: opts.size || '1024x1024',
      n: 1
    };

    return fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: opts.signal
    }).then(function (resp) {
      if (!resp.ok) {
        return resp.text().then(function (txt) {
          var msg = 'HTTP ' + resp.status;
          try { var j = JSON.parse(txt); if (j.error && j.error.message) msg += '：' + j.error.message; } catch (e) {}
          throw new Error(msg);
        });
      }
      incrementUsage();
      return resp.json();
    }).then(function (data) {
      var imgUrl = '';
      try {
        // 智谱/OpenAI 格式：data.data[0].url
        if (data.data && data.data[0] && data.data[0].url) {
          imgUrl = data.data[0].url;
        }
        // SiliconFlow 可能返回 b64_json
        else if (data.data && data.data[0] && data.data[0].b64_json) {
          imgUrl = 'data:image/png;base64,' + data.data[0].b64_json;
        }
      } catch (e) {}
      if (!imgUrl) {
        throw new Error('文生图返回数据格式异常');
      }
      if (opts.onDone) opts.onDone(imgUrl);
      return { url: imgUrl };
    }).catch(function (err) {
      if (err.name === 'AbortError') return;
      if (opts.onError) opts.onError(err);
      throw err;
    });
  }

  // ====== v3.1 新增：自动重试 + Per-stage routing（T0-3/T0-4） ======
  // 借鉴 OpenMAIC PR #788：瞬时错误（429/5xx/网络）指数退避重试

  /**
   * 自动重试包装器
   * @param {Function} fn - 返回 Promise 的函数
   * @param {Object} opts - { maxRetries?: 3, backoff?: 'exponential'|'linear', baseDelay?: 1000 }
   */
  function withRetry(fn, opts) {
    opts = opts || {};
    var maxRetries = opts.maxRetries || 3;
    var baseDelay = opts.baseDelay || 1000;
    var mode = opts.backoff || 'exponential';

    return new Promise(function (resolve, reject) {
      var attempt = 0;
      function run() {
        attempt++;
        Promise.resolve()
          .then(fn)
          .then(resolve)
          .catch(function (err) {
            var isTransient = err && (
              err.status === 429 ||
              (err.status && err.status >= 500) ||
              err.name === 'NetworkError' ||
              err.name === 'TypeError'  // fetch 失败
            );
            if (!isTransient || attempt >= maxRetries) {
              reject(err);
              return;
            }
            var delay = mode === 'exponential'
              ? baseDelay * Math.pow(2, attempt - 1)
              : baseDelay * attempt;
            console.warn('[ai-client] 第 ' + attempt + ' 次失败，' + delay + 'ms 后重试:', err.message || err);
            setTimeout(run, delay);
          });
      }
      run();
    });
  }

  /**
   * Per-stage LLM 路由配置（PRD §7.2）
   * 不同课堂阶段用不同模型，平衡质量与成本
   * 默认全用 GLM-4-Flash（免费），用户配了强模型时按表升级
   */
  var STAGE_MODEL_MAP = {
    classroom_outline:   { temperature: 0.7, preferStrong: true  },  // 课堂大纲（需教学设计）
    teacher_script:      { temperature: 0.6, preferStrong: false },  // AI 老师讲稿（低延迟流式）
    variant_question:    { temperature: 0.3, preferStrong: true  },  // 变式题（需严谨）
    quick_qa:            { temperature: 0.5, preferStrong: false },  // 简单答疑（高频低成本）
    code_review:         { temperature: 0.2, preferStrong: true  },  // 代码评审（需严谨）
    whiteboard_cmd:      { temperature: 0.2, preferStrong: false },  // 白板绘图指令
    socratic_guide:      { temperature: 0.5, preferStrong: false },  // 苏格拉底引导
    peer_review:         { temperature: 0.6, preferStrong: false }   // 同伴评审
  };

  /**
   * 按阶段调用 LLM（带重试）
   * @param {string} stage - STAGE_MODEL_MAP 的 key
   * @param {Array} messages - OpenAI 格式 messages
   * @param {Object} streamOpts - 流式回调 { onChunk, onDone, onError }
   * @returns {Promise}
   */
  function callByStage(stage, messages, streamOpts) {
    streamOpts = streamOpts || {};
    var stageCfg = STAGE_MODEL_MAP[stage] || STAGE_MODEL_MAP.quick_qa;
    var cfg = loadConfig();

    // Metaso 使用单一模型，不需要 preferStrong 切换
    var useStrong = stageCfg.preferStrong && cfg.apiKey && cfg.provider !== 'zhipu' && cfg.provider !== 'metaso';

    var callOpts = {
      messages: messages,
      temperature: stageCfg.temperature,
      onChunk: streamOpts.onChunk,
      onDone: streamOpts.onDone,
      onError: streamOpts.onError,
      signal: streamOpts.signal
    };

    // 流式不重试（流断了无法续传），仅非流式重试
    if (streamOpts.onChunk) {
      return streamChat(callOpts);
    }

    // 非流式：chat() 返回 OpenAI 格式 JSON，这里提取文本字符串给调用方
    return withRetry(function () {
      return chat(callOpts).then(function (data) {
        if (data && data.choices && data.choices[0] && data.choices[0].message) {
          return data.choices[0].message.content || '';
        }
        if (data && typeof data.content === 'string') return data.content;
        return '';
      });
    }, { maxRetries: 3, backoff: 'exponential' });
  }

  // ====== 暴露 API ======
  window.AiClient = {
    streamChat: streamChat,
    chat: chat,
    canUse: canUse,
    incrementUsage: incrementUsage,
    getUsage: getUsage,
    loadConfig: loadConfig,
    visionRecognize: visionRecognize,
    hasVisionSupport: hasVisionSupport,
    generateImage: generateImage,
    hasImageGenSupport: hasImageGenSupport,
    // v3.1 新增
    withRetry: withRetry,
    callByStage: callByStage,
    STAGE_MODEL_MAP: STAGE_MODEL_MAP,
    PROVIDER_MAP: PROVIDER_MAP,
    VISION_MODELS: VISION_MODELS,
    IMAGE_MODELS: IMAGE_MODELS,
    METASO_SUBJECT_ID: METASO_SUBJECT_ID
  };
})();
