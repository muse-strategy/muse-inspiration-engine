(function () {
  "use strict";

  var $ = function (selector, root) {
    return (root || document).querySelector(selector);
  };
  var $$ = function (selector, root) {
    return Array.prototype.slice.call((root || document).querySelectorAll(selector));
  };
  var LIBRARY_KEY = "muse-library-v4";
  var toastTimer = null;
  var previewUrl = "";

  var state = {
    raw: "",
    sourceType: "user-input",
    sourceLabel: "用户输入",
    sourceUrl: "",
    imageName: "",
    title: "",
    summary: "",
    keywords: [],
    verify: [],
    inferred: [],
    signals: [],
    metrics: [],
    recommendation: "",
    reasons: [],
    credibility: "",
    directions: [],
    selectedDirection: null,
    brief: null,
    visual: null,
    currentStep: 0,
    unlockedStep: 0,
    completed: {},
    revision: 0
  };

  var input = $("#source-input");
  var workspace = $("#workspace");
  var analysisStatus = $("#analysis-status");

  function escapeHtml(value) {
    return String(value == null ? "" : value).replace(/[&<>"']/g, function (char) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
    });
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\r/g, "")
      .replace(/[ \t]+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function truncate(value, limit) {
    return value.length > limit ? value.slice(0, limit - 1) + "…" : value;
  }

  function showToast(message) {
    var toast = $("#toast");
    toast.textContent = message;
    toast.classList.add("is-active");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toast.classList.remove("is-active");
    }, 2800);
  }

  function setView(viewName) {
    $$(".view").forEach(function (view) {
      view.classList.toggle("is-active", view.id === "view-" + viewName);
    });
    $$(".nav-item").forEach(function (item) {
      item.classList.toggle("is-active", item.dataset.view === viewName);
    });
    if (viewName === "library") renderLibrary();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  $$('[data-view]').forEach(function (item) {
    item.addEventListener("click", function () {
      setView(item.dataset.view);
    });
  });

  function titleFrom(text) {
    var firstLine = text.split(/\n/).map(function (line) {
      return line.trim();
    }).filter(Boolean)[0] || "未命名材料";
    firstLine = firstLine.replace(/^(标题|主题|热点)[:：]\s*/, "");
    return truncate(firstLine, 62);
  }

  function keywordsFrom(text) {
    var output = [];
    var english = text.match(/[A-Za-z][A-Za-z0-9-]{2,}/g) || [];
    var chinese = text.match(/[\u4e00-\u9fff]{2,10}/g) || [];
    english.concat(chinese).forEach(function (word) {
      if (output.indexOf(word) === -1 && !/^(这是|用户|内容|分析|思考|提供|一个|相关|进行|希望|可以|需要|如果|现在|以及|探索|输入|开始)$/.test(word)) {
        output.push(word);
      }
    });
    return (output.length ? output : ["内容主题", "品牌关联", "用户视角"]).slice(0, 7);
  }

  function inferFrom(text) {
    var brand = /品牌|产品|公司|某品牌|教育|平台/.test(text);
    var collaboration = /合作|联名|IP|电影|影视|跨界|赞助/.test(text);
    var goal = /转化|认知|互动|涨粉|传播|用户行动/.test(text);
    return [
      brand ? "材料出现了品牌或产品语境，可能存在品牌参与空间。" : "材料暂未提供明确品牌语境，品牌关联需要补充。",
      collaboration ? "材料可能涉及合作、IP 或跨界表达，授权与事实状态需要核实。" : "材料更像一个待展开的主题，具体内容场景仍需定义。",
      goal ? "材料包含部分运营目标线索，仍需确认优先目标。" : "材料没有明确希望促成的用户行动，这是一个信息缺口。"
    ];
  }

  function signalsFrom(text) {
    var signals = [];
    if (/合作|联名|IP|跨界/.test(text)) signals.push("品牌合作 / 关系叙事");
    if (/电影|影视|故事|流浪/.test(text)) signals.push("文化内容 / 叙事资产");
    if (/教育|学习|课程|学生/.test(text)) signals.push("学习场景 / 用户成长");
    if (/产品|品牌|消费|购买/.test(text)) signals.push("产品价值 / 选择理由");
    if (!signals.length) signals.push("主题表达 / 语境建立");
    signals.push("需要从事实材料转化为用户视角");
    return signals.slice(0, 4);
  }

  function verifyFrom(text, sourceType) {
    var items = [];
    if (sourceType === "user-input") items.push("热点的原始出处、发布时间和当前状态");
    if (sourceType === "web-content" || sourceType === "link-pasted-text") items.push("网页内容是否完整，以及页面的发布时间");
    if (sourceType === "image-text") items.push("截图文字是否完整，图片中的账号、时间和上下文");
    if (/合作|IP|电影|联名|跨界/.test(text)) items.push("合作是否官宣、IP 授权范围和品牌可使用的事实");
    items.push("目标用户的真实反馈，不能由本次材料直接推断");
    return items.slice(0, 4);
  }

  function metric(value, tone, reason) {
    return { value: value, tone: tone, reason: reason };
  }

  function evaluate(text) {
    var brand = /品牌|产品|公司|某品牌|教育|平台/.test(text);
    var collaboration = /合作|联名|IP|电影|影视|跨界/.test(text);
    var goal = /转化|认知|互动|涨粉|传播|用户行动/.test(text);
    var risk = collaboration || /争议|敏感|传闻|未证实|侵权/.test(text);
    var metrics = [
      { label: "AUDIENCE FIT / 用户关联", data: brand ? metric("中 / Moderate", "moderate", "有明确语境，但材料没有说明目标用户的具体处境。") : metric("待补充 / Unknown", "weak", "材料没有提供目标用户信息，不能直接推断关联度。") },
      { label: "BRAND FIT / 品牌关联", data: brand && collaboration ? metric("高 / Strong", "strong", "品牌与合作或内容资产出现显性连接，具备讨论入口。") : brand ? metric("中 / Moderate", "moderate", "能看到品牌语境，但自然参与方式还不清晰。") : metric("弱 / Weak", "weak", "材料中未出现可识别的品牌参与理由。") },
      { label: "GOAL FIT / 目标适配", data: goal ? metric("中 / Moderate", "moderate", "有部分运营目标线索，但仍需明确优先目标。") : metric("待补充 / Unknown", "weak", "没有给出希望促成的用户行动或运营目标。") },
      { label: "CONTENT SPACE / 内容空间", data: collaboration ? metric("中高 / Moderate–High", "strong", "合作、IP 或跨界语境提供了可拆解的内容关系。") : metric("中 / Moderate", "moderate", "可以从用户视角展开，但需要更具体的场景和冲突。") },
      { label: "EXECUTION COST / 执行成本", data: collaboration ? metric("中高 / Moderate–High", "moderate", "涉及合作、IP 或事实核验，前置沟通和审核成本较高。") : metric("中 / Moderate", "moderate", "需要补充素材、平台和制作边界后才能估算。") },
      { label: "RISK / 内容风险", data: risk ? metric("高 / High", "weak", "事实、授权和品牌表达边界需要先核实，不能当作已发生事实。") : metric("中 / Moderate", "moderate", "材料不足以判断敏感性，发布前仍需人工复核。") }
    ];
    var recommendation = risk ? "小范围测试" : brand ? "建议跟进" : "小范围测试";
    var reasons = risk ? [
      "材料有内容连接点，但合作 / IP 等事实状态尚未被来源证明。",
      "先用低成本内容验证用户是否对这个切入点有反应。",
      "授权、时间和品牌表达确认前，不建议直接做强商业化表达。"
    ] : [
      "材料已经提供了可讨论的主题，但仍要补充目标用户和运营目标。",
      "先以一个轻量内容切入点测试，再决定是否扩大制作投入。",
      "所有事实和外部数据都应回到原始来源核验。"
    ];
    return {
      metrics: metrics,
      recommendation: recommendation,
      reasons: reasons,
      credibility: text.length > 45 ? "中：基于用户材料，未连接实时平台数据；以下内容含 AI 推断。" : "低至中：材料较短，建议补充来源和上下文后再决策。"
    };
  }

  function directionsFrom(title) {
    var topic = truncate(title, 24);
    return [
      { name: "情绪共鸣型", tag: "让用户产生“这说的不就是我吗？”", insight: "从「" + topic + "」背后的情绪或矛盾切入，把行业话题翻译成用户正在经历的具体时刻。", user: "对这个话题有感受、但不一定主动搜索解决方案的人群。", angle: "用一个真实场景或选择瞬间开场，先建立共感，再让品牌成为叙事中的一个角色。", brand: "品牌不抢占话题，而是提供一种被理解的表达或陪伴。", why: "适合建立记忆和评论区共鸣，但需要真实用户语境支持。" },
      { name: "实用价值型", tag: "给用户收藏、学习或解决问题的理由。", insight: "把「" + topic + "」拆成用户可以理解、保存和行动的判断框架，而不是停留在热点复述。", user: "正在做选择、寻找方法或希望降低决策成本的人群。", angle: "用清单、拆解或前后对照组织内容，让用户看完能带走一个具体判断。", brand: "品牌以工具、经验或服务能力自然出现，先提供帮助，再承接产品。", why: "更容易形成收藏和长尾价值，但必须保证信息准确、可执行。" },
      { name: "互动参与型", tag: "让用户评论、投票、分享或参与讨论。", insight: "「" + topic + "」存在不同立场或选择空间，可以把单向传播改成用户参与的内容事件。", user: "愿意表达观点、分享经历或参与轻量选择的人群。", angle: "设计二选一、情境提问或用户投稿，让评论成为内容的一部分。", brand: "品牌提供讨论场景和参与机制，不把互动变成生硬的产品推销。", why: "有机会获得高质量反馈，但要提前设计社区规则和风险边界。" }
    ];
  }

  function briefFrom(direction) {
    var platform = direction.name === "实用价值型" ? "小红书图文 / 知识型短视频（平台需确认）" : direction.name === "互动参与型" ? "小红书互动帖 / 短视频评论区（平台需确认）" : "小红书叙事图文 / 生活方式短视频（平台需确认）";
    return {
      campaign: state.title + "：从话题到用户视角" + (state.revision ? " · 迭代版" : ""),
      goal: direction.name === "情绪共鸣型" ? "建立品牌与用户情绪的连接，并验证共鸣表达。" : direction.name === "实用价值型" ? "提供可保存、可执行的信息，让用户完成一次判断或行动。" : "引导用户表达观点与经历，收集真实反馈并形成讨论。",
      audience: direction.user,
      insight: direction.insight,
      message: "不要只复述热点；从用户真实处境出发，让品牌以有理由的方式参与。",
      title: "「" + state.title + "」背后，用户真正想解决的是什么？",
      cover: direction.name === "互动参与型" ? "你会选 A 还是 B？" : direction.name === "实用价值型" ? "一张图看懂：从话题到选择" : "原来大家在意的不是热闹本身",
      format: platform,
      structure: direction.angle + "；第二段呈现来源事实；第三段给出品牌参与方式；结尾留下可回应的问题或行动。",
      visual: direction.name === "实用价值型" ? "信息卡片 + 局部真实场景；层级清晰、留白充足。" : direction.name === "互动参与型" ? "大字问题 + 人物 / 场景切片；首屏明确参与动作。" : "真实生活场景 + 轻杂志排版；保留人物情绪和环境细节。",
      assets: "原始来源截图或链接、品牌可用素材、用户场景照片 / 视频、事实核验记录。",
      interaction: direction.name === "互动参与型" ? "结尾设置二选一或情境提问，并提前准备事实纠偏回复。" : "评论区追问用户的真实经历，不把评论区变成单向销售区。",
      metrics: "优先观察有效评论质量、收藏 / 分享反馈和用户是否完成目标动作；不使用无来源的热度预测。",
      verify: state.verify.join("；")
    };
  }

  function visualFrom(brief, direction) {
    var practical = direction.name === "实用价值型";
    var interactive = direction.name === "互动参与型";
    return {
      cards: [
        ["COLOR / 色彩", practical ? "米白底 + 炭黑字 + 一处橙色强调；信息优先。" : interactive ? "黑底 + 紫橙渐变强调；制造选择和参与的张力。" : "黑曜石底 + 暖橙肤色 + 柔和紫色；克制但有情绪。"],
        ["COMPOSITION / 构图", practical ? "卡片化分区、3:4 信息节奏、关键结论靠上。" : interactive ? "问题文字占首屏 40%，人物 / 场景作为对照锚点。" : "近景人物或物件 + 大留白标题，像一页编辑部版面。"],
        ["TYPE / 字体感觉", practical ? "高可读无衬线，数字和关键词使用等宽字。" : "粗体标题搭配细等宽标签，形成 Editorial 层级。"],
        ["COVER CONCEPT / 封面", brief.cover],
        ["IMAGE KEYWORDS / 图片关键词", practical ? "真实场景、自然光、手部动作、纸张纹理、信息卡片" : interactive ? "双人对照、选择手势、评论气泡、现场感、强对比" : "真实生活、电影感光影、轻杂志、人物情绪、局部特写"],
        ["MOOD / 氛围", practical ? "清晰、可靠、值得收藏" : interactive ? "开放、好奇、想表达" : "被理解、克制、有余韵"]
      ],
      prompt: "Create an editorial social content cover for \"" + brief.campaign + "\". " + (interactive ? "Show a visible participation question. " : "") + "Use " + (practical ? "warm off-white, charcoal and one orange accent" : "obsidian black with restrained orange-to-violet light") + ", " + (practical ? "structured card composition" : "real-life scene with generous negative space") + ", readable typography, no invented logos, no fabricated statistics, no claim of real-time trend data."
    };
  }

  function fillList(selector, values) {
    $(selector).innerHTML = values.map(function (value) {
      return "<li>" + escapeHtml(value) + "</li>";
    }).join("");
  }

  function renderDiscover() {
    $("#workspace-title").textContent = state.title;
    $("#source-badge").textContent = "来源：" + state.sourceLabel;
    $("#discover-title").textContent = state.title;
    $("#discover-summary").textContent = state.summary;
    $("#discover-source").textContent = state.sourceLabel + (state.sourceUrl ? " · " + state.sourceUrl : "");
    $("#user-material").textContent = state.raw;
    $("#discover-keywords").innerHTML = state.keywords.map(function (keyword) {
      return '<span class="keyword">' + escapeHtml(keyword) + "</span>";
    }).join("");
    fillList("#verify-list", state.verify);
    fillList("#inference-list", state.inferred);
    fillList("#signal-list", state.signals);
  }

  function renderEvaluate() {
    $("#metrics").innerHTML = state.metrics.map(function (item) {
      return '<article class="metric" data-tone="' + item.data.tone + '"><div class="metric-label">' + escapeHtml(item.label) + '</div><div class="metric-value">' + escapeHtml(item.data.value) + '</div><p class="metric-reason">' + escapeHtml(item.data.reason) + "</p></article>";
    }).join("");
    $("#recommendation-title").textContent = state.recommendation;
    fillList("#recommendation-reasons", state.reasons);
    $("#credibility-copy").textContent = state.credibility;
  }

  function renderDirections() {
    $("#directions").innerHTML = state.directions.map(function (direction, index) {
      return '<article class="direction-card"><div class="direction-number">0' + (index + 1) + ' / CREATIVE ROUTE</div><h4>' + escapeHtml(direction.name) + '</h4><p class="direction-tag">' + escapeHtml(direction.tag) + '</p><dl>' +
        '<div><dt>CORE INSIGHT / 核心洞察</dt><dd>' + escapeHtml(direction.insight) + '</dd></div>' +
        '<div><dt>TARGET USER / 目标用户</dt><dd>' + escapeHtml(direction.user) + '</dd></div>' +
        '<div><dt>CONTENT ANGLE / 内容切入</dt><dd>' + escapeHtml(direction.angle) + '</dd></div>' +
        '<div><dt>BRAND ROLE / 品牌出现方式</dt><dd>' + escapeHtml(direction.brand) + '</dd></div>' +
        '<div><dt>WHY / 为什么值得做</dt><dd>' + escapeHtml(direction.why) + '</dd></div>' +
        '</dl><button class="direction-select" data-direction="' + index + '" type="button">采用这个方向 →</button></article>';
    }).join("");
  }

  function briefField(label, value, full) {
    return '<div class="brief-field' + (full ? " full" : "") + '"><b>' + escapeHtml(label) + '</b><span>' + escapeHtml(value) + "</span></div>";
  }

  function renderBrief() {
    if (!state.brief) return;
    var brief = state.brief;
    $("#brief-paper").innerHTML = '<div class="paper-kicker">MUSE CONTENT BRIEF / ' + escapeHtml(state.sourceLabel.toUpperCase()) + '</div><h4>' + escapeHtml(brief.campaign) + '</h4><div class="brief-grid">' +
      briefField("内容目标", brief.goal) + briefField("目标用户", brief.audience) + briefField("核心洞察", brief.insight) + briefField("核心信息", brief.message) +
      briefField("标题方向", brief.title) + briefField("封面文案", brief.cover) + briefField("内容形式", brief.format) + briefField("内容结构 / 视频结构", brief.structure, true) +
      briefField("视觉建议", brief.visual) + briefField("素材需求", brief.assets) + briefField("评论区互动方式", brief.interaction) + briefField("发布后重点观察指标", brief.metrics) +
      briefField("需要人工核实的信息", brief.verify, true) + "</div>";
  }

  function renderVisual() {
    if (!state.visual) return;
    $("#visual-grid").innerHTML = state.visual.cards.map(function (card) {
      return '<article class="visual-card"><b>' + escapeHtml(card[0]) + '</b><span>' + escapeHtml(card[1]) + "</span></article>";
    }).join("");
    $("#visual-prompt").textContent = state.visual.prompt;
  }

  function renderStepper() {
    $$(".step").forEach(function (step) {
      var number = Number(step.dataset.step);
      step.classList.toggle("is-active", number === state.currentStep);
      step.classList.toggle("is-done", !!state.completed[number]);
      step.disabled = number > state.unlockedStep;
    });
  }

  function showStep(stepNumber) {
    if (!state.raw || stepNumber > state.unlockedStep) return;
    state.currentStep = stepNumber;
    renderStepper();
    $$(".step-panel").forEach(function (panel) {
      panel.classList.toggle("is-active", panel.dataset.panel === String(stepNumber));
    });
    var panel = $("#step-panel-" + stepNumber);
    if (panel) panel.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function completeAndShow(nextStep) {
    state.completed[state.currentStep] = true;
    state.unlockedStep = Math.max(state.unlockedStep, nextStep);
    showStep(nextStep);
  }

  function runAnalysis(material, type, label, url) {
    var text = cleanText(material);
    if (!text) {
      showToast("请先输入热点描述，或补充截图中的文字。");
      input.focus();
      return false;
    }
    state.raw = text;
    state.sourceType = type || "user-input";
    state.sourceLabel = label || "用户输入";
    state.sourceUrl = url || "";
    state.title = titleFrom(text);
    state.summary = "这份材料围绕「" + state.title + "」展开。以下摘要是基于你提供的文字整理出的工作起点，不代表已验证的外部事实。";
    state.keywords = keywordsFrom(text);
    state.verify = verifyFrom(text, state.sourceType);
    state.inferred = inferFrom(text);
    state.signals = signalsFrom(text);
    var result = evaluate(text);
    state.metrics = result.metrics;
    state.recommendation = result.recommendation;
    state.reasons = result.reasons;
    state.credibility = result.credibility;
    state.directions = directionsFrom(state.title);
    state.selectedDirection = null;
    state.brief = null;
    state.visual = null;
    state.currentStep = 0;
    state.unlockedStep = 0;
    state.completed = {};
    state.revision = 0;
    renderDiscover();
    renderEvaluate();
    renderDirections();
    renderBrief();
    renderVisual();
    renderStepper();
    workspace.hidden = false;
    setView("studio");
    workspace.scrollIntoView({ behavior: "smooth", block: "start" });
    return true;
  }

  function startAnalysis() {
    var text = input.value.trim();
    var hasImage = $("#image-input").files.length > 0;
    var imageText = cleanText($("#image-text").value);
    if (!text && hasImage && !imageText) {
      showToast("截图已上传，但视觉分析能力未配置。请粘贴截图中的文字后继续。");
      $("#image-text").focus();
      return;
    }
    if (!text) text = imageText;
    if (!text) {
      showToast("请先输入热点描述，或上传截图后补充图片文字。");
      input.focus();
      return;
    }
    analysisStatus.textContent = "正在整理来源 · 提取主题 · 生成判断框架 ···";
    analysisStatus.classList.add("is-active");
    setTimeout(function () {
      analysisStatus.classList.remove("is-active");
      var isImage = hasImage;
      var label = isImage ? (text === imageText ? "用户上传截图 + 用户补充文字" : "用户输入 + 用户上传截图") : "用户输入";
      runAnalysis(text, isImage ? "image-text" : "user-input", label, "");
    }, 420);
  }

  $("#start-analysis").addEventListener("click", startAnalysis);
  input.addEventListener("keydown", function (event) {
    if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
      event.preventDefault();
      startAnalysis();
    }
  });

  $("#image-input").addEventListener("change", function (event) {
    var file = event.target.files && event.target.files[0];
    if (!file) return;
    var accepted = ["image/png", "image/jpeg", "image/webp"].indexOf(file.type) >= 0 || /\.(png|jpe?g|webp)$/i.test(file.name);
    if (!accepted) {
      showToast("只支持 PNG、JPG / JPEG、WEBP 图片。");
      event.target.value = "";
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    $("#image-preview").src = previewUrl;
    $("#image-preview").alt = file.name;
    $("#image-name").textContent = file.name;
    $("#image-attachment").hidden = false;
    $("#source-state").textContent = "来源：截图待补充文字";
    showToast("截图已上传并可预览；请粘贴图片文字后分析。");
  });

  $("#use-image-text").addEventListener("click", function () {
    var text = cleanText($("#image-text").value);
    if (!text) {
      showToast("请先粘贴截图中的文字。");
      $("#image-text").focus();
      return;
    }
    input.value = text;
    startAnalysis();
  });

  var urlModal = $("#url-modal");
  var urlInput = $("#url-input");
  var urlStatus = $("#url-status");
  var fallbackWrap = $("#url-fallback-wrap");
  var fallbackInput = $("#url-fallback");
  var readUrlButton = $("#read-url");
  var useFallbackButton = $("#use-url-fallback");

  function openUrlModal() {
    urlModal.hidden = false;
    urlStatus.className = "url-status";
    urlStatus.textContent = "";
    fallbackWrap.hidden = true;
    useFallbackButton.hidden = true;
    readUrlButton.hidden = false;
    readUrlButton.disabled = false;
    urlInput.value = "";
    fallbackInput.value = "";
    setTimeout(function () { urlInput.focus(); }, 20);
  }

  function closeUrlModal() {
    urlModal.hidden = true;
  }

  $("#open-url-modal").addEventListener("click", openUrlModal);
  $("#close-url-modal").addEventListener("click", closeUrlModal);
  $("#cancel-url").addEventListener("click", closeUrlModal);
  urlModal.addEventListener("click", function (event) {
    if (event.target === urlModal) closeUrlModal();
  });
  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") closeUrlModal();
  });

  async function readWebPage() {
    var url = urlInput.value.trim();
    if (!/^https?:\/\/\S+/i.test(url)) {
      urlStatus.className = "url-status is-active is-error";
      urlStatus.textContent = "请输入完整的 http(s) 链接。";
      return;
    }
    readUrlButton.disabled = true;
    urlStatus.className = "url-status is-active";
    urlStatus.textContent = "正在尝试读取网页内容，不会伪造读取结果 ···";
    try {
      var response = await fetch(url, { redirect: "follow" });
      if (!response.ok) throw new Error("HTTP " + response.status);
      var html = await response.text();
      var documentFromPage = new DOMParser().parseFromString(html, "text/html");
      var pageTitle = cleanText(documentFromPage.title || "");
      var pageBody = cleanText(documentFromPage.body ? documentFromPage.body.innerText : "");
      if (pageBody.length < 30) throw new Error("正文为空或需要登录");
      var material = (pageTitle ? "标题：" + pageTitle + "\n" : "") + pageBody.slice(0, 14000);
      closeUrlModal();
      input.value = material;
      $("#source-state").textContent = "来源：网页内容";
      analysisStatus.textContent = "正在整理网页内容 ···";
      analysisStatus.classList.add("is-active");
      setTimeout(function () {
        analysisStatus.classList.remove("is-active");
        runAnalysis(material, "web-content", "网页内容", url);
      }, 350);
    } catch (error) {
      readUrlButton.disabled = false;
      readUrlButton.hidden = true;
      useFallbackButton.hidden = false;
      fallbackWrap.hidden = false;
      urlStatus.className = "url-status is-active is-error";
      urlStatus.textContent = "暂时无法读取该页面内容（可能是跨域、登录限制或平台限制）。请粘贴正文或上传截图。";
    }
  }

  readUrlButton.addEventListener("click", readWebPage);
  useFallbackButton.addEventListener("click", function () {
    var text = cleanText(fallbackInput.value);
    if (!text) {
      fallbackInput.focus();
      return;
    }
    var url = urlInput.value.trim();
    closeUrlModal();
    input.value = text;
    $("#source-state").textContent = "来源：用户提供链接";
    runAnalysis(text, "link-pasted-text", "用户提供链接 + 用户粘贴正文", url);
  });

  $$(".step").forEach(function (step) {
    step.addEventListener("click", function () {
      showStep(Number(step.dataset.step));
    });
  });
  $("#continue-evaluate").addEventListener("click", function () { completeAndShow(1); });
  $("#continue-direction").addEventListener("click", function () { completeAndShow(2); });
  $$("[data-back]").forEach(function (button) {
    button.addEventListener("click", function () { showStep(Number(button.dataset.back)); });
  });
  $("#edit-material").addEventListener("click", function () {
    input.focus();
    input.scrollIntoView({ behavior: "smooth", block: "center" });
  });
  $("#directions").addEventListener("click", function (event) {
    var button = event.target.closest(".direction-select");
    if (!button) return;
    var index = Number(button.dataset.direction);
    state.selectedDirection = index;
    state.brief = briefFrom(state.directions[index]);
    state.visual = visualFrom(state.brief, state.directions[index]);
    state.completed[2] = true;
    state.unlockedStep = 3;
    renderBrief();
    renderVisual();
    showStep(3);
    showToast("已采用「" + state.directions[index].name + "」，Content Brief 已生成。");
  });
  $("#back-direction").addEventListener("click", function () { showStep(2); });
  $("#continue-visual").addEventListener("click", function () {
    if (!state.brief) {
      showToast("请先选择一个内容策略方向。");
      showStep(2);
      return;
    }
    state.completed[3] = true;
    state.unlockedStep = 4;
    showStep(4);
  });

  function briefText() {
    if (!state.brief) return "";
    var brief = state.brief;
    return ["MUSE CONTENT BRIEF", brief.campaign, "来源：" + state.sourceLabel, "", "内容目标：" + brief.goal, "目标用户：" + brief.audience, "核心洞察：" + brief.insight, "核心信息：" + brief.message, "标题方向：" + brief.title, "封面文案：" + brief.cover, "内容形式：" + brief.format, "内容结构：" + brief.structure, "视觉建议：" + brief.visual, "素材需求：" + brief.assets, "评论区互动方式：" + brief.interaction, "发布后重点观察指标：" + brief.metrics, "需要人工核实的信息：" + brief.verify].join("\n");
  }

  function copyText(text) {
    if (!text) return;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(function () { showToast("已复制到剪贴板。"); }).catch(function () { fallbackCopy(text); });
    } else fallbackCopy(text);
  }
  function fallbackCopy(text) {
    var area = document.createElement("textarea");
    area.value = text;
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    document.execCommand("copy");
    area.remove();
    showToast("已复制到剪贴板。");
  }

  $("#copy-brief").addEventListener("click", function () { copyText(briefText()); });
  $("#export-brief").addEventListener("click", function () {
    var blob = new Blob([briefText()], { type: "text/plain;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "muse-content-brief.txt";
    link.click();
    setTimeout(function () { URL.revokeObjectURL(url); }, 500);
    showToast("Brief 已导出为 TXT 文件。");
  });
  $("#regenerate-brief").addEventListener("click", function () {
    if (state.selectedDirection === null) return;
    state.revision = state.revision ? 0 : 1;
    state.brief = briefFrom(state.directions[state.selectedDirection]);
    state.visual = visualFrom(state.brief, state.directions[state.selectedDirection]);
    renderBrief();
    renderVisual();
    showToast("已重新整理一版 Brief，事实来源保持不变。");
  });
  $("#generate-prompt").addEventListener("click", function () {
    if (!state.visual) return;
    state.visual.prompt = visualFrom(state.brief, state.directions[state.selectedDirection]).prompt + " Keep the visual system consistent with the selected Content Brief.";
    renderVisual();
    showToast("已根据 Brief 整理视觉 Prompt。");
  });
  $("#copy-prompt").addEventListener("click", function () {
    if (state.visual) copyText(state.visual.prompt);
  });

  $("#save-analysis").addEventListener("click", function () {
    if (!state.raw) return;
    var records;
    try { records = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]"); } catch (error) { records = []; }
    var record = JSON.parse(JSON.stringify(state));
    record.id = Date.now();
    record.savedAt = new Date().toISOString();
    records = [record].concat(records.filter(function (item) { return item.raw !== record.raw; })).slice(0, 30);
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(records));
    renderLibrary();
    showToast("已保存到 Library。");
  });
  $("#new-analysis").addEventListener("click", function () {
    workspace.hidden = true;
    input.value = "";
    $("#image-text").value = "";
    $("#image-input").value = "";
    $("#image-attachment").hidden = true;
    $("#source-state").textContent = "来源：等待输入";
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function renderLibrary() {
    var grid = $("#library-grid");
    var records;
    try { records = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]"); } catch (error) { records = []; }
    if (!records.length) {
      grid.innerHTML = '<div class="empty-state">这里还没有保存的分析。<br>回到 Studio 输入一份真实材料，完成 Brief 后点击“保存到 Library”。</div>';
      return;
    }
    grid.innerHTML = records.map(function (record) {
      var date = new Date(record.savedAt);
      var stage = record.visual ? "Visual Assistant" : record.brief ? "Content Brief" : "Discover";
      return '<article class="library-card"><time>' + escapeHtml(date.toLocaleString("zh-CN")) + '</time><h2>' + escapeHtml(record.title) + '</h2><p>' + escapeHtml(record.sourceLabel) + '<br>' + escapeHtml(record.summary) + '</p><div class="library-card-foot"><span class="stage-chip">' + stage + '</span><button class="secondary-button open-record" data-id="' + record.id + '" type="button">重新打开 →</button></div></article>';
    }).join("");
    $$(".open-record", grid).forEach(function (button) {
      button.addEventListener("click", function () { openRecord(Number(button.dataset.id)); });
    });
  }

  function openRecord(id) {
    var records;
    try { records = JSON.parse(localStorage.getItem(LIBRARY_KEY) || "[]"); } catch (error) { records = []; }
    var record = records.find(function (item) { return item.id === id; });
    if (!record) return;
    Object.keys(state).forEach(function (key) {
      if (Object.prototype.hasOwnProperty.call(record, key)) state[key] = record[key];
    });
    state.completed = state.completed || {};
    state.unlockedStep = Number(state.unlockedStep || 0);
    renderDiscover(); renderEvaluate(); renderDirections(); renderBrief(); renderVisual(); renderStepper();
    workspace.hidden = false;
    setView("studio");
    showStep(Math.min(state.unlockedStep, 4));
    showToast("已重新打开这份分析。");
  }

  renderLibrary();
})();
