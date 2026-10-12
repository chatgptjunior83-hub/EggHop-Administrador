(()=>{'use strict';const $=id=>document.getElementById(id);const tabs=[...document.querySelectorAll('[data-filter]')];let entries=[],filter='pending';
async function api(path,options={}){const res=await fetch('/.netlify/functions/api?route='+encodeURIComponent(path),{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json',...(options.body?{'Content-Type':'application/json'}:{})},...options});const obj=await res.json().catch(()=>({}));if(!res.ok)throw Error(obj.error||'Erro na comunicação.');return obj;}
function alertMsg(text,ok=false){$('dashMsg').textContent=text;$('dashMsg').className='notice'+(ok?' good':'');}
function show(admin){$('dashboard').hidden=!admin;$('loginCard').hidden=admin;if(admin)refresh();}
function element(tag,cls,text){const el=document.createElement(tag);if(cls)el.className=cls;if(text!==undefined)el.textContent=text;return el;}
function render(){for(const type of ['pending','approved','blocked'])$('count'+type[0].toUpperCase()+type.slice(1)).textContent=entries.filter(x=>x.status===type).length;
  const list=$('requests');list.replaceChildren();const visible=entries.filter(x=>filter==='all'||x.status===filter);
  if(!visible.length){list.append(element('div','empty','Nenhum pedido nesta categoria.'));return;}
  for(const x of visible){const card=element('article','req');const left=element('div');left.append(element('h2','',x.nick));
    left.append(element('p','','Código para comparar no TikTok:'));left.append(element('div','code',x.code));
    left.append(element('p','',`Enviado em ${new Date(x.createdAt).toLocaleString('pt-BR')}`));
    if(x.updatedAt!==x.createdAt)left.append(element('p','',`Última mudança: ${new Date(x.updatedAt).toLocaleString('pt-BR')}`));
    left.append(element('div','tag',x.status==='pending'?'⏳ Aguardando':x.status==='approved'?'✅ Liberado':'⛔ Bloqueado'));
    const right=element('div','buttons');
    for(const [state,text,cls] of [['approved','✓ Liberar','approve'],['blocked','✕ Bloquear','block'],['pending','↺ Pendente','wait']]){
      if(x.status===state)continue;const btn=element('button',cls,text);btn.type='button';btn.addEventListener('click',async()=>{
        if(state==='approved'&&!confirm(`Você conferiu o nick ${x.nick} e o código ${x.code} na mensagem do TikTok?`))return;
        if(state==='blocked'&&!confirm(`Bloquear o acesso de ${x.nick}?`))return;
        btn.disabled=true;try{await api('admin-decision',{method:'POST',body:JSON.stringify({id:x.id,decision:state})});alertMsg('Acesso atualizado.',true);await refresh();}catch(err){alertMsg(err.message);btn.disabled=false;}
      });right.append(btn);
    }
    if(x.status==='approved'||x.everApproved===true){
      const release=element('button','wait','↻ Desvincular nick');release.type='button';
      release.title='Bloqueia este navegador e permite novo pedido com este nick.';
      release.addEventListener('click',async()=>{
        if(!confirm(`Desvincular o nick ${x.nick}? O navegador antigo será bloqueado e o nome poderá ser solicitado novamente. Faça isso apenas depois de confirmar pelo TikTok.`))return;
        release.disabled=true;
        try{await api('admin-release-nick',{method:'POST',body:JSON.stringify({id:x.id})});alertMsg(`Nick ${x.nick} liberado para uma nova solicitação.`,true);await refresh();}
        catch(err){alertMsg(err.message);release.disabled=false;}
      });right.append(release);
    }
    card.append(left,right);list.append(card);
  }
}
async function refresh(){try{const result=await api('admin-list');entries=result.requests||[];render();}catch(e){alertMsg(e.message);if(/restrito/.test(e.message))show(false);}}
$('loginForm').addEventListener('submit',async e=>{e.preventDefault();const b=$('loginButton');b.disabled=true;$('loginMsg').textContent='Entrando...';try{await api('admin-login',{method:'POST',body:JSON.stringify({password:$('password').value})});$('password').value='';$('loginMsg').textContent='';show(true);}catch(err){$('loginMsg').textContent=err.message;}finally{b.disabled=false;}});
$('refresh').addEventListener('click',refresh);
$('logout').addEventListener('click',async()=>{try{await api('admin-logout',{method:'POST',body:'{}'});}finally{show(false);}});
for(const tab of tabs)tab.addEventListener('click',()=>{filter=tab.dataset.filter;for(const t of tabs)t.classList.toggle('selected',t===tab);render();});
api('admin-status').then(s=>{if(s.admin)show(true);}).catch(e=>{$('loginMsg').textContent=e.message;});
})();
