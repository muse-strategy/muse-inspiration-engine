(function(M){
  M.outputText=(c,id)=>{
    if(c.stages.express.status!=='ready')throw Error('输出已过期或尚未生成，请先更新 Express。');
    const out=c.results.express.outputs.find(x=>x.id===id);if(!out)throw Error('输出不存在');
    return ['MUSE / '+out.name,c.name,'Case ID: '+c.id+' · Revision: '+c.revision,c.kind==='demo'?'演示案例 · 虚构策划情境，不代表真实合作或研究':'用户案例 · 声明需核验',M.analysis.mode,'',...out.sections.flatMap(x=>[x[0],x[1],'']),'证据与来源 / EVIDENCE & SOURCES',...c.sources.map(s=>`${s.label||s.type}: ${s.url||'用户提交，无外部链接'}\n${s.text}`),'','证据说明：背景是用户声明；分析为推断；创意和执行计划为策略假设；未知事实为待验证。','未解决风险',...c.results.build.challenges.map(x=>`${x.risk.text}\n${x.why}\n如何修正：${x.fix}\n处理：${c.challengeResolutions[x.id]||'待处理'}`)].join('\n');
  };
  M.download=(name,text,type='text/plain;charset=utf-8')=>{const url=URL.createObjectURL(new Blob([text],{type}));const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);};
  M.copy=async text=>{
    try{if(navigator.clipboard?.writeText){await navigator.clipboard.writeText(text);return true;}}catch(e){/* browser denies permission: try a user-gesture fallback */}
    const active=document.activeElement,area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();let ok=false;try{ok=document.execCommand('copy');}catch(e){}area.remove();active?.focus();if(!ok)throw Error('浏览器不允许复制，请使用 TXT 导出，或选中文本手动复制。');return true;
  };
})(Muse);
