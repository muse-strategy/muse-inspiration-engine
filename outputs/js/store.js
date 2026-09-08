(function(M){
  'use strict';
  M.invalidate=(c,from)=>{
    M.STEPS.slice(from).forEach(k=>{c.stages[k]={status:c.results[k] || c.stages[k].status==='ready' || c.stages[k].status==='stale' ? 'stale':'not_started',revision:c.revision,error:''};delete c.results[k];});
    if(from<=3)c.selectedDirectionId=null;
    c.challengeResolutions={};
  };
  M.updateContext=(c,context)=>{if(JSON.stringify(c.context)===JSON.stringify(context))return false;c.context=M.clone(context);c.revision++;c.updatedAt=M.now();c.stages.context.status='needs_input';M.invalidate(c,1);return true;};
  M.updateSources=(c,sources)=>{c.sources=M.clone(sources);c.revision++;c.stages.context.status='needs_input';M.invalidate(c,1);};
  M.chooseDirection=(c,id)=>{
    if(c.stages.define.status!=='ready' || !c.results.define?.directions.some(d=>d.id===id))throw Error('请先生成有效的策略方向。');
    if(c.selectedDirectionId===id)return false;
    c.selectedDirectionId=id;c.revision++;M.invalidate(c,4);return true;
  };
  M.canRun=(c,step)=>{
    const i=M.STEPS.indexOf(step);
    // A signal is enough to start Discover. Context is intentionally
    // completable later so an incomplete brief never blocks exploration.
    if(step==='discover')return !!c.sources.length;
    if(i===0)return !!c.sources.length;
    if(i<0 || c.stages[M.STEPS[i-1]].status!=='ready')return false;
    return step!=='build' || !!c.selectedDirectionId;
  };
  M.commitResult=(c,step,result)=>{M.auditClaims(result);const i=M.STEPS.indexOf(step);M.invalidate(c,i+1);c.results[step]=result;c.stages[step]={status:'ready',revision:c.revision,error:''};c.updatedAt=M.now();};
  M.visibleResult=(c,step)=>c.stages[step].status==='ready' ? c.results[step]:null;
})(Muse);
