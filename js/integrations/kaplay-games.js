/**
 * ============================================================
 * BioQuest — KAPLAY 教育迷你游戏集成模块（结构搭建类）
 * 基于 KAPLAY (MIT) 提供 2D 游戏引擎
 *
 * 游戏清单（结构搭建类，适合生物竞赛备考）：
 *   - cell-builder   细胞结构拼装（植物/动物细胞，拖拽所有细胞器到正确位置）
 *   - organ-system   人体器官系统拼装（消化/呼吸/循环/神经四大系统）
 *   - dna-helix      DNA 双螺旋搭建（碱基配对 A-T/G-C，方向性 5'→3'）
 *   - protein-synth  蛋白质合成流程（转录→翻译，密码子-反密码子配对）
 *
 * 设计要点：
 *   - 懒加载：首次 init() 才注入 kaplay.js，不阻塞首屏
 *   - 销毁机制：切换路由前必须 destroy()，避免 canvas/事件残留
 *   - 数据驱动：每个游戏定义结构/位置/配对规则，便于扩展
 * ============================================================
 */
(function () {
  'use strict';

  var _loaded = false;
  var _loadingPromise = null;
  var _activeGame = null; // 当前游戏实例引用，用于 destroy

  /**
   * 懒加载 kaplay.js（仅加载一次）
   */
  function ensureLoaded() {
    if (_loaded && typeof window.kaplay === 'function') {
      return Promise.resolve();
    }
    if (_loadingPromise) return _loadingPromise;
    _loadingPromise = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = 'js/vendor/kaplay.js?v=20260723d';
      s.defer = true;
      s.onload = function () {
        if (typeof window.kaplay === 'function') {
          _loaded = true;
          resolve();
        } else {
          _loadingPromise = null; // 重置，允许下次重试
          reject(new Error('kaplay.js 加载完成但未暴露 window.kaplay'));
        }
      };
      s.onerror = function () {
        _loadingPromise = null; // 重置，允许下次重试
        reject(new Error('kaplay.js 加载失败'));
      };
      document.head.appendChild(s);
    });
    return _loadingPromise;
  }

  /**
   * 启动指定游戏
   * @param {string} containerId - canvas 容器 ID
   * @param {string} gameName - 'cell-builder'|'organ-system'|'dna-helix'|'protein-synth'
   * @param {Object} options - 游戏选项（如 cell-type: 'plant'|'animal'）
   * @returns {Promise<void>}
   */
  function init(containerId, gameName, options) {
    var container = document.getElementById(containerId);
    if (!container) return Promise.reject(new Error('容器不存在: ' + containerId));

    // 先销毁已有游戏，避免 canvas 冲突
    destroy();

    return ensureLoaded().then(function () {
      try {
        switch (gameName) {
          case 'cell-builder':
            _activeGame = startCellBuilder(containerId, options || {});
            break;
          case 'organ-system':
            _activeGame = startOrganSystem(containerId, options || {});
            break;
          case 'dna-helix':
            _activeGame = startDnaHelix(containerId, options || {});
            break;
          case 'protein-synth':
            _activeGame = startProteinSynth(containerId, options || {});
            break;
          default:
            throw new Error('未知游戏: ' + gameName);
        }
      } catch (e) {
        console.error('[KaplayGames] 启动失败:', e);
        container.innerHTML = '<p style="color:var(--color-error);text-align:center;padding:40px;">游戏启动失败: ' +
          (e.message || '未知错误') + '</p>';
      }
    }).catch(function (err) {
      console.error('[KaplayGames] 引擎加载失败:', err);
      container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:40px;">游戏引擎未加载</p>';
    });
  }

  /**
   * 销毁当前游戏（释放 canvas + 事件）
   */
  function destroy() {
    if (_activeGame && typeof _activeGame.destroy === 'function') {
      try { _activeGame.destroy(); } catch (e) {}
    }
    _activeGame = null;
  }

  // ============================================================
  // 通用工具函数
  // ============================================================

  /**
   * 在容器内创建/复用一个 <canvas> 元素供 KAPLAY 使用
   * （KAPLAY 的 `canvas` 选项必须是 HTMLCanvasElement；若直接传 <div> 会报
   *   `c.canvas.getContext is not a function`）
   * @param {string} containerId 容器元素 id（通常是 <div>）
   * @param {number} width 画布逻辑宽度
   * @param {number} height 画布逻辑高度
   * @returns {HTMLCanvasElement}
   */
  function ensureCanvas(containerId, width, height) {
    var container = document.getElementById(containerId);
    if (!container) throw new Error('容器不存在: ' + containerId);
    width = width || 800;
    height = height || 600;
    // 复用已有 canvas（若已是 canvas）
    var canvas = container.querySelector('canvas');
    if (!canvas) {
      canvas = document.createElement('canvas');
      container.innerHTML = '';
      container.appendChild(canvas);
    }
    canvas.width = width;
    canvas.height = height;
    canvas.style.width = '100%';
    canvas.style.height = 'auto';
    canvas.style.maxWidth = width + 'px';
    canvas.style.display = 'block';
    canvas.style.margin = '0 auto';
    return canvas;
  }

  /**
   * 创建带拖拽功能的组件
   * @param {Object} k - kaplay 实例
   * @param {string} label - 显示文字
   * @param {number} x - 初始 x
   * @param {number} y - 初始 y
   * @param {Array} color - [r,g,b]
   * @returns {Object} kaplay 对象
   */
  function createDraggable(k, label, x, y, color) {
    return k.add([
      k.rect(120, 44),
      k.pos(x, y),
      k.color(color[0], color[1], color[2]),
      k.area(),
      'draggable',
      {
        originalX: x,
        originalY: y,
        targetX: 0,
        targetY: 0,
        placed: false,
        label: label
      }
    ]);
  }

  /**
   * 创建目标槽位（虚线边框）
   */
  function createTarget(k, label, x, y, color) {
    var target = k.add([
      k.rect(120, 44),
      k.pos(x, y),
      k.color(255, 255, 255),
      k.outline(2, k.rgb(color[0], color[1], color[2])),
      k.area(),
      'target',
      {
        expectedLabel: label,
        occupied: false
      }
    ]);
    k.add([
      k.text(label, { size: 11 }),
      k.pos(x + 60, y + 22),
      k.anchor('center'),
      k.color(150, 150, 150)
    ]);
    return target;
  }

  /**
   * 启用拖拽逻辑
   */
  function enableDrag(k, onDrop) {
    var dragging = null;
    var dragOffset = { x: 0, y: 0 };

    k.onMouseDown('draggable', function (obj) {
      if (obj.placed) return; // 已放置的不能拖
      dragging = obj;
      var mp = k.mousePos();
      dragOffset.x = mp.x - obj.pos.x;
      dragOffset.y = mp.y - obj.pos.y;
    });

    k.onMouseMove(function () {
      if (!dragging) return;
      var mp = k.mousePos();
      dragging.pos.x = mp.x - dragOffset.x;
      dragging.pos.y = mp.y - dragOffset.y;
    });

    k.onMouseRelease(function () {
      if (!dragging) return;
      // 检查是否落在目标槽位
      var dropped = false;
      var targets = k.get('target');
      for (var i = 0; i < targets.length; i++) {
        var t = targets[i];
        if (t.occupied) continue;
        // 简单 AABB 碰撞检测
        if (Math.abs(dragging.pos.x - t.pos.x) < 60 &&
            Math.abs(dragging.pos.y - t.pos.y) < 30) {
          // 吸附到目标位置
          dragging.pos.x = t.pos.x;
          dragging.pos.y = t.pos.y;
          dragging.placed = true;
          t.occupied = true;
          dropped = true;
          if (onDrop) onDrop(dragging, t);
          break;
        }
      }
      if (!dropped) {
        // 没有命中目标，回到原位
        dragging.pos.x = dragging.originalX;
        dragging.pos.y = dragging.originalY;
      }
      dragging = null;
    });
  }

  /**
   * 创建统一的销毁函数（销毁顺序：定时器 → RAF/事件 → canvas DOM）
   * @param {Object} k - kaplay 实例
   * @param {HTMLElement} canvas - canvas 容器元素
   * @param {Array} timers - 待清理的 setTimeout ID 列表
   * @returns {Function} destroy 函数
   */
  function makeDestroy(k, canvas, timers) {
    return function () {
      // 1. 先清除待执行的定时器，避免在销毁后操作已销毁的对象
      if (timers && timers.length) {
        for (var i = 0; i < timers.length; i++) {
          clearTimeout(timers[i]);
        }
        timers.length = 0;
      }
      // 2. 停止 RAF 循环并移除事件监听（quit 在 frameEnd 时执行清理）
      //    注意：k.destroy() 是销毁单个游戏对象，k.quit() 才是停止引擎
      try { k.quit(); } catch (e) {}
      // 3. 最后移除挂载的 canvas DOM，避免残留
      try { canvas.innerHTML = ''; } catch (e) {}
    };
  }

  // ============================================================
  // 游戏 1：细胞结构拼装
  // ============================================================
  function startCellBuilder(containerId, options) {
    var canvas = ensureCanvas(containerId, 800, 600);

    var cellType = options['cell-type'] || 'animal'; // 'plant' | 'animal'
    var isPlant = cellType === 'plant';

    // 细胞器数据：name + 在细胞中的目标位置 + 颜色
    var organelles = [
      { name: '细胞膜',   tx: 400, ty: 250, color: [196, 149, 106], bio: '控制物质进出' },
      { name: '细胞核',   tx: 400, ty: 250, color: [90, 125, 92],    bio: '遗传信息控制中心' },
      { name: '线粒体',   tx: 300, ty: 200, color: [232, 168, 48],   bio: '有氧呼吸主场所' },
      { name: '核糖体',   tx: 480, ty: 220, color: [180, 80, 80],    bio: '蛋白质合成场所' },
      { name: '高尔基体', tx: 500, ty: 300, color: [100, 149, 237],  bio: '加工与分泌' },
      { name: '内质网',   tx: 320, ty: 300, color: [147, 112, 219], bio: '脂质合成与运输' },
      { name: '溶酶体',   tx: 350, ty: 350, color: [205, 92, 92],   bio: '消化与分解' }
    ];
    if (isPlant) {
      organelles.push(
        { name: '细胞壁',   tx: 400, ty: 250, color: [124, 158, 99],  bio: '维持细胞形态' },
        { name: '叶绿体',   tx: 280, ty: 320, color: [34, 139, 34],   bio: '光合作用场所' },
        { name: '液泡',     tx: 450, ty: 280, color: [135, 206, 235], bio: '维持渗透压' }
      );
    } else {
      organelles.push(
        { name: '中心体',   tx: 380, ty: 320, color: [255, 140, 0],   bio: '参与细胞分裂' }
      );
    }

    var k = window.kaplay({
      global: false,
      canvas: canvas,
      width: 800,
      height: 600,
      background: [250, 247, 242]
    });

    // 标题
    k.add([
      k.text((isPlant ? '植物' : '动物') + '细胞结构拼装', { size: 22 }),
      k.pos(400, 30),
      k.anchor('center'),
      k.color(26, 58, 42)
    ]);
    k.add([
      k.text('拖拽左侧细胞器到细胞内正确位置', { size: 13 }),
      k.pos(400, 58),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);

    // 绘制细胞轮廓（大圆/椭圆）
    k.add([
      k.circle(180),
      k.pos(400, 320),
      k.color(255, 253, 245),
      k.outline(3, k.rgb(196, 149, 106))
    ]);
    if (isPlant) {
      // 植物细胞画方形轮廓
      k.add([
        k.rect(360, 280),
        k.pos(220, 180),
        k.color(255, 253, 245),
        k.outline(3, k.rgb(124, 158, 99))
      ]);
    }

    // 创建目标槽位（细胞内）
    var targets = [];
    organelles.forEach(function (o) {
      var t = createTarget(k, '', o.tx, o.ty, o.color);
      t.expectedLabel = o.name;
      targets.push(t);
    });

    // 创建可拖拽组件（左侧待选区）
    var startX = 30;
    var startY = 100;
    var col = 0, row = 0;
    var draggables = [];
    var shuffled = organelles.slice().sort(function () { return Math.random() - 0.5; });
    shuffled.forEach(function (o, i) {
      var dx = startX + (col * 130);
      var dy = startY + (row * 60);
      var d = createDraggable(k, o.name, dx, dy, o.color);
      d.targetX = o.tx;
      d.targetY = o.ty;
      d.expectedLabel = o.name;
      // 标签
      k.add([
        k.text(o.name, { size: 12 }),
        k.pos(dx + 60, dy + 22),
        k.anchor('center'),
        k.color(26, 58, 42)
      ]);
      draggables.push(d);
      col++;
      if (col >= 2) { col = 0; row++; }
    });

    // 分隔线
    k.add([
      k.rect(2, 500),
      k.pos(260, 80),
      k.color(220, 220, 220)
    ]);

    // 得分与完成状态
    var placedCount = 0;
    var scoreLabel = k.add([
      k.text('已放置: 0 / ' + organelles.length, { size: 14 }),
      k.pos(400, 570),
      k.anchor('center'),
      k.color(90, 125, 92)
    ]);
    var hintLabel = k.add([
      k.text('', { size: 12 }),
      k.pos(400, 80),
      k.anchor('center'),
      k.color(232, 168, 48)
    ]);

    var _timers = [];
    enableDrag(k, function (dragged, target) {
      placedCount++;
      scoreLabel.text = '已放置: ' + placedCount + ' / ' + organelles.length;
      if (dragged.expectedLabel === target.expectedLabel) {
        hintLabel.text = '✓ ' + dragged.expectedLabel + ' 位置正确';
        hintLabel.color = k.rgb(90, 125, 92);
      } else {
        hintLabel.text = '✗ ' + dragged.expectedLabel + ' 应放在另一位置';
        hintLabel.color = k.rgb(205, 92, 92);
      }
      if (placedCount === organelles.length) {
        hintLabel.text = '🎉 细胞结构拼装完成！';
        hintLabel.color = k.rgb(232, 168, 48);
      }
      // 3 秒后清除提示
      _timers.push(setTimeout(function () { hintLabel.text = ''; }, 3000));
    });

    return {
      kaplay: k,
      destroy: makeDestroy(k, canvas, _timers)
    };
  }

  // ============================================================
  // 游戏 2：人体器官系统拼装
  // ============================================================
  function startOrganSystem(containerId, options) {
    var canvas = ensureCanvas(containerId, 800, 600);

    var system = options['system'] || 'digestive'; // digestive|respiratory|circulatory|nervous
    var systems = {
      digestive: {
        title: '消化系统',
        organs: [
          { name: '口腔',   tx: 400, ty: 180, color: [255, 182, 193], bio: '机械消化开始' },
          { name: '食道',   tx: 400, ty: 240, color: [255, 160, 122], bio: '食物通道' },
          { name: '胃',     tx: 320, ty: 300, color: [255, 105, 180], bio: '胃液消化蛋白质' },
          { name: '肝脏',   tx: 480, ty: 290, color: [139, 69, 19],   bio: '分泌胆汁' },
          { name: '胰腺',   tx: 460, ty: 340, color: [255, 215, 0],   bio: '分泌消化酶' },
          { name: '小肠',   tx: 400, ty: 400, color: [255, 127, 80],  bio: '主要吸收场所' },
          { name: '大肠',   tx: 340, ty: 450, color: [210, 180, 140], bio: '水分吸收' }
        ]
      },
      respiratory: {
        title: '呼吸系统',
        organs: [
          { name: '鼻腔',   tx: 400, ty: 150, color: [255, 182, 193], bio: '过滤加温空气' },
          { name: '咽',     tx: 400, ty: 210, color: [255, 160, 122], bio: '空气与食物交叉' },
          { name: '喉',     tx: 400, ty: 260, color: [255, 105, 180], bio: '发声器官' },
          { name: '气管',   tx: 400, ty: 320, color: [173, 216, 230], bio: '气体通道' },
          { name: '左肺',   tx: 320, ty: 400, color: [255, 192, 203], bio: '气体交换场所' },
          { name: '右肺',   tx: 480, ty: 400, color: [255, 192, 203], bio: '气体交换场所' },
          { name: '膈肌',   tx: 400, ty: 480, color: [210, 180, 140], bio: '呼吸主要肌肉' }
        ]
      },
      circulatory: {
        title: '循环系统',
        organs: [
          { name: '心脏',     tx: 400, ty: 300, color: [220, 20, 60],   bio: '泵血器官' },
          { name: '主动脉',   tx: 400, ty: 230, color: [178, 34, 34],   bio: '体循环动脉' },
          { name: '肺动脉',   tx: 320, ty: 250, color: [70, 130, 180],  bio: '缺氧血入肺' },
          { name: '肺静脉',   tx: 480, ty: 250, color: [199, 21, 133],  bio: '富氧血回心' },
          { name: '上腔静脉', tx: 360, ty: 360, color: [70, 130, 180],  bio: '上半身回心血' },
          { name: '下腔静脉', tx: 440, ty: 360, color: [70, 130, 180],  bio: '下半身回心血' }
        ]
      },
      nervous: {
        title: '神经系统',
        organs: [
          { name: '大脑',     tx: 400, ty: 180, color: [255, 182, 193], bio: '最高级中枢' },
          { name: '小脑',     tx: 340, ty: 230, color: [255, 160, 122], bio: '协调运动' },
          { name: '脑干',     tx: 400, ty: 270, color: [255, 105, 180], bio: '生命中枢' },
          { name: '脊髓',     tx: 400, ty: 360, color: [173, 216, 230], bio: '传导通路' },
          { name: '脊神经',   tx: 320, ty: 400, color: [147, 112, 219], bio: '外周神经' },
          { name: '脑神经',   tx: 480, ty: 200, color: [147, 112, 219], bio: '12对脑神经' }
        ]
      }
    };

    var sysData = systems[system] || systems.digestive;

    var k = window.kaplay({
      global: false,
      canvas: canvas,
      width: 800,
      height: 600,
      background: [250, 247, 242]
    });

    k.add([
      k.text(sysData.title + ' 器官拼装', { size: 22 }),
      k.pos(400, 30),
      k.anchor('center'),
      k.color(26, 58, 42)
    ]);
    k.add([
      k.text('拖拽器官到人体正确解剖位置', { size: 13 }),
      k.pos(400, 58),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);

    // 绘制人体轮廓
    k.add([
      k.circle(60), // 头部
      k.pos(400, 150),
      k.color(255, 253, 245),
      k.outline(2, k.rgb(196, 149, 106))
    ]);
    k.add([
      k.rect(120, 300), // 躯干
      k.pos(340, 220),
      k.color(255, 253, 245),
      k.outline(2, k.rgb(196, 149, 106))
    ]);

    // 创建目标槽位
    sysData.organs.forEach(function (o) {
      var t = createTarget(k, '', o.tx, o.ty, o.color);
      t.expectedLabel = o.name;
    });

    // 创建可拖拽组件
    var startX = 30;
    var startY = 100;
    var col = 0, row = 0;
    var shuffled = sysData.organs.slice().sort(function () { return Math.random() - 0.5; });
    shuffled.forEach(function (o) {
      var dx = startX + (col * 130);
      var dy = startY + (row * 60);
      var d = createDraggable(k, o.name, dx, dy, o.color);
      d.expectedLabel = o.name;
      k.add([
        k.text(o.name, { size: 12 }),
        k.pos(dx + 60, dy + 22),
        k.anchor('center'),
        k.color(26, 58, 42)
      ]);
      col++;
      if (col >= 2) { col = 0; row++; }
    });

    k.add([
      k.rect(2, 500),
      k.pos(260, 80),
      k.color(220, 220, 220)
    ]);

    var placedCount = 0;
    var scoreLabel = k.add([
      k.text('已放置: 0 / ' + sysData.organs.length, { size: 14 }),
      k.pos(400, 570),
      k.anchor('center'),
      k.color(90, 125, 92)
    ]);
    var hintLabel = k.add([
      k.text('', { size: 12 }),
      k.pos(400, 80),
      k.anchor('center'),
      k.color(232, 168, 48)
    ]);

    var _timers = [];
    enableDrag(k, function (dragged, target) {
      placedCount++;
      scoreLabel.text = '已放置: ' + placedCount + ' / ' + sysData.organs.length;
      if (dragged.expectedLabel === target.expectedLabel) {
        hintLabel.text = '✓ ' + dragged.expectedLabel;
        hintLabel.color = k.rgb(90, 125, 92);
      } else {
        hintLabel.text = '✗ ' + dragged.expectedLabel + ' 位置不对';
        hintLabel.color = k.rgb(205, 92, 92);
      }
      if (placedCount === sysData.organs.length) {
        hintLabel.text = '🎉 ' + sysData.title + '拼装完成！';
        hintLabel.color = k.rgb(232, 168, 48);
      }
      _timers.push(setTimeout(function () { hintLabel.text = ''; }, 3000));
    });

    return {
      kaplay: k,
      destroy: makeDestroy(k, canvas, _timers)
    };
  }

  // ============================================================
  // 游戏 3：DNA 双螺旋搭建
  // ============================================================
  function startDnaHelix(containerId, options) {
    var canvas = ensureCanvas(containerId, 800, 600);

    // DNA 碱基配对规则：A-T, T-A, G-C, C-G
    var basePairs = [
      { top: 'A', bottom: 'T' },
      { top: 'T', bottom: 'A' },
      { top: 'G', bottom: 'C' },
      { top: 'C', bottom: 'G' },
      { top: 'A', bottom: 'T' },
      { top: 'G', bottom: 'C' },
      { top: 'T', bottom: 'A' },
      { top: 'C', bottom: 'G' }
    ];
    var baseColors = {
      'A': [255, 99, 132],
      'T': [54, 162, 235],
      'G': [75, 192, 192],
      'C': [255, 206, 86]
    };
    var baseNames = {
      'A': '腺嘌呤', 'T': '胸腺嘧啶', 'G': '鸟嘌呤', 'C': '胞嘧啶'
    };

    var k = window.kaplay({
      global: false,
      canvas: canvas,
      width: 800,
      height: 600,
      background: [250, 247, 242]
    });

    k.add([
      k.text('DNA 双螺旋搭建', { size: 22 }),
      k.pos(400, 30),
      k.anchor('center'),
      k.color(26, 58, 42)
    ]);
    k.add([
      k.text('配对规则：A-T（2氢键）、G-C（3氢键）。拖拽碱基到模板链对应位置', { size: 12 }),
      k.pos(400, 58),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);

    // 绘制 DNA 骨架（两条竖线代表磷酸-戊糖骨架）
    k.add([
      k.rect(4, 450),
      k.pos(280, 90),
      k.color(196, 149, 106)
    ]);
    k.add([
      k.rect(4, 450),
      k.pos(516, 90),
      k.color(196, 149, 106)
    ]);
    // 标注 5' 和 3' 端（双链反向平行：左链 5'→3' 向下，右链 3'→5' 向下）
    k.add([
      k.text("5'", { size: 14 }),
      k.pos(282, 80),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);
    k.add([
      k.text("5'", { size: 14 }),
      k.pos(518, 555),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);
    k.add([
      k.text("3'", { size: 14 }),
      k.pos(282, 555),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);
    k.add([
      k.text("3'", { size: 14 }),
      k.pos(518, 80),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);

    // 创建模板链（左侧固定碱基）+ 目标槽位（右侧待填）
    var rowHeight = 50;
    var startY = 110;
    var targets = [];
    var draggables = [];

    basePairs.forEach(function (pair, i) {
      var y = startY + i * rowHeight;
      // 左侧模板链碱基（固定）
      var c = baseColors[pair.top];
      k.add([
        k.rect(30, 30),
        k.pos(250, y),
        k.color(c[0], c[1], c[2])
      ]);
      k.add([
        k.text(pair.top, { size: 16 }),
        k.pos(265, y + 15),
        k.anchor('center'),
        k.color(255, 255, 255)
      ]);
      // 氢键虚线
      k.add([
        k.text(pair.top === 'G' || pair.top === 'C' ? '===' : '==', { size: 12 }),
        k.pos(350, y + 15),
        k.anchor('center'),
        k.color(180, 180, 180)
      ]);
      // 右侧目标槽位
      var t = createTarget(k, '', 520, y, baseColors[pair.bottom]);
      t.expectedLabel = pair.bottom;
      t.baseChar = pair.bottom;
      targets.push(t);
    });

    // 创建可拖拽碱基（底部待选区，打乱顺序）
    var poolY = 540;
    var poolChars = basePairs.map(function (p) { return p.bottom; }).sort(function () { return Math.random() - 0.5; });
    var poolStartX = 100;
    poolChars.forEach(function (baseChar, i) {
      var dx = poolStartX + i * 70;
      if (dx > 700) { dx = poolStartX + (i - 9) * 70; poolY = 575; }
      var c = baseColors[baseChar];
      var d = k.add([
        k.rect(30, 30),
        k.pos(dx, poolY),
        k.color(c[0], c[1], c[2]),
        k.area(),
        'draggable',
        {
          originalX: dx,
          originalY: poolY,
          placed: false,
          expectedLabel: baseChar,
          baseChar: baseChar
        }
      ]);
      k.add([
        k.text(baseChar, { size: 16 }),
        k.pos(dx + 15, poolY + 15),
        k.anchor('center'),
        k.color(255, 255, 255)
      ]);
      draggables.push(d);
    });

    var placedCount = 0;
    var scoreLabel = k.add([
      k.text('已配对: 0 / ' + basePairs.length, { size: 14 }),
      k.pos(400, 575),
      k.anchor('center'),
      k.color(90, 125, 92)
    ]);
    var hintLabel = k.add([
      k.text('', { size: 12 }),
      k.pos(400, 80),
      k.anchor('center'),
      k.color(232, 168, 48)
    ]);

    var _timers = [];
    enableDrag(k, function (dragged, target) {
      placedCount++;
      scoreLabel.text = '已配对: ' + placedCount + ' / ' + basePairs.length;
      if (dragged.expectedLabel === target.expectedLabel) {
        var bname = baseNames[dragged.expectedLabel];
        var pairType = (dragged.expectedLabel === 'G' || dragged.expectedLabel === 'C') ? '3 氢键' : '2 氢键';
        hintLabel.text = '✓ ' + dragged.expectedLabel + ' (' + bname + ') - ' + pairType;
        hintLabel.color = k.rgb(90, 125, 92);
      } else {
        hintLabel.text = '✗ 碱基配对错误（A-T, G-C）';
        hintLabel.color = k.rgb(205, 92, 92);
      }
      if (placedCount === basePairs.length) {
        hintLabel.text = '🎉 DNA 双螺旋搭建完成！';
        hintLabel.color = k.rgb(232, 168, 48);
      }
      _timers.push(setTimeout(function () { hintLabel.text = ''; }, 3000));
    });

    return {
      kaplay: k,
      destroy: makeDestroy(k, canvas, _timers)
    };
  }

  // ============================================================
  // 游戏 4：蛋白质合成流程
  // ============================================================
  function startProteinSynth(containerId, options) {
    var canvas = ensureCanvas(containerId, 800, 600);

    // 密码子表（简化版，展示翻译过程）
    // 每个 mRNA 密码子对应一个氨基酸
    var steps = [
      { stage: 'transcription', label: 'DNA → mRNA', desc: '转录：模板链 3\'-TAC-5\' → mRNA 5\'-AUG-3\'', target: 'mRNA', color: [70, 130, 180] },
      { stage: 'transcription', label: 'mRNA 加工', desc: '剪接去除内含子，加帽加尾', target: '成熟mRNA', color: [100, 149, 237] },
      { stage: 'translation', label: '核糖体结合', desc: '小亚基识别 mRNA 5\'帽，结合起始密码子 AUG', target: '核糖体', color: [255, 140, 0] },
      { stage: 'translation', label: 'tRNA 进位', desc: '起始 tRNA(携带甲硫氨酸)反密码子 UAC 配对 AUG', target: 'tRNA-Met', color: [50, 205, 50] },
      { stage: 'elongation', label: '肽键形成', desc: '肽酰转移酶催化，氨基酸脱水缩合形成肽键', target: '肽键', color: [255, 20, 147] },
      { stage: 'elongation', label: '移位', desc: '核糖体沿 mRNA 5\'→3\' 移动一个密码子', target: '移位', color: [138, 43, 226] },
      { stage: 'termination', label: '终止', desc: '遇到终止密码子(UAA/UAG/UGA)，释放因子作用', target: '终止', color: [220, 20, 60] },
      { stage: 'termination', label: '多肽链释放', desc: '完整多肽链从核糖体释放，进入折叠', target: '蛋白质', color: [255, 215, 0] }
    ];

    var k = window.kaplay({
      global: false,
      canvas: canvas,
      width: 800,
      height: 600,
      background: [250, 247, 242]
    });

    k.add([
      k.text('蛋白质合成流程', { size: 22 }),
      k.pos(400, 30),
      k.anchor('center'),
      k.color(26, 58, 42)
    ]);
    k.add([
      k.text('按正确顺序拖拽步骤卡片到流程线上（从转录到翻译）', { size: 12 }),
      k.pos(400, 58),
      k.anchor('center'),
      k.color(138, 138, 138)
    ]);

    // 绘制流程线（水平时间轴）
    k.add([
      k.rect(600, 3),
      k.pos(100, 320),
      k.color(196, 149, 106)
    ]);
    // 阶段标签
    k.add([
      k.text('转录', { size: 14 }),
      k.pos(175, 340),
      k.anchor('center'),
      k.color(70, 130, 180)
    ]);
    k.add([
      k.text('翻译', { size: 14 }),
      k.pos(400, 340),
      k.anchor('center'),
      k.color(255, 140, 0)
    ]);
    k.add([
      k.text('延伸', { size: 14 }),
      k.pos(550, 340),
      k.anchor('center'),
      k.color(138, 43, 226)
    ]);
    k.add([
      k.text('终止', { size: 14 }),
      k.pos(680, 340),
      k.anchor('center'),
      k.color(220, 20, 60)
    ]);

    // 创建目标槽位（沿流程线，按正确顺序）
    var targetPositions = [
      { x: 130, y: 300 },  // 转录 1
      { x: 220, y: 300 },  // 转录 2
      { x: 330, y: 300 },  // 翻译 1
      { x: 420, y: 300 },  // 翻译 2
      { x: 510, y: 300 },  // 延伸 1
      { x: 580, y: 300 },  // 延伸 2
      { x: 660, y: 300 },  // 终止 1
      { x: 720, y: 300 }   // 终止 2
    ];

    var targets = [];
    steps.forEach(function (step, i) {
      var pos = targetPositions[i];
      var t = createTarget(k, '', pos.x, pos.y, step.color);
      t.expectedLabel = step.target;
      t.stepIndex = i;
      targets.push(t);
    });

    // 创建可拖拽步骤卡片（底部，打乱顺序）
    var cardStartX = 30;
    var cardStartY = 420;
    var shuffled = steps.map(function (s, i) { return { step: s, originalIndex: i }; })
      .sort(function () { return Math.random() - 0.5; });

    shuffled.forEach(function (item, i) {
      var col = i % 4;
      var row = Math.floor(i / 4);
      var dx = cardStartX + col * 190;
      var dy = cardStartY + row * 80;
      var step = item.step;
      var d = k.add([
        k.rect(170, 60),
        k.pos(dx, dy),
        k.color(step.color[0], step.color[1], step.color[2]),
        k.area(),
        'draggable',
        {
          originalX: dx,
          originalY: dy,
          placed: false,
          expectedLabel: step.target,
          stepIndex: item.originalIndex
        }
      ]);
      k.add([
        k.text(step.label, { size: 11 }),
        k.pos(dx + 85, dy + 18),
        k.anchor('center'),
        k.color(255, 255, 255)
      ]);
      k.add([
        k.text(step.desc, { size: 8 }),
        k.pos(dx + 85, dy + 40),
        k.anchor('center'),
        k.color(255, 255, 255)
      ]);
    });

    var placedCount = 0;
    var scoreLabel = k.add([
      k.text('已放置: 0 / ' + steps.length, { size: 14 }),
      k.pos(400, 570),
      k.anchor('center'),
      k.color(90, 125, 92)
    ]);
    var hintLabel = k.add([
      k.text('', { size: 12 }),
      k.pos(400, 80),
      k.anchor('center'),
      k.color(232, 168, 48)
    ]);

    var _timers = [];
    enableDrag(k, function (dragged, target) {
      placedCount++;
      scoreLabel.text = '已放置: ' + placedCount + ' / ' + steps.length;
      if (dragged.stepIndex === target.stepIndex) {
        hintLabel.text = '✓ ' + dragged.expectedLabel + ' 位置正确';
        hintLabel.color = k.rgb(90, 125, 92);
      } else {
        hintLabel.text = '✗ ' + dragged.expectedLabel + ' 应在另一阶段';
        hintLabel.color = k.rgb(205, 92, 92);
      }
      if (placedCount === steps.length) {
        hintLabel.text = '🎉 蛋白质合成流程完成！';
        hintLabel.color = k.rgb(232, 168, 48);
      }
      _timers.push(setTimeout(function () { hintLabel.text = ''; }, 3000));
    });

    return {
      kaplay: k,
      destroy: makeDestroy(k, canvas, _timers)
    };
  }

  // ===== 页面渲染 =====

  var GAME_OPTIONS = {
    'cell-builder': { needsCellType: true },
    'organ-system': { needsSystem: true },
    'dna-helix': {},
    'protein-synth': {}
  };

  function renderGamesPage(target) {
    if (!target) return;
    target.innerHTML =
      '<div style="max-width:1000px;margin:0 auto;padding:24px 20px 80px;">' +
      '<h1 style="font-family:var(--font-serif,serif);font-size:1.8rem;color:var(--color-deep,#1a3a2a);margin-bottom:8px;">🎮 结构搭建类游戏</h1>' +
      '<p style="color:var(--text-muted,#8a8a8a);font-size:0.9rem;margin-bottom:24px;">基于 KAPLAY（MIT）的生物学结构拼装游戏，覆盖细胞结构、人体器官、DNA 双螺旋、蛋白质合成</p>' +

      // 游戏选择 + 选项
      '<div style="background:var(--surface-primary,#fff);border:1px solid var(--border-light,#ece8e1);border-radius:var(--radius-lg,20px);padding:20px;margin-bottom:20px;">' +
        '<h3 style="font-family:var(--font-serif,serif);font-size:1.1rem;color:var(--color-deep,#1a3a2a);margin-bottom:12px;">选择游戏与选项</h3>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
          '<div>' +
            '<label style="display:block;font-size:0.85rem;color:var(--text-secondary,#4a4a4a);margin-bottom:4px;">游戏类型</label>' +
            '<select id="game-type-select" style="width:100%;padding:8px 12px;border:1px solid var(--border-default,#e0dcd5);border-radius:8px;font-size:0.9rem;">' +
              '<option value="cell-builder">细胞结构拼装</option>' +
              '<option value="organ-system">人体器官系统拼装</option>' +
              '<option value="dna-helix">DNA 双螺旋搭建</option>' +
              '<option value="protein-synth">蛋白质合成流程</option>' +
            '</select>' +
          '</div>' +
          '<div id="game-options-container">' +
            '<label style="display:block;font-size:0.85rem;color:var(--text-secondary,#4a4a4a);margin-bottom:4px;">选项</label>' +
            '<select id="game-suboption-select" style="width:100%;padding:8px 12px;border:1px solid var(--border-default,#e0dcd5);border-radius:8px;font-size:0.9rem;">' +
              '<option value="animal">动物细胞</option>' +
              '<option value="plant">植物细胞</option>' +
            '</select>' +
          '</div>' +
        '</div>' +
        '<button id="game-start-btn" style="padding:10px 24px;background:var(--color-sage,#5a7d5c);color:#fff;border:none;border-radius:8px;cursor:pointer;font-size:0.95rem;width:100%;">开始游戏</button>' +
      '</div>' +

      // 游戏画布
      '<div id="game-container" style="background:#faf7f2;border-radius:12px;min-height:600px;display:flex;align-items:center;justify-content:center;color:var(--text-muted,#8a8a8a);">' +
        '<div style="text-align:center;">👆 选择游戏类型并点击"开始游戏"</div>' +
      '</div>' +
      '<div style="margin-top:16px;text-align:center;">' +
        '<button id="game-destroy-btn" style="padding:8px 18px;border:1px solid var(--border-default,#e0dcd5);background:transparent;border-radius:8px;cursor:pointer;font-size:0.85rem;color:var(--text-secondary,#4a4a4a);">结束游戏</button>' +
      '</div>' +
      '</div>';

    _bindPageEvents();
  }

  function _bindPageEvents() {
    var typeSelect = document.getElementById('game-type-select');
    var optionsContainer = document.getElementById('game-options-container');
    var suboptionSelect = document.getElementById('game-suboption-select');
    var startBtn = document.getElementById('game-start-btn');
    var destroyBtn = document.getElementById('game-destroy-btn');

    // 根据游戏类型更新选项
    function updateOptions() {
      if (!typeSelect || !optionsContainer) return;
      var gameType = typeSelect.value;
      var optionsHtml = '';
      if (gameType === 'cell-builder') {
        optionsHtml =
          '<label style="display:block;font-size:0.85rem;color:var(--text-secondary,#4a4a4a);margin-bottom:4px;">细胞类型</label>' +
          '<select id="game-suboption-select" style="width:100%;padding:8px 12px;border:1px solid var(--border-default,#e0dcd5);border-radius:8px;font-size:0.9rem;">' +
            '<option value="animal">动物细胞</option>' +
            '<option value="plant">植物细胞</option>' +
          '</select>';
      } else if (gameType === 'organ-system') {
        optionsHtml =
          '<label style="display:block;font-size:0.85rem;color:var(--text-secondary,#4a4a4a);margin-bottom:4px;">器官系统</label>' +
          '<select id="game-suboption-select" style="width:100%;padding:8px 12px;border:1px solid var(--border-default,#e0dcd5);border-radius:8px;font-size:0.9rem;">' +
            '<option value="digestive">消化系统</option>' +
            '<option value="respiratory">呼吸系统</option>' +
            '<option value="circulatory">循环系统</option>' +
            '<option value="nervous">神经系统</option>' +
          '</select>';
      } else {
        optionsHtml =
          '<label style="display:block;font-size:0.85rem;color:var(--text-secondary,#4a4a4a);margin-bottom:4px;">选项</label>' +
          '<select id="game-suboption-select" style="width:100%;padding:8px 12px;border:1px solid var(--border-default,#e0dcd5);border-radius:8px;font-size:0.9rem;" disabled>' +
            '<option value="">默认设置</option>' +
          '</select>';
      }
      optionsContainer.innerHTML = optionsHtml;
    }

    if (typeSelect) {
      typeSelect.addEventListener('change', updateOptions);
    }

    if (startBtn) {
      startBtn.addEventListener('click', function () {
        var gameType = typeSelect ? typeSelect.value : 'cell-builder';
        var subSel = document.getElementById('game-suboption-select');
        var subValue = subSel ? subSel.value : '';
        var container = document.getElementById('game-container');
        if (!container) return;

        var options = {};
        if (gameType === 'cell-builder') options['cell-type'] = subValue || 'animal';
        if (gameType === 'organ-system') options['system'] = subValue || 'digestive';

        container.innerHTML = '<div style="text-align:center;padding:80px;color:var(--text-muted);">⏳ 加载游戏引擎...</div>';
        init('game-container', gameType, options);
      });
    }

    if (destroyBtn) {
      destroyBtn.addEventListener('click', function () {
        destroy();
        var c = document.getElementById('game-container');
        if (c) {
          c.innerHTML = '<div style="text-align:center;color:var(--text-muted);">游戏已结束，请重新选择并开始</div>';
        }
      });
    }
  }

  // 暴露到全局
  window.KaplayGames = {
    init: init,
    destroy: destroy,
    isLoaded: function () { return _loaded; }
  };

  // 页面入口
  window.renderGamesPage = renderGamesPage;
  window.initKaplayGames = function (route, target) {
    renderGamesPage(target);
  };
})();
