/**
 * BioQuest — Canvas 生物过程可视化（严谨审定版）
 * 覆盖：有丝分裂、减数分裂、DNA 复制、转录与翻译、光合作用、细胞呼吸、膜运输与动作电位
 * 每个流程均按生物学教材的步骤拆分，并标注关键分子/结构
 */
(function() {
  'use strict';

  /* ---------- 流程定义 ---------- */
  var _processes = {
    mitosis: {
      id: 'mitosis', name: '有丝分裂', desc: '真核细胞将间期复制后的染色体精确均分到两个子细胞中，保证遗传物质稳定传递。',
      steps: [
        { name: '间期（G₂ 末）', desc: 'DNA 已完成复制；中心体复制为两个；染色质尚未凝集，核膜核仁完整。' },
        { name: '前期', desc: '染色质螺旋化→可见含两条姐妹染色单体的染色体；核仁消失；中心体移向两极，星射线形成纺锤体。' },
        { name: '中期', desc: '核膜解体；纺锤丝连接染色体着丝粒；所有染色体着丝粒排列在赤道板（细胞中央假想平面）上。' },
        { name: '后期', desc: '着丝粒一分为二；姐妹染色单体分开成为独立染色体；纺锤丝缩短将染色体拉向两极。' },
        { name: '末期与胞质分裂', desc: '染色体解螺旋恢复染色质状态；核膜核仁重新出现；细胞膜中部缢裂，形成两个子细胞。' }
      ]
    },
    meiosis: {
      id: 'meiosis', name: '减数分裂', desc: '生殖细胞特有的两次连续分裂（MI + MII），产生染色体数减半且遗传组成各异的四个子细胞。',
      steps: [
        { name: '前期 I（联会与交叉互换）', desc: '同源染色体两两配对（联会）形成四分体；非姐妹染色单体间发生交叉互换，产生新的等位基因组合。' },
        { name: '中期 I', desc: '四分体排列在赤道板两侧；来自父方和母方的同源染色体随机朝向两极（自由组合定律的细胞学基础）。' },
        { name: '后期 I', desc: '同源染色体分离，分别移向两极；非同源染色体自由组合；姐妹染色单体仍由着丝粒相连。' },
        { name: '末期 I 与胞质分裂', desc: '核膜可短暂重建；细胞一分为二，各含 n 条染色体（每条仍由两条染色单体组成）。' },
        { name: '中期 II', desc: '染色体再次排列在赤道板上，纺锤体重新形成。' },
        { name: '后期 II', desc: '着丝粒分裂，姐妹染色单体分开并移向两极。' },
        { name: '末期 II', desc: '核膜重建，胞质分裂完成；四个单倍体子细胞（n）形成，遗传组成各不相同。' }
      ]
    },
    dna: {
      id: 'dna', name: 'DNA 半保留复制', desc: '以亲代两条链分别为模板，按碱基互补配对原则合成子链，每个子代 DNA 含一条母链和一条新链。',
      steps: [
        { name: '起始与解旋', desc: '复制起点被识别；解旋酶破坏氢键，双向解开双链形成两个复制叉；单链结合蛋白（SSB）稳定单链；拓扑异构酶释放超螺旋张力。' },
        { name: '引物合成', desc: '引物酶合成 ~10 nt 的 RNA 引物，为 DNA 聚合酶提供游离 3\'-OH。' },
        { name: '前导链连续合成', desc: 'DNA 聚合酶以 3\'→5\' 模板链为模板，沿 5\'→3\' 方向连续合成前导链。' },
        { name: '后随链不连续合成', desc: '在另一条模板链上，DNA 聚合酶以 5\'→3\' 方向合成若干冈崎片段；RNA 引物随后被移除，缺口由 DNA 补齐。' },
        { name: '连接与校对', desc: 'DNA 连接酶将冈崎片段连接成完整后随链；错配修复系统校对；最终两个子代 DNA 各含一条母链和一条新链。' }
      ]
    },
    transcription: {
      id: 'transcription', name: '转录与翻译', desc: '遗传信息从 DNA 经 mRNA 传递到蛋白质——基因表达的核心过程。',
      steps: [
        { name: '转录起始', desc: 'RNA 聚合酶结合启动子；DNA 局部解旋形成转录泡；以模板链（3\'→5\'）为模板合成互补 mRNA（5\'→3\'）。' },
        { name: '转录延伸', desc: 'RNA 聚合酶沿 DNA 移动，mRNA 链延伸；已转录的 DNA 重新形成双螺旋。' },
        { name: 'mRNA 加工（真核）', desc: '5\' 端加 7-甲基鸟苷帽、3\' 端加 poly-A 尾；剪接体切除内含子、连接外显子；成熟 mRNA 出核。' },
        { name: '翻译起始', desc: '核糖体小亚基识别 mRNA 5\' 帽并扫描至 AUG 起始密码子；起始 tRNA（Met）进入 P 位；大亚基结合。' },
        { name: '翻译延伸', desc: '氨酰-tRNA 按密码子-反密码子配对进入 A 位；肽酰转移酶（23S/28S rRNA）催化肽键形成；核糖体移位。' },
        { name: '翻译终止', desc: '释放因子（RF）识别终止密码子（UAA/UAG/UGA）；多肽链水解释放；核糖体大小亚基解离。' }
      ]
    },
    photosynthesis: {
      id: 'photosynthesis', name: '光合作用', desc: '光反应（类囊体膜）将光能转为化学能（ATP、NADPH），暗反应（基质）利用化学能固定 CO₂。',
      steps: [
        { name: '光能吸收与电荷分离', desc: '类囊体膜上的天线色素将光能传递至 PSII 反应中心 P680；P680 被激发释放高能电子，自身被水的电子还原。' },
        { name: '水的光解与电子传递', desc: 'PSII 的放氧复合体（OEC）裂解 2 H₂O → 4 H⁺ + 4 e⁻ + O₂↑；电子经 PQ → cyt b6f → PC 传递至 PSI。' },
        { name: 'NADPH 与 ATP 生成', desc: 'PSI 反应中心 P700 被激发；电子经 Fd → NADP⁺ 还原酶生成 NADPH；cyt b6f 泵出质子建立梯度，ATP 合酶合成 ATP。' },
        { name: 'CO₂ 固定（Calvin 循环）', desc: 'Rubisco 催化 1 CO₂ + 1 RuBP → 2 分子 3-PGA；每固定 3 个 CO₂，循环可净输出 1 分子 G3P。' },
        { name: '还原与 RuBP 再生', desc: '3-PGA 被 ATP 磷酸化并由 NADPH 还原为 G3P；形成的 6 份 G3P 中，5 份用于再生 RuBP，1 份净输出并参与糖类合成。' }
      ]
    },
    respiration: {
      id: 'respiration', name: '细胞呼吸', desc: '细胞氧化分解有机物释放能量合成 ATP。分为糖酵解→丙酮酸氧化→TCA 循环→氧化磷酸化。',
      steps: [
        { name: '糖酵解（细胞质）', desc: '1 葡萄糖 + 2 NAD⁺ + 2 ADP + 2 Pi → 2 丙酮酸 + 2 NADH + 2 ATP（净）；不需氧。' },
        { name: '丙酮酸氧化（线粒体基质）', desc: '丙酮酸脱氢酶复合体催化：丙酮酸 + CoA + NAD⁺ → 乙酰-CoA + CO₂ + NADH。' },
        { name: '三羧酸循环（TCA / Krebs）', desc: '乙酰-CoA + 草酰乙酸 → 柠檬酸 → 经 8 步反应回草酰乙酸；每轮产 3 NADH + 1 FADH₂ + 1 GTP + 2 CO₂。' },
        { name: '电子传递链（线粒体内膜）', desc: 'NADH→复合体 I→Q→复合体 III→Cyt c→复合体 IV→O₂→H₂O；FADH₂→复合体 II→Q→…；电子传递同时将 H⁺ 泵至膜间隙。' },
        { name: '氧化磷酸化（ATP 合酶）', desc: 'H⁺ 顺梯度经 ATP 合酶（F₀F₁）回流基质，驱动 ADP + Pi → ATP；有氧呼吸释放的能量大部分在这一阶段转移到 ATP 中。' }
      ]
    },
    membrane: {
      id: 'membrane', name: '膜运输与动作电位', desc: '物质跨膜转运方式及神经细胞兴奋时膜电位的快速、可逆变化。',
      steps: [
        { name: '被动运输（自由扩散）', desc: 'O₂、CO₂、N₂ 及脂溶性小分子顺浓度梯度直接穿过磷脂双分子层，不耗能、不需载体。' },
        { name: '协助扩散（载体与通道）', desc: '葡萄糖经 GLUT 载体、水经水通道蛋白（AQP）、离子经离子通道顺电化学梯度转运，不耗 ATP。' },
        { name: '主动运输（钠钾泵）', desc: 'Na⁺-K⁺-ATPase 每水解 1 ATP 泵出 3 Na⁺、泵入 2 K⁺；维持膜内外 Na⁺/K⁺ 浓度梯度。' },
        { name: '静息电位', desc: '膜对 K⁺ 通透性较高，K⁺ 外流达平衡电位（~ -70 mV）；胞外 Na⁺ 高、胞内 K⁺ 高。' },
        { name: '去极化与反极化', desc: '阈上刺激→电压门控 Na⁺ 通道开放→Na⁺ 快速内流→膜电位上升至 +30~+40 mV。' },
        { name: '复极化与超极化', desc: 'Na⁺ 通道失活；电压门控 K⁺ 通道开放→K⁺ 外流→膜电位恢复并短暂低于静息电位（后超极化），随后逐步恢复稳态。' }
      ]
    }
  };

  var _theme = {
    ink: '#2c3e30',
    muted: '#5a6b5e',
    faint: '#8a9a8e',
    primary: '#4a7c59',
    primarySoft: '#edf5f0',
    warm: '#c4956a',
    border: '#e2ddd6',
    surface: '#ffffff',
    stage: '#f2f5f3',
    cell: '#d9efe4',
    nucleus: '#eee9f4',
    chromosomeA: '#e46e9b',
    chromosomeB: '#6f9dcc',
    spindle: '#7090c2',
    fluorescent: '#cfff57',
    yellow: '#e6b95a',
    cyan: '#70d7ca',
    rose: '#e46e9b',
    violet: '#8b77c5',
    orange: '#e8a45f',
    blueSoft: '#dceaf5',
    greenSoft: '#dcefe3',
    yellowSoft: '#f6edca',
    violetSoft: '#e9e3f4'
  };

  var _teaching = {
    mitosis: {
      groups: [{ label: '分裂间期 · 准备阶段', span: 1 }, { label: '分裂期 · 有丝分裂四期', span: 4 }],
      note: '示意模型采用 2n＝4。分裂间期属于细胞周期，但不属于有丝分裂的前、中、后、末四个时期。',
      steps: [
        { action: 'DNA 复制完成，进入分裂期前准备', metrics: [['计数范围', '母细胞内'], ['染色体', '4 条'], ['DNA', '4C']], observations: ['核膜、核仁完整，染色体仍呈染色质状态', 'DNA 含量加倍，但着丝粒尚未分裂'], exam: 'DNA 加倍不等于染色体数加倍。' },
        { action: '染色质丝凝缩形成染色体', metrics: [['计数范围', '母细胞内'], ['染色体', '4 条'], ['DNA', '4C']], observations: ['每条染色体含两条姐妹染色单体', '核膜、核仁逐渐消失，纺锤体形成'], exam: '前期发生凝缩，不发生 DNA 复制。' },
        { action: '着丝粒排列在赤道板中央', metrics: [['计数范围', '母细胞内'], ['染色体', '4 条'], ['DNA', '4C']], observations: ['染色体形态稳定、数目清晰', '赤道板是假想平面，不是真实结构'], exam: '中期是观察染色体形态和数目的最佳时期。' },
        { action: '着丝粒分裂，子染色体移向两极', metrics: [['计数范围', '一个细胞内'], ['染色体', '8 条'], ['DNA', '4C']], observations: ['姐妹染色单体分开后各自成为染色体', '两极获得形态和数目相同的一套染色体'], exam: '后期染色体数暂时加倍，DNA 总量不变。' },
        { action: '两套染色体分别形成新的细胞核', metrics: [['计数范围', '每个子细胞核'], ['染色体', '4 条'], ['DNA', '2C']], observations: ['染色体解螺旋，核膜、核仁重新出现', '亲代染色体平均分配到两个子细胞'], exam: '动物细胞形成分裂沟；高等植物细胞形成细胞板。' }
      ]
    },
    meiosis: {
      groups: [{ label: '减数分裂 I · 同源染色体分离', span: 4 }, { label: '减数分裂 II · 姐妹染色单体分离', span: 3 }],
      note: '示意模型采用 2n＝4。减数分裂前 DNA 复制一次，细胞连续分裂两次，最终形成 4 个染色体数减半的子细胞。',
      steps: [
        { action: '同源染色体联会并发生互换', metrics: [['计数范围', '初级性母细胞'], ['染色体', '4 条'], ['DNA', '4C']], observations: ['一对同源染色体联会形成一个四分体', '非姐妹染色单体之间可发生交叉互换'], exam: '四分体中的 4 指四条染色单体，不是 4 条染色体。' },
        { action: '同源染色体成对排列在赤道板两侧', metrics: [['计数范围', '初级性母细胞'], ['染色体', '4 条'], ['DNA', '4C']], observations: ['同源染色体的朝向是随机的', '非同源染色体自由组合'], exam: '中期 I 排列的是同源染色体对，不是单条染色体。' },
        { action: '同源染色体分离，着丝粒不分裂', metrics: [['计数范围', '初级性母细胞'], ['染色体', '4 条'], ['DNA', '4C']], observations: ['每条染色体仍含两条姐妹染色单体', '等位基因随同源染色体分别移向两极'], exam: '后期 I 的标志是同源染色体分离；姐妹染色单体不分离。' },
        { action: '形成两个染色体数减半的子细胞', metrics: [['计数范围', '每个子细胞'], ['染色体', '2 条'], ['DNA', '2C']], observations: ['染色体数由 2n 减为 n', '两细胞中的染色体组合可能不同'], exam: '减数分裂 I 完成染色体数减半，DNA 尚未降至 1C。' },
        { action: '染色体分别排列在两个赤道板上', metrics: [['计数范围', '每个子细胞'], ['染色体', '2 条'], ['DNA', '2C']], observations: ['减数分裂 I 与 II 之间通常不再复制 DNA', '排列方式类似有丝分裂中期'], exam: '中期 II 不再出现同源染色体联会。' },
        { action: '着丝粒分裂，姐妹染色单体分离', metrics: [['计数范围', '每个分裂细胞'], ['染色体', '4 条'], ['DNA', '2C']], observations: ['姐妹染色单体成为独立染色体', '染色体分别移向每个细胞的两极'], exam: '后期 II 与有丝分裂后期都发生着丝粒分裂。' },
        { action: '形成四个遗传组成不同的单倍体细胞', metrics: [['计数范围', '每个子细胞'], ['染色体', '2 条'], ['DNA', '1C']], observations: ['每个子细胞只含一套非同源染色体', '互换和自由组合增加遗传多样性'], exam: '最终子细胞的染色体数是亲代体细胞的一半。' }
      ]
    },
    dna: {
      groups: [{ label: '复制起始', span: 2 }, { label: '链的延伸', span: 2 }, { label: '完成与校对', span: 1 }],
      note: '画面取双向复制中的一个复制叉作局部放大。两条新链都只能沿 5′→3′ 方向延伸；“前导链连续、后随链不连续”由两条模板链反向平行决定。',
      steps: [
        { action: '解旋酶打开双链，形成复制泡', metrics: [['核心结构', '复制叉'], ['模板', '亲代两条链'], ['原则', '碱基互补']], observations: ['氢键断裂，磷酸二酯键不被切断', '复制从起点向两个方向推进'], exam: '解旋发生在复制叉处，复制通常是双向进行的。' },
        { action: '引物酶提供可延伸的 3′-OH', metrics: [['引物成分', 'RNA'], ['合成酶', '引物酶'], ['作用', '提供起点']], observations: ['DNA 聚合酶不能从头合成新链', '前导链和每个冈崎片段都需要引物'], exam: 'RNA 引物最终会被去除并由 DNA 替换。' },
        { action: '前导链沿复制叉方向连续延伸', metrics: [['新链方向', '5′→3′'], ['方式', '连续合成'], ['酶', 'DNA 聚合酶']], observations: ['模板链读取方向为 3′→5′', '新链延伸方向与复制叉移动方向一致'], exam: 'DNA 聚合酶只能把核苷酸加到新链的 3′ 端。' },
        { action: '后随链以冈崎片段方式合成', metrics: [['新链方向', '5′→3′'], ['方式', '不连续'], ['中间产物', '冈崎片段']], observations: ['每个片段独立使用一个 RNA 引物', '片段延伸方向与复制叉移动方向相反'], exam: '不连续的是合成过程，不是子代 DNA 的最终结构。' },
        { action: '移除引物、连接片段并完成校对', metrics: [['连接酶', 'DNA 连接酶'], ['结果', '2 个 DNA'], ['方式', '半保留复制']], observations: ['每个子代 DNA 含一条母链和一条新链', '校对和修复提高复制准确性'], exam: '半保留指两条子代 DNA 都保留亲代 DNA 的一条链。' }
      ]
    },
    transcription: {
      groups: [{ label: '转录 · DNA → RNA', span: 3 }, { label: '翻译 · RNA → 多肽', span: 3 }],
      note: '真核细胞中，转录和 RNA 加工主要发生在细胞核内，翻译发生在细胞质中的核糖体上。',
      steps: [
        { action: 'RNA 聚合酶识别启动子并打开 DNA', metrics: [['场所', '细胞核'], ['模板', 'DNA 模板链'], ['产物方向', '5′→3′']], observations: ['RNA 聚合酶沿模板链 3′→5′ 移动', '转录只以 DNA 的一条链为模板'], exam: '编码链序列与 mRNA 基本相同，但 DNA 的 T 对应 RNA 的 U。' },
        { action: '核糖核苷酸按互补原则逐个连接', metrics: [['场所', '细胞核'], ['原料', '核糖核苷酸'], ['产物', '前体 mRNA']], observations: ['转录泡前方解旋、后方重新形成双螺旋', 'mRNA 从 5′ 端向 3′ 端延长'], exam: '转录不需要 DNA 引物。' },
        { action: '前体 mRNA 剪接并形成成熟 mRNA', metrics: [['对象', '真核细胞'], ['去除', '内含子'], ['保留', '外显子']], observations: ['5′ 端加帽、3′ 端加 poly-A 尾', '成熟 mRNA 经核孔进入细胞质'], exam: 'RNA 加工是真核基因表达的补充内容，原核细胞通常无典型核内加工。' },
        { action: '核糖体在 AUG 处装配翻译起始复合体', metrics: [['场所', '核糖体'], ['起始密码子', 'AUG'], ['起始氨基酸', 'Met']], observations: ['起始 tRNA 的反密码子与 AUG 配对', '大、小亚基共同形成完整核糖体'], exam: '密码子位于 mRNA，反密码子位于 tRNA。' },
        { action: 'tRNA 依次进入，肽链逐步延长', metrics: [['读取方向', '5′→3′'], ['配对', '密码子-反密码子'], ['产物', '多肽链']], observations: ['肽键由核糖体催化形成', '核糖体每次沿 mRNA 移动一个密码子'], exam: '一种 tRNA 携带特定氨基酸，但一种氨基酸可对应多种密码子。' },
        { action: '释放因子识别终止密码子并释放多肽', metrics: [['终止信号', 'UAA/UAG/UGA'], ['进入 A 位', '释放因子'], ['结果', '多肽释放']], observations: ['终止密码子不编码氨基酸', '核糖体亚基解离并可再次利用'], exam: '终止密码子没有对应的 tRNA。' }
      ]
    },
    photosynthesis: {
      groups: [{ label: '光反应阶段 · 类囊体薄膜', span: 3 }, { label: '卡尔文循环 · 叶绿体基质', span: 2 }],
      note: '“暗反应”不表示只能在黑暗中进行；它依赖光反应提供的 ATP 和 NADPH，实际常与光反应同时进行。',
      steps: [
        { action: '色素吸收光能并激发 PSII 电子', metrics: [['场所', '类囊体薄膜'], ['能量输入', '光能'], ['反应中心', 'P680']], observations: ['天线色素将能量传递到反应中心', '电子被激发后进入电子传递链'], exam: '叶绿体中的色素位于类囊体薄膜，不位于叶绿体基质。' },
        { action: '水光解补充电子并释放氧气', metrics: [['原料', 'H₂O'], ['产物', 'O₂、H⁺、e⁻'], ['电子路径', 'PSII→PSI']], observations: ['氧气中的氧来自水', '电子传递伴随 H⁺ 在类囊体腔内积累'], exam: '光合作用释放的 O₂ 来源于水的光解。' },
        { action: '形成 ATP 和 NADPH', metrics: [['场所', '类囊体薄膜'], ['能量产物', 'ATP'], ['还原力', 'NADPH']], observations: ['H⁺ 顺梯度通过 ATP 合酶', 'PSI 电子最终用于还原 NADP⁺'], exam: 'ATP 和 NADPH 随后在叶绿体基质中被卡尔文循环利用。' },
        { action: 'Rubisco 催化 CO₂ 与 RuBP 结合', metrics: [['场所', '叶绿体基质'], ['碳源', 'CO₂'], ['最初产物', '3-PGA']], observations: ['不直接产生葡萄糖', '固定 3 个 CO₂ 才能净得到 1 个 G3P'], exam: 'CO₂ 固定阶段不直接需要光，但需要由光反应提供能量和还原力。' },
        { action: '还原 3-PGA 并再生 RuBP', metrics: [['消耗', 'ATP、NADPH'], ['输出', 'G3P'], ['循环受体', 'RuBP']], observations: ['大部分 G3P 用于再生 RuBP', '少部分 G3P 可用于合成糖类'], exam: 'RuBP 必须再生，卡尔文循环才能持续固定 CO₂。' }
      ]
    },
    respiration: {
      groups: [{ label: '第一阶段 · 细胞质基质', span: 1 }, { label: '有氧阶段 · 线粒体', span: 4 }],
      note: '有氧呼吸的能量逐步释放：少量 ATP 在底物水平磷酸化中形成，大部分 ATP 来自氧化磷酸化。',
      steps: [
        { action: '葡萄糖分解为两分子丙酮酸', metrics: [['场所', '细胞质基质'], ['碳流', '6C→2×3C'], ['净产 ATP', '2']], observations: ['糖酵解不直接需要氧', '同时产生少量 NADH'], exam: '糖酵解发生在细胞质基质，而不是线粒体。' },
        { action: '丙酮酸氧化形成乙酰辅酶 A', metrics: [['场所', '线粒体基质'], ['碳流', '3C→2C+CO₂'], ['还原产物', 'NADH']], observations: ['每个丙酮酸脱去一个 CO₂', '乙酰基与 CoA 结合进入三羧酸循环'], exam: '丙酮酸氧化是连接糖酵解与三羧酸循环的步骤。' },
        { action: '乙酰基被彻底氧化并再生草酰乙酸', metrics: [['场所', '线粒体基质'], ['释放', 'CO₂'], ['主要产物', 'NADH/FADH₂']], observations: ['循环受体草酰乙酸在反应末端再生', '能量主要暂存在还原型辅酶中'], exam: '三羧酸循环每轮接受一个 2C 乙酰基。' },
        { action: '电子沿内膜复合体传递并泵出 H⁺', metrics: [['场所', '线粒体内膜'], ['最终受体', 'O₂'], ['膜外积累', 'H⁺']], observations: ['NADH 和 FADH₂ 提供高能电子', '氧接受电子和 H⁺ 形成水'], exam: '氧在电子传递链末端发挥作用，不直接参与糖酵解。' },
        { action: 'H⁺ 回流驱动 ATP 合酶合成 ATP', metrics: [['驱动力', 'H⁺ 电化学梯度'], ['酶', 'ATP 合酶'], ['主要产物', 'ATP']], observations: ['H⁺ 从膜间隙回流到基质', '化学渗透把梯度势能转化为 ATP 化学能'], exam: '破坏线粒体内膜的 H⁺ 梯度会显著抑制 ATP 合成。' }
      ]
    },
    membrane: {
      groups: [{ label: '物质跨膜运输', span: 3 }, { label: '神经细胞动作电位', span: 3 }],
      note: '被动运输的共同点是顺浓度或电化学梯度；主动运输逆梯度并直接或间接消耗能量。',
      steps: [
        { action: '小分子顺浓度梯度穿过脂双层', metrics: [['方向', '高→低'], ['膜蛋白', '不需要'], ['ATP', '不消耗']], observations: ['适用于 O₂、CO₂ 等小分子', '运输速率受浓度梯度影响'], exam: '自由扩散不需要载体，也不存在载体饱和。' },
        { action: '通道或载体帮助物质顺梯度通过', metrics: [['方向', '高→低'], ['膜蛋白', '需要'], ['ATP', '不消耗']], observations: ['通道具有选择性，载体可发生构象变化', '水可经水通道蛋白快速通过'], exam: '协助扩散需要膜蛋白，但仍属于被动运输。' },
        { action: '钠钾泵逆梯度转运 Na⁺ 和 K⁺', metrics: [['每个 ATP', '3 Na⁺ 出'], ['同时', '2 K⁺ 入'], ['类型', '主动运输']], observations: ['泵维持膜两侧离子浓度差', '运输方向与离子电化学梯度相反'], exam: '钠钾泵直接水解 ATP，是生电性转运蛋白。' },
        { action: 'K⁺ 漏通道参与维持静息电位', metrics: [['典型膜电位', '约 −70 mV'], ['胞内主要阳离子', 'K⁺'], ['胞外较高', 'Na⁺']], observations: ['静息时膜对 K⁺ 的通透性较高', '膜内相对膜外呈负电'], exam: '静息电位主要由离子选择性通透和浓度梯度共同形成。' },
        { action: '电压门控 Na⁺ 通道开放导致去极化', metrics: [['阈电位', '约 −55 mV'], ['主要离子流', 'Na⁺ 内流'], ['峰值', '约 +30 mV']], observations: ['动作电位具有全或无特性', '超过阈值后膜电位快速上升'], exam: '动作电位幅度不随阈上刺激强度继续增大。' },
        { action: 'K⁺ 外流使膜复极并短暂超极化', metrics: [['Na⁺ 通道', '失活'], ['K⁺ 通道', '开放'], ['结果', '复极/超极化']], observations: ['K⁺ 通道关闭较慢导致短暂超极化', '随后离子通道和钠钾泵共同恢复稳态'], exam: '复极化主要由 K⁺ 外流引起，不是 Na⁺ 外流。' }
      ]
    }
  };

  /* ---------- 全局状态 ---------- */
  var _state = {
    process: 'mitosis', step: 0, progress: 0, playing: false, speed: 1,
    zoom: 1, panX: 0, panY: 0, dragging: false, lastX: 0, lastY: 0,
    lastTime: 0, animId: null, hotSpots: [], time: 0, completed: false, lastPanelKey: '', fitScale: 1
  };

  /* ---------- 样式 ---------- */
  function _addStyles() {
    if (document.getElementById('bio-animation-styles')) return;
    var s = document.createElement('style');
    s.id = 'bio-animation-styles';
    s.textContent = [
      '.ba-page{--ba-primary:var(--color-primary,#4a7c59);--ba-primary-dark:var(--color-primary-dark,#3a6347);--ba-primary-soft:var(--color-primary-50,#edf5f0);--ba-warm:var(--color-warm,#c4956a);--ba-bg:var(--color-bg,#faf8f5);--ba-stage:var(--color-bg-cool,#f2f5f3);--ba-surface:var(--color-surface,#fff);--ba-text:var(--color-text,#2c3e30);--ba-secondary:var(--color-text-secondary,#5a6b5e);--ba-muted:var(--color-text-muted,#8a9a8e);--ba-border:var(--color-border,#e2ddd6);max-width:1180px;margin:0 auto;overflow:hidden;background:var(--ba-surface);color:var(--ba-text);border:1px solid var(--ba-border);border-radius:16px;box-shadow:0 8px 24px rgba(44,62,48,.06);font-family:"LXGW WenKai",var(--font-sans,"PingFang SC","Microsoft YaHei",sans-serif)}',
      '.ba-header{display:flex;align-items:center;justify-content:space-between;gap:28px;padding:25px 28px 22px;border-bottom:1px solid var(--ba-border);background:var(--ba-surface)}',
      '.ba-heading{min-width:0}.ba-kicker{display:flex;align-items:center;gap:8px;margin:0 0 8px;color:var(--ba-warm);font:600 11px/1 var(--font-mono,ui-monospace,monospace);letter-spacing:.13em}.ba-kicker:before{width:24px;height:2px;background:var(--ba-warm);content:""}',
      '.ba-title{margin:0;color:var(--ba-text);font:700 clamp(25px,3vw,34px)/1.2 "LXGW WenKai",var(--font-serif,serif);letter-spacing:-.015em}.ba-title strong{color:var(--ba-primary);font-weight:700}.ba-subtitle{margin:8px 0 0;color:var(--ba-secondary);font-size:14px;line-height:1.65}',
      '.ba-picker{flex:0 0 210px;display:grid;gap:7px}.ba-picker label{color:var(--ba-muted);font-size:11px;letter-spacing:.08em}.ba-process-select{width:100%;padding:9px 11px;border:1px solid var(--ba-border);border-radius:9px;background:var(--ba-stage);color:var(--ba-text);font:600 13px "LXGW WenKai",var(--font-sans,sans-serif)}',
      '.ba-phase-groups{display:grid;gap:4px;padding:8px 18px 0;background:var(--ba-stage);color:var(--ba-muted);font-size:10px;letter-spacing:.05em;text-align:center}.ba-phase-group{padding:4px 5px 5px;border-bottom:1px solid rgba(138,154,142,.28)}.ba-phase-group:first-child{color:var(--ba-primary);border-color:rgba(74,124,89,.34)}',
      '.ba-phase-strip{display:grid;gap:4px;padding:4px 18px 8px;background:var(--ba-stage);border-bottom:1px solid var(--ba-border)}.ba-phase{display:flex;align-items:center;justify-content:center;gap:6px;min-width:0;min-height:45px;padding:7px 5px;border:0;border-radius:8px;background:transparent;color:var(--ba-muted);cursor:pointer;font:600 12px/1.25 "LXGW WenKai",var(--font-sans,sans-serif);transition:background-color .2s,color .2s,box-shadow .2s}.ba-phase:hover{background:rgba(74,124,89,.07);color:var(--ba-primary)}.ba-phase.is-active{background:var(--ba-surface);color:var(--ba-primary);box-shadow:0 1px 4px rgba(44,62,48,.08),inset 0 -2px 0 var(--ba-warm)}.ba-phase-number{display:grid;place-items:center;flex:0 0 23px;width:23px;height:23px;border:1px solid currentColor;border-radius:50%;font:600 9px/1 var(--font-mono,ui-monospace,monospace)}.ba-phase.is-active .ba-phase-number{background:var(--ba-primary);border-color:var(--ba-primary);color:#fff}.ba-phase-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
      '.ba-main{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(330px,.82fr);min-height:680px}.ba-stage-wrap{position:relative;min-width:0;overflow:hidden;background-color:var(--ba-stage);background-image:radial-gradient(rgba(74,124,89,.13) 1px,transparent 1px);background-size:25px 25px;border-right:1px solid var(--ba-border)}.ba-canvas{display:block;width:100%;height:680px;cursor:grab}.ba-canvas:active{cursor:grabbing}',
      '.ba-live{position:absolute;top:16px;left:16px;display:flex;align-items:center;gap:7px;padding:6px 10px;background:rgba(255,255,255,.9);color:var(--ba-secondary);border:1px solid var(--ba-border);border-radius:999px;box-shadow:0 2px 8px rgba(44,62,48,.07);font-size:11px;font-weight:600;pointer-events:none}.ba-live-dot{width:7px;height:7px;border-radius:50%;background:var(--ba-primary)}.ba-live.is-playing .ba-live-dot{animation:ba-pulse 1.2s ease-in-out infinite}@keyframes ba-pulse{50%{transform:scale(1.45)}}',
      '.ba-focus-label{position:absolute;top:18px;right:18px;max-width:220px;padding:7px 11px;border:1px solid rgba(44,62,48,.55);border-radius:999px;background:#cfff57;color:#26372b;box-shadow:0 3px 10px rgba(44,62,48,.1);font-size:11px;font-weight:600;pointer-events:none}',
      '.ba-hotspot-card{position:absolute;display:none;z-index:10;max-width:270px;padding:10px 13px;background:rgba(255,255,255,.97);color:var(--ba-secondary);border:1px solid var(--ba-border);border-left:3px solid var(--ba-primary);border-radius:4px 9px 9px 4px;box-shadow:0 7px 20px rgba(44,62,48,.14);font-size:12px;line-height:1.55;pointer-events:none}.ba-hotspot-card h4{margin:0 0 3px;color:var(--ba-primary);font-size:13px}.ba-hotspot-card p{margin:0}',
      '.ba-panel{display:flex;flex-direction:column;min-height:680px;padding:25px 24px 22px;background:var(--ba-surface)}.ba-note-head{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding-bottom:15px;border-bottom:1px solid var(--ba-border)}.ba-note-label{margin:0 0 5px;color:var(--ba-warm);font-size:11px;font-weight:600;letter-spacing:.1em}.ba-note-title{margin:0;color:var(--ba-text);font:700 23px/1.3 "LXGW WenKai",var(--font-serif,serif)}.ba-note-index{flex:0 0 auto;color:var(--ba-warm);font:600 23px/1 var(--font-mono,ui-monospace,monospace)}.ba-note-index small{color:var(--ba-muted);font-size:10px;font-weight:500}',
      '.ba-action{display:inline-flex;align-self:flex-start;margin:17px 0 12px;padding:6px 10px;background:rgba(196,149,106,.12);color:#966c47;border-left:3px solid var(--ba-warm);border-radius:3px 8px 8px 3px;font-size:13px;font-weight:600}.ba-metrics{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:0 0 12px}.ba-metric{padding:7px 8px;background:var(--ba-stage);border:1px solid var(--ba-border);border-radius:8px}.ba-metric span{display:block;margin-bottom:2px;color:var(--ba-muted);font-size:10px}.ba-metric strong{display:block;color:var(--ba-text);font:600 11px/1.3 var(--font-mono,ui-monospace,monospace)}',
      '.ba-knowledge-label{margin:14px 0 6px;color:var(--ba-muted);font-size:11px;font-weight:600;letter-spacing:.08em}.ba-step-desc{margin:0;color:var(--ba-secondary);font-size:13px;line-height:1.75}.ba-process-note{margin:10px 0 2px;padding:9px 11px;border-left:3px solid var(--ba-primary);border-radius:3px 8px 8px 3px;background:rgba(74,124,89,.07);color:var(--ba-secondary);font-size:12px;line-height:1.6}.ba-process-note strong{display:block;margin-bottom:2px;color:var(--ba-primary)}',
      '.ba-observe{display:grid;gap:7px;margin:7px 0 12px;padding:0;list-style:none}.ba-observe li{position:relative;padding-left:19px;color:var(--ba-text);font-size:12px;line-height:1.58}.ba-observe li:before{position:absolute;top:.58em;left:0;width:7px;height:7px;border-radius:50%;background:var(--ba-primary);content:""}.ba-exam{margin:0 0 4px;padding:9px 11px;background:var(--ba-primary-soft);border-radius:8px;color:var(--ba-secondary);font-size:12px;line-height:1.65}.ba-exam strong{display:inline-block;margin-right:6px;color:var(--ba-primary)}',
      '.ba-hl{box-decoration-break:clone;-webkit-box-decoration-break:clone;padding:0 .1em;border-radius:2px;background:linear-gradient(transparent 44%,rgba(207,255,87,.72) 44%,rgba(207,255,87,.72) 92%,transparent 92%);color:#26372b;font-weight:600}.ba-hl--pink{background:linear-gradient(transparent 44%,rgba(255,139,185,.58) 44%,rgba(255,139,185,.58) 92%,transparent 92%)}.ba-hl--cyan{background:linear-gradient(transparent 44%,rgba(112,232,218,.58) 44%,rgba(112,232,218,.58) 92%,transparent 92%)}.ba-hl--yellow{background:linear-gradient(transparent 44%,rgba(255,226,92,.72) 44%,rgba(255,226,92,.72) 92%,transparent 92%)}',
      '.ba-controls{margin-top:auto;padding-top:17px;border-top:1px solid var(--ba-border)}.ba-actions{display:grid;grid-template-columns:auto 1fr auto;gap:8px}.ba-btn{min-height:40px;padding:8px 11px;border:1px solid var(--ba-border);border-radius:8px;background:var(--ba-surface);color:var(--ba-text);cursor:pointer;font:600 12px "LXGW WenKai",var(--font-sans,sans-serif);transition:background-color .2s,border-color .2s,transform .2s}.ba-btn:hover{background:var(--ba-primary-soft);border-color:rgba(74,124,89,.4);color:var(--ba-primary);transform:translateY(-1px)}.ba-btn--main{background:var(--ba-primary);border-color:var(--ba-primary);color:#fff;box-shadow:0 4px 12px rgba(74,124,89,.16)}.ba-btn--main:hover{background:var(--ba-primary-dark);border-color:var(--ba-primary-dark);color:#fff}.ba-time-head{display:flex;justify-content:space-between;margin:13px 1px 6px;color:var(--ba-muted);font-size:10px}.ba-range{display:block;width:100%;accent-color:var(--ba-warm);cursor:pointer}.ba-speed-row{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:12px;color:var(--ba-muted);font-size:11px}.ba-speed{min-width:116px;padding:7px 8px;border:1px solid var(--ba-border);border-radius:8px;background:var(--ba-stage);color:var(--ba-text);font-family:inherit}',
      '.ba-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:11px 18px;background:var(--ba-stage);border-top:1px solid var(--ba-border);color:var(--ba-muted);font-size:11px}.ba-legend{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:12px}.ba-legend-item{display:inline-flex;align-items:center;gap:5px}.ba-legend-dot{width:10px;height:10px;border-radius:50%}',
      '.ba-phase:focus-visible,.ba-btn:focus-visible,.ba-process-select:focus-visible,.ba-range:focus-visible,.ba-speed:focus-visible{outline:2px solid var(--ba-primary);outline-offset:2px}',
      '@media(max-width:900px){.ba-main{grid-template-columns:1fr}.ba-stage-wrap{border-right:0;border-bottom:1px solid var(--ba-border)}.ba-canvas{height:520px}.ba-panel{min-height:0}}',
      '@media(max-width:640px){.ba-page{border-radius:12px}.ba-header{display:grid;gap:15px;padding:22px 20px 19px}.ba-picker{width:100%;max-width:none}.ba-phase-groups{padding:7px 7px 0}.ba-phase-strip{grid-template-columns:repeat(3,minmax(0,1fr))!important;padding:4px 7px 7px}.ba-phase-strip.is-dense{grid-template-columns:repeat(4,minmax(0,1fr))!important}.ba-phase{flex-direction:column;gap:3px;min-height:52px;padding-inline:2px}.ba-phase-name{max-width:100%}.ba-canvas{height:420px}.ba-panel{padding:22px 18px}.ba-focus-label{display:none}.ba-footer{align-items:flex-start;flex-direction:column}.ba-legend{justify-content:flex-start}}',
      '@media(max-width:420px){.ba-canvas{height:365px}.ba-phase-strip.is-dense{grid-template-columns:repeat(3,minmax(0,1fr))!important}.ba-metrics{grid-template-columns:1fr 1fr}.ba-metric:first-child{grid-column:1/-1}.ba-actions{grid-template-columns:1fr 1fr}.ba-btn--main{grid-column:1/-1;grid-row:1}.ba-title{font-size:25px}}',
      '@media(prefers-reduced-motion:reduce){.ba-live.is-playing .ba-live-dot{animation:none}.ba-btn:hover{transform:none}}'
    ].join('');
    document.head.appendChild(s);
  }

  /* ---------- 工具函数 ---------- */
  function _ease(t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; }
  function _clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function _lerp(a, b, t) { return a + (b - a) * t; }
  var _highlightTerms = [
    '姐妹染色单体', '同源染色体', '半保留复制', '碱基互补配对', '电化学梯度', '氧化磷酸化',
    'ATP 合酶', 'RNA 聚合酶', 'DNA 聚合酶', '冈崎片段', '着丝粒分裂', '交叉互换',
    '自由组合', '四分体', '赤道板', '复制叉', '前导链', '后随链', '模板链', '编码链',
    '卡尔文循环', '类囊体薄膜', '叶绿体基质', '线粒体内膜', '线粒体基质', '细胞质基质',
    '主动运输', '协助扩散', '自由扩散', '静息电位', '去极化', '复极化', '超极化',
    '密码子', '反密码子', '终止密码子', '核糖体', 'NADPH', 'NADH', 'FADH₂', 'ATP',
    'DNA', 'mRNA', 'tRNA', '染色体', '着丝粒', '纺锤体', '细胞板', '分裂沟', 'CO₂', 'O₂', 'H⁺'
  ].sort(function(a, b) { return b.length - a.length; });
  var _highlightPattern = new RegExp(_highlightTerms.map(function(term) {
    return term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }).join('|'), 'g');

  function _highlightText(text) {
    var index = 0;
    var styles = ['', ' ba-hl--pink', ' ba-hl--cyan', ' ba-hl--yellow'];
    return String(text || '').replace(_highlightPattern, function(match) {
      var style = styles[index % styles.length];
      index += 1;
      return '<mark class="ba-hl' + style + '">' + match + '</mark>';
    });
  }

  function _shortStepName(name) {
    var short = String(name).replace(/（[^）]+）/g, '').replace(/与胞质分裂/g, '').trim();
    var aliases = {
      '光能吸收与电荷分离': '光能吸收',
      '水的光解与电子传递': '水光解与传递',
      'NADPH 与 ATP 生成': 'ATP/NADPH',
      '还原与 RuBP 再生': 'RuBP 再生',
      '前导链连续合成': '前导链合成',
      '后随链不连续合成': '后随链合成',
      '电子传递链': '电子传递链',
      '氧化磷酸化': 'ATP 合成',
      '去极化与反极化': '去极化',
      '复极化与超极化': '复极化'
    };
    return aliases[short] || short;
  }
  var _z = function(v) { return v * _state.zoom * _state.fitScale; };
  function _toWorldX(x) { return x - _state.panX; }
  function _toWorldY(y) { return y - _state.panY; }

  /* ---------- 通用绘图 ---------- */
  function _chr(ctx, x, y, rot, gap, color, alpha) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.lineCap = 'round';
    function chromosomeArm(side) {
      ctx.beginPath();
      ctx.moveTo(side * gap, -_z(28));
      ctx.quadraticCurveTo(side * (gap + _z(5)), 0, side * gap, _z(28));
      ctx.strokeStyle = _theme.ink;
      ctx.lineWidth = _z(9);
      ctx.stroke();
      ctx.strokeStyle = color;
      ctx.lineWidth = _z(5);
      ctx.stroke();
    }
    chromosomeArm(-1);
    chromosomeArm(1);
    ctx.fillStyle = _theme.yellow;
    ctx.strokeStyle = _theme.ink;
    ctx.lineWidth = _z(2);
    ctx.beginPath(); ctx.arc(0, 0, _z(5), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function _cell(ctx, cx, cy, rx, ry, fill, stroke, split) {
    ctx.save();
    ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(4); ctx.fillStyle = _theme.cell;
    ctx.shadowColor = 'rgba(44,62,48,.14)';
    ctx.shadowBlur = _z(1);
    ctx.shadowOffsetX = _z(7);
    ctx.shadowOffsetY = _z(8);
    if (split > 0) {
      ctx.beginPath(); ctx.ellipse(cx - split, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(cx + split, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    } else { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  function _nuke(ctx, cx, cy, rx, ry, alpha) {
    ctx.save(); ctx.globalAlpha = alpha;
    ctx.fillStyle = _theme.nucleus;
    ctx.strokeStyle = _theme.ink;
    ctx.lineWidth = _z(2.5);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.restore();
  }

  function _spindle(ctx, poles, targets) {
    ctx.strokeStyle = 'rgba(112,144,194,.52)'; ctx.lineWidth = _z(1.5);
    poles.forEach(function(p) {
      targets.forEach(function(t) {
        ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(t.x, t.y); ctx.stroke();
      });
    });
  }

  function _lbl(ctx, x, y, text, bg) {
    ctx.save();
    ctx.font = '600 ' + Math.max(8, _z(12)) + 'px "LXGW WenKai",sans-serif';
    var tw = ctx.measureText(text).width;
    var left = x - tw / 2 - _z(9);
    var top = y - _z(14);
    var width = tw + _z(18);
    var height = _z(24);
    ctx.fillStyle = 'rgba(255,255,255,.96)';
    ctx.strokeStyle = _theme.ink;
    ctx.lineWidth = _z(1.7);
    ctx.beginPath(); ctx.roundRect(left, top, width, height, _z(7)); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = bg && /^#/.test(bg) ? bg : _theme.warm;
    ctx.lineWidth = _z(3);
    ctx.beginPath(); ctx.moveTo(left + _z(8), top + height); ctx.lineTo(left + width - _z(8), top + height); ctx.stroke();
    ctx.fillStyle = _theme.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, x, top + height / 2);
    ctx.restore();
  }

  function _arrow(ctx, x1, y1, x2, y2, color) {
    ctx.strokeStyle = color; ctx.lineWidth = _z(2); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
    var ang = Math.atan2(y2 - y1, x2 - x1);
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - _z(8) * Math.cos(ang - 0.5), y2 - _z(8) * Math.sin(ang - 0.5));
    ctx.lineTo(x2 - _z(8) * Math.cos(ang + 0.5), y2 - _z(8) * Math.sin(ang + 0.5));
    ctx.closePath(); ctx.fill();
  }

  function _softPanel(ctx, x, y, width, height, fill, stroke, radius) {
    ctx.save();
    ctx.fillStyle = fill || 'rgba(255,255,255,.72)';
    ctx.strokeStyle = stroke || 'rgba(44,62,48,.2)';
    ctx.lineWidth = _z(1.5);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, radius || _z(18));
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function _particle(ctx, x, y, radius, color, label, textColor) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.strokeStyle = _theme.ink;
    ctx.lineWidth = _z(1.4);
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    if (label) {
      ctx.fillStyle = textColor || _theme.ink;
      ctx.font = '700 ' + Math.max(8, _z(9)) + 'px "LXGW WenKai",sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, x, y + _z(.4));
    }
    ctx.restore();
  }

  function _callout(ctx, anchorX, anchorY, boxX, boxY, text, accent, canvasWidth, alpha) {
    if (canvasWidth < 500) return;
    ctx.save();
    ctx.globalAlpha = alpha === undefined ? 1 : alpha;
    ctx.font = '700 ' + Math.max(9, _z(12)) + 'px "LXGW WenKai",sans-serif';
    var width = ctx.measureText(text).width + _z(22);
    var height = _z(31);
    var x = _clamp(boxX, _z(12), canvasWidth - width - _z(12));
    var y = Math.max(_z(12), boxY);
    var edgeX = x + width / 2 < anchorX ? x + width : x;
    var edgeY = y + height / 2;
    var elbowX = _lerp(anchorX, edgeX, .48);
    ctx.strokeStyle = _theme.ink;
    ctx.lineWidth = _z(1.8);
    ctx.beginPath();
    ctx.moveTo(anchorX, anchorY);
    ctx.lineTo(elbowX, edgeY);
    ctx.lineTo(edgeX, edgeY);
    ctx.stroke();
    ctx.fillStyle = accent || _theme.yellowSoft;
    ctx.lineWidth = _z(2);
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, _z(8));
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = _theme.ink;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + _z(11), y + height / 2);
    ctx.beginPath();
    ctx.arc(anchorX, anchorY, _z(3.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function _flowDot(ctx, points, progress, color, radius) {
    if (!points || points.length < 2) return;
    var lengths = [];
    var total = 0;
    for (var i = 1; i < points.length; i++) {
      var length = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
      lengths.push(length);
      total += length;
    }
    var distance = (((progress % 1) + 1) % 1) * total;
    var x = points[0].x, y = points[0].y;
    for (var segment = 0; segment < lengths.length; segment++) {
      if (distance <= lengths[segment]) {
        var local = lengths[segment] ? distance / lengths[segment] : 0;
        x = _lerp(points[segment].x, points[segment + 1].x, local);
        y = _lerp(points[segment].y, points[segment + 1].y, local);
        break;
      }
      distance -= lengths[segment];
    }
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = _z(8);
    ctx.beginPath();
    ctx.arc(x, y, radius || _z(4), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function _drawTeachingFocus(ctx, canvas) {
    var focus = _state.hotSpots.length ? _state.hotSpots[_state.hotSpots.length - 1] : null;
    var label = document.getElementById('ba-focus-label');
    if (label) label.textContent = focus ? '重点观察 · ' + focus.title : '重点观察 · ' + _processes[_state.process].steps[_state.step].name;
    if (!focus) return;

    var pulse = 0.5 + 0.5 * Math.sin(_state.time * 4);
    var radius = _clamp(focus.r, _z(22), _z(76));
    ctx.save();
    ctx.translate(_state.panX, _state.panY);
    var total = _processes[_state.process].steps.length;
    var transitionFade = _state.step < total - 1 ? _clamp((.96 - _state.progress) / .1, 0, 1) : 1;
    ctx.globalAlpha = 0.8 * transitionFade;
    ctx.fillStyle = 'rgba(207,255,87,.1)';
    ctx.strokeStyle = _theme.fluorescent;
    ctx.lineWidth = _z(2.5);
    ctx.setLineDash([_z(8), _z(6)]);
    ctx.shadowColor = _theme.fluorescent;
    ctx.shadowBlur = _z(11 + pulse * 7);
    ctx.beginPath();
    ctx.ellipse(focus.x, focus.y, radius + pulse * _z(3), radius * 0.76 + pulse * _z(3), 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }

  function _drawStageCaption(ctx, canvas) {
    var process = _processes[_state.process];
    var text = String(_state.step + 1).padStart(2, '0') + '  ' + _shortStepName(process.steps[_state.step].name);
    ctx.save();
    ctx.font = '600 12px "LXGW WenKai",sans-serif';
    var width = ctx.measureText(text).width + 26;
    var x = canvas.width / 2 - width / 2;
    var y = canvas.height - 50;
    ctx.fillStyle = _theme.surface;
    ctx.strokeStyle = _theme.ink;
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.roundRect(x, y, width, 32, 16); ctx.fill(); ctx.stroke();
    ctx.fillStyle = _theme.ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, canvas.width / 2, y + 16);
    ctx.restore();
  }

  /* ========== 1. 有丝分裂 ========== */
  function _drawMitosis(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    var rx = _z(190), ry = _z(130);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var split = step === 4 ? _lerp(0, _z(40), t) : 0;
    _cell(ctx, cx, cy, rx, ry, 'rgba(90,125,92,0.1)', '#5a7d5c', split);

    // 核膜和核仁
    if (step <= 1) {
      var neAlpha = step === 0 ? 0.7 : _lerp(0.7, 0, t);
      _nuke(ctx, cx, cy, rx * 0.75, ry * 0.75, neAlpha);
      // 核仁（间期存在，前期消失）
      if (step === 0) {
        ctx.fillStyle = 'rgba(167,139,250,0.3)';
        ctx.beginPath(); ctx.arc(cx + _z(20), cy - _z(15), _z(12), 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(167,139,250,0.5)';
        ctx.beginPath(); ctx.arc(cx + _z(20), cy - _z(15), _z(6), 0, Math.PI * 2); ctx.fill();
        _state.hotSpots.push({ x: cx + _z(20), y: cy - _z(15), r: _z(16), title: '核仁', text: '间期核仁明显，负责核糖体RNA的合成和核糖体亚基的组装。前期核仁消失。' });
      }
      if (step === 0) _state.hotSpots.push({ x: cx, y: cy, r: _z(80), title: '核膜', text: '间期核膜完整，染色质在核内。前期核膜开始解体。' });
    }
    if (step === 4) {
      _nuke(ctx, cx - split, cy, rx * 0.75, ry * 0.75, 0.5 + 0.3 * t);
      _nuke(ctx, cx + split, cy, rx * 0.75, ry * 0.75, 0.5 + 0.3 * t);
      // 末期核仁重建
      if (t > 0.6) {
        var nucleolusAlpha = (t - 0.6) / 0.4;
        ctx.fillStyle = 'rgba(167,139,250,' + (0.3 * nucleolusAlpha) + ')';
        ctx.beginPath(); ctx.arc(cx - split + _z(15), cy - _z(10), _z(10), 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(cx + split - _z(15), cy - _z(10), _z(10), 0, Math.PI * 2); ctx.fill();
      }
    }

    // 中心体（间期已复制，位于细胞中心附近）
    var poleL = { x: cx - _z(30), y: cy };
    var poleR = { x: cx + _z(30), y: cy };
    if (step === 0) {
      // 间期：中心体刚复制完成，仍在细胞中心附近
      ctx.fillStyle = '#f472b6'; [poleL, poleR].forEach(function(p) {
        ctx.beginPath(); ctx.arc(p.x, p.y, _z(6), 0, Math.PI * 2); ctx.fill();
      });
      _state.hotSpots.push({ x: poleL.x, y: poleL.y, r: _z(16), title: '中心体（已复制）', text: '间期中心体已完成复制，但仍位于细胞中心附近。前期将移向两极形成纺锤体。' });
    }
    // 前期开始向两极移动
    if (step >= 1) {
      poleL = { x: cx - rx + _z(15), y: cy };
      poleR = { x: cx + rx - _z(15), y: cy };
      var centrosomeX = step === 1 ? _lerp(_z(30), rx - _z(15), t) : rx - _z(15);
      ctx.fillStyle = '#f472b6';
      ctx.beginPath(); ctx.arc(cx - centrosomeX, cy, _z(6), 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + centrosomeX, cy, _z(6), 0, Math.PI * 2); ctx.fill();
      // 星射线（微管）从中心体辐射
      if (step >= 1 && step <= 3) {
        ctx.strokeStyle = 'rgba(244,114,182,0.3)'; ctx.lineWidth = _z(1);
        for (var a = 0; a < 8; a++) {
          var ang = a * Math.PI / 4;
          ctx.beginPath();
          ctx.moveTo(cx - centrosomeX, cy);
          ctx.lineTo(cx - centrosomeX + Math.cos(ang) * _z(25), cy + Math.sin(ang) * _z(25));
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(cx + centrosomeX, cy);
          ctx.lineTo(cx + centrosomeX + Math.cos(ang) * _z(25), cy + Math.sin(ang) * _z(25));
          ctx.stroke();
        }
      }
      if (step === 1) _state.hotSpots.push({ x: cx - centrosomeX, y: cy, r: _z(16), title: '中心体', text: '中心体移向两极，发射星射线（微管）形成纺锤体。' });
    }

    // 染色体
    var chrs = [
      { x: cx - _z(55), y: cy - _z(35), color: '#e8a830' },
      { x: cx + _z(45), y: cy - _z(25), color: '#e8a830' },
      { x: cx - _z(25), y: cy + _z(45), color: '#5eead4' },
      { x: cx + _z(65), y: cy + _z(35), color: '#5eead4' }
    ];
    var targets = [];
    chrs.forEach(function(chr, i) {
      var sx = chr.x, sy = chr.y, rot = 0, gap = _z(10), alpha = 1;
      if (step === 0) {
        // 间期：染色质细丝
        ctx.strokeStyle = chr.color; ctx.globalAlpha = 0.5; ctx.lineWidth = _z(2);
        ctx.beginPath(); ctx.moveTo(sx - _z(30), sy); ctx.bezierCurveTo(sx - _z(5), sy - _z(15), sx + _z(5), sy + _z(15), sx + _z(30), sy); ctx.stroke();
        ctx.globalAlpha = 1;
        gap = _z(2);
      } else if (step === 1) {
        gap = _lerp(_z(2), _z(10), t);
        rot = _lerp(0, Math.PI / 8 * (i % 2 ? 1 : -1), t);
      } else if (step === 2) {
        // 中期：着丝粒严格排列在赤道板(y=cy)上
        sx = _lerp(chr.x, cx + (i - 1.5) * _z(38), t);
        sy = _lerp(chr.y, cy, t);  // 着丝粒精确对齐赤道板
        rot = _lerp(Math.PI / 8 * (i % 2 ? 1 : -1), 0, t);
        _state.hotSpots.push({ x: cx + (i - 1.5) * _z(38), y: cy, r: _z(28), title: '中期染色体', text: '所有染色体的着丝粒精确排列在赤道板（细胞中央假想平面）上，动粒微管张力平衡。' });
      } else if (step === 3) {
        sx = cx + (i - 1.5) * _z(38); sy = cy;
        gap = _lerp(_z(10), _z(65), t);
        _state.hotSpots.push({ x: sx, y: sy, r: _z(30), title: '后期分离', text: '着丝粒分裂，姐妹染色单体成为独立染色体。' });
      } else if (step === 4) {
        var side = i < 2 ? -1 : 1;
        sx = _lerp(cx + (i - 1.5) * _z(38), cx + side * (_z(40) + (i % 2) * _z(25)), t);
        sy = _lerp(cy, cy + (i % 2 - 0.5) * _z(30), t);
        alpha = _lerp(1, 0.5, t);
      }
      targets.push({ x: sx, y: sy });
      if (step > 0) _chr(ctx, sx, sy, rot, gap, chr.color, alpha);
    });

    if (step >= 1 && step <= 3) _spindle(ctx, [poleL, poleR], targets);

    // 分裂沟
    if (step === 4 && t > 0.5) {
      ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.moveTo(cx, cy - ry * 0.5); ctx.lineTo(cx, cy + ry * 0.5); ctx.stroke();
    }

    ctx.restore();
  }

  /* ========== 2. 减数分裂 ========== */
  function _drawMeiosis(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2;
    var step = _state.step, t = _ease(_state.progress);
    var rx = _z(180), ry = _z(126);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var paternal = _theme.yellow;
    var maternal = _theme.chromosomeB;

    function drawX(x, y, color, scale, rotation, tipColor) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rotation || 0); ctx.lineCap = 'round';
      var arm = _z(28 * scale), gap = _z(8 * scale), curve = _z(5 * scale);
      [-1, 1].forEach(function(side) {
        ctx.beginPath();
        ctx.moveTo(side * gap, -arm);
        ctx.quadraticCurveTo(side * (gap + curve), 0, side * gap, arm);
        ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(9 * scale); ctx.stroke();
        ctx.strokeStyle = color; ctx.lineWidth = _z(5 * scale); ctx.stroke();
      });
      ctx.fillStyle = _theme.yellow; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.6);
      ctx.beginPath(); ctx.arc(0, 0, _z(5 * scale), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (tipColor) {
        ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(7 * scale);
        ctx.beginPath(); ctx.moveTo(-gap, -arm + _z(3 * scale)); ctx.lineTo(-gap, -arm + _z(11 * scale)); ctx.stroke();
        ctx.strokeStyle = tipColor; ctx.lineWidth = _z(4 * scale); ctx.stroke();
      }
      ctx.restore();
    }

    function drawChromatid(x, y, color, scale, direction, tipColor) {
      ctx.save(); ctx.translate(x, y); ctx.lineCap = 'round';
      var side = direction || 1;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * _z(12 * scale), -_z(12 * scale), side * _z(16 * scale), -_z(25 * scale));
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(side * _z(12 * scale), _z(12 * scale), side * _z(16 * scale), _z(25 * scale));
      ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(8 * scale); ctx.stroke();
      ctx.strokeStyle = color; ctx.lineWidth = _z(4.5 * scale); ctx.stroke();
      ctx.fillStyle = _theme.yellow; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.5);
      ctx.beginPath(); ctx.arc(0, 0, _z(4.5 * scale), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      if (tipColor) {
        ctx.strokeStyle = tipColor; ctx.lineWidth = _z(4 * scale);
        ctx.beginPath(); ctx.moveTo(side * _z(13 * scale), -_z(18 * scale)); ctx.lineTo(side * _z(16 * scale), -_z(25 * scale)); ctx.stroke();
      }
      ctx.restore();
    }

    function drawPole(x, y) {
      ctx.fillStyle = _theme.warm; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.5);
      ctx.beginPath(); ctx.arc(x, y, _z(6), 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    }

    if (step <= 2) {
      _cell(ctx, cx, cy, rx, ry, '', '', 0);
    } else if (step <= 5) {
      var firstSplit = step === 3 ? t : 1;
      var firstCenter = _lerp(0, _z(112), firstSplit);
      var firstRx = _lerp(rx, _z(104), firstSplit);
      var firstRy = _lerp(ry, _z(98), firstSplit);
      _cell(ctx, cx - firstCenter, cy, firstRx, firstRy, '', '', 0);
      _cell(ctx, cx + firstCenter, cy, firstRx, firstRy, '', '', 0);
    } else {
      var secondSplit = t;
      [-1, 1].forEach(function(horizontal) {
        [-1, 1].forEach(function(vertical) {
          _cell(
            ctx,
            cx + horizontal * _z(112),
            cy + vertical * _lerp(0, _z(76), secondSplit),
            _lerp(_z(104), _z(88), secondSplit),
            _lerp(_z(98), _z(58), secondSplit),
            '', '', 0
          );
        });
      });
    }

    if (step === 0) {
      _nuke(ctx, cx, cy, rx * 0.78, ry * 0.8, 1 - t * 0.75);
      var pairData = [
        { x: cx - _z(62), y: cy, scale: 1, pRot: -0.15, mRot: 0.15 },
        { x: cx + _z(62), y: cy, scale: 0.74, pRot: 0.16, mRot: -0.16 }
      ];
      pairData.forEach(function(pair, index) {
        var offset = _z(13);
        drawX(pair.x - offset, pair.y, paternal, pair.scale, pair.pRot, t > 0.52 ? maternal : null);
        drawX(pair.x + offset, pair.y, maternal, pair.scale, pair.mRot, t > 0.52 ? paternal : null);
        ctx.strokeStyle = _theme.chromosomeA; ctx.lineWidth = _z(2.5); ctx.setLineDash([_z(4), _z(3)]);
        ctx.beginPath(); ctx.moveTo(pair.x - _z(7), pair.y - _z(7)); ctx.lineTo(pair.x + _z(7), pair.y + _z(7)); ctx.stroke(); ctx.setLineDash([]);
        if (index === 1) _lbl(ctx, pair.x, pair.y + _z(52), '四分体', _theme.fluorescent);
      });
      _callout(ctx, cx - _z(75), cy - _z(18), cx - _z(232), cy - _z(103), '非姐妹染色单体交叉互换', _theme.yellowSoft, canvas.width, 1);
      _state.hotSpots.push({ x: cx + _z(62), y: cy, r: _z(39), title: '四分体（联会复合体）', text: '一对同源染色体联会形成一个四分体，非姐妹染色单体之间可发生交叉互换。' });
    }

    if (step === 1 || step === 2) {
      var leftPole = cx - _z(150), rightPole = cx + _z(150);
      drawPole(leftPole, cy); drawPole(rightPole, cy);
      ctx.strokeStyle = _theme.warm; ctx.lineWidth = _z(2); ctx.setLineDash([_z(6), _z(6)]);
      ctx.beginPath(); ctx.moveTo(cx, cy - _z(92)); ctx.lineTo(cx, cy + _z(92)); ctx.stroke(); ctx.setLineDash([]);
      var separation = step === 2 ? _lerp(_z(16), _z(92), t) : _z(16);
      var positions = [
        { y: cy - _z(36), scale: 1, pSide: -1 },
        { y: cy + _z(36), scale: 0.74, pSide: 1 }
      ];
      positions.forEach(function(pair, index) {
        var pX = cx + pair.pSide * separation;
        var mX = cx - pair.pSide * separation;
        drawX(pX, pair.y, paternal, pair.scale, 0, index === 0 ? maternal : null);
        drawX(mX, pair.y, maternal, pair.scale, 0, index === 0 ? paternal : null);
        _spindle(ctx, [{ x: leftPole, y: cy }, { x: rightPole, y: cy }], [{ x: pX, y: pair.y }, { x: mX, y: pair.y }]);
      });
      _callout(ctx, cx, cy - _z(36), cx - _z(235), cy - _z(115), step === 1 ? '同源染色体对位于赤道板两侧' : '同源染色体移向两极', _theme.blueSoft, canvas.width, 1);
      _state.hotSpots.push({ x: cx, y: cy, r: _z(47), title: step === 1 ? '同源染色体对排列' : '同源染色体分离', text: step === 1 ? '中期 I：同源染色体成对排列在赤道板两侧，朝向具有随机性。' : '后期 I：同源染色体分离，姐妹染色单体仍由着丝粒相连。' });
    }

    if (step === 3) {
      var move = _lerp(_z(92), _z(112), t);
      var yLong = _lerp(cy - _z(36), cy - _z(24), t);
      var yShort = _lerp(cy + _z(36), cy + _z(24), t);
      drawX(cx - move, yLong, paternal, 1, 0, maternal);
      drawX(cx - move, yShort, maternal, 0.74, 0, null);
      drawX(cx + move, yLong, maternal, 1, 0, paternal);
      drawX(cx + move, yShort, paternal, 0.74, 0, null);
      _nuke(ctx, cx - move, cy, _z(70), _z(68), t);
      _nuke(ctx, cx + move, cy, _z(70), _z(68), t);
      _callout(ctx, cx - move, cy - _z(5), cx - _z(250), cy - _z(118), '每个子细胞：n＝2，DNA＝2C', _theme.greenSoft, canvas.width, 1);
      _state.hotSpots.push({ x: cx - move, y: cy, r: _z(66), title: '染色体数减半', text: '每个子细胞得到每对同源染色体中的一条，因此由 2n 变为 n；染色体仍含两条姐妹染色单体。' });
    }

    if (step === 4 || step === 5) {
      [-1, 1].forEach(function(side) {
        var cellX = cx + side * _z(112);
        var topPole = cy - _z(78), bottomPole = cy + _z(78);
        drawPole(cellX, topPole); drawPole(cellX, bottomPole);
        ctx.strokeStyle = _theme.warm; ctx.lineWidth = _z(1.7); ctx.setLineDash([_z(5), _z(5)]);
        ctx.beginPath(); ctx.moveTo(cellX - _z(70), cy); ctx.lineTo(cellX + _z(70), cy); ctx.stroke(); ctx.setLineDash([]);
        var longColor = side < 0 ? paternal : maternal;
        var shortColor = side < 0 ? maternal : paternal;
        var longTip = side < 0 ? maternal : paternal;
        if (step === 4) {
          drawX(cellX - _z(25), cy, longColor, 0.86, Math.PI / 2, longTip);
          drawX(cellX + _z(25), cy, shortColor, 0.66, Math.PI / 2, null);
          _spindle(ctx, [{ x: cellX, y: topPole }, { x: cellX, y: bottomPole }], [{ x: cellX - _z(25), y: cy }, { x: cellX + _z(25), y: cy }]);
        } else {
          var chromatidSeparation = _lerp(0, _z(55), t);
          [-1, 1].forEach(function(direction) {
            drawChromatid(cellX - _z(25), cy + direction * chromatidSeparation, longColor, 0.78, direction, direction < 0 ? longTip : null);
            drawChromatid(cellX + _z(25), cy + direction * chromatidSeparation, shortColor, 0.62, direction, null);
          });
        }
      });
      _callout(ctx, cx + _z(87), cy, cx + _z(146), cy - _z(122), step === 4 ? '单条染色体在赤道板排列' : '着丝粒分裂，姐妹染色单体分开', _theme.violetSoft, canvas.width, 1);
      _state.hotSpots.push({ x: cx + _z(112), y: cy, r: _z(58), title: step === 4 ? '中期 II' : '姐妹染色单体分离', text: step === 4 ? '染色体在两个细胞的赤道板上分别排列，DNA 不再复制。' : '后期 II 着丝粒分裂，姐妹染色单体成为独立染色体并移向两极。' });
    }

    if (step === 6) {
      [-1, 1].forEach(function(horizontal) {
        [-1, 1].forEach(function(vertical) {
          var childX = cx + horizontal * _z(112);
          var childY = cy + vertical * _lerp(_z(55), _z(76), t);
          var longColor = horizontal < 0 ? paternal : maternal;
          var shortColor = horizontal < 0 ? maternal : paternal;
          drawChromatid(childX - _z(18), childY, longColor, 0.62, vertical, vertical < 0 ? (horizontal < 0 ? maternal : paternal) : null);
          drawChromatid(childX + _z(18), childY, shortColor, 0.5, vertical, null);
          _lbl(ctx, childX, childY + _z(42), 'n＝2 · 1C', _theme.primary);
        });
      });
      _callout(ctx, cx + _z(112), cy + _z(76), cx + _z(154), cy - _z(129), '4 个单倍体子细胞', _theme.greenSoft, canvas.width, 1);
      _state.hotSpots.push({ x: cx + _z(112), y: cy + _z(76), r: _z(48), title: '四个单倍体子细胞', text: '每个子细胞含一套非同源染色体。交叉互换和自由组合使其遗传组成产生差异。' });
    }
    ctx.restore();
  }

  /* ========== 3. DNA 半保留复制 ========== */
  function _drawDNA(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2 - _z(4);
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var xLeft = cx - _z(285), forkX = cx + _z(98), xRight = cx + _z(285);
    var open = _z(step === 0 ? _lerp(24, 102, t) : 102);
    var topY = cy - open, bottomY = cy + open;
    var finish = step === 4 ? _clamp((t - .25) / .47, 0, 1) : 0;

    function strand(points, color, width, alpha, dash) {
      ctx.save();
      ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.strokeStyle = color; ctx.lineWidth = width || _z(4); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath();
      points.forEach(function(point, index) { if (index) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); });
      ctx.stroke();
      ctx.restore();
    }

    function drawParentDuplex(alpha) {
      ctx.save(); ctx.globalAlpha = alpha;
      strand([{ x: forkX, y: cy - _z(8) }, { x: xRight, y: cy - _z(8) }], _theme.yellow, _z(5));
      strand([{ x: forkX, y: cy + _z(8) }, { x: xRight, y: cy + _z(8) }], _theme.chromosomeB, _z(5));
      for (var p = 0; p < 8; p++) {
        var px = _lerp(forkX + _z(18), xRight - _z(8), p / 7);
        ctx.strokeStyle = p % 2 ? _theme.violet : _theme.cyan;
        ctx.lineWidth = _z(1.5);
        ctx.beginPath(); ctx.moveTo(px, cy - _z(6)); ctx.lineTo(px, cy + _z(6)); ctx.stroke();
      }
      ctx.restore();
    }

    ctx.save(); ctx.globalAlpha = 1 - finish;
    _softPanel(ctx, xLeft - _z(26), cy - _z(148), xRight - xLeft + _z(52), _z(296), 'rgba(255,255,255,.43)', 'rgba(74,124,89,.16)', _z(34));

    strand([{ x: xLeft, y: topY }, { x: forkX, y: cy - _z(8) }], _theme.yellow, _z(5));
    strand([{ x: xLeft, y: bottomY }, { x: forkX, y: cy + _z(8) }], _theme.chromosomeB, _z(5));
    drawParentDuplex(1);

    _lbl(ctx, xLeft - _z(18), topY, "5'", _theme.yellow);
    _lbl(ctx, xLeft - _z(18), bottomY, "3'", _theme.chromosomeB);
    _lbl(ctx, xRight + _z(18), cy - _z(8), "3'", _theme.yellow);
    _lbl(ctx, xRight + _z(18), cy + _z(8), "5'", _theme.chromosomeB);

    _particle(ctx, forkX, cy, _z(23), _theme.yellowSoft, '解旋酶');
    _arrow(ctx, forkX + _z(28), cy - _z(37), forkX + _z(83), cy - _z(37), _theme.warm);
    _lbl(ctx, forkX + _z(55), cy - _z(55), '复制叉移动方向', _theme.warm);

    for (var s = 0; s < 5; s++) {
      var ssbX = xLeft + _z(74 + s * 57);
      var fraction = (ssbX - xLeft) / (forkX - xLeft);
      _particle(ctx, ssbX, _lerp(topY, cy - _z(8), fraction) + _z(13), _z(5), _theme.violetSoft, '');
      _particle(ctx, ssbX, _lerp(bottomY, cy + _z(8), fraction) - _z(13), _z(5), _theme.violetSoft, '');
    }

    var primerAlpha = step === 0 ? 0 : (step === 1 ? t : 1);
    ctx.save(); ctx.globalAlpha = primerAlpha;
    strand([{ x: xLeft + _z(10), y: bottomY - _z(15) }, { x: xLeft + _z(44), y: bottomY - _z(15) }], _theme.rose, _z(6));
    var fragmentStarts = [xLeft + _z(112), xLeft + _z(215), xLeft + _z(318)];
    fragmentStarts.forEach(function(start) {
      var frac = (start - xLeft) / (forkX - xLeft);
      var y = _lerp(topY, cy - _z(8), frac) + _z(15);
      strand([{ x: start + _z(58), y: y }, { x: start + _z(78), y: y }], _theme.rose, _z(6));
    });
    ctx.restore();

    if (step === 1) {
      _callout(ctx, xLeft + _z(28), bottomY - _z(15), xLeft + _z(9), cy + _z(126), 'RNA 引物提供 3′-OH', _theme.yellowSoft, canvas.width, primerAlpha);
    }

    if (step >= 2) {
      var lead = step === 2 ? t : 1;
      var leadEnd = _lerp(xLeft + _z(42), forkX - _z(24), lead);
      var leadStartY = bottomY - _z(15);
      var leadEndFraction = (leadEnd - xLeft) / (forkX - xLeft);
      var leadEndY = _lerp(bottomY, cy + _z(8), leadEndFraction) - _z(15);
      strand([{ x: xLeft + _z(42), y: leadStartY }, { x: leadEnd, y: leadEndY }], _theme.primary, _z(6));
      _particle(ctx, leadEnd, leadEndY, _z(16), _theme.greenSoft, 'Pol');
      _arrow(ctx, leadEnd - _z(52), leadEndY + _z(22), leadEnd - _z(8), leadEndY + _z(22), _theme.primary);
      _lbl(ctx, xLeft + _z(142), bottomY + _z(31), '前导链 · 连续合成 5′→3′', _theme.primary);
      if (step === 2) {
        _callout(ctx, leadEnd, leadEndY, xLeft + _z(82), cy - _z(143), 'DNA 聚合酶向复制叉连续延伸', _theme.greenSoft, canvas.width, 1);
        _state.hotSpots.push({ x: leadEnd, y: leadEndY, r: _z(29), title: '前导链连续合成', text: 'DNA 聚合酶始终沿 5′→3′ 方向延伸新链，方向与复制叉推进方向一致。' });
      }
    }

    if (step >= 3) {
      var fragmentProgress = step === 3 ? t : 1;
      fragmentStarts.forEach(function(start, index) {
        var local = _clamp(fragmentProgress * 3 - index, 0, 1);
        if (!local) return;
        var right = start + _z(58);
        var left = _lerp(right, start, local);
        var frac = (right - xLeft) / (forkX - xLeft);
        var y = _lerp(topY, cy - _z(8), frac) + _z(15);
        strand([{ x: right, y: y }, { x: left, y: y }], _theme.cyan, _z(6));
        _arrow(ctx, right - _z(4), y + _z(20), left + _z(4), y + _z(20), _theme.cyan);
      });
      _lbl(ctx, xLeft + _z(195), topY - _z(28), '后随链 · 冈崎片段 5′→3′', _theme.cyan);
      if (step === 3) {
        var lastX = fragmentStarts[2] + _z(29);
        var lastFrac = (lastX - xLeft) / (forkX - xLeft);
        var lastY = _lerp(topY, cy - _z(8), lastFrac) + _z(15);
        _callout(ctx, lastX, lastY, xLeft + _z(23), cy - _z(143), '片段背离复制叉延伸', _theme.blueSoft, canvas.width, 1);
        _state.hotSpots.push({ x: lastX, y: lastY, r: _z(31), title: '冈崎片段', text: '后随链必须分段合成；每个片段先有 RNA 引物，随后由连接酶把相邻片段连成完整新链。' });
      }
    }

    if (step === 0) {
      _callout(ctx, forkX, cy, forkX + _z(42), cy + _z(74), '氢键断开，磷酸二酯键保持', _theme.yellowSoft, canvas.width, 1);
      _state.hotSpots.push({ x: forkX, y: cy, r: _z(33), title: '复制叉与解旋酶', text: '解旋酶破坏两条母链之间的氢键；单链结合蛋白稳定已分开的模板链。' });
    } else if (step === 1) {
      _state.hotSpots.push({ x: xLeft + _z(28), y: bottomY - _z(15), r: _z(25), title: 'RNA 引物', text: '引物酶合成短 RNA 引物，为 DNA 聚合酶提供可延伸的 3′-OH。' });
    }

    if (step === 4 && finish < .7) {
      fragmentStarts.forEach(function(start) {
        var frac = (start + _z(56) - xLeft) / (forkX - xLeft);
        var y = _lerp(topY, cy - _z(8), frac) + _z(15);
        _particle(ctx, start + _z(56), y, _z(13), _theme.yellowSoft, 'Lig');
      });
      _callout(ctx, xLeft + _z(271), cy - _z(22), xLeft + _z(38), cy - _z(143), '去除引物、补齐 DNA、连接缺口', _theme.yellowSoft, canvas.width, 1 - finish);
    }
    ctx.restore();

    if (step === 4 && finish > 0) {
      ctx.save(); ctx.globalAlpha = finish;
      _softPanel(ctx, xLeft - _z(16), cy - _z(132), xRight - xLeft + _z(32), _z(264), 'rgba(255,255,255,.72)', 'rgba(74,124,89,.22)', _z(30));
      var moleculeYs = [cy - _z(66), cy + _z(66)];
      var parentalColors = [_theme.yellow, _theme.chromosomeB];
      moleculeYs.forEach(function(y, index) {
        strand([{ x: xLeft + _z(28), y: y - _z(8) }, { x: xRight - _z(28), y: y - _z(8) }], parentalColors[index], _z(6));
        strand([{ x: xLeft + _z(28), y: y + _z(8) }, { x: xRight - _z(28), y: y + _z(8) }], _theme.primary, _z(6));
        for (var b = 0; b < 12; b++) {
          var bx = _lerp(xLeft + _z(34), xRight - _z(34), b / 11);
          ctx.strokeStyle = b % 2 ? _theme.cyan : _theme.violet;
          ctx.lineWidth = _z(1.4);
          ctx.beginPath(); ctx.moveTo(bx, y - _z(6)); ctx.lineTo(bx, y + _z(6)); ctx.stroke();
        }
        _lbl(ctx, cx, y + _z(36), '一条母链 ＋ 一条新链', index ? _theme.blueSoft : _theme.yellowSoft);
      });
      _callout(ctx, cx + _z(116), cy - _z(66), cx + _z(124), cy - _z(139), '两个子代 DNA 均为半保留', _theme.greenSoft, canvas.width, finish);
      ctx.restore();
      _state.hotSpots.push({ x: cx + _z(116), y: cy - _z(66), r: _z(44), title: '半保留复制结果', text: '两个子代 DNA 分子都保留一条亲代链，并含一条按碱基互补配对原则新合成的链。' });
    }

    ctx.restore();
  }

  /* ========== 4. 转录与翻译 ========== */
  function _drawTranscription(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2 - _z(4);
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var geneX0 = cx - _z(282), geneX1 = cx + _z(282);
    var dnaY = cy - _z(116), processingY = cy - _z(18), ribY = cy + _z(132);
    var codons = ['AUG', 'CCG', 'UAC', 'GUA', 'UAA'];
    var aaNames = ['Met', 'Pro', 'Tyr', 'Val'];
    var aaColors = [_theme.orange, _theme.cyan, _theme.violet, _theme.rose];

    function line(x1, y1, x2, y2, color, width, alpha, dash) {
      ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.strokeStyle = color; ctx.lineWidth = width || _z(4); ctx.lineCap = 'round';
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.restore();
    }

    function drawRibosome(x, y, assembly, separation) {
      var split = separation || 0;
      ctx.save(); ctx.globalAlpha = assembly;
      ctx.fillStyle = _theme.violetSoft; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.ellipse(x, y - _z(13 + split), _z(44), _z(23), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = _theme.blueSoft;
      ctx.beginPath(); ctx.ellipse(x, y + _z(13 + split), _z(38), _z(17), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.font = '700 ' + Math.max(8, _z(9)) + 'px "LXGW WenKai",sans-serif'; ctx.fillStyle = _theme.ink; ctx.textAlign = 'center';
      ctx.fillText('大亚基', x, y - _z(12 + split)); ctx.fillText('小亚基', x, y + _z(15 + split));
      ctx.restore();
    }

    function drawTRNA(x, y, color, label, alpha) {
      ctx.save(); ctx.globalAlpha = alpha === undefined ? 1 : alpha;
      ctx.strokeStyle = color; ctx.lineWidth = _z(3); ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y); ctx.bezierCurveTo(x - _z(16), y - _z(12), x - _z(17), y + _z(10), x, y + _z(19));
      ctx.bezierCurveTo(x + _z(17), y + _z(10), x + _z(16), y - _z(12), x, y); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x, y - _z(2)); ctx.lineTo(x, y - _z(24)); ctx.stroke();
      _particle(ctx, x, y - _z(31), _z(8), color, label || 'aa');
      if (canvas.width >= 500) {
        ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(8)) + 'px monospace'; ctx.textAlign = 'center';
        ctx.fillText('反密码子', x, y + _z(31));
      }
      ctx.restore();
    }

    var later = step >= 3;
    _softPanel(ctx, geneX0 - _z(24), cy - _z(181), geneX1 - geneX0 + _z(48), _z(211), later ? 'rgba(233,227,244,.34)' : 'rgba(233,227,244,.72)', 'rgba(139,119,197,.28)', _z(32));
    _lbl(ctx, geneX0 + _z(8), cy - _z(161), '细胞核', _theme.violetSoft);

    line(geneX0, dnaY, geneX1, dnaY, _theme.yellow, _z(5), later ? .58 : 1);
    line(geneX0, dnaY + _z(20), geneX1, dnaY + _z(20), _theme.chromosomeB, _z(5), later ? .58 : 1);
    for (var i = 0; i < 18; i++) {
      var baseX = _lerp(geneX0 + _z(9), geneX1 - _z(9), i / 17);
      line(baseX, dnaY + _z(4), baseX, dnaY + _z(16), i % 2 ? _theme.cyan : _theme.violet, _z(1.5), later ? .48 : .86);
    }
    _lbl(ctx, geneX0 - _z(18), dnaY, "5′", _theme.yellow);
    _lbl(ctx, geneX0 - _z(18), dnaY + _z(20), "3′", _theme.chromosomeB);
    _lbl(ctx, geneX1 + _z(18), dnaY, "3′", _theme.yellow);
    _lbl(ctx, geneX1 + _z(18), dnaY + _z(20), "5′", _theme.chromosomeB);

    var promoterX = geneX0 + _z(55), terminatorX = geneX1 - _z(45);
    line(promoterX, dnaY - _z(21), promoterX, dnaY + _z(37), _theme.primary, _z(3), later ? .42 : 1, [_z(4), _z(3)]);
    _lbl(ctx, promoterX, dnaY - _z(35), '启动子', _theme.greenSoft);
    line(terminatorX, dnaY - _z(13), terminatorX, dnaY + _z(31), _theme.rose, _z(2), later ? .42 : .8, [_z(4), _z(3)]);

    if (step <= 1) {
      var polStart = promoterX + _z(10);
      var polEnd = step === 0 ? _lerp(polStart, polStart + _z(48), t) : _lerp(polStart + _z(48), terminatorX, t);
      _particle(ctx, polEnd, dnaY + _z(10), _z(24), _theme.yellowSoft, 'Pol II');
      var transcriptStart = promoterX + _z(18);
      var transcriptEnd = Math.max(transcriptStart, polEnd - _z(8));
      if (step === 1 || t > .35) {
        line(transcriptStart, dnaY + _z(54), transcriptEnd, dnaY + _z(54), _theme.rose, _z(6), step === 0 ? _clamp((t - .35) / .65, 0, 1) : 1);
        _lbl(ctx, transcriptStart - _z(16), dnaY + _z(54), '5′', _theme.rose);
        line(transcriptEnd, dnaY + _z(50), polEnd, dnaY + _z(24), _theme.rose, _z(3));
      }
      _arrow(ctx, polEnd + _z(30), dnaY - _z(24), polEnd + _z(72), dnaY - _z(24), _theme.warm);
      if (step === 0) {
        _callout(ctx, polEnd, dnaY + _z(10), geneX0 + _z(8), cy - _z(31), '聚合酶识别启动子并局部解链', _theme.yellowSoft, canvas.width, 1);
        _state.hotSpots.push({ x: polEnd, y: dnaY + _z(10), r: _z(34), title: '转录起始复合体', text: 'RNA 聚合酶结合启动子，局部打开 DNA；以模板链为模板开始合成 RNA。' });
      } else {
        _callout(ctx, polEnd, dnaY + _z(10), geneX0 + _z(21), cy - _z(31), '模板链按 3′→5′ 方向被读取', _theme.blueSoft, canvas.width, 1);
        _state.hotSpots.push({ x: polEnd, y: dnaY + _z(10), r: _z(35), title: '转录泡', text: 'RNA 聚合酶读取 DNA 模板链 3′→5′，使 RNA 链沿 5′→3′ 方向延长；后方 DNA 重新闭合。' });
      }
    }

    if (step === 2) {
      var splice = t;
      var exonWidth = _z(92), gap = _z(_lerp(64, 8, splice));
      var totalWidth = exonWidth * 3 + gap * 2;
      var exonStart = cx - totalWidth / 2;
      var exonColors = [_theme.orange, _theme.cyan, _theme.violet];
      var exonLabels = ['外显子 1', '外显子 2', '外显子 3'];
      for (var e = 0; e < 3; e++) {
        var ex = exonStart + e * (exonWidth + gap);
        ctx.fillStyle = exonColors[e]; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.7);
        ctx.beginPath(); ctx.roundRect(ex, processingY - _z(9), exonWidth, _z(18), _z(7)); ctx.fill(); ctx.stroke();
        ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(9, _z(10)) + 'px "LXGW WenKai",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(exonLabels[e], ex + exonWidth / 2, processingY);
        if (e < 2 && splice < .92) {
          var nextX = ex + exonWidth + gap;
          ctx.strokeStyle = _theme.rose; ctx.lineWidth = _z(3); ctx.setLineDash([_z(5), _z(4)]);
          ctx.beginPath(); ctx.moveTo(ex + exonWidth, processingY); ctx.quadraticCurveTo((ex + exonWidth + nextX) / 2, processingY + _z(45 * (1 - splice)), nextX, processingY); ctx.stroke(); ctx.setLineDash([]);
        }
      }
      _particle(ctx, exonStart - _z(18), processingY, _z(9), _theme.yellowSoft, '帽');
      for (var a = 0; a < 5; a++) _particle(ctx, exonStart + totalWidth + _z(14 + a * 12), processingY, _z(5), _theme.rose, 'A');
      _callout(ctx, cx, processingY, geneX0 + _z(26), cy + _z(39), '剪除内含子，连接外显子', _theme.violetSoft, canvas.width, 1);
      _state.hotSpots.push({ x: cx, y: processingY, r: _z(56), title: '真核 mRNA 加工', text: '前体 mRNA 加 5′ 帽、3′ poly(A) 尾，并由剪接体去除内含子、连接外显子。' });
    }

    if (step >= 3) {
      var exportProgress = step === 3 ? _clamp(t * 1.65, 0, 1) : 1;
      var mStart = geneX0 + _z(53), mEnd = geneX1 - _z(36);
      var matureY = _lerp(processingY, ribY, exportProgress);
      line(mStart, matureY, mEnd, matureY, _theme.rose, _z(6));
      _particle(ctx, mStart - _z(13), matureY, _z(9), _theme.yellowSoft, '帽');
      for (var tail = 0; tail < 5; tail++) _particle(ctx, mEnd + _z(10 + tail * 11), matureY, _z(4.8), _theme.rose, 'A');
      _lbl(ctx, mStart - _z(29), matureY, '5′', _theme.rose); _lbl(ctx, mEnd + _z(68), matureY, '3′', _theme.rose);

      if (exportProgress > .72 || step > 3) {
        var codonAlpha = _clamp((exportProgress - .72) / .28, 0, 1);
        var codonWidth = (mEnd - mStart - _z(34)) / codons.length;
        ctx.save(); ctx.globalAlpha = step > 3 ? 1 : codonAlpha;
        codons.forEach(function(codon, index) {
          var x = mStart + _z(17) + index * codonWidth;
          ctx.fillStyle = index === codons.length - 1 ? 'rgba(228,110,155,.13)' : 'rgba(74,124,89,.08)';
          ctx.strokeStyle = index === codons.length - 1 ? _theme.rose : 'rgba(74,124,89,.28)'; ctx.lineWidth = _z(1);
          ctx.beginPath(); ctx.roundRect(x, ribY + _z(31), codonWidth - _z(4), _z(23), _z(5)); ctx.fill(); ctx.stroke();
          ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(9, _z(10)) + 'px monospace'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillText(codon, x + (codonWidth - _z(4)) / 2, ribY + _z(43));
        });
        ctx.restore();
      }

      var ribStart = mStart + _z(48), ribEnd = mEnd - _z(18);
      var ribProgress = step === 3 ? _clamp((t - .5) / .5, 0, 1) * .06 : (step === 4 ? t : 1);
      var ribX = _lerp(ribStart, ribEnd, ribProgress);
      var release = step === 5 ? t : 0;
      drawRibosome(ribX, ribY, step === 3 ? _clamp((t - .42) / .4, 0, 1) : 1, release * _z(18));

      if (step === 3) {
        drawTRNA(ribX, ribY - _z(48), _theme.cyan, 'Met', _clamp((t - .55) / .35, 0, 1));
        _callout(ctx, ribX, ribY, geneX0 + _z(17), cy + _z(28), '小亚基定位 AUG，大亚基随后结合', _theme.greenSoft, canvas.width, 1);
        _state.hotSpots.push({ x: ribX, y: ribY, r: _z(48), title: '翻译起始复合体', text: '核糖体小亚基定位起始密码子 AUG，起始 tRNA 携带甲硫氨酸进入 P 位，大亚基结合。' });
      }

      if (step === 4 || step === 5) {
        var aaCount = step === 4 ? Math.max(1, Math.min(4, Math.ceil(t * 4))) : 4;
        var chainPoints = [];
        for (var aa = 0; aa < aaCount; aa++) {
          var aaX = ribX - _z(6 + aa * 13), aaY = ribY - _z(39 + aa * 18);
          chainPoints.push({ x: aaX, y: aaY });
        }
        ctx.strokeStyle = _theme.primary; ctx.lineWidth = _z(4); ctx.lineCap = 'round'; ctx.beginPath();
        chainPoints.forEach(function(point, index) { if (index) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); }); ctx.stroke();
        chainPoints.forEach(function(point, index) { _particle(ctx, point.x, point.y, _z(7), aaColors[index], canvas.width < 500 ? '' : aaNames[index]); });

        if (step === 4) {
          drawTRNA(ribX + _z(17), ribY - _z(1), _theme.cyan, aaNames[Math.min(3, aaCount)], 1);
          ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(9)) + 'px monospace'; ctx.textAlign = 'center';
          ctx.fillText('E', ribX - _z(23), ribY + _z(2)); ctx.fillText('P', ribX, ribY + _z(2)); ctx.fillText('A', ribX + _z(23), ribY + _z(2));
          _arrow(ctx, ribX + _z(50), ribY - _z(50), ribX + _z(92), ribY - _z(50), _theme.warm);
          _callout(ctx, ribX + _z(17), ribY - _z(1), geneX0 + _z(4), cy + _z(23), '密码子—反密码子配对决定氨基酸', _theme.blueSoft, canvas.width, 1);
          _state.hotSpots.push({ x: ribX + _z(17), y: ribY - _z(1), r: _z(31), title: 'tRNA 与密码子配对', text: '氨酰-tRNA 的反密码子与 mRNA 密码子互补配对；核糖体催化肽键形成并沿 5′→3′ 移位。' });
        } else {
          var releasedY = ribY - _z(78 + 48 * t);
          ctx.save(); ctx.globalAlpha = t;
          _particle(ctx, ribX + _z(4), ribY - _z(4), _z(17), _theme.yellowSoft, 'RF');
          _arrow(ctx, ribX - _z(4), ribY - _z(56), ribX - _z(4), releasedY, _theme.primary);
          ctx.restore();
          _callout(ctx, ribX + _z(4), ribY - _z(4), geneX0 + _z(33), cy + _z(26), '释放因子识别终止密码子', _theme.yellowSoft, canvas.width, 1);
          _state.hotSpots.push({ x: ribX, y: ribY - _z(28), r: _z(48), title: '翻译终止', text: '终止密码子没有对应 tRNA；释放因子促使多肽链水解释放，核糖体大小亚基随后解离。' });
        }
      }
    }

    ctx.restore();
  }

  /* ========== 5. 光合作用 ========== */
  function _drawPhotosynthesis(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2 - _z(3);
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var rx = _z(312), ry = _z(192), memY = cy - _z(57);
    var left = cx - _z(238), right = cx + _z(226);
    ctx.save(); ctx.translate(_z(8), _z(9)); ctx.fillStyle = 'rgba(74,124,89,.14)'; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(220,239,227,.76)'; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(4);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(74,124,89,.45)'; ctx.lineWidth = _z(2);
    ctx.beginPath(); ctx.ellipse(cx, cy, rx - _z(12), ry - _z(12), 0, 0, Math.PI * 2); ctx.stroke();
    _lbl(ctx, cx - _z(225), cy + _z(147), '叶绿体基质', _theme.greenSoft);

    ctx.fillStyle = 'rgba(230,185,90,.24)'; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(2.5);
    ctx.beginPath(); ctx.roundRect(left, memY - _z(24), right - left, _z(48), _z(22)); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(196,149,106,.55)'; ctx.lineWidth = _z(2);
    ctx.beginPath(); ctx.moveTo(left + _z(13), memY - _z(11)); ctx.lineTo(right - _z(13), memY - _z(11)); ctx.moveTo(left + _z(13), memY + _z(11)); ctx.lineTo(right - _z(13), memY + _z(11)); ctx.stroke();
    _lbl(ctx, cx - _z(188), memY + _z(43), '类囊体腔（H⁺ 积累）', _theme.yellowSoft);

    var ps2x = cx - _z(173), b6x = cx - _z(55), ps1x = cx + _z(62), atpX = cx + _z(181);
    _particle(ctx, ps2x, memY, _z(30), _theme.yellow, 'PSII');
    _particle(ctx, b6x, memY, _z(24), _theme.rose, 'b6f');
    _particle(ctx, ps1x, memY, _z(30), _theme.cyan, 'PSI');

    ctx.save(); ctx.fillStyle = _theme.violetSoft; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(2);
    ctx.beginPath(); ctx.roundRect(atpX - _z(16), memY - _z(31), _z(32), _z(50), _z(10)); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(atpX, memY + _z(39), _z(27), _z(19), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(atpX, memY + _z(18)); ctx.lineTo(atpX, memY + _z(24)); ctx.stroke();
    ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(9)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ATP', atpX, memY + _z(42)); ctx.restore();

    var electronPath = [
      { x: ps2x, y: memY - _z(31) }, { x: ps2x + _z(43), y: memY - _z(45) },
      { x: b6x, y: memY - _z(30) }, { x: ps1x - _z(42), y: memY - _z(45) },
      { x: ps1x, y: memY - _z(31) }, { x: ps1x + _z(56), y: memY - _z(62) }
    ];
    ctx.strokeStyle = _theme.warm; ctx.lineWidth = _z(2.5); ctx.setLineDash([_z(6), _z(5)]); ctx.beginPath();
    electronPath.forEach(function(point, index) { if (index) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); }); ctx.stroke(); ctx.setLineDash([]);
    _lbl(ctx, ps2x + _z(57), memY - _z(55), 'PQ', _theme.yellowSoft); _lbl(ctx, ps1x - _z(57), memY - _z(55), 'PC', _theme.blueSoft);

    var lightAlpha = step <= 2 ? 1 : .35;
    [ps2x, ps1x].forEach(function(x, systemIndex) {
      ctx.save(); ctx.globalAlpha = lightAlpha; ctx.strokeStyle = _theme.yellow; ctx.lineWidth = _z(3); ctx.lineCap = 'round';
      for (var ray = 0; ray < 4; ray++) {
        var rayX = x - _z(23) + ray * _z(15);
        ctx.beginPath(); ctx.moveTo(rayX, memY - _z(105)); ctx.lineTo(rayX + _z(7), memY - _z(50)); ctx.stroke();
      }
      ctx.restore();
      if (step <= 2) _flowDot(ctx, [{ x: x - _z(15), y: memY - _z(100) }, { x: x, y: memY - _z(33) }], (_state.time * .55 + systemIndex * .35) % 1, _theme.fluorescent, _z(4));
    });

    if (step <= 2) {
      for (var ed = 0; ed < 3; ed++) _flowDot(ctx, electronPath, (_state.time * .2 + ed / 3) % 1, _theme.fluorescent, _z(4));
    }

    if (step === 0) {
      _callout(ctx, ps2x, memY, cx - _z(275), cy - _z(165), 'P680 受光激发，电子跃迁', _theme.yellowSoft, canvas.width, 1);
      _state.hotSpots.push({ x: ps2x, y: memY, r: _z(42), title: '光能吸收与电荷分离', text: '天线色素把光能传给反应中心；P680 和 P700 的电子被激发到较高能级并交给初级电子受体。' });
    }

    if (step >= 1) {
      var waterX = ps2x - _z(66), waterY = memY + _z(74);
      _particle(ctx, waterX, waterY, _z(20), _theme.blueSoft, 'H₂O');
      _arrow(ctx, waterX + _z(20), waterY - _z(6), ps2x - _z(21), memY + _z(18), _theme.spindle);
      var oxygenY = waterY + Math.sin(_state.time * 2) * _z(8);
      _particle(ctx, waterX - _z(43), oxygenY, _z(13), _theme.cyan, 'O₂');
      for (var hp = 0; hp < 6; hp++) {
        var hx = cx - _z(132) + hp * _z(44);
        _particle(ctx, hx, memY + _z(5 + Math.sin(_state.time * 2 + hp) * 5), _z(6), _theme.cyan, 'H⁺');
      }
      if (step === 1) {
        _callout(ctx, waterX, waterY, cx - _z(284), cy + _z(116), '水光解补充电子并释放 O₂', _theme.blueSoft, canvas.width, 1);
        _state.hotSpots.push({ x: waterX, y: waterY, r: _z(34), title: '水的光解', text: '放氧复合体氧化水，产生电子、H⁺ 和 O₂；电子补给 P680，H⁺ 有助于形成跨膜质子梯度。' });
      }
    }

    if (step >= 2) {
      for (var flow = 0; flow < 4; flow++) {
        _flowDot(ctx, [{ x: atpX + _z((flow - 1.5) * 5), y: memY + _z(5) }, { x: atpX, y: memY + _z(69) }], (_state.time * .42 + flow * .22) % 1, _theme.cyan, _z(5));
      }
      _arrow(ctx, atpX + _z(33), memY + _z(46), atpX + _z(88), memY + _z(70), _theme.primary);
      _lbl(ctx, atpX + _z(104), memY + _z(74), 'ATP', _theme.greenSoft);
      _particle(ctx, ps1x + _z(58), memY - _z(61), _z(13), _theme.yellowSoft, 'Fd');
      _arrow(ctx, ps1x + _z(72), memY - _z(61), ps1x + _z(118), memY - _z(61), _theme.primary);
      _lbl(ctx, ps1x + _z(145), memY - _z(61), 'NADPH', _theme.greenSoft);
      _callout(ctx, atpX, memY + _z(39), cx + _z(74), cy + _z(116), 'H⁺ 顺梯度回流驱动 ATP 合成', _theme.greenSoft, canvas.width, 1);
      if (step === 2) _state.hotSpots.push({ x: atpX, y: memY + _z(39), r: _z(43), title: '光合磷酸化', text: '类囊体腔内的 H⁺ 经 ATP 合酶回流至基质，驱动 ATP 生成；PSI 的电子最终用于还原 NADP⁺ 形成 NADPH。' });
    }

    var calvinX = cx + _z(42), calvinY = cy + _z(101);
    ctx.save(); ctx.globalAlpha = step >= 3 ? 1 : .32;
    ctx.strokeStyle = _theme.primary; ctx.lineWidth = _z(4); ctx.beginPath(); ctx.ellipse(calvinX, calvinY, _z(111), _z(66), 0, .2, Math.PI * 1.83); ctx.stroke();
    var cycleNodes = [
      { x: calvinX - _z(86), y: calvinY - _z(27), label: 'RuBP\n5C', color: _theme.yellowSoft },
      { x: calvinX + _z(42), y: calvinY - _z(55), label: '3-PGA\n3C', color: _theme.blueSoft },
      { x: calvinX + _z(76), y: calvinY + _z(35), label: 'G3P\n3C', color: _theme.greenSoft }
    ];
    cycleNodes.forEach(function(node) {
      ctx.fillStyle = node.color; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.7); ctx.beginPath(); ctx.ellipse(node.x, node.y, _z(31), _z(22), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(9)) + 'px "LXGW WenKai",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      node.label.split('\n').forEach(function(part, index) { ctx.fillText(part, node.x, node.y + _z((index - .5) * 12)); });
    });
    _lbl(ctx, calvinX - _z(20), calvinY + _z(72), '卡尔文循环 · 叶绿体基质', _theme.greenSoft);
    ctx.restore();

    if (step >= 3) {
      var co2X = calvinX - _z(172), co2Y = calvinY - _z(72);
      for (var c = 0; c < 3; c++) {
        var co2Progress = step === 3 ? _clamp(t * 1.5 - c * .18, 0, 1) : 1;
        _particle(ctx, _lerp(co2X + c * _z(24), calvinX - _z(98), co2Progress), _lerp(co2Y, calvinY - _z(36), co2Progress), _z(11), _theme.rose, 'CO₂');
      }
      _lbl(ctx, calvinX - _z(111), calvinY - _z(2), 'Rubisco', _theme.yellowSoft);
      if (step === 3) {
        _callout(ctx, calvinX - _z(86), calvinY - _z(27), cx - _z(279), cy + _z(115), 'Rubisco 催化 CO₂ 与 RuBP 结合', _theme.yellowSoft, canvas.width, 1);
        _state.hotSpots.push({ x: calvinX - _z(86), y: calvinY - _z(27), r: _z(39), title: 'CO₂ 固定', text: 'Rubisco 催化 CO₂ 与 RuBP 结合，不稳定的六碳中间体随即形成两分子 3-PGA。' });
      }
    }

    if (step === 4) {
      for (var energy = 0; energy < 2; energy++) {
        var energyLabel = energy ? 'NADPH' : 'ATP';
        var energyX = calvinX - _z(12) + energy * _z(70);
        _lbl(ctx, energyX, calvinY - _z(103), energyLabel, _theme.greenSoft);
        _arrow(ctx, energyX, calvinY - _z(84), energyX, calvinY - _z(55), _theme.primary);
      }
      _arrow(ctx, calvinX + _z(98), calvinY + _z(36), calvinX + _z(172), calvinY + _z(60), _theme.primary);
      _lbl(ctx, calvinX + _z(205), calvinY + _z(66), 'G3P 输出', _theme.greenSoft);
      _flowDot(ctx, [{ x: calvinX - _z(86), y: calvinY - _z(27) }, { x: calvinX + _z(42), y: calvinY - _z(55) }, { x: calvinX + _z(76), y: calvinY + _z(35) }, { x: calvinX - _z(86), y: calvinY - _z(27) }], (_state.time * .18) % 1, _theme.fluorescent, _z(5));
      _callout(ctx, calvinX + _z(76), calvinY + _z(35), cx + _z(113), cy - _z(175), '多数 G3P 再生 RuBP，少量输出', _theme.greenSoft, canvas.width, 1);
      _state.hotSpots.push({ x: calvinX + _z(76), y: calvinY + _z(35), r: _z(42), title: '还原与 RuBP 再生', text: 'ATP 和 NADPH 驱动 3-PGA 还原为 G3P；多数 G3P 用于再生 RuBP，少量净输出用于合成糖类等有机物。' });
    }

    ctx.restore();
  }

  /* ========== 6. 细胞呼吸 ========== */
  function _drawRespiration(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2 - _z(2);
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var mx = cx + _z(66), my = cy + _z(14), mrx = _z(246), mry = _z(158);
    ctx.save(); ctx.translate(_z(8), _z(9)); ctx.fillStyle = 'rgba(44,62,48,.12)'; ctx.beginPath(); ctx.ellipse(mx, my, mrx, mry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(246,237,202,.63)'; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(4);
    ctx.beginPath(); ctx.ellipse(mx, my, mrx, mry, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = 'rgba(196,149,106,.6)'; ctx.lineWidth = _z(2);
    ctx.beginPath(); ctx.ellipse(mx, my, mrx - _z(12), mry - _z(12), 0, 0, Math.PI * 2); ctx.stroke();
    _lbl(ctx, mx + _z(151), my + _z(119), '线粒体基质', _theme.yellowSoft);

    var membraneY = my - _z(84);
    ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(5); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(mx - _z(188), membraneY); ctx.lineTo(mx + _z(184), membraneY);
    ctx.bezierCurveTo(mx + _z(206), membraneY, mx + _z(190), my - _z(8), mx + _z(145), my - _z(9));
    ctx.bezierCurveTo(mx + _z(92), my - _z(10), mx + _z(100), my + _z(83), mx + _z(44), my + _z(82));
    ctx.bezierCurveTo(mx - _z(16), my + _z(82), mx + _z(4), my - _z(15), mx - _z(55), my - _z(17));
    ctx.bezierCurveTo(mx - _z(115), my - _z(19), mx - _z(102), my + _z(79), mx - _z(166), my + _z(70)); ctx.stroke();
    ctx.strokeStyle = _theme.orange; ctx.lineWidth = _z(2); ctx.beginPath(); ctx.moveTo(mx - _z(188), membraneY + _z(9)); ctx.lineTo(mx + _z(174), membraneY + _z(9)); ctx.stroke();
    _lbl(ctx, mx - _z(143), membraneY - _z(27), '膜间隙', _theme.blueSoft);

    var glyX = cx - _z(264), glyY = cy - _z(26);
    _softPanel(ctx, glyX - _z(67), glyY - _z(104), _z(153), _z(208), 'rgba(255,255,255,.68)', 'rgba(74,124,89,.22)', _z(24));
    _lbl(ctx, glyX + _z(9), glyY - _z(83), '糖酵解 · 细胞质基质', _theme.greenSoft);
    var glucoseY = glyY - _z(38);
    ctx.save(); ctx.fillStyle = _theme.yellowSoft; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(2); ctx.beginPath();
    for (var h = 0; h < 6; h++) {
      var angle = Math.PI / 3 * h - Math.PI / 6;
      var hx = glyX + Math.cos(angle) * _z(22), hy = glucoseY + Math.sin(angle) * _z(22);
      if (h) ctx.lineTo(hx, hy); else ctx.moveTo(hx, hy);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(9)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('葡萄糖', glyX, glucoseY); ctx.restore();
    _arrow(ctx, glyX, glucoseY + _z(29), glyX, glyY + _z(13), _theme.warm);
    var split = step === 0 ? t : 1;
    for (var pyruvate = 0; pyruvate < 2; pyruvate++) {
      var targetX = glyX + (pyruvate ? 1 : -1) * _z(27);
      var targetY = glyY + _z(49);
      _particle(ctx, _lerp(glyX, targetX, split), _lerp(glyY + _z(13), targetY, split), _z(13), _theme.orange, '3C');
    }
    _lbl(ctx, glyX, glyY + _z(84), '2 丙酮酸 ＋ 少量 ATP、NADH', _theme.yellowSoft);

    if (step === 0) {
      _callout(ctx, glyX, glyY + _z(49), cx - _z(323), cy + _z(111), '6C 葡萄糖分解为两个 3C 丙酮酸', _theme.yellowSoft, canvas.width, 1);
      _state.hotSpots.push({ x: glyX, y: glyY + _z(49), r: _z(38), title: '糖酵解', text: '糖酵解发生在细胞质基质，不直接需要 O₂；一分子葡萄糖形成两分子丙酮酸，并产生少量 ATP 和 NADH。' });
    }

    var entryStart = { x: glyX + _z(55), y: glyY + _z(49) };
    var entryEnd = { x: mx - _z(143), y: my + _z(35) };
    if (step >= 1) {
      var entry = step === 1 ? t : 1;
      _arrow(ctx, entryStart.x, entryStart.y, entryEnd.x, entryEnd.y, _theme.orange);
      _particle(ctx, _lerp(entryStart.x, entryEnd.x, entry), _lerp(entryStart.y, entryEnd.y, entry), _z(14), _theme.orange, '3C');
      if (entry > .48) {
        _particle(ctx, entryEnd.x + _z(34), entryEnd.y, _z(18), _theme.yellowSoft, '2C');
        _lbl(ctx, entryEnd.x + _z(34), entryEnd.y + _z(31), '乙酰-CoA', _theme.yellowSoft);
        _particle(ctx, entryEnd.x + _z(4), entryEnd.y - _z(45), _z(11), _theme.rose, 'CO₂');
        _lbl(ctx, entryEnd.x + _z(88), entryEnd.y - _z(42), 'NADH', _theme.greenSoft);
      }
      if (step === 1) {
        _callout(ctx, entryEnd.x + _z(34), entryEnd.y, cx - _z(307), cy + _z(116), '丙酮酸氧化脱羧形成乙酰-CoA', _theme.yellowSoft, canvas.width, 1);
        _state.hotSpots.push({ x: entryEnd.x + _z(34), y: entryEnd.y, r: _z(36), title: '丙酮酸氧化', text: '丙酮酸进入线粒体基质后氧化脱羧，形成乙酰-CoA，同时产生 CO₂ 和 NADH。' });
      }
    }

    var tcaX = mx + _z(30), tcaY = my + _z(52);
    ctx.save(); ctx.globalAlpha = step >= 2 ? 1 : .26;
    ctx.strokeStyle = _theme.violet; ctx.lineWidth = _z(4); ctx.beginPath(); ctx.ellipse(tcaX, tcaY, _z(91), _z(60), 0, .2, Math.PI * 1.86); ctx.stroke();
    var tcaNodes = [
      { x: tcaX - _z(72), y: tcaY - _z(31), label: '柠檬酸\n6C' },
      { x: tcaX + _z(61), y: tcaY - _z(37), label: '氧化脱羧' },
      { x: tcaX + _z(42), y: tcaY + _z(44), label: '草酰乙酸\n4C' }
    ];
    tcaNodes.forEach(function(node, index) {
      ctx.fillStyle = index === 1 ? _theme.blueSoft : _theme.violetSoft; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.5); ctx.beginPath(); ctx.ellipse(node.x, node.y, _z(31), _z(20), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(8.7)) + 'px "LXGW WenKai",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; node.label.split('\n').forEach(function(part, index2) { ctx.fillText(part, node.x, node.y + _z((index2 - .5) * 11)); });
    });
    _lbl(ctx, tcaX - _z(7), tcaY + _z(76), '三羧酸循环（TCA）', _theme.violetSoft);
    ctx.restore();

    if (step >= 2) {
      _flowDot(ctx, [{ x: tcaX - _z(72), y: tcaY - _z(31) }, { x: tcaX + _z(61), y: tcaY - _z(37) }, { x: tcaX + _z(42), y: tcaY + _z(44) }, { x: tcaX - _z(72), y: tcaY - _z(31) }], (_state.time * .16) % 1, _theme.fluorescent, _z(5));
      for (var product = 0; product < 3; product++) {
        _lbl(ctx, tcaX + _z(112), tcaY - _z(60) + product * _z(32), ['NADH', 'FADH₂', 'CO₂'][product], product === 2 ? _theme.rose : _theme.greenSoft);
      }
      if (step === 2) {
        _callout(ctx, tcaX, tcaY, cx + _z(102), cy - _z(151), '乙酰基被逐步氧化，载氢辅酶积累', _theme.violetSoft, canvas.width, 1);
        _state.hotSpots.push({ x: tcaX, y: tcaY, r: _z(55), title: '三羧酸循环', text: '乙酰-CoA 的乙酰基被彻底氧化为 CO₂；循环再生草酰乙酸，并把能量转移到 NADH、FADH₂ 和少量 ATP/GTP 中。' });
      }
    }

    var complexX = [mx - _z(116), mx - _z(54), mx + _z(18), mx + _z(88)];
    var electronPath = [];
    ctx.save(); ctx.globalAlpha = step >= 3 ? 1 : .24;
    complexX.forEach(function(x, index) {
      ctx.fillStyle = index % 2 ? _theme.blueSoft : _theme.greenSoft; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.7);
      ctx.beginPath(); ctx.roundRect(x - _z(19), membraneY - _z(26), _z(38), _z(52), _z(10)); ctx.fill(); ctx.stroke();
      ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(9, _z(10)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(['I', 'II', 'III', 'IV'][index], x, membraneY);
      electronPath.push({ x: x, y: membraneY - _z(38) });
    });
    ctx.strokeStyle = _theme.warm; ctx.lineWidth = _z(2.5); ctx.setLineDash([_z(6), _z(5)]); ctx.beginPath(); electronPath.forEach(function(point, index) { if (index) ctx.lineTo(point.x, point.y); else ctx.moveTo(point.x, point.y); }); ctx.stroke(); ctx.setLineDash([]);
    _lbl(ctx, (complexX[0] + complexX[2]) / 2, membraneY - _z(51), 'Q', _theme.yellowSoft); _lbl(ctx, (complexX[2] + complexX[3]) / 2, membraneY - _z(51), 'Cyt c', _theme.yellowSoft);
    ctx.restore();

    if (step >= 3) {
      for (var electron = 0; electron < 3; electron++) _flowDot(ctx, electronPath, (_state.time * .2 + electron / 3) % 1, _theme.fluorescent, _z(4));
      _lbl(ctx, complexX[0] - _z(52), membraneY - _z(39), 'NADH', _theme.greenSoft); _arrow(ctx, complexX[0] - _z(34), membraneY - _z(39), complexX[0] - _z(7), membraneY - _z(39), _theme.primary);
      _particle(ctx, complexX[3] + _z(55), membraneY - _z(36), _z(15), _theme.cyan, 'O₂');
      _arrow(ctx, complexX[3] + _z(18), membraneY - _z(36), complexX[3] + _z(40), membraneY - _z(36), _theme.spindle);
      _lbl(ctx, complexX[3] + _z(82), membraneY - _z(5), 'H₂O', _theme.blueSoft);
      for (var proton = 0; proton < 8; proton++) {
        var protonX = mx - _z(144) + proton * _z(39);
        _particle(ctx, protonX, membraneY - _z(79 + Math.sin(_state.time * 2 + proton) * 5), _z(6), _theme.cyan, 'H⁺');
      }
      if (step === 3) {
        _callout(ctx, complexX[2], membraneY, cx + _z(87), cy - _z(163), '电子传递释放能量并泵出 H⁺', _theme.blueSoft, canvas.width, 1);
        _state.hotSpots.push({ x: complexX[2], y: membraneY, r: _z(49), title: '电子传递链', text: 'NADH 和 FADH₂ 提供高能电子；电子依次传递，释放的能量驱动 H⁺ 泵入膜间隙，O₂ 是最终电子受体并形成水。' });
      }
    }

    var synthaseX = mx + _z(157);
    ctx.save(); ctx.globalAlpha = step === 4 ? 1 : .28;
    ctx.fillStyle = _theme.rose; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.7);
    ctx.beginPath(); ctx.roundRect(synthaseX - _z(14), membraneY - _z(27), _z(28), _z(47), _z(9)); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(synthaseX, membraneY + _z(42), _z(27), _z(19), 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(synthaseX, membraneY + _z(19)); ctx.lineTo(synthaseX, membraneY + _z(26)); ctx.stroke();
    ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(9)) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('ATP', synthaseX, membraneY + _z(46)); ctx.restore();

    if (step === 4) {
      for (var returnH = 0; returnH < 4; returnH++) _flowDot(ctx, [{ x: synthaseX + _z((returnH - 1.5) * 5), y: membraneY - _z(81) }, { x: synthaseX, y: membraneY + _z(68) }], (_state.time * .38 + returnH * .23) % 1, _theme.cyan, _z(5));
      for (var atp = 0; atp < 5; atp++) {
        var angle = atp * .75 - .8;
        var atpX = synthaseX + _z(65 + atp * 10);
        var atpY = membraneY + _z(38 + Math.sin(angle + _state.time) * 34);
        _particle(ctx, atpX, atpY, _z(12), _theme.greenSoft, 'ATP');
      }
      _callout(ctx, synthaseX, membraneY + _z(42), cx + _z(81), cy + _z(118), 'H⁺ 回流驱动 ATP 大量合成', _theme.greenSoft, canvas.width, 1);
      _state.hotSpots.push({ x: synthaseX, y: membraneY + _z(42), r: _z(45), title: '氧化磷酸化', text: 'H⁺ 顺电化学梯度通过 ATP 合酶回流到基质，驱动 ADP 与 Pi 合成 ATP；有氧呼吸的大部分 ATP 在此阶段形成。' });
    }

    ctx.restore();
  }

  /* ========== 7. 膜运输与动作电位 ========== */
  function _drawMembrane(ctx, canvas) {
    var cx = canvas.width / 2, cy = canvas.height / 2 - _z(2);
    var step = _state.step, t = _ease(_state.progress);
    ctx.save(); ctx.translate(_state.panX, _state.panY);
    _state.hotSpots = [];

    var left = cx - _z(296), right = cx + _z(296), memY = cy - _z(82);
    _softPanel(ctx, left - _z(15), memY - _z(118), right - left + _z(30), _z(236), 'rgba(255,255,255,.46)', 'rgba(74,124,89,.16)', _z(28));
    _lbl(ctx, left + _z(4), memY - _z(92), '细胞外液', _theme.yellowSoft);
    _lbl(ctx, left + _z(4), memY + _z(93), '细胞质', _theme.blueSoft);

    function drawBilayer() {
      for (var x = left; x <= right; x += _z(20)) {
        ctx.strokeStyle = 'rgba(196,149,106,.56)'; ctx.lineWidth = _z(1.5); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(x - _z(3), memY - _z(16)); ctx.lineTo(x - _z(3), memY - _z(2)); ctx.moveTo(x + _z(3), memY - _z(16)); ctx.lineTo(x + _z(3), memY - _z(2)); ctx.stroke();
        ctx.strokeStyle = 'rgba(112,144,194,.5)'; ctx.beginPath(); ctx.moveTo(x - _z(3), memY + _z(16)); ctx.lineTo(x - _z(3), memY + _z(2)); ctx.moveTo(x + _z(3), memY + _z(16)); ctx.lineTo(x + _z(3), memY + _z(2)); ctx.stroke();
        _particle(ctx, x, memY - _z(23), _z(7), _theme.orange, '');
        _particle(ctx, x, memY + _z(23), _z(7), _theme.cyan, '');
      }
    }

    function drawProtein(x, color, label, open, blocked) {
      ctx.save(); ctx.fillStyle = color; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(2);
      ctx.beginPath(); ctx.roundRect(x - _z(23), memY - _z(39), _z(46), _z(78), _z(16)); ctx.fill(); ctx.stroke();
      if (open) {
        ctx.fillStyle = 'rgba(255,255,255,.88)'; ctx.beginPath(); ctx.roundRect(x - _z(6), memY - _z(35), _z(12), _z(70), _z(6)); ctx.fill();
      }
      if (blocked) {
        ctx.strokeStyle = _theme.rose; ctx.lineWidth = _z(5); ctx.beginPath(); ctx.moveTo(x - _z(14), memY - _z(13)); ctx.lineTo(x + _z(14), memY + _z(13)); ctx.stroke();
      }
      ctx.fillStyle = _theme.ink; ctx.font = '700 ' + Math.max(8, _z(9)) + 'px "LXGW WenKai",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      label.split('\n').forEach(function(part, index) { ctx.fillText(part, x, memY + _z((index - .5) * 12)); }); ctx.restore();
    }

    drawBilayer();

    if (step === 0) {
      for (var o = 0; o < 9; o++) _particle(ctx, left + _z(87 + (o % 5) * 43), memY - _z(66 + Math.floor(o / 5) * 27), _z(10), _theme.greenSoft, 'O₂');
      for (var insideO = 0; insideO < 3; insideO++) _particle(ctx, left + _z(112 + insideO * 82), memY + _z(76), _z(10), _theme.greenSoft, 'O₂');
      var diffusionX = cx + _z(116);
      var diffusionY = _lerp(memY - _z(82), memY + _z(82), t);
      _particle(ctx, diffusionX, diffusionY, _z(12), _theme.greenSoft, 'O₂');
      _arrow(ctx, diffusionX + _z(34), memY - _z(72), diffusionX + _z(34), memY + _z(68), _theme.primary);
      _callout(ctx, diffusionX, diffusionY, cx + _z(114), cy + _z(39), '顺浓度梯度直接穿过脂双层', _theme.greenSoft, canvas.width, 1);
      _state.hotSpots.push({ x: diffusionX, y: diffusionY, r: _z(31), title: '自由扩散', text: 'O₂、CO₂ 等小而脂溶性的分子可顺浓度梯度直接穿过磷脂双分子层，不需要膜蛋白，也不消耗 ATP。' });
    }

    if (step === 1) {
      var carrierX = cx - _z(104), channelX = cx + _z(104);
      drawProtein(carrierX, _theme.greenSoft, '载体\nGLUT', false, false);
      drawProtein(channelX, _theme.blueSoft, '离子\n通道', true, false);
      var glucoseY = _lerp(memY - _z(79), memY + _z(79), t);
      ctx.save(); ctx.translate(carrierX, glucoseY); ctx.fillStyle = _theme.yellowSoft; ctx.strokeStyle = _theme.ink; ctx.lineWidth = _z(1.5); ctx.beginPath();
      for (var g = 0; g < 6; g++) { var ga = g * Math.PI / 3 - Math.PI / 6; var gx = Math.cos(ga) * _z(12), gy = Math.sin(ga) * _z(12); if (g) ctx.lineTo(gx, gy); else ctx.moveTo(gx, gy); }
      ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      for (var ion = 0; ion < 3; ion++) {
        var ionProgress = (_state.time * .35 + ion * .28) % 1;
        _particle(ctx, channelX, _lerp(memY - _z(79), memY + _z(79), ionProgress), _z(8), _theme.cyan, 'K⁺');
      }
      _callout(ctx, carrierX, memY, cx - _z(282), cy + _z(41), '特异性膜蛋白帮助极性物质通过', _theme.blueSoft, canvas.width, 1);
      _state.hotSpots.push({ x: carrierX, y: memY, r: _z(39), title: '协助扩散', text: '载体蛋白可通过构象变化转运葡萄糖；通道蛋白形成亲水通道。两者都顺浓度或电化学梯度运输，不消耗 ATP。' });
    }

    if (step === 2) {
      var pumpX = cx;
      drawProtein(pumpX, _theme.yellowSoft, 'Na⁺/K⁺\n泵', true, false);
      for (var na = 0; na < 3; na++) {
        var naProgress = (_state.time * .31 + na * .27) % 1;
        _particle(ctx, pumpX + _z(14 + na * 14), _lerp(memY + _z(82), memY - _z(82), naProgress), _z(9), _theme.rose, 'Na⁺');
      }
      for (var k = 0; k < 2; k++) {
        var kProgress = (_state.time * .31 + k * .36) % 1;
        _particle(ctx, pumpX - _z(22 + k * 15), _lerp(memY - _z(82), memY + _z(82), kProgress), _z(9), _theme.cyan, 'K⁺');
      }
      _particle(ctx, pumpX + _z(83), memY + _z(64), _z(16), _theme.greenSoft, 'ATP');
      _arrow(ctx, pumpX + _z(66), memY + _z(54), pumpX + _z(28), memY + _z(25), _theme.primary);
      _lbl(ctx, pumpX + _z(102), memY - _z(72), '3 Na⁺ 泵出', _theme.violetSoft);
      _lbl(ctx, pumpX - _z(104), memY + _z(72), '2 K⁺ 泵入', _theme.blueSoft);
      _callout(ctx, pumpX, memY, cx - _z(277), cy + _z(43), '逆电化学梯度运输，直接消耗 ATP', _theme.yellowSoft, canvas.width, 1);
      _state.hotSpots.push({ x: pumpX, y: memY, r: _z(45), title: '钠钾泵', text: 'Na⁺-K⁺-ATPase 每水解 1 个 ATP，泵出 3 个 Na⁺、泵入 2 个 K⁺，维持胞外高 Na⁺、胞内高 K⁺。' });
    }

    if (step >= 3) {
      var naChannelX = cx - _z(111), kChannelX = cx + _z(111);
      var naOpen = step === 4;
      var kOpen = step === 5;
      drawProtein(naChannelX, _theme.violetSoft, 'Na⁺\n通道', naOpen, step === 5);
      drawProtein(kChannelX, _theme.blueSoft, 'K⁺\n通道', kOpen || step === 3, false);

      for (var outsideNa = 0; outsideNa < 8; outsideNa++) _particle(ctx, left + _z(64 + outsideNa * 64), memY - _z(78 + (outsideNa % 2) * 25), _z(8), _theme.rose, 'Na⁺');
      for (var insideK = 0; insideK < 8; insideK++) _particle(ctx, left + _z(82 + insideK * 61), memY + _z(76 + (insideK % 2) * 25), _z(8), _theme.cyan, 'K⁺');

      if (step === 3) {
        for (var leak = 0; leak < 3; leak++) {
          var leakProgress = (_state.time * .2 + leak * .3) % 1;
          _particle(ctx, kChannelX, _lerp(memY + _z(66), memY - _z(60), leakProgress), _z(7), _theme.cyan, 'K⁺');
        }
      }
      if (step === 4) {
        for (var sodium = 0; sodium < 5; sodium++) {
          var sodiumProgress = (_state.time * .45 + sodium * .17) % 1;
          _particle(ctx, naChannelX, _lerp(memY - _z(70), memY + _z(70), sodiumProgress), _z(8), _theme.rose, 'Na⁺');
        }
      }
      if (step === 5) {
        for (var potassium = 0; potassium < 5; potassium++) {
          var potassiumProgress = (_state.time * .38 + potassium * .18) % 1;
          _particle(ctx, kChannelX, _lerp(memY + _z(70), memY - _z(70), potassiumProgress), _z(8), _theme.cyan, 'K⁺');
        }
      }

      var chartX0 = cx - _z(251), chartX1 = cx + _z(251), chartTop = cy + _z(34), chartBottom = cy + _z(191);
      function voltageY(voltage) { return _lerp(chartBottom, chartTop, (voltage + 90) / 130); }
      var keys = [
        { u: 0, v: -70 }, { u: .18, v: -70 }, { u: .26, v: -55 },
        { u: .38, v: 35 }, { u: .57, v: -70 }, { u: .72, v: -85 }, { u: 1, v: -70 }
      ];
      function waveVoltage(u) {
        for (var keyIndex = 1; keyIndex < keys.length; keyIndex++) {
          if (u <= keys[keyIndex].u) {
            var previous = keys[keyIndex - 1], next = keys[keyIndex];
            var local = (u - previous.u) / (next.u - previous.u);
            var smooth = local * local * (3 - 2 * local);
            return _lerp(previous.v, next.v, smooth);
          }
        }
        return keys[keys.length - 1].v;
      }
      function drawWave(limit, color, width, alpha, dash) {
        ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; if (dash) ctx.setLineDash(dash);
        ctx.beginPath();
        var samples = 100;
        for (var sample = 0; sample <= samples; sample++) {
          var u = limit * sample / samples;
          var x = _lerp(chartX0, chartX1, u), y = voltageY(waveVoltage(u));
          if (sample) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        ctx.stroke(); ctx.restore();
      }

      ctx.strokeStyle = 'rgba(44,62,48,.42)'; ctx.lineWidth = _z(1.6); ctx.beginPath(); ctx.moveTo(chartX0, chartTop); ctx.lineTo(chartX0, chartBottom); ctx.lineTo(chartX1, chartBottom); ctx.stroke();
      [-70, -55, 0, 35].forEach(function(voltage) {
        var y = voltageY(voltage); ctx.strokeStyle = voltage === -55 ? 'rgba(228,110,155,.3)' : 'rgba(44,62,48,.13)'; ctx.lineWidth = _z(1); ctx.setLineDash([_z(4), _z(4)]); ctx.beginPath(); ctx.moveTo(chartX0, y); ctx.lineTo(chartX1, y); ctx.stroke(); ctx.setLineDash([]);
        _lbl(ctx, chartX0 - _z(29), y, (voltage > 0 ? '+' : '') + voltage + ' mV', voltage === -55 ? _theme.violetSoft : _theme.blueSoft);
      });
      drawWave(1, _theme.faint, _z(2), .33, [_z(5), _z(5)]);
      var currentU = step === 3 ? _lerp(.02, .26, t) : (step === 4 ? _lerp(.26, .38, t) : _lerp(.38, 1, t));
      drawWave(currentU, _theme.rose, _z(4), 1);
      var markerX = _lerp(chartX0, chartX1, currentU), markerY = voltageY(waveVoltage(currentU));
      _particle(ctx, markerX, markerY, _z(7), _theme.fluorescent, '');
      _lbl(ctx, chartX1 - _z(35), chartBottom + _z(24), '时间 →', _theme.greenSoft);

      if (step === 3) {
        _callout(ctx, kChannelX, memY, cx + _z(135), cy - _z(183), 'K⁺ 漏通道参与维持约 −70 mV', _theme.blueSoft, canvas.width, 1);
        _state.hotSpots.push({ x: markerX, y: markerY, r: _z(35), title: '静息电位', text: '静息时膜对 K⁺ 的通透性较高；K⁺ 漏出与胞内负电荷共同建立约 −70 mV 的静息电位。' });
      } else if (step === 4) {
        _callout(ctx, naChannelX, memY, cx - _z(289), cy - _z(185), 'Na⁺ 通道开放，膜电位快速上升', _theme.violetSoft, canvas.width, 1);
        _state.hotSpots.push({ x: naChannelX, y: memY, r: _z(45), title: '去极化与反极化', text: '达到阈电位后，电压门控 Na⁺ 通道大量开放，Na⁺ 快速内流；膜电位越过 0 mV 并达到正值。' });
      } else {
        _callout(ctx, kChannelX, memY, cx + _z(126), cy - _z(185), 'Na⁺ 通道失活，K⁺ 外流促使复极化', _theme.blueSoft, canvas.width, 1);
        _state.hotSpots.push({ x: kChannelX, y: memY, r: _z(45), title: '复极化与后超极化', text: 'Na⁺ 通道失活，电压门控 K⁺ 通道开放使 K⁺ 外流；通道关闭较慢会造成短暂后超极化，随后恢复静息。' });
      }
    }

    ctx.restore();
  }

  /* ---------- 渲染循环 ---------- */
  function _drawProcessFrame(ctx, view) {
    switch (_state.process) {
      case 'mitosis': _drawMitosis(ctx, view); break;
      case 'meiosis': _drawMeiosis(ctx, view); break;
      case 'dna': _drawDNA(ctx, view); break;
      case 'transcription': _drawTranscription(ctx, view); break;
      case 'photosynthesis': _drawPhotosynthesis(ctx, view); break;
      case 'respiration': _drawRespiration(ctx, view); break;
      case 'membrane': _drawMembrane(ctx, view); break;
    }
  }

  function _drawFrame(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d');
    var w = Math.max(1, Math.round(canvas.clientWidth));
    var h = Math.max(1, Math.round(canvas.clientHeight));
    var ratio = Math.min(window.devicePixelRatio || 1, 2);
    var pixelWidth = Math.max(1, Math.round(w * ratio));
    var pixelHeight = Math.max(1, Math.round(h * ratio));
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) { canvas.width = pixelWidth; canvas.height = pixelHeight; }
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    _state.fitScale = _clamp(Math.min(w / 760, h / 560), 0.52, 1);
    ctx.clearRect(0, 0, w, h);
    var view = { width: w, height: h };
    var total = _processes[_state.process].steps.length;
    var transition = _state.step < total - 1 ? _clamp((_state.progress - .86) / .14, 0, 1) : 0;
    if (transition > 0) {
      var currentStep = _state.step;
      var currentProgress = _state.progress;
      ctx.save(); ctx.globalAlpha = 1 - _ease(transition); _drawProcessFrame(ctx, view); ctx.restore();
      var currentHotSpots = _state.hotSpots.slice();
      _state.step = currentStep + 1;
      _state.progress = 0;
      ctx.save(); ctx.globalAlpha = _ease(transition); _drawProcessFrame(ctx, view); ctx.restore();
      _state.step = currentStep;
      _state.progress = currentProgress;
      _state.hotSpots = currentHotSpots;
    } else {
      _drawProcessFrame(ctx, view);
    }
    _drawTeachingFocus(ctx, view);
    _drawStageCaption(ctx, view);
  }

  function _update(dt) {
    if (!_state.playing) return;
    _state.progress += dt / (4300 / _state.speed);
    if (_state.progress >= 1) {
      var total = _processes[_state.process].steps.length;
      if (_state.step >= total - 1) {
        _state.progress = 1;
        _state.playing = false;
        _state.completed = true;
        _updatePlayingState();
      } else {
        _state.progress = 0;
        _state.step += 1;
        _state.lastPanelKey = '';
        _renderPanel(true);
      }
    }
  }

  function _loop(timestamp) {
    if (!_state.lastTime) _state.lastTime = timestamp;
    _state.time += (timestamp - _state.lastTime) / 1000;
    _update(timestamp - _state.lastTime);
    _state.lastTime = timestamp;
    _drawFrame(document.getElementById('bio-animation-canvas'));
    _updateTimeline();
    _state.animId = requestAnimationFrame(_loop);
  }

  /* ---------- UI ---------- */
  var _legendMap = {
    mitosis: [[_theme.chromosomeA, '染色体'], [_theme.spindle, '纺锤丝'], [_theme.yellow, '着丝粒']],
    meiosis: [[_theme.yellow, '父方同源染色体'], [_theme.chromosomeB, '母方同源染色体'], [_theme.chromosomeA, '互换片段']],
    dna: [[_theme.yellow, '亲代链'], [_theme.chromosomeB, '互补亲代链'], [_theme.primary, '新合成链'], [_theme.chromosomeA, '酶']],
    transcription: [[_theme.yellow, 'DNA'], [_theme.chromosomeA, 'mRNA'], [_theme.cyan, 'tRNA'], [_theme.primary, '多肽链']],
    photosynthesis: [[_theme.yellow, '光能/电子'], [_theme.cyan, 'H⁺'], [_theme.primary, 'ATP/NADPH'], [_theme.chromosomeA, 'CO₂']],
    respiration: [[_theme.yellow, '碳骨架'], [_theme.chromosomeA, 'NADH/FADH₂'], [_theme.cyan, 'H⁺'], [_theme.primary, 'ATP']],
    membrane: [[_theme.chromosomeA, 'Na⁺'], [_theme.cyan, 'K⁺'], [_theme.spindle, '膜蛋白'], [_theme.yellow, 'ATP']]
  };

  function _renderNavigation() {
    var process = _processes[_state.process];
    var teaching = _teaching[_state.process];
    var groups = document.getElementById('ba-phase-groups');
    var strip = document.getElementById('ba-phase-strip');
    if (!groups || !strip) return;

    groups.style.gridTemplateColumns = 'repeat(' + process.steps.length + ',minmax(0,1fr))';
    groups.innerHTML = teaching.groups.map(function(group) {
      return '<span class="ba-phase-group" style="grid-column:span ' + group.span + '">' + group.label + '</span>';
    }).join('');

    strip.style.gridTemplateColumns = 'repeat(' + process.steps.length + ',minmax(0,1fr))';
    strip.classList.toggle('is-dense', process.steps.length > 6);
    strip.innerHTML = process.steps.map(function(step, index) {
      var number = String(index + 1).padStart(2, '0');
      return '<button class="ba-phase" type="button" data-step="' + index + '" aria-label="' + step.name + '" aria-pressed="false"><span class="ba-phase-number">' + number + '</span><span class="ba-phase-name">' + _shortStepName(step.name) + '</span></button>';
    }).join('');

    Array.prototype.forEach.call(strip.querySelectorAll('.ba-phase'), function(button) {
      button.addEventListener('click', function() { _pauseAt(Number(button.getAttribute('data-step')), 0.72); });
    });
  }

  function _renderLegend() {
    var legend = document.getElementById('ba-legend');
    var model = document.getElementById('ba-model-note');
    if (model) model.textContent = '教学模型：' + _processes[_state.process].name + ' · 可拖动时间轴逐帧观察';
    if (!legend) return;
    legend.innerHTML = (_legendMap[_state.process] || []).map(function(item) {
      return '<span class="ba-legend-item"><i class="ba-legend-dot" style="background:' + item[0] + '"></i>' + item[1] + '</span>';
    }).join('');
  }

  function _renderPanel(force) {
    var key = _state.process + ':' + _state.step;
    if (!force && key === _state.lastPanelKey) return;
    _state.lastPanelKey = key;

    var process = _processes[_state.process];
    var step = process.steps[_state.step];
    var teaching = _teaching[_state.process];
    var detail = teaching.steps[_state.step];
    var total = process.steps.length;
    var title = document.getElementById('ba-note-title');
    if (!title) return;

    document.getElementById('ba-process-title').textContent = process.name;
    document.getElementById('ba-process-desc').textContent = process.desc;
    title.textContent = step.name;
    document.getElementById('ba-note-index').textContent = String(_state.step + 1).padStart(2, '0');
    document.getElementById('ba-note-total').textContent = ' / ' + String(total).padStart(2, '0');
    document.getElementById('ba-action').textContent = detail.action;
    document.getElementById('ba-metrics').innerHTML = detail.metrics.map(function(metric) {
      return '<div class="ba-metric"><span>' + metric[0] + '</span><strong>' + metric[1] + '</strong></div>';
    }).join('');
    document.getElementById('ba-step-desc').innerHTML = _highlightText(step.desc);
    document.getElementById('ba-process-note').innerHTML = '<strong>本过程关键关系</strong>' + _highlightText(teaching.note);
    document.getElementById('ba-observe').innerHTML = detail.observations.map(function(item) {
      return '<li>' + _highlightText(item) + '</li>';
    }).join('');
    document.getElementById('ba-exam').innerHTML = '<strong>重点提醒</strong>' + _highlightText(detail.exam);

    var canvas = document.getElementById('bio-animation-canvas');
    if (canvas) canvas.setAttribute('aria-label', process.name + '，' + step.name + '：' + detail.action);
    Array.prototype.forEach.call(document.querySelectorAll('#ba-phase-strip .ba-phase'), function(button, index) {
      var active = index === _state.step;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }

  function _updatePlayingState() {
    var play = document.getElementById('ba-play');
    var live = document.getElementById('ba-live');
    var liveText = document.getElementById('ba-live-text');
    if (!play || !live || !liveText) return;
    play.textContent = _state.completed && !_state.playing ? '重新播放' : (_state.playing ? '暂停观察' : '继续播放');
    live.classList.toggle('is-playing', _state.playing);
    liveText.textContent = _state.completed && !_state.playing ? '过程完成' : (_state.playing ? '正在播放' : '已暂停');
  }

  function _updateTimeline() {
    var range = document.getElementById('ba-range');
    var value = document.getElementById('ba-time-value');
    if (!range || !value) return;
    var total = _processes[_state.process].steps.length;
    range.max = String(total * 1000);
    range.value = String(Math.round((_state.step + _state.progress) * 1000));
    value.textContent = Math.round(_state.progress * 100) + '%';
  }

  function _pauseAt(step, progress) {
    var total = _processes[_state.process].steps.length;
    _state.step = _clamp(step, 0, total - 1);
    _state.progress = progress === undefined ? 0.72 : _clamp(progress, 0, 1);
    _state.playing = false;
    _state.completed = _state.step === total - 1 && _state.progress >= 1;
    _state.lastPanelKey = '';
    _renderPanel(true);
    _updatePlayingState();
    _updateTimeline();
    _drawFrame(document.getElementById('bio-animation-canvas'));
  }

  function _setProcess(processId, autoplay) {
    if (!_processes[processId]) return false;
    _state.process = processId;
    _state.step = 0;
    _state.progress = 0.16;
    _state.playing = !!autoplay;
    _state.completed = false;
    _state.zoom = 1;
    _state.panX = 0;
    _state.panY = 0;
    _state.lastPanelKey = '';
    var select = document.getElementById('ba-process-select');
    if (select) select.value = processId;
    _renderNavigation();
    _renderLegend();
    _renderPanel(true);
    _updatePlayingState();
    _updateTimeline();
    _drawFrame(document.getElementById('bio-animation-canvas'));
    return true;
  }

  function _bindControls() {
    var processSelect = document.getElementById('ba-process-select');
    processSelect.innerHTML = Object.keys(_processes).map(function(key) {
      return '<option value="' + key + '">' + _processes[key].name + '</option>';
    }).join('');
    processSelect.value = _state.process;
    processSelect.addEventListener('change', function(event) { _setProcess(event.target.value, false); });

    document.getElementById('ba-play').addEventListener('click', function() {
      if (_state.completed && !_state.playing) {
        _state.step = 0;
        _state.progress = 0;
        _state.completed = false;
        _state.lastPanelKey = '';
        _renderPanel(true);
      }
      _state.playing = !_state.playing;
      _state.lastTime = 0;
      _updatePlayingState();
    });
    document.getElementById('ba-prev').addEventListener('click', function() { _pauseAt(_state.step - 1, 0.72); });
    document.getElementById('ba-next').addEventListener('click', function() { _pauseAt(_state.step + 1, 0.72); });
    document.getElementById('ba-speed').addEventListener('change', function(event) { _state.speed = Number(event.target.value); });
    document.getElementById('ba-range').addEventListener('input', function(event) {
      var total = _processes[_state.process].steps.length;
      var globalProgress = Number(event.target.value) / 1000;
      var step = Math.min(total - 1, Math.floor(globalProgress));
      var local = step === total - 1 ? _clamp(globalProgress - step, 0, 1) : globalProgress - step;
      _pauseAt(step, local);
    });
  }

  function _setupCanvas(canvas) {
    canvas.addEventListener('wheel', function(e) {
      e.preventDefault(); _state.zoom = _clamp(_state.zoom * (e.deltaY > 0 ? 0.9 : 1.1), 0.35, 3);
    });
    canvas.addEventListener('mousedown', function(e) {
      _state.dragging = true; _state.lastX = e.clientX; _state.lastY = e.clientY;
    });
    window.addEventListener('mousemove', function(e) {
      if (_state.dragging) { _state.panX += e.clientX - _state.lastX; _state.panY += e.clientY - _state.lastY; _state.lastX = e.clientX; _state.lastY = e.clientY; }
      var card = document.getElementById('ba-hotspot-card'); if (!card) return;
      var r = canvas.getBoundingClientRect();
      var wx = _toWorldX(e.clientX - r.left, canvas), wy = _toWorldY(e.clientY - r.top, canvas);
      var found = _state.hotSpots.find(function(h) { return Math.hypot(h.x - wx, h.y - wy) < h.r; });
      if (found) {
        card.style.display = 'block';
        card.style.left = Math.min(e.clientX - r.left + 12, r.width - 270) + 'px';
        card.style.top = Math.min(e.clientY - r.top + 12, r.height - 80) + 'px';
        card.innerHTML = '<h4>' + found.title + '</h4><p>' + found.text + '</p>';
        canvas.style.cursor = 'pointer';
      } else { card.style.display = 'none'; canvas.style.cursor = _state.dragging ? 'grabbing' : 'grab'; }
    });
    window.addEventListener('mouseup', function() { _state.dragging = false; });
  }

  function initBioAnimation(target) {
    _addStyles();
    var pageTarget = target || document.getElementById('page-content');
    if (!pageTarget) return;
    pageTarget.innerHTML = [
      '<section class="ba-page" aria-label="生物过程交互动画">',
        '<header class="ba-header">',
          '<div class="ba-heading">',
            '<p class="ba-kicker">BIOQUEST · 动态图解</p>',
            '<h1 class="ba-title"><strong id="ba-process-title">生物过程</strong>如何连续发生？</h1>',
            '<p class="ba-subtitle" id="ba-process-desc"></p>',
          '</div>',
          '<div class="ba-picker"><label for="ba-process-select">选择观察过程</label><select class="ba-process-select" id="ba-process-select"></select></div>',
        '</header>',
        '<div class="ba-phase-groups" id="ba-phase-groups" aria-hidden="true"></div>',
        '<nav class="ba-phase-strip" id="ba-phase-strip" aria-label="过程阶段"></nav>',
        '<div class="ba-main">',
          '<div class="ba-stage-wrap">',
            '<canvas class="ba-canvas" id="bio-animation-canvas" role="img" aria-label="生物过程动态示意图"></canvas>',
            '<div class="ba-live" id="ba-live"><span class="ba-live-dot"></span><span id="ba-live-text">已暂停</span></div>',
            '<div class="ba-focus-label" id="ba-focus-label">重点观察</div>',
            '<div class="ba-hotspot-card" id="ba-hotspot-card"></div>',
          '</div>',
          '<aside class="ba-panel" aria-live="polite">',
            '<div class="ba-note-head">',
              '<div><p class="ba-note-label">当前阶段</p><h2 class="ba-note-title" id="ba-note-title"></h2></div>',
              '<div class="ba-note-index"><span id="ba-note-index">01</span><small id="ba-note-total"></small></div>',
            '</div>',
            '<div class="ba-action" id="ba-action"></div>',
            '<div class="ba-metrics" id="ba-metrics"></div>',
            '<p class="ba-knowledge-label">过程解释</p>',
            '<p class="ba-step-desc" id="ba-step-desc"></p>',
            '<div class="ba-process-note" id="ba-process-note"></div>',
            '<p class="ba-knowledge-label">观察与考点</p>',
            '<ul class="ba-observe" id="ba-observe"></ul>',
            '<div class="ba-exam" id="ba-exam"></div>',
            '<div class="ba-controls">',
              '<div class="ba-actions">',
                '<button class="ba-btn" id="ba-prev" type="button" aria-label="上一个阶段">← 上一步</button>',
                '<button class="ba-btn ba-btn--main" id="ba-play" type="button">继续播放</button>',
                '<button class="ba-btn" id="ba-next" type="button" aria-label="下一个阶段">下一步 →</button>',
              '</div>',
              '<div class="ba-time-head"><span>本阶段开始</span><span id="ba-time-value">16%</span><span>阶段完成</span></div>',
              '<input class="ba-range" id="ba-range" type="range" min="0" max="5000" value="160" aria-label="完整过程时间轴">',
              '<div class="ba-speed-row"><label for="ba-speed">播放速度</label><select class="ba-speed" id="ba-speed"><option value="0.5">0.5× 慢速观察</option><option value="1" selected>1× 标准速度</option><option value="1.5">1.5× 快速回放</option></select></div>',
            '</div>',
          '</aside>',
        '</div>',
        '<footer class="ba-footer"><span id="ba-model-note"></span><span class="ba-legend" id="ba-legend"></span></footer>',
      '</section>'
    ].join('');

    _bindControls();
    _renderNavigation();
    _renderLegend();
    _renderPanel(true);
    _updatePlayingState();
    _updateTimeline();
    _setupCanvas(document.getElementById('bio-animation-canvas'));
    if (_state.animId) cancelAnimationFrame(_state.animId);
    _state.lastTime = 0; _state.animId = requestAnimationFrame(_loop);
  }

  function renderBioAnimationPage(target) { initBioAnimation(target); }

  // ====== v3.1: 课堂动作控制接口（T1-4） ======
  // 供 EventBus 调用：切换动画 + 跳到指定步
  function setProcessByName(name) {
    var keys = Object.keys(_processes);
    var selected = '';
    var normalized = String(name || '').toLowerCase();
    for (var i = 0; i < keys.length; i++) {
      if (keys[i].toLowerCase().indexOf(normalized) >= 0 || _processes[keys[i]].name.toLowerCase().indexOf(normalized) >= 0) {
        selected = keys[i];
        break;
      }
    }
    if (!selected) return false;
    if (document.getElementById('bio-animation-canvas')) return _setProcess(selected, true);
    _state.process = selected;
    _state.step = 0; _state.progress = 0; _state.playing = true; _state.completed = false;
    return true;
  }

  function gotoStep(step) {
    if (!_processes[_state.process]) return;
    var total = _processes[_state.process].steps.length;
    _state.step = Math.max(0, Math.min(total - 1, step | 0));
    _state.progress = 0;
    _state.playing = false;
    _state.completed = false;
    _state.lastPanelKey = '';
    if (document.getElementById('bio-animation-canvas')) {
      _renderPanel(true);
      _updatePlayingState();
      _updateTimeline();
      _drawFrame(document.getElementById('bio-animation-canvas'));
    }
  }

  window.initBioAnimation = initBioAnimation;
  window.renderBioAnimationPage = renderBioAnimationPage;
  // v3.1 课堂动作控制
  window.BioAnimationController = {
    setProcessByName: setProcessByName,
    gotoStep: gotoStep,
    getState: function () { return { process: _state.process, step: _state.step, total: _processes[_state.process] ? _processes[_state.process].steps.length : 0 }; }
  };
})();
