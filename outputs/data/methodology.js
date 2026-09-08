(function(M){
  M.goals=['Brand Awareness','Product Awareness','Launch','Acquisition','Engagement','Conversion','Retention','Reputation','Cultural Relevance','Other'];
  M.goalLabels={'Brand Awareness':'品牌认知','Product Awareness':'产品认知','Launch':'新品发布','Acquisition':'用户获取','Engagement':'用户互动','Conversion':'转化','Retention':'用户留存','Reputation':'品牌声誉','Cultural Relevance':'文化关联','Other':'其他'};
  M.labels={
    'Context':'背景设定','Discover':'发现机会','Diagnose':'战略诊断','Define':'策略定义','Build':'构建 Campaign','Express':'交付输出',
    'not_started':'未开始','running':'运行中','ready':'已完成','needs_input':'待补充','error':'出错','stale':'已过期',
    'Cultural Signal':'文化信号','Audience Signal':'用户信号','Market Signal':'市场信号','Brand Signal':'品牌信号','Opportunity Signal':'机会信号',
    'Input':'输入','Output':'输出','Question':'关键问题','Evidence':'证据边界','Dependency':'前置依赖','Validation':'验证方式',
    'Why':'为什么','But':'仍需面对','Strategic Question':'关键战略问题','Human Insight':'用户洞察','Brand Truth':'品牌依据','Cultural Truth':'文化依据','Audience Role':'用户角色','Brand Role':'品牌角色','IP / Trend Role':'文化 / IP 角色','TO VALIDATE':'待验证','Promising · Needs Validation':'值得探索 · 待验证','How to Fix':'如何修正','Information gap':'信息缺口','Strategic Rationale':'战略依据','Audience Value':'用户价值','Brand Value':'品牌价值','Cultural Relevance':'文化关联','Product Connection':'产品连接','Differentiation':'差异化','Execution Complexity':'执行复杂度','Risk':'风险',
    'Attention':'吸引注意','Engagement':'深度互动','Participation':'用户参与','Product Experience':'产品体验','Sharing':'分享传播','Conversion':'转化行动',
    'Purpose':'内容目的','Format / Channel':'形式 / 渠道','Action':'下一步行动','Target / Actual':'目标 / 实际','Role':'战略角色','Audience':'目标人群','Content':'内容形式','KPI':'关键指标','Definition':'指标定义','Target':'目标','Actual':'实际数据',
    'Hero':'主内容','Hub':'系列内容','Hygiene':'基础内容','UGC':'用户共创','KOL':'创作者合作','Official Social':'官方社交内容','PR':'公关内容','Search':'搜索内容','Product':'产品内容',
    'Campaign Brief':'Campaign 简报','Content Brief':'内容简报','Strategy Summary':'策略摘要','Social Copy':'社交媒体文案','KOL Brief':'创作者合作简报','Visual System / Visual Assistant':'视觉系统 / 视觉助手','Timeline':'时间计划','KPI Dashboard':'KPI 指标看板','Client-ready Summary':'客户版摘要','Strategy Deck / 逐页提纲':'策略 Deck / 逐页提纲',
    'Discovery / Search / UGC':'发现 / 搜索 / 用户共创','Reach / Demonstration':'触达 / 产品演示','Conversation':'话题讨论','Depth / Relationship':'深度沟通 / 用户关系','Experience / Participation':'线下体验 / 用户参与','Participation / Retention':'参与 / 用户留存','Product / Conversion':'产品体验 / 转化','Intent / Discovery':'主动搜索 / 发现',
    'Business Fit':'商业目标匹配','Audience Tension':'用户张力','Brand Right-to-Play':'品牌进入资格','Cultural / IP Fit':'文化 / IP 匹配','Competitive White Space':'竞争空白','Product Connection':'产品连接','Execution Feasibility':'执行可行性','Strategic Risk':'战略风险',
    'Promising but Needs Validation':'值得探索，但需要验证','Promising hypothesis':'有希望的假设','High Risk':'高风险','Weak Fit':'匹配度较弱','Strong':'强','Promising':'值得探索','Weak':'较弱','Needs Validation':'待验证',

    'Opportunity':'机会','Why Now':'为什么是现在','What Changed':'发生了什么变化','Who Cares':'谁会在意','Why It Matters':'为什么重要','Unknowns':'未知信息','Potential Opportunity':'潜在机会','Evidence':'证据',
    'Participation Mechanism':'用户参与机制','Campaign Architecture':'Campaign 架构','Confidence':'可信程度','Implication':'策略含义','Campaign → Product':'Campaign → 产品','USER JOURNEY · 根据方向与目标生成':'用户旅程 · 根据方向与目标生成',
    'Local deterministic demo engine':'本地演示引擎','Non-real-time':'非实时分析','No live market data':'未接入实时市场数据',

    'Brand / 品牌名称':'品牌名称','Product / Service':'产品 / 服务','Business Goal':'商业目标','Who / 谁':'目标人群','Scene / 什么场景':'使用场景','Need / 需要什么':'核心需求','Barrier / Tension · 阻碍与矛盾':'阻碍与矛盾',
    'Brand positioning':'品牌定位','Product strengths':'产品优势','Existing IP':'现有 IP 资产','Community':'用户社群','Offline resources':'线下资源','Content assets':'内容资产','Partnerships / 状态与授权':'合作关系 / 状态与授权',
    'Budget':'预算','Timing':'时间安排','Channels / 用逗号分隔':'渠道 / 用逗号分隔','Resources / 团队与产能':'资源 / 团队与产能','Geography':'地域范围','Other restrictions / 法务、品牌与资源限制':'其他限制 / 法务与品牌限制'
  };
  M.t=value=>M.labels[value]||value;
  M.statusLabel=value=>M.labels[value]||({not_started:'未开始',running:'运行中',ready:'已完成',needs_input:'待补充',error:'出错',stale:'已过期'}[value]||value);
  M.goalLabel=value=>M.goalLabels[value]||value;
  M.method=[
    {key:'context',name:'Context',display:'背景设定',cn:'建立品牌与 Campaign 背景',question:'为谁、为什么、凭什么做？',input:'品牌 / 产品 / Brief / 来源材料',output:'品牌背景、目标、用户张力、资产与约束',evidence:'用户声明不自动视为外部事实。未知项可明确保留。',dependency:'策略的共同起点',validation:'确认品牌、产品与目标人群、场景、需求、阻碍。'},
    {key:'discover',name:'Discover',display:'发现机会',cn:'发现文化、用户与市场机会',question:'这个信号为什么值得品牌关注？',input:'原始信号 + 可选背景设定',output:'五类信号、机会命题与未知项',evidence:'每条信号标记来源、证据状态与定性可信度。',dependency:'原始信号已记录；背景可在此后补充',validation:'查证原始出处、时效和真实需求，不假装实时搜索。'},
    {key:'diagnose',name:'Diagnose',display:'战略诊断',cn:'判断机会是否值得投入',question:'这个品牌值得参与吗？',input:'背景设定 + 机会分析',output:'八维判断、战略结论、理由、风险与关键问题',evidence:'区分已有依据与需要外部研究的竞争/文化判断。',dependency:'发现机会结果有效',validation:'先验证可能推翻策略的关键假设。'},
    {key:'define',name:'Define',display:'策略领地',cn:'建立创意领地并比较方向',question:'品牌应该站在哪里，以及为什么有资格站在那里？',input:'战略诊断 + 信号 + 背景设定',output:'创意领地 + 三个可比较方向',evidence:'洞察是推断；品牌/文化真相在核验前仍不是事实。',dependency:'战略诊断有效，用户选择方向',validation:'比较用户价值、品牌价值、产品连接和复杂度。'},
    {key:'build',name:'Build',display:'构建 Campaign',cn:'把方向变成完整 Campaign',question:'用户如何参与，并真实进入产品？',input:'唯一选定方向 + 背景设定',output:'机制、旅程、渠道、内容、产品桥梁与指标体系',evidence:'时间表和 KPI 是计划，不是已发生的效果。',dependency:'策略定义有效且选定方向',validation:'用小规模原型验证参与门槛和产品承接。'},
    {key:'express',name:'Express',display:'交付输出',cn:'输出可执行的策略资产',question:'团队下一步具体做什么？',input:'同一 Case 的有效 Campaign',output:'策略摘要、Brief、文案、视觉、时间表、指标框架',evidence:'输出携带来源、假设、待验证项与版本。',dependency:'Campaign 有效；上游变化后必须重建',validation:'人工审核事实、授权、承诺与品牌规范。'}
  ];
  M.fields=[
    ['品牌与目标',[['brand','品牌名称'],['product','产品 / 服务'],['goal','商业目标']]],
    ['目标用户 · 不只是一个年龄段',[['who','目标人群'],['scene','使用场景'],['need','核心需求'],['tension','阻碍与矛盾']]],
    ['品牌资产 · 请写实际可用能力',[['positioning','品牌定位'],['strengths','产品优势'],['ip','现有 IP 资产'],['community','用户社群'],['offline','线下资源'],['content','内容资产'],['partnerships','合作关系 / 状态与授权']]],
    ['约束条件 · 未知可留空',[['budget','预算'],['timing','时间安排'],['channels','渠道 / 用逗号分隔'],['resources','资源 / 团队与产能'],['geography','地域范围'],['restrictions','其他限制 / 法务与品牌资源']]]
  ];
  M.channelRoles=[
    {match:'小红书|xiaohongshu|rednote|pinterest',role:'发现 / 搜索 / 用户共创',content:'场景解答、可检索经验与参与示范',action:'收藏问题 → 查看解决方案',kpi:'有效搜索访问、参与入口点击'},
    {match:'抖音|douyin|tiktok|reels',role:'触达 / 产品演示',content:'短视频演示与低门槛挑战',action:'理解价值 → 查看演示或参与',kpi:'有效观看、行动入口点击'},
    {match:'微博|weibo|twitter|x\\b',role:'话题讨论',content:'议题、问答与事实澄清',action:'表达观点 → 进入专题',kpi:'相关讨论质量、专题访问'},
    {match:'公众号|newsletter|email|邮件',role:'深度沟通 / 用户关系',content:'完整解释与分阶段答疑',action:'理解方法 → 预约或回访',kpi:'内容到产品入口点击、有效回复'},
    {match:'线下|offline|门店|展',role:'线下体验 / 用户参与',content:'现场任务、体验导览和服务说明',action:'完成体验 → 自愿留下下一步意向',kpi:'有效体验完成、合规留资'},
    {match:'社群|community|discord',role:'参与 / 用户留存',content:'任务反馈、同伴经验和复访提醒',action:'共同完成 → 返回使用',kpi:'任务完成、复访行为'},
    {match:'官网|website|landing|站内|app|产品',role:'产品体验 / 转化',content:'能力说明、体验与决策信息',action:'试用 → 评估 → 自主决定',kpi:'体验启动、关键行为完成'},
    {match:'搜索|search|seo',role:'主动搜索 / 发现',content:'问题解答、选购依据和真实案例',action:'找到答案 → 产品体验',kpi:'有意图访问、有效产品行为'}
  ];
})(Muse);
