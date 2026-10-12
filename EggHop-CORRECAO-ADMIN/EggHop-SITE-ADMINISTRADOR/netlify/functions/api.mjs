import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';

const COOKIE = 'egghop_admin_access';
const TTL = 12*3600;
const H = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'};
const reply=(v,status=200,extra={})=>new Response(JSON.stringify(v),{status,headers:{...H,...extra}});
const cfg=()=>({password:process.env.ADMIN_PASSWORD||'',secret:process.env.ADMIN_SESSION_SECRET||'',bridge:process.env.ADMIN_BRIDGE_SECRET||'',player:process.env.PLAYER_SITE_URL||''});
function valid(e){
  if(e.password.length<16||e.secret.length<32||e.bridge.length<32||e.secret===e.bridge||e.password===e.bridge)return false;
  try {const u=new URL(e.player);return u.protocol==='https:'&&u.pathname==='/'&&!u.search&&!u.hash&&!u.username&&!u.password;} catch {return false;}
}
const digest=x=>createHash('sha256').update(x).digest('hex');
const mac=(s,t)=>createHmac('sha256',s).update(t).digest('hex');
function eq(a,b){if(typeof a!=='string'||typeof b!=='string'||a.length!==b.length)return false;return timingSafeEqual(Buffer.from(a),Buffer.from(b));}
function token(secret){let exp=Math.floor(Date.now()/1000)+TTL;return `${exp}.${mac(secret,'admin:'+exp)}`;}
function getCookie(req){const raw=req.headers.get('cookie')||'';const item=raw.split(';').map(x=>x.trim()).find(x=>x.startsWith(COOKIE+'='));return item?item.slice(COOKIE.length+1):'';}
function logged(req,secret){const m=/^(\d{10})\.([a-f0-9]{64})$/.exec(getCookie(req));if(!m)return false;const n=Number(m[1]),now=Date.now()/1000;return n>now&&n<now+TTL+300&&eq(m[2],mac(secret,'admin:'+m[1]));}
function setCookie(value,age,req){const secure=new URL(req.url).protocol==='https:'?'; Secure':'';return `${COOKIE}=${value}; Path=/; HttpOnly; SameSite=Strict${secure}; Max-Age=${age}`;}
function sameOrigin(req){const origin=req.headers.get('origin');if(!origin)return true;try{return new URL(origin).host===new URL(req.url).host;}catch{return false;}}
async function body(req){if(req.headers.get('content-type')?.split(';')[0]?.trim()!=='application/json')throw Object.assign(Error('Envie JSON.'),{status:415});const text=await req.text();if(text.length>4096)throw Object.assign(Error('Dados grandes demais.'),{status:413});try{return JSON.parse(text);}catch{throw Object.assign(Error('JSON inválido.'),{status:400});}}
function rateKey(req,s){const ip=(req.headers.get('x-nf-client-connection-ip')||req.headers.get('x-forwarded-for')||'').split(',')[0].trim().slice(0,80)||'unknown';return 'admin-login/'+mac(s,ip);}
async function bridge(action,method,e,payload){
  const target=new URL('/.netlify/functions/api',e.player);
  target.searchParams.set('route',action);
  const options={method,headers:{'X-EggHop-Bridge':e.bridge,'Accept':'application/json'},signal:AbortSignal.timeout(15000)};
  if(method==='POST'){options.headers['Content-Type']='application/json';options.body=JSON.stringify(payload);}
  let response;try{response=await fetch(target,options);}catch{return reply({error:'Não foi possível conectar ao site dos jogadores. Confira PLAYER_SITE_URL.'},502);}
  let result;try{result=await response.json();}catch{return reply({error:'O site dos jogadores retornou uma resposta inválida.'},502);}
  return reply(result,response.status);
}
export default async function handler(request){
  const route=new URL(request.url).searchParams.get('route')||'';
  if(!['GET','POST'].includes(request.method))return reply({error:'Método não permitido.'},405);
  if(request.method==='POST'&&!sameOrigin(request))return reply({error:'Origem inválida.'},403);
  const e=cfg();if(!valid(e))return reply({error:'Configure ADMIN_PASSWORD, ADMIN_SESSION_SECRET, ADMIN_BRIDGE_SECRET e PLAYER_SITE_URL na Netlify.'},503);
  try{
    if(route==='admin-status'&&request.method==='GET')return reply({admin:logged(request,e.secret)});
    if(route==='admin-login'&&request.method==='POST'){
      const s=getStore({name:'egghop-admin-login-v1',consistency:'strong'});
      const key=rateKey(request,e.secret);const now=Date.now();const prior=await s.get(key,{type:'json',consistency:'strong'});
      if(prior?.blockedUntil>now)return reply({error:'Muitas tentativas. Aguarde 15 minutos.'},429);
      const {password}=await body(request);
      if(!eq(digest(String(password||'')),digest(e.password))){
        const count=prior?.reset>now?(prior?.count||0)+1:1;
        await s.setJSON(key,{count,reset:now+900000,blockedUntil:count>=5?now+900000:0});
        return reply({error:'Senha de administrador incorreta.'},401);
      }
      await s.delete(key);
      return reply({admin:true},200,{'Set-Cookie':setCookie(token(e.secret),TTL,request)});
    }
    if(route==='admin-logout'&&request.method==='POST')return reply({admin:false},200,{'Set-Cookie':setCookie('',0,request)});
    if(!logged(request,e.secret))return reply({error:'Acesso restrito ao administrador.'},403);
    if(route==='admin-list'&&request.method==='GET')return bridge('admin-list','GET',e);
    if(route==='admin-decision'&&request.method==='POST')return bridge('admin-decision','POST',e,await body(request));
    if(route==='admin-release-nick'&&request.method==='POST')return bridge('admin-release-nick','POST',e,await body(request));
    return reply({error:'Rota não encontrada.'},404);
  }catch(err){if(err?.status&&err.status<500)return reply({error:err.message},err.status);console.error('EggHop admin:',err);return reply({error:'Erro temporário no painel de administrador.'},503);}
}
