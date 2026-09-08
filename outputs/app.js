(function(M){
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)],e=M.ui.e;
  // Explicit developer-only reset for QA: /index.html?reset-onboarding=1.
  // Normal visits never mutate onboarding state during initialization.
  if(new URLSearchParams(location.search).get('reset-onboarding')==='1')M.onboarding.reset();
  let cases=M.storage.read(),active=null,view='login',filter='recent',outputId='strategy',run=null,urlRun=null,imageAttachment=null,toastTimer=null,manage=null;
  const toast=message=>{const t=$('#toast');t.textContent=message;t.classList.add('is-active');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('is-active'),4200);};
  function storageNotice(){const el=$('#storage-warning');el.hidden=!M.storage.warning;el.textContent=M.storage.warning;}
  function completeOnboarding(){M.onboarding?.complete();}
  function isDemoCase(c){return c?.kind==='demo' || String(c?.id||'').startsWith('demo-');}
  function persist(){
    // Demo fixtures are ephemeral: they can be explored and routed, but never
    // enter the user's Case registry or recent/saved lists.
    if(active && !isDemoCase(active)){active.updatedAt=M.now();const i=cases.findIndex(c=>c.id===active.id);if(i>=0)cases[i]=active;else cases.unshift(active);}
    if(!isDemoCase(active))M.storage.write(cases);
    storageNotice();
  }
  function cancelRun(){if(!run)return;const task=run;task.controller.abort();if(active?.id===task.id && active.stages[task.step].status==='running'){active.stages[task.step]={status:'needs_input',revision:active.revision,error:'运行已取消，可以重试。'};}run=null;persist();}
  function cancelURL(){if(urlRun){urlRun.abort();urlRun=null;}$('#read-url').disabled=false;}
  function setInput(){
    const sources=active?.sources||[],s=sources.find(x=>x.type!=='image')||sources[0];$('#source-input').value=s?.text||'';
    const image=sources.find(x=>x.image)?.image;imageAttachment=image||null;
    $('#image-input').value='';$('#image-attachment').hidden=!image;
    if(image){$('#image-preview').src=image.preview?.startsWith('data:image/jpeg;base64,')?image.preview:'';$('#image-name').textContent=image.name+' · 保存的压缩预览';$('#image-text').value=sources.find(x=>x.image)?.text||'';}else{$('#image-preview').removeAttribute('src');$('#image-name').textContent='';$('#image-text').value='';}
    $('#source-state').textContent=s?'来源：'+M.ui.sourceName(s):'来源：等待输入';
  }
  function renderChrome(){
    $('#workspace').hidden=!active;document.body.classList.toggle('has-case',!!active);
    if(!active)return;
    $('#workspace-title').textContent=active.name;$('#case-mode').textContent=active.kind==='demo'?'SIMULATED CASE / 模拟案例':'用户案例';
    $('#case-meta').textContent='版本 '+active.revision+' · '+(M.storage.warning?'未保存至本地':'草稿保存在此浏览器')+' · '+(active.saved?'已收藏':'未收藏');
    $('#source-badge').textContent='来源：'+(active.sources.map(M.ui.sourceName).join(' + ')||'待输入');$('#save-analysis').textContent=active.saved?'✓ 已保存 · 更新案例':'保存到案例库';
    $('#stepper').innerHTML=M.method.map((s,i)=>`<button class="step ${i===active.currentStep?'is-active':''} ${active.stages[s.key].status==='ready'?'is-done':''}" data-step="${i}" type="button" aria-current="${i===active.currentStep?'step':'false'}"><span class="step-marker">0${i}</span><span class="step-name">${e(s.display||M.t(s.name))}<small class="step-en">${e(s.name)}</small></span><span class="step-cn">${e(s.cn)} · ${e(M.statusLabel(active.stages[s.key].status))}</span></button>`).join('');
    const step=M.method[active.currentStep];$('#stage-title').textContent=(step.display||M.t(step.name))+' / '+step.cn;$('#stage-question').textContent=step.question;$('#stage-status').textContent=M.statusLabel(active.stages[step.key].status);
    $('#stage-status').dataset.status=active.stages[step.key].status;
  }
  function renderWorkspace(){
    renderChrome();if(!active)return;
    const i=active.currentStep,key=M.STEPS[i],status=active.stages[key].status;
    $('#stage-content').innerHTML=M.renderStage(active,i,outputId);
    $('#case-notes').innerHTML=M.ui.analysisNotes(active);
    $('#stage-actions').innerHTML=i===0?'':`<button class="text-button" id="back-step">← 返回 / ${M.method[i-1].display||M.method[i-1].name}</button><div class="button-group">${status==='ready'?'<button class="secondary-button" id="regenerate-stage">重新计算本阶段</button>':''}${i<5?`<button class="primary-button" id="next-step" ${status!=='ready'||(i===3&&!active.selectedDirectionId)?'disabled':''}>下一步：${M.method[i+1].display||M.method[i+1].name} →</button>`:'<button class="primary-button" id="finish-save">保存完整案例 →</button>'}</div>`;
    if(run)$$('#context-form input, #context-form textarea, #context-form select, #confirm-context').forEach(x=>x.disabled=true);
  }
  function renderLibrary(){const labels=[['recent','最近访问'],['saved','已保存案例'],['outputs','策略输出'],['demo','模拟案例'],['sources','来源材料']];$('#library-filters').innerHTML=labels.map(([id,label])=>`<button class="filter-button ${filter===id?'is-active':''}" data-filter="${id}" aria-pressed="${filter===id}">${label}</button>`).join('');$('#library-grid').innerHTML=M.renderLibrary(cases,filter,$('#library-search').value);}
  function renderRoute(){
    const route=M.route.read();
    // First visit: Login → Method. Returning visit: Login is bypassed and
    // the user lands directly in Studio. Explicit hash navigation is still
    // respected, so Method remains reachable from the nav at any time.
    if(!location.hash){M.route.go(M.onboarding?.isComplete()?'studio':'login',null,0,true);return;}
    view=route.view;
    if(route.id && active?.id!==route.id){
      cancelRun();
      const found=cases.find(c=>c.id===route.id);
      const demoId=route.id.startsWith('demo-')?route.id.slice(5):null;
      if(found){active=M.normalize(found);active.openedAt=M.now();setInput();}
      else if(demoId && M.demos.some(d=>d.id===demoId)){active=M.makeDemo(demoId);active.currentStep=route.step;setInput();}
      else{toast('该案例不存在或已删除，已返回 Studio。');active=null;setInput();M.route.go('studio',null,0,true);return;}
    }
    if(view==='studio'){completeOnboarding();if(active){active.currentStep=route.id?route.step:active.currentStep;persist();}}
    $$('.view').forEach(x=>x.classList.toggle('is-active',x.id==='view-'+view));$$('.nav-item').forEach(x=>{x.classList.toggle('is-active',x.dataset.view===view);x.setAttribute('aria-current',x.dataset.view===view?'page':'false');});
    if(view==='studio')renderWorkspace();if(view==='library')renderLibrary();
  }
  function gotoStep(i){if(!active)return;M.route.go('studio',active.id,i);}
  function newAnalysis(){cancelRun();cancelURL();if($('#url-modal').open)$('#url-modal').close();active=null;outputId='strategy';setInput();$('#analysis-status').textContent='';$('#analysis-status').classList.remove('is-active');M.route.go('studio',null,0,true);renderWorkspace();$('#source-input').focus();window.scrollTo({top:0,behavior:'smooth'});}
  async function runStep(step,advance=false){
    if(!active || run){if(run)toast('当前分析仍在运行，请等待或取消。');return;}
    if(!M.canRun(active,step)){toast('先完成有效的上游步骤；Build 需要选定方向。');return;}
    const task={id:active.id,step,revision:active.revision,controller:new AbortController()};run=task;
    active.stages[step]={status:'running',revision:active.revision,error:''};persist();renderWorkspace();$('#analysis-status').textContent='正在推演当前策略问题…';$('#analysis-status').classList.add('is-active');$('#start-analysis').disabled=true;
    try{
      const result=await M.analysis.run(step,active,{signal:task.controller.signal});
      if(run!==task || active.id!==task.id || active.revision!==task.revision)return;
      M.commitResult(active,step,result);run=null;persist();
      if(step==='context' && advance){active.currentStep=1;gotoStep(1);await runStep('discover');}else renderWorkspace();
    }catch(err){if(err.name!=='AbortError' && active?.id===task.id){active.stages[step]={status:'error',revision:active.revision,error:'本次处理失败：'+err.message+'。检查输入后可以 Retry。'};toast('分析未完成，可重试。');}if(run===task)run=null;persist();renderWorkspace();}
    finally{if(!run){$('#start-analysis').disabled=false;$('#analysis-status').classList.remove('is-active');}}
  }
  async function next(){if(!active)return;const i=active.currentStep,key=M.STEPS[i];if(active.stages[key].status!=='ready' || (i===3&&!active.selectedDirectionId)){toast('请先完成当前阶段并选择方向。');return;}active.currentStep=i+1;gotoStep(i+1);if(active.stages[M.STEPS[i+1]].status!=='ready')await runStep(M.STEPS[i+1]);}
  async function attachSource(source){
    cancelRun();if(!active){active=M.newCase();active.sources=[source];active.name=source.text.slice(0,42)||'新策略';}else M.updateSources(active,[source]);
    // A signal is enough to start the first useful result. Context is a
    // follow-up form, not a gate that prevents a user from seeing an opportunity.
    active.currentStep=1;active.stages.context.status='needs_input';persist();setInput();gotoStep(1);renderWorkspace();$('#workspace').scrollIntoView({behavior:'smooth',block:'start'});
    await runStep('discover');
  }
  async function startAnalysis(){
    if(run){toast('分析正在运行，请等待或取消。');return;}
    const text=$('#source-input').value.trim(),imageText=$('#image-text').value.trim();
    if(imageAttachment&&!imageText){toast('截图未进行 OCR，请先补充截图中的文字。');$('#image-text').focus();return;}
    if(!text&&!imageText){toast('请先输入品牌、Brief 或来源材料。');$('#source-input').focus();return;}
    if(text.length+imageText.length>60000){toast('材料过长，请缩减至 60,000 字以内。');return;}
    const source={id:M.id(),type:imageAttachment?'image':'text',text:imageAttachment?[text,imageText].filter((x,i,a)=>x&&a.indexOf(x)===i).join('\n'):text,label:imageAttachment?'用户截图 + 人工文字（未 OCR）':'用户输入',url:'',...(imageAttachment?{image:M.clone(imageAttachment)}:{})};
    if(active && !imageAttachment && active.sources.length===1 && active.sources[0].text===text){active.currentStep=1;gotoStep(1);await runStep('discover');}else await attachSource(source);
    $('#analysis-status').textContent='机会已生成 · 可继续补充背景设定以深化策略。';$('#analysis-status').classList.add('is-active');
  }
  $('#login-enter').addEventListener('click',()=>M.route.go(M.onboarding?.isComplete()?'studio':'workflow',null,0,true));
  $('#start-analysis').addEventListener('click',startAnalysis);
  $('#source-input').addEventListener('keydown',event=>{if(event.key==='Enter'&&!event.isComposing&&event.keyCode!==229&&(!event.shiftKey||event.metaKey||event.ctrlKey)){event.preventDefault();startAnalysis();}});
  $('#source-input').addEventListener('input',()=>{
    if(!active)return;const s=active.sources.find(x=>x.type!=='image')||active.sources[0];if(!s || s.text===$('#source-input').value)return;
    cancelRun();const sources=M.clone(active.sources);sources[sources.findIndex(x=>x.id===s.id)].text=$('#source-input').value;M.updateSources(active,sources);persist();renderWorkspace();
  });
  $('#image-input').addEventListener('change',async event=>{try{const img=await M.sources.image(event.target.files[0]);imageAttachment=img;$('#image-preview').src=img.preview;$('#image-name').textContent=img.name;$('#image-attachment').hidden=false;$('#image-text').value='';$('#source-state').textContent='截图待补充文字 · 无 OCR';toast('截图已读取；请补文字后提交。');}catch(err){event.target.value='';toast(err.message);}});
  $('#use-image-text').addEventListener('click',startAnalysis);
  $('#remove-image').addEventListener('click',()=>{imageAttachment=null;$('#image-input').value='';$('#image-attachment').hidden=true;$('#image-text').value='';if(active?.sources.some(s=>s.image)){cancelRun();M.updateSources(active,active.sources.map(s=>{const x={...s,type:'text',label:'用户补充文字'};delete x.image;return x;}));persist();renderWorkspace();}toast('截图已移除，文字保留。');});
  const urlDialog=$('#url-modal');
  function openURL(){cancelURL();$('#url-input').value='';$('#url-fallback').value='';$('#url-status').textContent='读取受跨域和登录限制；失败后可直接粘贴正文。';$('#url-status').className='url-status is-active';$('#url-fallback-wrap').hidden=false;$('#use-url-fallback').hidden=false;$('#read-url').hidden=false;urlDialog.showModal();$('#url-input').focus();}
  $('#open-url-modal').addEventListener('click',openURL);['close-url-modal','cancel-url'].forEach(id=>$('#'+id).addEventListener('click',()=>urlDialog.close()));urlDialog.addEventListener('close',cancelURL);
  $('#read-url').addEventListener('click',async()=>{
    if(urlRun)return;let url;try{url=M.sources.validateURL($('#url-input').value.trim());}catch(err){$('#url-status').textContent=err.message;return;}
    const controller=new AbortController();urlRun=controller;const timeout=setTimeout(()=>controller.abort('timeout'),6500);$('#read-url').disabled=true;$('#url-status').textContent='正在读取网页，最多等待 6.5 秒；取消可立即停止。';
    try{const source=await M.sources.readURL(url,controller.signal);if(urlRun!==controller||!urlDialog.open)return;urlRun=null;urlDialog.close();await attachSource(source);toast('网页正文已记录，内容声明仍需核验。');}
    catch(err){if(urlRun===controller&&urlDialog.open){$('#url-status').textContent='暂时无法读取该页面内容（跨域、超时、登录或平台限制）。请粘贴正文继续。';$('#url-status').className='url-status is-active is-error';$('#url-fallback').focus();}}
    finally{clearTimeout(timeout);if(urlRun===controller)urlRun=null;$('#read-url').disabled=false;}
  });
  $('#use-url-fallback').addEventListener('click',async()=>{try{const url=M.sources.validateURL($('#url-input').value.trim()),text=$('#url-fallback').value.trim();if(!text)throw Error('请粘贴页面正文。');if(text.length>60000)throw Error('正文过长，请保留相关片段。');urlDialog.close();await attachSource({id:M.id(),type:'url-pasted',text,url,label:'用户提供链接 + 用户粘贴正文'});}catch(err){$('#url-status').textContent=err.message;}});
  $('#stage-content').addEventListener('input',event=>{
    if(!active || !event.target.closest('#context-form') || !event.target.name)return;
    cancelRun();const form=$('#context-form');const context=Object.fromEntries(new FormData(form));M.updateContext(active,{...M.emptyContext(),...context});persist();renderChrome();
  });
  $('#stage-content').addEventListener('submit',event=>{if(event.target.id!=='context-form')return;event.preventDefault();if(run)return;const c={...M.emptyContext(),...Object.fromEntries(new FormData(event.target))};M.updateContext(active,c);const missing=M.missingContext(c);if(missing.length&&!$('#allow-unknown').checked){active.stages.context.status='needs_input';$('#context-errors').textContent='请补充：'+missing.join(' / ')+'，或明确勾选以未知项继续。';persist();renderChrome();return;}if(!active.sources.some(s=>s.text.trim())){$('#context-errors').textContent='原始材料为空，请先补充来源文字。';return;}runStep('context',true);});
  $('#stage-content').addEventListener('change',event=>{const id=event.target.dataset.resolution;if(id && active){active.challengeResolutions[id]=event.target.value;persist();toast('处理方式已记录；这不代表风险已经验证消除。');}});
  document.addEventListener('click',async event=>{
    const b=event.target.closest('button');if(!b)return;
    try{
      if(b.dataset.view){if(run)cancelRun();if(b.dataset.view==='studio')completeOnboarding();M.route.go(b.dataset.view,b.dataset.view==='studio'?active?.id:null,active?.currentStep||0);return;}
      if(b.dataset.step){if(run)cancelRun();gotoStep(Number(b.dataset.step));return;}
      if(b.dataset.direction){cancelRun();M.chooseDirection(active,b.dataset.direction);persist();renderWorkspace();toast('方向已选择；旧 Campaign、内容和指标已失效。点击 Next 生成。');return;}
      if(b.dataset.output){outputId=b.dataset.output;renderWorkspace();return;}
      if(b.dataset.filter){filter=b.dataset.filter;renderLibrary();return;}
      if(b.dataset.demo){cancelRun();active=M.makeDemo(b.dataset.demo);active.stages.context.status='needs_input';setInput();gotoStep(0);return;}
      if(b.dataset.open){cancelRun();const c=cases.find(c=>c.id===b.dataset.open);active=M.normalize(c);active.openedAt=M.now();setInput();persist();gotoStep(active.currentStep);return;}
      if(b.dataset.saveCase){const c=cases.find(x=>x.id===b.dataset.saveCase);c.saved=!c.saved;persist();renderLibrary();return;}
      if(b.dataset.rename||b.dataset.delete){manage={id:b.dataset.rename||b.dataset.delete,type:b.dataset.delete?'delete':'rename'};const c=cases.find(x=>x.id===manage.id);$('#manage-title').textContent=manage.type==='delete'?'删除此案例？':'重命名案例';$('#manage-copy').textContent=manage.type==='delete'?'只删除当前浏览器中的案例，不能撤销。建议先导出 Case JSON。':'名称变化不会改变策略背景或生成结果。';$('#rename-label').hidden=manage.type==='delete';$('#rename-input').disabled=manage.type==='delete';$('#rename-input').value=c.name;$('#manage-dialog').showModal();(manage.type==='delete'?$('#manage-cancel'):$('#rename-input')).focus();return;}
      switch(b.id){
        case 'new-analysis':case 'library-new':newAnalysis();break;
        case 'save-analysis':case 'finish-save':if(active){if(isDemoCase(active)){toast('模拟案例仅供查看，不会写入你的案例库。');}else{active.saved=true;persist();renderChrome();toast(M.storage.warning?'保存未成功，请导出 JSON。':'已保存到案例库。');}}break;
        case 'run-stage':await runStep(M.STEPS[active.currentStep]);break;
        case 'regenerate-stage':active.revision++;await runStep(M.STEPS[active.currentStep]);break;
        case 'cancel-run':cancelRun();$('#analysis-status').classList.remove('is-active');$('#start-analysis').disabled=false;renderWorkspace();break;
        case 'back-step':cancelRun();gotoStep(active.currentStep-1);break;
        case 'next-step':await next();break;
        case 'copy-brief':await M.copy(M.outputText(active,outputId));toast('已复制到剪贴板。');break;
        case 'export-brief':M.download('muse-'+outputId+'.txt',M.outputText(active,outputId));toast('已导出 TXT。');break;
        case 'export-md':M.download('muse-'+outputId+'.md',M.outputText(active,outputId),'text/markdown;charset=utf-8');toast('已导出 Markdown。');break;
        case 'backup-case':case 'export-case':M.download('muse-case-'+active.id+'.json',JSON.stringify(active,null,2),'application/json');toast('已导出完整 Case JSON。');break;
      }
    }catch(err){toast(err.message);}
  });
  $('#library-search').addEventListener('input',renderLibrary);
  $('#import-case').addEventListener('change',async event=>{try{const f=event.target.files[0];if(!f)return;if(f.size>5*1024*1024)throw Error('案例文件超过 5 MB。');const c=M.normalize(JSON.parse(await f.text()));M.auditClaims(c);c.id=M.id();c.name+=' · 导入';c.openedAt=M.now();cases.unshift(c);persist();renderLibrary();toast('已导入为独立案例，原案例未覆盖。');}catch(err){toast('导入失败：'+err.message);}finally{event.target.value='';}});
  $('#manage-cancel').addEventListener('click',()=>$('#manage-dialog').close());
  $('#manage-form').addEventListener('submit',event=>{event.preventDefault();if(!manage)return;const c=cases.find(x=>x.id===manage.id);if(!c)return;if(manage.type==='delete'){if(active?.id===c.id){cancelRun();active=null;setInput();}cases=cases.filter(x=>x.id!==c.id);}else{const name=$('#rename-input').value.trim();if(!name)return;c.name=name;if(active?.id===c.id)active.name=name;}persist();$('#manage-dialog').close();renderLibrary();toast(manage.type==='delete'?'案例已删除。':'案例已重命名。');manage=null;});
  $('#product-notes').innerHTML=M.ui.analysisNotes();
  window.addEventListener('hashchange',renderRoute);window.addEventListener('beforeunload',()=>{cancelRun();});
  storageNotice();renderRoute();
})(Muse);
