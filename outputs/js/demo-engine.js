(function(M){
  'use strict';
  const C=M.claim;
  const short=(s,n=90)=>String(s||'').length>n?String(s).slice(0,n)+'…':String(s||'');
  const ids=c=>c.sources.map(s=>s.id);
  const labels=c=>c.sources.map(s=>s.label||({text:'用户输入',image:'用户截图',url:'网页来源','url-pasted':'用户提供链接'}[s.type]||'案例材料'));
  const inferred=(c,text,basis='依据用户背景与材料进行的策略推断')=>C(text,'INFERENCE',ids(c),basis,labels(c));
  const assumed=(c,text)=>C(text,'ASSUMPTION',ids(c),'拟议策略，不代表已验证的用户行为或市场事实',labels(c));
  const unknown=(c,text)=>C(text,'TO VALIDATE',ids(c),'当前材料不足以确认，需要外部核验',labels(c));
  const profile=c=>{
    const b=c.context;
    return {b,commercial:['Launch','Product Awareness','Acquisition','Conversion'].includes(b.goal),retention:b.goal==='Retention',reputation:b.goal==='Reputation',participation:!!(b.community||b.offline),hasBridge:!!(b.product.trim()&&b.strengths.trim()),lowBudget:/小|低|有限|small|low/i.test(b.budget),ip:!!b.ip.trim(),scope:[b.scene,b.need,b.tension].filter(Boolean).join('；')};
  };
  function challenges(c,direction){
    const p=profile(c),b=p.b,out=[];
    const add=(id,risk,why,fix,severity='Needs Validation')=>out.push({id,risk:unknown(c,risk),why,fix,severity});
    if(!b.goal)add('goal','商业目标尚不明确','当前 Context 没有 Business Goal，无法定义目标行为。','先选择主要商业目标，再决定是否扩大投入。');
    if(!b.positioning || !b.strengths)add('right','品牌资格尚未建立',`${b.brand||'品牌'} 尚未提供${!b.positioning?'品牌定位':'可用产品能力'}，不能由话题相关推导出品牌关联。`,'补充真实能力或已有资产的可核验案例；不成立则退出该领地。','High Risk');
    if(!p.hasBridge)add('bridge','当前 Campaign 与产品连接较弱',`尚无法从 ${b.product||'未定义产品'} 的能力推导出可体验的行动。`,'明确产品中的一项真实任务与活动后入口；在此之前不承诺转化。','High Risk');
    if(p.ip)add('license','文化资产的使用资格需要确认',`当前 IP 设定为「${short(b.ip)}」，合作声明为「${short(b.partnerships)||'未提供'}」。二者不能替代授权。`,'列出名称、图像、场地、改编权限；授权未确认时改为自有内容原型。','High Risk');
    if(direction?.type==='participation')add('participation','参与可能成为无价值的打卡',`「${short(b.tension)}」意味着用户不一定愿意提交作品。仅拍照或抽奖不能证明解决了「${short(b.need)}」。`,'先让用户带走一个与产品能力相关的结果；只把可自愿分享的成果作为 UGC，不强制分享。');
    if(direction?.type==='proof')add('proof','演示效果可能被误读为性能承诺',`方向依赖「${short(b.strengths)||'尚未说明的能力'}」，缺少测试条件或对照依据。`,'先审核演示与真实产品一致，说明限制，避免无依据的效果对比。');
    if(p.lowBudget && (direction?.type==='participation'||b.offline))add('budget','资源规模可能超过小预算',`预算为「${b.budget}」，线下资源为「${b.offline||'未提供'}」，资源数量不等于执行产能。`,'先运行一个可控试点，核对单点成本和人力后再复制。');
    if(!b.timing || !b.resources)add('capacity','排期或执行责任尚未落实',`时间：${b.timing||'未确认'}；团队：${b.resources||'未确认'}。`,'指定负责人、产能与审核时长；时间表先作为相对阶段，不编造日期。');
    if(b.restrictions)add('constraints','方案必须通过当前限制审查',b.restrictions,'将限制转换为上线前检查项；不能通过时移除相应表达、数据采集或机制。');
    if(b.tension)add('tension','受众张力尚未被直接验证',`「${b.tension}」来自输入，不是本工具开展的用户调研。`,'用目标用户访谈或小规模任务测试判断张力是否存在，并记录反例。');
    return out;
  }
  function discover(c){
    const b=c.context,p=profile(c),raw=c.sources.map(s=>s.text).join('\n');
    const signals=[
      {type:'Cultural Signal',statement:inferred(c,`材料中的文化/场景线索：${short(raw,145)}`),confidence:'Needs Validation',implication:`只把它视为讨论「${b.need||'用户需求'}」的候选入口，不推断热度。`},
      {type:'Audience Signal',statement:inferred(c,`${b.who||'待定义人群'} 在「${b.scene||'待确认场景'}」希望 ${b.need||'明确需求'}，但面临 ${b.tension||'未知阻碍'}。`),confidence:b.tension?'Promising hypothesis':'Needs Validation',implication:'验证真实任务与阻碍，而不只按人口属性划分受众。'},
      {type:'Market Signal',statement:unknown(c,`尚无独立资料证明「${b.product||'该产品'}」所在市场的变化或竞争空白。`),confidence:'Needs Validation',implication:'补充竞品实际活动、产品信息及发布时间，不把缺少资料写成市场空白。'},
      {type:'Brand Signal',statement:b.strengths?inferred(c,`可讨论的品牌入口：${b.positioning||b.brand}；用户提供的能力：${b.strengths}`):unknown(c,'品牌能力不足，暂不能判断 Right-to-Play。'),confidence:b.strengths?'Promising hypothesis':'Needs Validation',implication:p.hasBridge?`用 ${b.product} 的一项实际任务证明关联。`:'先补充产品能力，暂不承诺产品转化。'},
      {type:'Opportunity Signal',statement:assumed(c,`把「${b.tension||'待验证张力'}」转为 ${b.brand||'品牌'} 帮助用户「${b.need||'完成任务'}」的机会。`),confidence:'Needs Validation',implication:`以 ${b.goal||'待确认目标'} 为约束，先测试价值是否成立。`}
    ];
    return {signals,opportunity:{'Opportunity':assumed(c,`从 ${b.scene||'真实场景'} 切入，让 ${b.brand||'品牌'} 提供 ${b.need||'具体帮助'}，而非复述材料。`),'Why Now':b.timing?assumed(c,`用户给定窗口：${b.timing}。外部时效仍需核验。`):unknown(c,'没有可核验的时间触发因素，暂不能证明必须现在做。'),'What Changed':unknown(c,'当前只掌握提交材料，没有前后对比证据；请补充行为、文化或供给变化。'),'Who Cares':inferred(c,`${b.who||'待定义用户'}；关键场景：${b.scene||'待补充'}`),'Why It Matters':inferred(c,`如果缓解「${b.tension||'未定义张力'}」，可能支持 ${b.goal||'待确认目标'}。`),'Evidence':unknown(c,'用户材料与 Context 已记录；重要外部声明未独立核验。'),'Unknowns':unknown(c,'真实需求强度、市场变化、竞品占位、授权和资源可用性。'),'Potential Opportunity':assumed(c,p.commercial?`将 ${b.product} 的能力转为可比较、可试用的体验。`:p.retention?'把一次活动变成可持续返回产品的有用习惯。':'建立有品牌理由的参与方式，让用户带走与自身需求相关的成果。')},sourceIds:ids(c)};
  }
  function diagnose(c){
    const b=c.context,p=profile(c),op=c.results.discover.opportunity.Opportunity;
    const dim=(name,rating,why,gap)=>({name,rating,why:inferred(c,why),gap:unknown(c,gap)});
    const dimensions=[
      dim('Business Fit',b.goal?'Promising':'Needs Validation',`机会「${op.text}」要服务 ${b.goal||'尚未选择的目标'}，而非仅增加内容数量。`,'需确认业务基线、优先目标和目标行为。'),
      dim('Audience Tension',b.tension&&b.scene?'Promising':'Needs Validation',`需要缓解的矛盾是「${b.tension||'未定义'}」，场景为「${b.scene||'未定义'}」。`,'输入尚非调研，验证用户是否真的愿意改变行为。'),
      dim('Brand Right-to-Play',b.strengths&&b.positioning?'Promising':'Weak',`${b.brand||'品牌'} 的进入理由应是「${b.positioning||'定位待补充'}」和「${b.strengths||'能力待补充'}」，不是与热点同时出现。`,'需要可核验能力、既有资产或授权，缺失时不建议放大。'),
      dim('Cultural / IP Fit',p.ip?'Needs Validation':'Promising',p.ip?`文化资产「${b.ip}」应帮助用户理解 ${b.need||'其需求'}；不把知名度等同战略价值。`:'当前无需外部 IP；可从材料中的文化/场景线索构建自有表达。','文化意义是否被受众接受；使用权是否明确。'),
      dim('Competitive White Space','Needs Validation',`可测试的差异是围绕「${b.tension||'用户任务'}」提供真实能力证明；尚不能声称竞争者没有这样做。`,'补充直接和替代竞争者的活动与产品证据。'),
      dim('Product Connection',p.hasBridge?'Promising':'Weak',p.hasBridge?`从 ${b.need} 进入 ${b.product} 的「${b.strengths}」，需要一个真实可用的入口。`:'当前 Campaign 与产品连接较弱：产品或能力信息不足。','验证体验入口、任务完成路径和价值连续性。'),
      dim('Execution Feasibility',b.resources&&b.timing?'Promising':'Needs Validation',`预算：${b.budget||'未知'}；时间：${b.timing||'未知'}；团队：${b.resources||'未知'}。`,'用试点成本、审核排期和产能确认可行性。'),
      dim('Strategic Risk',p.ip||!p.hasBridge?'Needs Validation':'Promising',p.ip?`「${b.ip}」授权与品牌语义是优先风险。`:!p.hasBridge?'内容可能有传播性，但产品连接没有成立。':`最大不确定性是用户是否认可「${b.tension||'该张力'}」及愿意完成下一步。`,'先做可以否定假设的小实验，避免为已有创意寻找赞美。')
    ];
    const risk=challenges(c);
    return {dimensions,verdict:!b.goal||!b.strengths?'Weak Fit':p.ip?'High Risk':'Promising but Needs Validation',why:inferred(c,`有条件地探索：${b.brand||'品牌'} 可尝试以自身能力回应「${b.tension||'用户矛盾'}」，并服务 ${b.goal||'业务目标'}。`),but:unknown(c,risk[0]?.risk.text||'尚无外部验证，不应直接放大投入。'),question:unknown(c,`目标用户是否愿意在「${b.scene||'目标场景'}」借助 ${b.product||'产品'} 完成「${b.need||'任务'}」，且认为这是 ${b.brand||'品牌'} 有资格提供的帮助？`),challenges:risk};
  }
  function define(c){
    const b=c.context,p=profile(c),dg=c.results.diagnose;
    const territoryClaim=assumed(c,`${b.brand||'品牌'} · 把「${short(b.tension,42)||'阻碍'}」变成「${short(b.need,42)||'能力'}」`);
    const directions=[
      {id:'proof',type:'proof',name:`看得见的 ${short(b.need,20)||'价值'}`,rationale:`依据诊断「${dg.verdict}」，先用产品能力证明解决张力的资格，不依赖外部 IP 热度。`,audienceValue:`在 ${b.scene||'真实场景'} 看见并比较 ${b.product||'产品'} 是否有用。`,brandValue:`用「${b.strengths||'待补充能力'}」建立 ${b.brand||'品牌'} 的可信理由。`,culturalRelevance:'把材料中的议题翻译成具体选择，避免只蹭文化符号。',productConnection:p.hasBridge?`直接进入 ${b.product} 的一项可操作演示或试用。`:'当前缺少可证明的产品能力，先补充真实任务。',differentiation:'以可观察的体验结果区别于口号式传播；竞品差异仍需核验。',complexity:p.lowBudget?'Low · 单个可控场景演示':'Medium · 产品与内容团队共同验证',risk:'演示可能夸大效果；需说明条件与限制。',mechanism:'体验比较',contentTypes:['Hero','Hygiene','Product'],journey:['发现问题','观察演示','尝试产品','判断是否继续']},
      {id:'participation',type:'participation',name:`一起完成 ${short(b.need,20)||'一个任务'}`,rationale:`把诊断中的用户张力转为共同任务，让用户从围观者变成有价值成果的创作者。`,audienceValue:`围绕 ${b.need||'自身需求'} 产出可带走的成果，分享是自愿的。`,brandValue:`${b.brand||'品牌'} 提供工具、反馈或场景，而不是占据用户故事。`,culturalRelevance:p.ip?`「${b.ip}」作为观察和表达入口；授权未确认前只做自有原型。`:'以用户真实处境构建共同表达，不假设社会热度。',productConnection:p.hasBridge?`把参与成果带入 ${b.product} 的延伸任务，延续 ${b.strengths}。`:'成果尚无产品承接，需先补桥梁，不强行引导购买。',differentiation:'可带走的成果与产品任务连续，区别于拍照加抽奖。',complexity:b.offline?'High · 现场协调、内容审核、用户支持':'Medium · 模板设计、反馈和审核',risk:'任务过重或成果同质化，可能失去参与理由。',mechanism:'共同创作',contentTypes:['Hero','Hub','UGC','Official Social'],journey:['看见邀请','理解任务','创作成果','自愿分享','延伸体验']},
      {id:'utility',type:'utility',name:`你的 ${short(b.scene,18)||'日常'} 解决手册`,rationale:`以诊断提出的「${short(b.tension,45)}」为服务任务，提供持续有用的帮助而非一次爆点。`,audienceValue:`降低 ${b.scene||'场景'} 中的判断和行动成本。`,brandValue:`让 ${b.brand||'品牌'} 因有用而被记住，并通过重复使用累积关系。`,culturalRelevance:'用真实问题与长期需求承接文化变化，不依赖短期讨论量。',productConnection:p.hasBridge?`工具或指南先解决一个小任务，再在 ${b.product} 中完成更完整体验。`:'先提供独立有用内容，产品能力补齐前不编造承接。',differentiation:'按任务提供清晰步骤、适用边界和反馈修订，而不是随机标题。',complexity:'Low–Medium · 需要持续维护、答疑与准确性审核',risk:'容易成为泛用资料，需保留品牌独有的能力与使用路径。',mechanism:'持续服务',contentTypes:['Hub','Hygiene','Search','Product'],journey:p.retention?['回到真实任务','获得帮助','完成产品任务','反馈与复访']:['搜索问题','获得方法','尝试小任务','进入产品','反馈结果']}
    ].map(d=>({...d,
      strategicRole:d.type==='proof'?'证明品牌能力与产品价值':d.type==='participation'?'让用户成为成果共同作者':'把品牌变成持续可返回的帮助入口',
      userBehavior:d.type==='proof'?'观察、比较并自主试用':d.type==='participation'?'完成一个可带走的成果并自愿反馈':'搜索、尝试、复访并逐步形成使用习惯',
      campaignMechanism:`${d.mechanism}：${d.audienceValue}`,
      channelRole:d.type==='proof'?'演示与产品体验承接':d.type==='participation'?'任务邀请、成果展示与社群反馈':'问题解答、工具内容与产品服务承接',
      businessValue:d.type==='proof'?'建立可信的产品认知与有效体验':d.type==='participation'?'累积有意义的品牌参与与关系':'用持续有用的服务支持留存与长期关系',
      executionModel:d.complexity,
      evidence:assumed(c,'战略方向为当前信息下的候选方案，不是已验证结论。')}));
    const territory={...territoryClaim,name:territoryClaim.text,strategicMeaning:`把用户面对的「${b.tension||'阻碍'}」转译成可行动的「${b.need||'任务'}」，让创意服务真实行为。`,brandRightToPlay:b.strengths?`${b.brand||'品牌'} 可以凭「${b.strengths}」提供帮助；能力与授权仍需核验。`:'品牌进入资格尚未建立，不能仅凭材料中的话题相关性参与。',userCanDo:`用户可以在这里${b.need||'完成一个具体任务'}，并自主决定是否继续或分享。`,brandShouldNotDo:'不把热点、抽奖、强制分享或未经证明的产品承诺冒充用户价值。',creativePossibilities:`可发展为${directions.map(d=>d.mechanism).join('、')}等机制；先用小规模原型验证。`};
    return {foundation:{'Human Insight':inferred(c,`用户希望 ${b.need||'完成任务'}，但 ${b.tension||'阻碍尚未定义'}；需要的是控制感与实际帮助，而非更多信息。`),'Brand Truth':b.strengths?unknown(c,`${b.brand} 声称可提供 ${b.strengths}；需核验真实能力。`):unknown(c,'品牌能力尚未建立。'),'Cultural Truth':unknown(c,`材料可能反映「${short(c.sources[0]?.text,100)}」，尚不能推广为社会共识。`),'Audience Role':assumed(c,'有自主选择权的体验者或创作者，不是品牌传播工具。'),'Brand Role':assumed(c,`以 ${b.strengths||'待定义能力'} 降低用户行动成本。`),'IP / Trend Role':assumed(c,p.ip?`用 ${b.ip} 提供文化理解入口，而非替代产品价值。`:'提供理解场景的语境；不需要外部 IP 才能成立。')},territory,formula:[inferred(c,c.results.discover.signals[0].statement.text),inferred(c,b.tension||'用户张力未定义'),inferred(c,b.strengths||'品牌资格未建立')],directions,challenges:dg.challenges};
  }
  function build(c){
    const b=c.context,p=profile(c),d=c.results.define.directions.find(x=>x.id===c.selectedDirectionId);
    if(!d)throw Error('请选择一个有效的战略方向。');
    const requested=b.channels.split(/[,，、;；\n]+/).map(x=>x.trim()).filter(Boolean);
    const channelNames=requested.length?requested:['品牌自有内容触点（建议，待确认）','产品体验入口（建议，待确认）'];
    const channels=[...new Set(channelNames)].slice(0,12).map(name=>{
      const role=M.channelRoles.find(x=>new RegExp(x.match,'i').test(name));
      return {name,role:role?.role||'Pilot / 待验证触点',audience:b.who||'待定义用户',content:`${d.name}：${role?.content||'小规模任务说明与反馈内容'}`,action:role?.action||'理解价值 → 试点参与',kpi:role?.kpi||'有效行动与用户反馈',evidence:assumed(c,'渠道角色是策略规划，实际触达和行为需要测量。')};
    });
    const desired=p.retention?'返回产品完成有价值任务':p.reputation?'理解事实与品牌承诺并获得可用回应':p.commercial?'完成产品体验并自主做出下一步选择':d.type==='participation'?'完成有品牌关联的参与成果并识别品牌角色':'理解品牌能解决的具体问题并愿意进一步了解';
    const campaignKpi=p.retention?'有效复访任务完成率':p.reputation?'关键信息理解与问题解决反馈':p.commercial?'产品体验到关键意向行为的完成率':d.type==='participation'?'有效成果完成与品牌归因反馈':'核心信息理解与品牌关联反馈';
    let journey=d.journey.slice();if(p.commercial && d.type==='participation')journey.push('自主试用或咨询');if(p.retention && journey.at(-1)!=='反馈与复访')journey.push('反馈与复访');
    const architecture=[
      ['Attention','看见与自己相关的矛盾',`在 ${b.scene||'目标场景'} 识别 ${b.tension||'问题'}`,'展示真实任务而非热点排名','Hero / 问题入口'],
      ['Engagement','相信值得花时间','理解品牌提供的帮助',`说明 ${b.strengths||'能力缺口与适用边界'}`,'演示 / 方法说明'],
      ['Participation','获得对自己有用的结果',d.type==='participation'?'完成一个可带走的作品或回答':d.type==='proof'?'完成一次自主比较':'完成一个小任务',`提供${d.mechanism}所需支持`,'任务模板 / 操作说明'],
      ['Product Experience','延续已经获得的价值',p.hasBridge?`进入 ${b.product} 的对应任务`:'待补真实产品入口，不强推',p.hasBridge?'提供连续体验与清晰退出方式':'先确认能力与任务承接','Product Content'],
      ['Sharing','自愿表达有价值的成果',d.type==='participation'?'自愿分享自己的观察或结果':'可选分享真实体验，不设为参与条件','提供隐私安全的模板与授权说明','UGC / 真实体验'],
      ['Conversion',`支持 ${b.goal||'业务目标'} 的下一步`,desired,'提供明确、非强迫的行动入口','CTA / 帮助信息']
    ].map((x,i)=>({stage:x[0],why:x[1],user:x[2],brand:x[3],content:x[4],channel:channels[Math.min(i,channels.length-1)].name,next:i===5?'反馈与复盘':journey[Math.min(i+1,journey.length-1)],evidence:assumed(c,'拟议阶段；Sharing 为可选，转化按业务目标定义，不等同购买。')}));
    const types=d.contentTypes.slice();if(p.reputation && !types.includes('PR'))types.push('PR');
    if(/KOL|达人|创作者|creator/i.test(b.resources+' '+b.partnerships))types.push('KOL');
    const contentSystem=[...new Set(types)].map(type=>({type,title:`${d.name} / ${type==='Hero'?'一次看懂核心价值':type==='UGC'?'我的观察与成果':type==='Hygiene'?'开始前需要知道的事':type==='Search'?'如何解决这个具体问题':type==='Product'?'把帮助带入产品':type==='PR'?'事实与责任说明':'真实任务与进展'}`,purpose:type==='UGC'?'让用户用自己的成果表达，而非统一口号':type==='Product'?d.productConnection:`围绕 ${b.need||'用户任务'} 提供 ${type} 层级的信息`,format:type==='Hero'?'主叙事 / 演示':type==='UGC'?'可选文字、图片或短视频模板':'图文 / 短演示 / 问答',channel:channels[0].name,action:desired,evidence:assumed(c,'内容计划，不代表已制作或发布')}));
    const phaseNames=p.retention?['现有任务诊断','服务机制试点','复访与持续维护']:p.commercial?['能力与入口校验','发布前小范围试用','发布与体验承接','体验反馈与优化']:d.type==='participation'?['授权与任务原型','单点邀请与示范','参与与成果反馈','延伸体验与复盘']:['需求与素材核验','小范围内容测试','持续服务与复盘'];
    const timeline=phaseNames.map((phase,i)=>({phase,window:`阶段 ${i+1} · ${b.timing||'具体日期待确认'}`,deliverable:i===0?'确认关键假设、负责人及资源':i===phaseNames.length-1?'复盘目标行为、修订下一轮假设':`${d.mechanism}的可执行内容与支持`,gate:i===0?'能力、授权或事实未确认则不发布':'用户价值成立且资源可用才扩大',owner:b.resources||'负责人待指定'}));
    const measurement={businessGoal:b.goal||'待确认',desiredBehavior:desired,campaignKpi,why:`该指标判断 ${d.name} 是否推动 ${desired}，而非只观察曝光。`,definition:p.commercial?'完成关键意向行为的有效体验用户 / 有效体验用户；需预先定义行为与归因窗口':p.retention?'完成有价值任务的复访用户 / 进入复访触点的用户；需定义周期':'通过用户反馈与任务记录验证信息理解、品牌归因和参与成果；研究方法待确认',target:'未设定；需基线与资源依据',actual:'未接入测量数据',channelKpis:channels.map(x=>({channel:x.name,kpi:x.kpi,why:`用于诊断 ${x.role} 是否促成目标行为，而非当作商业结果。`,source:'待接入合规事件记录或人工复盘',actual:'未测量'})),levels:[{level:'Business',metric:b.goal||'业务目标待定',why:'校准 Campaign 的业务意义'},{level:'Brand',metric:'品牌角色理解 / 归因反馈',why:'判断用户是否把价值与品牌联系起来'},{level:'Communication',metric:'核心信息理解',why:'确认传播了正确内容'},{level:'Participation',metric:d.type==='participation'?'有效任务成果':'有效体验完成',why:'判断用户是否获得实际价值'},{level:'Content',metric:'有用性反馈与下一步行动',why:'诊断哪些信息帮助用户行动'},{level:'Conversion',metric:desired,why:'按业务目标定义转化，不强行等同成交'}]};
    return {directionId:d.id,directionName:d.name,version:c.revision,coreIdea:assumed(c,`${d.name}：${b.brand||'品牌'} 以「${d.mechanism}」帮助 ${b.who||'目标用户'} 在 ${b.scene||'具体场景'} 完成 ${b.need||'任务'}。`),territory:c.results.define.territory,participation:assumed(c,`${d.mechanism}：${d.audienceValue} 品牌负责 ${d.brandValue} 不把分享、购买或隐私披露设为获得基础帮助的前提。`),journey,architecture,channels,timeline,contentSystem,productBridge:{strength:p.hasBridge?'Promising · Needs Validation':'Weak',claim:p.hasBridge?assumed(c,`Campaign 中的 ${d.mechanism} → ${b.product} 中的相关任务 → ${b.strengths}。入口、能力与用户接受度必须实际核验。`):unknown(c,'当前 Campaign 与产品连接较弱。没有足够产品能力信息，暂不设计强制转化。'),action:d.productConnection},measurement,challenges:challenges(c,d),validation:[unknown(c,`用户是否认可「${b.tension||'该张力'}」？通过访谈与任务观察核验。`),unknown(c,`${d.mechanism}是否真的产生 ${desired}？以小样本原型观察，不虚构验证结果。`),unknown(c,`预算「${b.budget||'待确认'}」和资源「${b.resources||'待确认'}」是否支持试点？`)],sourceIds:ids(c)};
  }
  function express(c){
    const b=c.context,cp=c.results.build,d=c.results.define.directions.find(x=>x.id===cp.directionId);
    if(cp.directionId!==c.selectedDirectionId)throw Error('方向已变化，请重新生成 Campaign。');
    const visual={color:d.type==='proof'?'清晰中性底色 + 品牌识别色；不靠光效暗示性能':d.type==='participation'?'克制的品牌色 + 温暖人物/场景色；为用户成果留白':'高可读中性色 + 单一强调色，优先信息层级',composition:d.type==='proof'?'同条件的操作步骤和真实界面对照':d.type==='participation'?'用户成果居中，品牌工具与文化语境位于辅助层':'任务 → 方法 → 行动的编辑式信息结构',typography:'清晰无衬线正文，克制的大标题与等宽注释；遵循品牌规范',cover:`${d.name} · ${b.brand}`,keywords:[b.product,b.scene,b.need,d.mechanism,cp.contentSystem[0]?.format].filter(Boolean).join(' / '),mood:d.type==='proof'?'可判断、可信、保有选择权':d.type==='participation'?'好奇、开放、成果属于用户':'可靠、清晰、有用',prompt:`Create a brand editorial visual direction for ${b.brand} / ${b.product}. Territory: ${cp.territory.text}. Campaign: ${cp.coreIdea.text}. Audience: ${b.who}, scene: ${b.scene}. Format: ${cp.contentSystem.map(x=>x.format).join('; ')}. Use ${d.type==='proof'?'honest product demonstrations':d.type==='participation'?'participant-made outcomes and open composition':'a clear task-to-action information hierarchy'}. Respect brand guidelines. Do not invent logos, partnerships, product capabilities, performance statistics or real testimonials. This is a visual prompt, not a generated image.`};
    const summary=[['品牌与目标',`${b.brand} / ${b.product} · ${b.goal}`],['用户任务',`${b.who}，在 ${b.scene} 需要 ${b.need}；阻碍：${b.tension}`],['机会',c.results.discover.opportunity.Opportunity.text],['诊断',`${c.results.diagnose.verdict} — ${c.results.diagnose.why.text}`],['领地',cp.territory.text],['选定方向',cp.directionName],['核心创意',cp.coreIdea.text],['产品桥梁',cp.productBridge.claim.text],['测量逻辑',`${b.goal} → ${cp.measurement.desiredBehavior} → ${cp.measurement.campaignKpi}`]];
    const outputs=[
      {id:'strategy',name:'Strategy Summary',sections:summary},
      {id:'campaign',name:'Campaign Brief',sections:[...summary,['参与机制',cp.participation.text],['用户旅程',cp.journey.join(' → ')],['渠道分工',cp.channels.map(x=>`${x.name}: ${x.role}; ${x.action}`).join('\n')],['资源与约束',[b.budget,b.timing,b.resources,b.restrictions].filter(Boolean).join('；')]]},
      {id:'content',name:'Content Brief',sections:[['策略依据',cp.directionName],['核心信息',cp.coreIdea.text],['内容系统',cp.contentSystem.map(x=>`${x.type} / ${x.title}\n目的：${x.purpose}\n形式：${x.format}\n行动：${x.action}`).join('\n\n')],['素材',`${b.content||'素材待准备'}；真实产品信息、来源核验、授权记录`],['人工审核',b.restrictions||'核验事实、产品承诺、版权与用户隐私']]},
      {id:'social',name:'Social Copy',sections:[['发布说明','本地生成的文案草稿，发布前需事实与品牌审核。'],['开场',`在 ${b.scene}，你是否也遇到过：${b.tension}？`],['正文',`我们想与 ${b.who} 一起探索「${d.name}」。先从 ${d.mechanism} 开始，看看能否更接近「${b.need}」。`],['行动邀请',cp.productBridge.strength.startsWith('Weak')?'先分享你的实际需求；产品体验入口待确认。':`了解 ${b.product} 的相关体验与适用条件，按自己的需要决定下一步。`]]},
      {id:'kol',name:'KOL Brief',sections:[['使用状态',cp.contentSystem.some(x=>x.type==='KOL')?'当前计划包含创作者合作；实际合作待确认。':'当前 Campaign 未配置 KOL；以下为可选委托模板，不代表已安排合作。'],['任务',`围绕 ${d.name} 展示 ${b.scene} 中的真实任务。`],['表达边界','披露合作关系；不提供虚构体验或效果背书；保留真实局限。'],['内容与行动',`${cp.coreIdea.text}\n${cp.measurement.desiredBehavior}`],['验收','品牌角色清楚、能力表达准确、隐私和授权合规；不以单一曝光量替代用户价值。']]},
      {id:'visual',name:'Visual System / Visual Assistant',sections:Object.entries(visual).map(([k,v])=>[({color:'Color Direction',composition:'Composition',typography:'Typography',cover:'Cover Concept / KV Direction',keywords:'Image Keywords',mood:'Mood',prompt:'Visual Prompt'})[k],v])},
      {id:'timeline',name:'Timeline',sections:cp.timeline.map(x=>[x.phase,`${x.window}\n交付：${x.deliverable}\n责任：${x.owner}\n门槛：${x.gate}`])},
      {id:'kpi',name:'KPI Dashboard',sections:[['数据状态','未接入真实测量。以下为指标设计，不是活动成绩。'],['指标链',`${b.goal} → ${cp.measurement.desiredBehavior} → ${cp.measurement.campaignKpi}`],['定义与依据',cp.measurement.definition+'\n'+cp.measurement.why],...cp.measurement.channelKpis.map(x=>[x.channel,`${x.kpi}\n原因：${x.why}\n数据：${x.actual}`])]},
      {id:'client',name:'Client-ready Summary',sections:[...summary,['执行建议','先核验关键假设，再小范围验证机制；数据不足不建议直接放大投入。'],['决策前仍需解决',cp.challenges.map(x=>`${x.risk.text}：${x.fix}`).join('\n')]]},
      {id:'deck',name:'Strategy Deck / 逐页提纲',sections:summary.map((x,i)=>[`${i+1}. ${x[0]}`,x[1]])}
    ];
    return {directionId:cp.directionId,caseRevision:c.revision,outputs,visual,challenges:cp.challenges,disclaimer:'Local deterministic demo engine · Non-real-time · No live market data。所有创意与执行计划均为 ASSUMPTION；未核验外部声明不得作为事实发布。'};
  }
  M.engine={discover,diagnose,define,build,express,challenges};
})(Muse);
