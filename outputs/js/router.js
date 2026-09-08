(function(M){
  M.route={
    read(){const parts=location.hash.slice(1).split('/');return {view:['login','studio','library','workflow'].includes(parts[0])?parts[0]:'login',id:/^[\w-]+$/.test(parts[1]||'')?parts[1]:null,step:Math.max(0,Math.min(5,Number(parts[2])||0))};},
    go(view,id,step=0,replace=false){const hash='#'+view+(view==='studio'&&id?'/'+id+'/'+step:'');if(replace){history.replaceState(null,'',hash);window.dispatchEvent(new Event('hashchange'));}else if(location.hash!==hash)location.hash=hash;else window.dispatchEvent(new Event('hashchange'));}
  };
})(Muse);
