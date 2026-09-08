(function(M){
  // The product ships with one deliberately fictional demo. It is a fixture,
  // not a user Case, and is never copied into the user's saved Case list.
  M.demos=[
    {
      id:'audio',
      name:'Auralab · 通勤降噪耳机',
      subtitle:'产品证明 → 真实场景体验 → 自主选择',
      source:'SIMULATED CASE：虚构消费电子品牌 Auralab 的通勤耳机策略演示。通勤者需要听清内容，同时不想与环境完全隔绝。计划展示可切换的聆听模式，并让用户自主比较；无实测性能数据，不承诺降噪数值或安全效果。',
      context:{
        brand:'Auralab（虚构品牌）',
        product:'可切换聆听模式的无线耳机',
        goal:'Launch',
        who:'每天乘公共交通的通勤者',
        scene:'在地铁、站台和办公室之间切换',
        need:'专注聆听，同时保留对环境的自主控制',
        tension:'想屏蔽干扰，却担心错过报站或同事提醒',
        positioning:'把聆听选择权还给用户',
        strengths:'可切换聆听模式与试戴体验，实际能力待实测',
        ip:'',
        community:'早期体验用户（待招募）',
        offline:'一处体验点（待确认）',
        content:'产品操作演示、模式对比说明',
        partnerships:'暂无外部 IP 合作',
        budget:'小预算；优先单点体验',
        timing:'新品发布前测试，发布时演示，发布后回访',
        channels:'官网, 抖音, 线下',
        resources:'产品经理、内容制作、体验支持',
        geography:'单城市试点',
        restrictions:'不使用未经测试的性能对比，不做交通安全承诺'
      }
    }
  ];

  M.makeDemo=id=>{
    const d=M.demos.find(x=>x.id===id);
    if(!d)throw Error('Demo 不存在');
    const c=M.newCase(d.source);
    // A stable route identifies the fixture without putting it in storage.
    c.id='demo-'+d.id;
    c.name=d.name;
    c.kind='demo';
    c.context={...M.emptyContext(),...M.clone(d.context)};
    c.sources[0].label='SIMULATED CASE · 非真实市场研究';
    c.stages.context.status='needs_input';
    return c;
  };
})(Muse);
