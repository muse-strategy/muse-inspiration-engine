(function(M){
  'use strict';
  M.analysis={mode:'Local deterministic demo engine · Non-real-time · No live market data',provider:'local',
    async run(step,c,{signal}={}){
      if(!M.canRun(c,step))throw Error('上游结果尚未就绪，请先完成前一阶段并选择方向。');
      await new Promise((resolve,reject)=>{if(signal?.aborted){reject(new DOMException('已取消','AbortError'));return;}const done=()=>{signal?.removeEventListener('abort',abort);resolve();};const timer=setTimeout(done,180);const abort=()=>{clearTimeout(timer);reject(new DOMException('已取消','AbortError'));};signal?.addEventListener('abort',abort,{once:true});});
      if(step==='context')return {confirmed:true,unknownFields:M.missingContext(c.context)};
      const result=M.engine[step](M.clone(c));M.auditClaims(result);return result;
    }
  };
})(Muse);
