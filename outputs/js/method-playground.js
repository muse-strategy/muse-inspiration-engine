(function(){
  'use strict';

  const questionFeedback={
    why:{
      label:'先追问原因',
      lines:['什么变了？','这股关注，背后藏着哪种需要？'],
      closing:'从“发生了什么”，再往下走一步。'
    },
    who:{
      label:'先找人',
      lines:['谁真的在意？','他们是在表达、寻找，还是互相影响？'],
      closing:'人群一换，信号的意义也会换。'
    },
    brand:{
      label:'先看关系',
      lines:['品牌能带来什么？','它和这股关注之间，有没有一条自然的线？'],
      closing:'有关系，才有进入的理由。'
    },
    act:{
      label:'先做了再说',
      lines:['等等。','谁在意？','为什么在意？','和品牌有什么关系？','用户为什么愿意参与？'],
      closing:'先把问题想清楚，再决定要不要做。'
    }
  };

  const stations={
    brand:{
      audience:'正在寻找一种参与方式',
      opportunity:'把关注变成可参与的体验',
      context:'品牌的能力成为入口',
      strategy:'从品牌能力出发，设计一条进入话题的路径'
    },
    audience:{
      audience:'正在寻找被理解的同伴',
      opportunity:'把关注变成彼此连接的时刻',
      context:'用户的表达成为线索',
      strategy:'从真实感受出发，让参与先于传播发生'
    },
    platform:{
      audience:'正在寻找继续发生的场景',
      opportunity:'把关注变成可持续的流动',
      context:'平台的关系成为放大器',
      strategy:'从分发关系出发，让信号找到下一站'
    }
  };

  const $=(selector,root=document)=>root.querySelector(selector);
  const $$=(selector,root=document)=>[...root.querySelectorAll(selector)];

  function renderQuestion(key,button,feedback){
    const item=questionFeedback[key];
    $$('.method-choice',button.closest('.method-choice-panel')).forEach(x=>x.classList.toggle('is-selected',x===button));
    feedback.classList.remove('is-visible');
    // Restart the small reveal each time without touching a Case or storage.
    feedback.innerHTML=`<p class="method-feedback-label">${item.label}</p><div class="method-reveal-list"></div><p class="method-feedback-closing"></p>`;
    feedback.classList.add('is-visible');
    const list=$('.method-reveal-list',feedback),closing=$('.method-feedback-closing',feedback);
    item.lines.forEach((line,index)=>{
      const row=document.createElement('span');
      row.textContent=line;
      row.style.setProperty('--reveal-delay',`${index*170}ms`);
      list.append(row);
    });
    closing.textContent=item.closing;
    closing.style.setProperty('--reveal-delay',`${item.lines.length*170+120}ms`);
  }

  function renderStation(key,button,card){
    const item=stations[key];
    $$('.method-station',card).forEach(x=>{
      const selected=x===button;
      x.classList.toggle('is-active',selected);
      x.setAttribute('aria-selected',String(selected));
    });
    ['audience','opportunity','context','strategy'].forEach(name=>{
      const target=$(`#method-branch-${name}`,card);
      if(target)target.textContent=item[name];
    });
    card.dataset.station=key;
    $('.method-branch-path',card)?.classList.remove('is-shifting');
    requestAnimationFrame(()=>$('.method-branch-path',card)?.classList.add('is-shifting'));
  }

  function init(root=document){
    const mapSection=$('.method-map-section',root);
    if(mapSection){
      // Method is initially hidden in the SPA; trigger when its view is actually shown.
      const reveal=()=>{mapSection.classList.remove('is-revealed');requestAnimationFrame(()=>requestAnimationFrame(()=>mapSection.classList.add('is-revealed')))};
      reveal();
      new MutationObserver(()=>{if($('#view-workflow',root)?.classList.contains('is-active'))reveal()}).observe($('#view-workflow',root)||root,{attributes:true,attributeFilter:['class']});
    }
    const questionFeedbackEl=$('#method-question-feedback',root);
    if(questionFeedbackEl){
      $$('.method-choice',root).forEach(button=>button.addEventListener('click',()=>renderQuestion(button.dataset.methodQuestion,button,questionFeedbackEl)));
    }
    const branchCard=$('.method-branch-card',root);
    if(branchCard){
      $$('.method-station',branchCard).forEach(button=>button.addEventListener('click',()=>renderStation(button.dataset.methodStation,button,branchCard)));
    }
    const simulation=$('[data-simulation]',root);
    if(simulation){
      const paths={
        audience:{label:'AUDIENCE-FIRST',nodes:['Signal','人真正关心的事','尚未被满足的需要','让参与有意义','共同完成一个小行动'],note:'从谁在意开始，机会会靠近真实的人。'},
        brand:{label:'BRAND-FIRST',nodes:['Signal','品牌可以承担的角色','值得被相信的能力','一个自然的进入理由','让能力被体验'],note:'从品牌能做什么开始，策略会长出清晰的边界。'},
        culture:{label:'CULTURE-FIRST',nodes:['Signal','正在发生的文化张力','人们重新理解它的方式','一个新的表达空间','让话题继续发生'],note:'从变化本身开始，策略会寻找新的语境。'}
      };
      $$('.simulation-choices button',simulation).forEach(button=>button.addEventListener('click',()=>{
        const path=paths[button.dataset.simPath];
        $$('.simulation-choices button',simulation).forEach(x=>x.classList.toggle('is-selected',x===button));
        const result=$('[data-simulation-result]',simulation);result.hidden=false;
        result.innerHTML=`<p class="simulation-label">${path.label} · YOUR STRATEGY SHAPE</p><div class="simulation-nodes">${path.nodes.map((node,i)=>`<div class="simulation-node"><small>${String(i+1).padStart(2,'0')}</small><strong>${node}</strong></div>${i<path.nodes.length-1?'<span aria-hidden="true">↓</span>':''}`).join('')}</div><p class="simulation-note">${path.note}</p>`;
      }));
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>init());
  else init();
})();
