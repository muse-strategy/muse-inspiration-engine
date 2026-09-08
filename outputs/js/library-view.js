(function(M){
  const {e,badge}=M.ui;
  M.renderLibrary=(cases,filter='recent',query='')=>{
    const demoCards=M.demos.map(d=>`<article class="library-card demo-card"><span class="demo-badge">SIMULATED CASE / 模拟案例</span><h2>${e(d.name)}</h2><p>${e(d.subtitle)}</p><p>从一个消费电子品牌的增长问题开始，看看一个信号如何被推演成策略。</p><button class="secondary-button" data-demo="${d.id}">载入演示 →</button></article>`).join('');
    if(filter==='demo')return demoCards;
    const matches=cases.filter(c=>(filter!=='saved'||c.saved)&&(filter!=='outputs'||c.stages.express.status==='ready')&&(`${c.name} ${c.context.brand} ${c.context.product}`).toLowerCase().includes(query.toLowerCase())).sort((a,b)=>(b.openedAt||b.updatedAt).localeCompare(a.openedAt||a.updatedAt));
    if(!matches.length)return filter==='recent'?demoCards:'<div class="empty-state">这里暂时没有匹配的记录。<br>在 Studio 开始一个案例，或载入模拟案例。草稿自动保存在当前浏览器。</div>';
    return matches.map(c=>{
      const stage=M.method[c.currentStep],status=c.stages[stage.key].status;
      return `<article class="library-card"><time>${e(new Date(c.updatedAt).toLocaleString('zh-CN'))}</time><div class="card-top"><span class="stage-chip">${e(stage.display||M.t(stage.name))} <small>${e(stage.name)}</small> · ${e(M.statusLabel(status))}</span>${c.kind==='demo'?'<span class="demo-badge">SIMULATED CASE / 模拟案例</span>':''}</div><h2>${e(c.name)}</h2><p>${e(c.context.brand||'背景待补充')} / ${e(c.context.goal||'目标待确认')}</p>${filter==='sources'?c.sources.map(s=>`<details><summary>${e(s.label||s.type)}</summary><p>${e(s.url||'用户提交')}</p><p>${e(s.text)}</p>${s.image?`<img class="source-thumbnail" src="${e(s.image.preview?.startsWith('data:image/jpeg;base64,')?s.image.preview:'')}" alt="保存的截图预览">`:''}</details>`).join(''):`<p>${e(c.sources[0]?.text.slice(0,140)||'暂无材料')}</p>`}<div class="library-actions"><button class="secondary-button" data-open="${c.id}">打开 / 继续 →</button><button class="text-button" data-save-case="${c.id}">${c.saved?'取消收藏':'收藏'}</button><button class="text-button" data-rename="${c.id}">重命名</button><button class="text-button danger" data-delete="${c.id}">删除</button></div></article>`;
    }).join('');
  };
})(Muse);
