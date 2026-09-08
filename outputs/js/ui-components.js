(function(M){
  const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const evidenceLabels={'VERIFIED':'已验证','INFERENCE':'推断','ASSUMPTION':'策略假设','TO VALIDATE':'待验证'};
  const badge=status=>`<span class="evidence-badge" data-evidence="${e(status)}">${e(evidenceLabels[status]||M.statusLabel(status)||status)}</span>`;
  const sourceName=s=>s?.label||({text:'用户输入',image:'用户截图',url:'网页来源','url-pasted':'用户提供链接'}[s?.type]||'案例材料');
  // Resolve references against this Case at render time, including older saved claims.
  // Internal IDs stay in the model/JSON, never in the evidence reading surface.
  const sourceNames=(x,c)=>{
    const refs=[...new Set([...(x.sourceIds||[]),x.verification?.sourceId].filter(Boolean))];
    if(c)return [...new Set(refs.map(id=>{const source=c.sources.find(s=>s.id===id);return source?sourceName(source):'引用材料暂不可用';}))];
    return Array.isArray(x.sourceLabels)?x.sourceLabels.filter(v=>typeof v==='string'):[];
  };
  const claim=(x,c)=>{
    if(!x)return '';
    const names=sourceNames(x,c),v=x.verification;
    return `<div class="claim">${badge(x.status)}<p>${e(x.text)}</p><details class="evidence-detail"><summary>查看证据详情</summary><p>${e(x.basis||'待补充依据')}</p><p class="evidence-source">来源：${e(names.join('、')||'尚未关联来源材料')}</p>${v?`<dl class="verification-record"><dt>支持摘录</dt><dd>${e(v.excerpt)}</dd><dt>核验人</dt><dd>${e(v.reviewer)}</dd><dt>核验时间</dt><dd>${e(v.at||'未记录')}</dd></dl>`:''}</details></div>`;
  };
  const field=(label,value)=>`<div class="brief-field"><b>${e(M.t(label))}</b><span>${e(value)}</span></div>`;
  const card=(label,x,c)=>`<article class="info-card"><h4 class="card-label">${e(M.t(label))}</h4>${typeof x==='object'?claim(x,c):`<p class="body-copy">${e(x)}</p>`}</article>`;
  const challenge=(items,c)=>!items?.length?'':`<section class="challenge-section"><div class="section-title"><div><p class="eyebrow">策略挑战 / STRATEGIC CHALLENGE</p><h3>先挑战，再投入。</h3></div><span class="panel-code">${items.length} 个当前案例问题</span></div><p class="challenge-intro">不替方案找赞美，先检查用户参与、品牌资格、产品连接和执行条件。</p><div class="challenge-grid">${items.map(x=>`<article class="challenge-card"><span class="risk-severity">${e(M.statusLabel(x.severity)||x.severity)}</span><h4>${e(x.risk.text)}</h4>${badge(x.risk.status)}${field('为什么 / Why',x.why)}${field('如何修正 / How to Fix',x.fix)}<label class="resolution-label">处理方式<select data-resolution="${e(x.id)}"><option value="待处理" ${!c.challengeResolutions[x.id]?'selected':''}>待处理</option>${['接受建议，待验证','调整方案后复核','暂不处理，保留风险'].map(v=>`<option ${c.challengeResolutions[x.id]===v?'selected':''}>${v}</option>`).join('')}</select></label></article>`).join('')}</div></section>`;
  const analysisNotes=c=>`<details class="analysis-notes">
    <summary>关于本次分析</summary>
    <dl>
      <div><dt>分析范围</dt><dd>本次推演基于当前案例材料与用户输入，用于完成第一轮策略判断。</dd></div>
      <div><dt>判断状态</dt><dd><span class="analysis-status-list">已验证 · 推断 · 策略假设 · 待验证</span></dd></div>
      <div><dt>分析边界</dt><dd>本次结果不等同于实时市场监测或真实消费者调研结果。</dd></div>
    </dl>
  </details>`;
  M.ui={e,badge,claim,field,card,challenge,analysisNotes,sourceName};
})(Muse);
