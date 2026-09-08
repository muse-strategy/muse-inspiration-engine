(function (M) {
  'use strict';
  M.STEPS = ['context', 'discover', 'diagnose', 'define', 'build', 'express'];
  M.STATUS = ['not_started', 'running', 'ready', 'needs_input', 'error', 'stale'];
  M.clone = x => JSON.parse(JSON.stringify(x));
  M.id = () => globalThis.crypto?.randomUUID?.() || 'case-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  M.now = () => new Date().toISOString();
  /** @typedef {{brand:string,product:string,goal:string,who:string,scene:string,need:string,tension:string,positioning:string,strengths:string,ip:string,community:string,offline:string,content:string,partnerships:string,budget:string,timing:string,channels:string,resources:string,geography:string,restrictions:string}} BrandContext */
  M.emptyContext = () => Object.fromEntries(['brand','product','goal','who','scene','need','tension','positioning','strengths','ip','community','offline','content','partnerships','budget','timing','channels','resources','geography','restrictions'].map(k => [k, '']));
  /** A Case owns a versioned dependency chain. Sources are not verified facts. */
  M.newCase = (source = '') => ({schemaVersion: 5, id: M.id(), name: source.trim().slice(0,42) || '未命名策略', kind:'case', saved:false, createdAt:M.now(),updatedAt:M.now(),openedAt:M.now(), revision:0, currentStep:0, context:M.emptyContext(), sources:source.trim() ? [{id:M.id(),type:'text',text:source.trim(),label:'用户输入',url:''}] : [], stages:Object.fromEntries(M.STEPS.map(k => [k,{status:'not_started',revision:0,error:''}])), results:{}, selectedDirectionId:null, evidence:[], challengeResolutions:{}});
  M.missingContext = c => ['brand','product','goal','who','scene','need','tension'].filter(k=>!c[k]?.trim());
  M.validCase = c => !!(c && c.schemaVersion===5 && typeof c.id==='string' && /^[\w-]+$/.test(c.id) && typeof c.name==='string' && c.context && Object.keys(M.emptyContext()).every(k=>typeof c.context[k]==='string') && Array.isArray(c.sources) && c.sources.every(s=>s && typeof s.id==='string' && typeof s.text==='string' && typeof s.type==='string') && c.stages && M.STEPS.every(k=>c.stages[k] && M.STATUS.includes(c.stages[k].status)) && c.results && Array.isArray(c.evidence) && Number.isInteger(c.currentStep) && c.currentStep>=0 && c.currentStep<6);
  M.normalize = c => {
    if(!M.validCase(c)) throw Error('案例格式无法识别，原始记录未被覆盖。');
    const x=M.clone(c); x.challengeResolutions ||= {};
    M.STEPS.forEach((k,i)=>{if(x.stages[k].status==='running'){x.stages[k].status='needs_input';x.stages[k].error='上次运行已中断，请重新生成。';} if(i && x.stages[k].status==='ready' && !x.results[k])x.stages[k].status='needs_input';});
    return x;
  };
})(globalThis.Muse = globalThis.Muse || {});
