/**
 * ============================================================
 * BioQuest — PhET 互动模拟实验集成
 * 通过 iframe 嵌入 PhET Interactive Simulations (CC BY 4.0)
 * 来源：https://phet.colorado.edu
 * 许可证：HTML 模拟文件遵循 CC BY 4.0，需署名 University of Colorado Boulder
 * ============================================================
 */

(function() {
  'use strict';

  // 局部 HTML 转义 fallback
  function escapeHtml(str) {
    if (typeof window !== 'undefined' && typeof window.escapeHtml === 'function') {
      return window.escapeHtml(str);
    }
    if (str == null) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // 八个与高中生物学相关的 PhET 模拟
  // 全部使用 latest 版本令牌，自动跟随官方更新
  var SIMS = [
    {
      id: 'gene-expression-essentials',
      title: '基因表达基础',
      topic: '遗传',
      topic_zh: '中心法则 · 转录翻译',
      desc: '可视化 DNA 转录为 mRNA、mRNA 翻译为蛋白质的全过程。可调节基因启动/关闭，观察蛋白质合成速率变化。',
      knowledge: '对应「基因的表达」章节：启动子、RNA 聚合酶、密码子、tRNA、核糖体翻译。'
    },
    {
      id: 'gene-machine-lac-operon',
      title: '基因机器：乳糖操纵子',
      topic: '遗传',
      topic_zh: '原核基因调控',
      desc: '调节乳糖操纵子（lac operon）的表达：诱导剂、阻遏蛋白、CAP-cAMP 复合物如何协同控制基因开关。',
      knowledge: '对应「基因调控」：负调控（阻遏蛋白）、正调控（CAP-cAMP）、诱导表达。'
    },
    {
      id: 'natural-selection',
      title: '自然选择',
      topic: '进化',
      topic_zh: '达尔文进化论',
      desc: '通过兔子种群实验观察突变、环境选择、遗传漂变如何驱动种群进化。可调节环境因子、突变率、选择压力。',
      knowledge: '对应「生物进化」：自然选择三要素（变异/遗传/选择压力）、种群基因频率变化。'
    },
    {
      id: 'membrane-transport',
      title: '膜运输',
      topic: '细胞',
      topic_zh: '物质跨膜运输',
      desc: '动态观察自由扩散、协助扩散、主动运输三种方式。可调节浓度梯度、载体蛋白、ATP 供应。',
      knowledge: '对应「物质进出细胞」：被动运输（自由/协助扩散）、主动运输、胞吞胞吐。'
    },
    {
      id: 'membrane-channels',
      title: '膜通道蛋白',
      topic: '细胞',
      topic_zh: '离子通道',
      desc: '观察通道蛋白如何选择性地让特定离子通过细胞膜。可调节通道开关、离子浓度、通道类型。',
      knowledge: '对应「细胞膜的结构与功能」：选择透过性、闸门通道、水通道蛋白 AQP。'
    },
    {
      id: 'neuron',
      title: '神经元',
      topic: '神经调节',
      topic_zh: '动作电位',
      desc: '刺激神经元观察静息电位、去极化、复极化、超极化的全过程。可调节 Na⁺/K⁺ 通透性观察电位变化。',
      knowledge: '对应「神经调节」：静息电位、动作电位、Na⁺-K⁺ 泵、阈刺激。'
    },
    {
      id: 'molecular-motors',
      title: '分子马达',
      topic: '神经调节',
      topic_zh: '轴突运输',
      desc: '观察驱动蛋白和动力蛋白如何沿微管运输囊泡。可调节 ATP 浓度、负载大小、马达类型。',
      knowledge: '对应「细胞骨架」：微管、驱动蛋白 kinesin、动力蛋白 dynein、ATP 供能。'
    },
    {
      id: 'stretching-dna',
      title: '拉伸 DNA',
      topic: '分子生物学',
      topic_zh: 'DNA 双螺旋力学',
      desc: '通过原子力显微镜观察 DNA 双螺旋的力学特性。可调节拉力、温度、离子强度观察 DNA 解链。',
      knowledge: '对应「核酸的结构」：氢键、碱基堆积力、Tm 值、GC 含量与稳定性。'
    }
  ];

  var _state = {
    activeSim: null,
    modalEl: null
  };

  // 构建模拟 URL
  function buildSimUrl(simId) {
    return 'https://phet.colorado.edu/sims/html/' + simId + '/latest/' + simId + '_en.html';
  }

  // 渲染顶部介绍区
  function _renderHeader() {
    return '' +
      '<div class="phet-header">' +
        '<div class="phet-header-icon">🧬</div>' +
        '<h1 class="phet-title">PhET 互动模拟实验</h1>' +
        '<p class="phet-subtitle">基于 PhET Interactive Simulations，由科罗拉多大学博尔德分校提供</p>' +
        '<p class="phet-desc">通过互动可视化深入理解生物学的核心机制 — 基因表达、自然选择、膜运输、神经冲动、DNA 力学等。每个模拟对应一个核心生物学概念，配合教材学习效果更佳。</p>' +
        '<div class="phet-attribution">' +
          '<a href="https://phet.colorado.edu" target="_blank" rel="noopener noreferrer" class="phet-attribution-link">' +
            'PhET Interactive Simulations, University of Colorado Boulder · CC BY 4.0' +
          '</a>' +
        '</div>' +
      '</div>';
  }

  // 渲染主题筛选标签
  function _renderTopicFilter() {
    var topics = ['全部', '遗传', '进化', '细胞', '神经调节', '分子生物学'];
    return '<div class="phet-topic-filter" id="phet-topic-filter">' +
      topics.map(function(t, i) {
        return '<button class="phet-topic-btn' + (i === 0 ? ' phet-topic-btn--active' : '') +
          '" data-topic="' + escapeHtml(t) + '">' + escapeHtml(t) + '</button>';
      }).join('') +
    '</div>';
  }

  // 渲染模拟卡片
  function _renderSimCard(sim) {
    return '' +
      '<article class="phet-card" data-sim-id="' + escapeHtml(sim.id) + '" data-topic="' + escapeHtml(sim.topic) + '">' +
        '<div class="phet-card-header">' +
          '<span class="phet-card-topic">' + escapeHtml(sim.topic) + '</span>' +
          '<h3 class="phet-card-title">' + escapeHtml(sim.title) + '</h3>' +
          '<p class="phet-card-subtitle">' + escapeHtml(sim.topic_zh) + '</p>' +
        '</div>' +
        '<div class="phet-card-body">' +
          '<p class="phet-card-desc">' + escapeHtml(sim.desc) + '</p>' +
          '<div class="phet-card-knowledge">' +
            '<span class="phet-card-knowledge-label">📚 教材对应</span>' +
            '<p>' + escapeHtml(sim.knowledge) + '</p>' +
          '</div>' +
        '</div>' +
        '<button class="phet-card-btn" data-action="open-sim" data-sim-id="' + escapeHtml(sim.id) + '">' +
          '▶ 启动互动模拟' +
        '</button>' +
      '</article>';
  }

  // 渲染模拟网格
  function _renderSimGrid(filterTopic) {
    var sims = (filterTopic && filterTopic !== '全部')
      ? SIMS.filter(function(s) { return s.topic === filterTopic; })
      : SIMS;
    return '<div class="phet-grid" id="phet-grid">' +
      sims.map(_renderSimCard).join('') +
    '</div>';
  }

  // 打开模拟模态框
  function _openSimModal(simId) {
    var sim = null;
    for (var i = 0; i < SIMS.length; i++) {
      if (SIMS[i].id === simId) { sim = SIMS[i]; break; }
    }
    if (!sim) return;

    _closeSimModal(); // 关闭已有模态框

    var overlay = document.createElement('div');
    overlay.className = 'phet-modal-overlay';
    overlay.id = 'phet-modal-overlay';
    overlay.innerHTML = '' +
      '<div class="phet-modal">' +
        '<div class="phet-modal-header">' +
          '<div class="phet-modal-title-wrap">' +
            '<h2 class="phet-modal-title">' + escapeHtml(sim.title) + '</h2>' +
            '<p class="phet-modal-subtitle">' + escapeHtml(sim.topic) + ' · ' + escapeHtml(sim.topic_zh) + '</p>' +
          '</div>' +
          '<button class="phet-modal-close" id="phet-modal-close" aria-label="关闭模拟">×</button>' +
        '</div>' +
        '<div class="phet-modal-frame">' +
          '<iframe src="' + escapeHtml(buildSimUrl(sim.id)) + '" ' +
            'class="phet-modal-iframe" ' +
            'allowfullscreen allow="autoplay; encrypted-media; picture-in-picture" ' +
            // sandbox 防御纵深：允许脚本+同源（PhET 需要本地存储配置）+ 弹窗
            // 不允许 allow-top-navigation，防止 iframe 导航父窗口
            'sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox" ' +
            'referrerpolicy="no-referrer-when-downgrade" ' +
            'title="' + escapeHtml(sim.title) + '"></iframe>' +
        '</div>' +
        '<div class="phet-modal-footer">' +
          '<div class="phet-modal-desc">' + escapeHtml(sim.desc) + '</div>' +
          '<div class="phet-modal-knowledge">' +
            '<strong>📚 教材对应：</strong>' + escapeHtml(sim.knowledge) +
          '</div>' +
          '<a href="https://phet.colorado.edu/sims/html/' + escapeHtml(simId) + '/latest/' + escapeHtml(simId) + '_en.html" ' +
             'target="_blank" rel="noopener noreferrer" class="phet-modal-openlink">' +
            '↗ 在 PhET 官网打开（全屏）' +
          '</a>' +
          '<p class="phet-modal-attribution">' +
            '模拟由 <a href="https://phet.colorado.edu" target="_blank" rel="noopener noreferrer">PhET Interactive Simulations</a>，' +
            'University of Colorado Boulder 提供，遵循 CC BY 4.0 许可证。' +
          '</p>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);
    _state.activeSim = simId;
    _state.modalEl = overlay;

    // 关闭事件
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) _closeSimModal();
    });
    var closeBtn = overlay.querySelector('#phet-modal-close');
    if (closeBtn) closeBtn.addEventListener('click', _closeSimModal);

    // ESC 关闭
    document.addEventListener('keydown', _onEscKey);

    // 路由变化时自动关闭（MEDIUM-1 修复：防止模态框 + body 滚动锁残留）
    window.addEventListener('hashchange', _closeSimModal);

    // 锁定背景滚动
    document.body.style.overflow = 'hidden';

    // 焦点陷阱：将焦点设到关闭按钮
    if (closeBtn) closeBtn.focus();
  }

  function _onEscKey(e) {
    if (e.key === 'Escape' || e.keyCode === 27) {
      _closeSimModal();
    }
  }

  function _closeSimModal() {
    if (_state.modalEl && _state.modalEl.parentNode) {
      _state.modalEl.parentNode.removeChild(_state.modalEl);
    }
    _state.modalEl = null;
    _state.activeSim = null;
    document.removeEventListener('keydown', _onEscKey);
    window.removeEventListener('hashchange', _closeSimModal); // 移除路由变化监听
    document.body.style.overflow = '';
  }

  // 渲染整页
  function renderPhetSimsPage(target) {
    if (!target) target = document.getElementById('main-content') || document.body;
    target.innerHTML = '<div class="phet-page">' +
      _renderHeader() +
      _renderTopicFilter() +
      _renderSimGrid('全部') +
      '<div class="phet-footer">' +
        '<p>💡 提示：首次加载模拟需要数秒，请耐心等待。模拟在 PhET 服务器运行，需要网络连接。</p>' +
        '<p class="phet-license">' +
          '本页集成 PhET Interactive Simulations HTML5 文件，版权归 ' +
          '<a href="https://phet.colorado.edu" target="_blank" rel="noopener noreferrer">University of Colorado Boulder</a> ' +
          '所有，遵循 <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener noreferrer">CC BY 4.0</a> 许可证。' +
          'BioQuest 仅通过 iframe 嵌入官方模拟文件，未修改 PhET 源代码。' +
        '</p>' +
      '</div>' +
    '</div>';

    _attachInteractions();
  }

  // 绑定交互
  function _attachInteractions() {
    // 主题筛选
    var filter = document.getElementById('phet-topic-filter');
    if (filter) {
      filter.addEventListener('click', function(e) {
        var btn = e.target.closest('.phet-topic-btn');
        if (!btn) return;
        var topic = btn.getAttribute('data-topic');
        // 更新激活状态
        var allBtns = filter.querySelectorAll('.phet-topic-btn');
        for (var i = 0; i < allBtns.length; i++) {
          allBtns[i].classList.remove('phet-topic-btn--active');
        }
        btn.classList.add('phet-topic-btn--active');
        // 重渲染网格
        var grid = document.getElementById('phet-grid');
        if (grid) {
          var sims = (topic && topic !== '全部')
            ? SIMS.filter(function(s) { return s.topic === topic; })
            : SIMS;
          grid.innerHTML = sims.map(_renderSimCard).join('');
        }
      });
    }

    // 卡片点击 / 启动按钮
    var grid = document.getElementById('phet-grid');
    if (grid) {
      grid.addEventListener('click', function(e) {
        var btn = e.target.closest('[data-action="open-sim"]');
        if (btn) {
          var simId = btn.getAttribute('data-sim-id');
          _openSimModal(simId);
          return;
        }
        // 点击卡片任意位置也打开
        var card = e.target.closest('.phet-card');
        if (card) {
          _openSimModal(card.getAttribute('data-sim-id'));
        }
      });
    }
  }

  // 路由初始化入口
  function initPhetSims(target) {
    renderPhetSimsPage(target);
  }

  // 暴露到全局（与 bio-lab.js / bio-animation.js 保持一致）
  if (typeof window !== 'undefined') {
    window.initPhetSims = initPhetSims;
    window.renderPhetSimsPage = renderPhetSimsPage;
  }
})();
