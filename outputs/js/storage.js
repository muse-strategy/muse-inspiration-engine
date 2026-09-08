(function(M){
  'use strict';
  const KEY='muse-cases-v5';
  const ONBOARDING_KEY='muse-onboarding-completed';
  const ONBOARDING_ALIASES=['muse_onboarding_completed'];
  const RETIRED_DEMO_BACKUP='muse-retired-demo-migration-v1';
  // These escaped signatures only identify historical demo records during
  // migration. They are not product-facing content and avoid reintroducing
  // retired fixture names into the runtime.
  const retiredSignatures=[
    String.fromCodePoint(0x733f,0x8f85,0x5bfc),
    String.fromCodePoint(0x535a,0x7269,0x9986)
  ];
  const isRetiredDemo=c=>!!(c&&(c.kind==='demo'||retiredSignatures.some(token=>JSON.stringify(c).includes(token))));

  M.storageKey=KEY;
  M.onboardingKey=ONBOARDING_KEY;
  M.onboarding={
    isComplete(){try{return [ONBOARDING_KEY,...ONBOARDING_ALIASES].some(key=>localStorage.getItem(key)==='true');}catch(e){return false;}},
    complete(){try{localStorage.setItem(ONBOARDING_KEY,'true');return true;}catch(e){return false;}},
    reset(){try{[ONBOARDING_KEY,...ONBOARDING_ALIASES].forEach(key=>localStorage.removeItem(key));return true;}catch(e){return false;}}
  };

  M.storage={
    warning:'',
    retiredDemoCount:0,
    read(){
      this.warning='';
      this.retiredDemoCount=0;
      try{
        const raw=localStorage.getItem(KEY);
        if(raw===null)return this.migrate();
        const data=JSON.parse(raw);
        if(data.version!==5 || !Array.isArray(data.cases))throw Error('案例库格式不正确');
        const valid=data.cases.filter(M.validCase);
        if(valid.length!==data.cases.length)this.warning='部分案例损坏，原始存储未覆盖。请导出备份后处理。';
        const cases=valid.filter(c=>!isRetiredDemo(c));
        this.retiredDemoCount=valid.length-cases.length;
        // Remove only retired demo records from the active v5 registry. User
        // Cases retain their original schema and values; the old v4 source is
        // never touched by this cleanup.
        if(this.retiredDemoCount && valid.length===data.cases.length){
          try{localStorage.setItem(RETIRED_DEMO_BACKUP,JSON.stringify({version:1,cases:valid.filter(isRetiredDemo)}));}catch(e){}
          try{localStorage.setItem(KEY,JSON.stringify({version:5,cases}));}catch(e){}
        }
        return cases.map(M.normalize);
      }catch(e){this.warning='无法读取本地案例库：'+e.message+'。原数据未覆盖；本次可继续使用并导出 JSON。';return [];} 
    },
    write(cases){
      try{
        const existing=localStorage.getItem(KEY);
        if(existing!==null){const d=JSON.parse(existing);if(d.version!==5 || !Array.isArray(d.cases) || !d.cases.every(M.validCase))throw Error('旧存储含损坏记录，为保护数据已停止覆盖');}
        const clean=cases.filter(c=>!isRetiredDemo(c));
        if(!clean.every(M.validCase))throw Error('案例数据校验失败');
        localStorage.setItem(KEY,JSON.stringify({version:5,cases:clean}));return true;
      }catch(e){this.warning='本地保存失败：'+e.message+'。请导出 Case JSON 备份。';return false;}
    },
    migrate(){
      const raw=localStorage.getItem('muse-library-v4');if(!raw)return [];
      let old;try{old=JSON.parse(raw);}catch(e){throw Error('旧案例库无法解析');}
      if(!Array.isArray(old))throw Error('旧案例库不是列表');
      const cases=old.filter(x=>x && typeof x.raw==='string').map((x,i)=>{
        const c=M.newCase(x.raw);c.id='legacy-'+String(x.id||i).replace(/[^\w-]/g,'');c.name=x.title||'旧版案例';c.saved=true;c.kind='legacy';c.createdAt=x.savedAt||c.createdAt;c.legacy=M.clone(x);c.sources[0] && (c.sources[0].url=x.sourceUrl||'');c.stages.context.status='needs_input';return c;
      });
      const active=cases.filter(c=>!isRetiredDemo(c));
      this.retiredDemoCount=cases.length-active.length;
      if(this.retiredDemoCount){try{localStorage.setItem(RETIRED_DEMO_BACKUP,JSON.stringify({version:1,cases:cases.filter(isRetiredDemo)}));}catch(e){}}
      // Keep muse-library-v4 intact; only the v5 working registry is written.
      if(active.length===cases.length){this.write(active);}else if(active.length){this.write(active);}
      return active;
    }
  };
})(Muse);
