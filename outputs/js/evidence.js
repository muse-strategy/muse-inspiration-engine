(function(M){
  'use strict';
  M.evidenceStates=['VERIFIED','INFERENCE','ASSUMPTION','TO VALIDATE'];
  M.claim=(text,status='ASSUMPTION',sourceIds=[],basis='策略建议，需验证',sourceLabels=[])=>({text,status,sourceIds,sourceLabels,basis});
  M.verifyClaim=(claim,record)=>{
    if(!record?.sourceId || !record?.excerpt?.trim() || !record?.reviewer?.trim()) throw Error('核验需要来源、支持摘录和核验人。');
    return {...claim,status:'VERIFIED',verification:{...record,at:M.now()}};
  };
  M.auditClaims=function walk(value){
    if(!value || typeof value!=='object')return;
    if(value.status && M.evidenceStates.includes(value.status)){
      if(typeof value.text!=='string')throw Error('证据声明缺少文本');
      if(value.status==='VERIFIED' && (!value.verification?.sourceId || !value.verification?.excerpt || !value.verification?.reviewer))throw Error('禁止将未经核验的声明标记为 VERIFIED');
    }
    Object.values(value).forEach(v=>{if(v && typeof v==='object')walk(v);});
  };
})(Muse);
