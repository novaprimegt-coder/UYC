/* UYC V1.1.0 — sitio estático. Credenciales: solo cifradas en almacenamiento local. */
(function(){
"use strict";
const records=Array.isArray(window.UYC_RECORDS)?window.UYC_RECORDS:[];
const $=(q,el=document)=>el.querySelector(q);
const esc=s=>String(s===undefined||s===null?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const nl=s=>esc(s).replace(/\n/g,"<br>");
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
let view="inicio",current=records[0]?.id||null,filter="",unlocked=null,visible=new Set(),toastTimer,carouselIndex=0;
const names={inicio:"Inicio",registros:"Empresas y plataformas",ficha:"Ficha detallada",identidad:"Identidad visual",redes:"Redes sociales",accesos:"Accesos y seguridad",enlaces:"Enlaces y pendientes"};
const selected=()=>records.find(x=>x.id===current)||records[0]||null;
function btn(label,action,extra=""){return '<button type="button" class="btn '+extra+'" data-action="'+esc(action)+'">'+esc(label)+'</button>'}
function tag(s){return '<span class="tag">'+esc(s)+'</span>'}
function tags(xs){return '<div class="taglist">'+(xs||[]).map(tag).join("")+'</div>'}
function field(k,v,copy=true){const missing=v===null||v===undefined||v==="";return '<div class="field"><label>'+esc(k)+'</label><div class="value"><span class="'+(missing?"muted":"")+'">'+esc(missing?"No registrado":v)+'</span>'+(copy&&!missing?'<button class="btn copy" type="button" data-copy="'+esc(v)+'">Copiar</button>':"")+'</div></div>'}
function link(label,url){return url?'<a class="btn sm" target="_blank" rel="noopener noreferrer" href="'+esc(url)+'">↗ '+esc(label)+'</a>':'<span class="fineprint">Pendiente de crear o confirmar</span>'}
function card(title,inner){return '<section class="card pad"><h3>'+esc(title)+'</h3>'+inner+'</section>'}
function top(title,sub,kicker="REGISTRO UYC"){return '<div class="kicker">'+esc(kicker)+'</div><h1 class="title">'+esc(title)+'</h1><p class="sub">'+esc(sub)+'</p>'}
function section(title,sub=""){return '<div class="heading"><h2>'+esc(title)+'</h2><small>'+esc(sub)+'</small></div>'}
function badge(s){return '<span class="pill warn">'+esc(s)+'</span>'}
function recordTile(r){return '<article class="card rec"><div class="rec-mark"><img src="assets/taskflow/image4.png" alt="Logo oficial cuadrado TaskFlow" loading="lazy" onerror="this.hidden=true"></div><div class="rec-main"><h3>'+esc(r.nombre)+'</h3><p>'+esc(r.tipo)+'</p>'+badge(r.estado)+'</div><button class="btn primary" data-open="'+esc(r.id)+'">Abrir ficha ↗</button></article>'}
function items(r){return (r?.activos||[]).length}
function countSocial(){return records.reduce((n,r)=>n+(r.redes||[]).length,0)}
function countMedia(){return records.reduce((n,r)=>n+items(r),0)}
function home(){
return top("Todo tu ecosistema, en un solo lugar.","Organización centralizada de empresas, marcas, aplicaciones, identidades digitales y recursos oficiales.","UYC · CENTRO MAESTRO")
+'<section class="hero"><div><div class="pills"><span class="pill">Centro de organización UYC</span><span class="pill warn">Actualización por versiones</span></div><h2>Una plataforma.<br><em>Toda tu información organizada.</em></h2><p>Explora y consulta tus registros desde una página web central. Cada nueva empresa se incorporará sin eliminar la anterior.</p><div class="actions">'+btn("Ver registros","goto:registros","primary")+btn("Identidad visual","goto:identidad")+'</div></div><img class="hero-art" src="assets/taskflow/image1.png" alt="Arte Hero oficial de TaskFlow" draggable="false"></section>'
+section("Galería oficial de TaskFlow","PNG originales • proporciones intactas")
+'<div class="home-preview-list"><button type="button" data-action="goto:identidad"><img src="assets/taskflow/image2.png" alt="Logo principal" loading="lazy"><span>Logo principal</span></button><button type="button" data-action="goto:identidad"><img src="assets/taskflow/image5.png" alt="Logo horizontal" loading="lazy"><span>Logo horizontal</span></button><button type="button" data-action="goto:identidad"><img src="assets/taskflow/image6.png" alt="Isotipo" loading="lazy"><span>Isotipo</span></button><button type="button" data-action="goto:identidad"><img src="assets/taskflow/image1.png" alt="Arte Hero" loading="lazy"><span>Arte Hero</span></button></div>'
+'<div class="grid stats">'+[[records.length,"Empresas y plataformas","Registros incorporados"],[countMedia(),"Recursos visuales","Registrados"],[countSocial(),"Redes sociales","Registradas o pendientes"],[records.reduce((n,r)=>n+(r.cuentas||[]).length,0),"Cuentas relacionadas","Registros vinculados"]].map(x=>'<div class="card stat"><span>'+esc(x[1])+'</span><b>'+x[0]+'</b><small>'+esc(x[2])+'</small></div>').join("")+'</div>'
+section("Empresas y plataformas","Selecciona una ficha")+'<div class="rows">'+(records.length?records.map(recordTile).join(""):'<div class="card empty">No hay registros incorporados.</div>')+'</div>'
+'<p class="mini-note">Las contraseñas no se publican en el sitio. Los datos de cada registro se actualizan en el repositorio UYC.</p>';
}
function allRecords(){
const arr=records.filter(r=>norm(JSON.stringify(r)).includes(norm(filter)));
return top("Empresas y plataformas","Todos los registros acumulados y organizados en UYC.","CATÁLOGO GENERAL")
+'<div class="notice">Los registros se añaden progresivamente a esta misma página. La información existente permanece disponible.</div>'
+'<div class="rows">'+(arr.length?arr.map(recordTile).join(""):'<div class="card empty">No se encontraron registros para esta búsqueda.</div>')+'</div>';
}
function detail(){
const r=selected();if(!r)return '<div class="empty">No hay empresas registradas.</div>';
return top(r.nombre,r.tipo,"FICHA INSTITUCIONAL")+recordTile(r)
+section("Información general")+'<div class="grid cards2">'
+card("Descripción",'<div class="text-block">'+nl(r.descripcion)+'</div>')
+card("Identidad y estado",field("Nombre oficial",r.nombre)+field("Tipo",r.tipo,false)+field("Estado",r.estado,false)+field("Nombre correcto",r.identidad?.nombre_oficial,false))
+'</div>'+section("Filosofía y desarrollo")
+'<div class="grid cards2">'+card("Misión",'<div class="text-block">'+nl(r.mision)+'</div>')+card("Visión",'<div class="text-block">'+nl(r.vision)+'</div>')+card("Propósito",'<div class="text-block">'+nl(r.proposito)+'</div>')+card("Objetivo general",'<div class="text-block">'+nl(r.objetivo)+'</div>')+'</div>'
+section("Valores de la plataforma")+card("Valores institucionales",tags(r.valores))
+section("Información principal")+'<div class="grid cards2">'+card("Identidad digital",field("Correo principal propuesto",r.contacto?.correo)+field("Estado del correo",r.contacto?.correo_estado,false)+field("Usuario principal",r.contacto?.usuario)+field("Usuario alternativo",r.contacto?.usuario_alternativo)+field("Teléfono / WhatsApp",r.contacto?.whatsapp,false))
+card("Presencia web",field("Sitio oficial",r.web?.url)+field("Dominio",r.web?.dominio)+field("Ruta",r.web?.ruta)+field("Hosting",r.web?.alojamiento,false)+field("Protocolo",r.web?.protocolo,false)+field("Estado indicado",r.web?.estado,false)+link("Abrir sitio TaskFlow",r.web?.url))+'</div>';
}
function assetInfo(r){
 const files=["image2.png","image3.png","image4.png","image5.png","image6.png","image1.png","image7.png","image8.png"];
 const dims=[[256,384],[1254,1254],[1254,1254],[2172,724],[1254,1254],[1672,941],[1254,1254],[1254,1254]];
 const filenames=["TaskFlow_logo-principal_256x384.png","TaskFlow_logo-secundario_1254x1254.png","TaskFlow_logo-cuadrado_1254x1254.png","TaskFlow_logo-horizontal_2172x724.png","TaskFlow_isotipo_1254x1254.png","TaskFlow_arte-hero_1672x941.png","TaskFlow_variante-complementaria-A_1254x1254.png","TaskFlow_variante-complementaria-B_1254x1254.png"];
 return (r.activos||[]).map((a,i)=>({...a,src:"assets/taskflow/"+files[i],file:files[i],filename:filenames[i],w:dims[i][0],h:dims[i][1],transparent:i!==5}));
}
function identity(){
 const r=selected();if(!r)return '<div class="empty">No registrado</div>';
 const entries=assetInfo(r);if(!entries.length)return top("Identidad visual",r.nombre);
 carouselIndex=((carouselIndex%entries.length)+entries.length)%entries.length;
 const active=entries[carouselIndex];
 const label=a=>a.w+" × "+a.h+" px";
 const desc=active.uso||"Identidad visual de TaskFlow";
 return top("Biblioteca de identidad visual","Ocho piezas originales. Formato, transparencia, proporción y resolución sin alteraciones.","TASKFLOW / ARCHIVOS OFICIALES")
 +'<div class="notice">Las imágenes mostradas y las descargas deben corresponder a los PNG originales del documento oficial. Se mantienen sus medidas exactas y los fondos transparentes, sin recortes ni rediseños.</div>'
 +'<div class="asset-showcase">'
 +'<div id="assetDisplay" class="asset-display '+(active.transparent?'transparent':'')+'"><button class="asset-arrow prev" type="button" aria-label="Recurso anterior" data-slide="-1">‹</button><img src="'+esc(active.src)+'" alt="'+esc(active.nombre)+'" draggable="false" onerror="this.closest(&quot;.asset-display&quot;).classList.add(&quot;missing&quot;)" onload="this.closest(&quot;.asset-display&quot;).classList.remove(&quot;missing&quot;)"><div class="asset-placeholder">El archivo original aún no está alojado en este repositorio.<br>No se muestra una imagen inventada en su lugar.</div><button class="asset-arrow next" type="button" aria-label="Recurso siguiente" data-slide="1">›</button></div>'
 +'<div class="asset-info"><span class="mini-label">RECURSO '+String(carouselIndex+1).padStart(2,"0")+' / '+String(entries.length).padStart(2,"0")+'</span><h2>'+esc(active.nombre)+'</h2><p>'+esc(desc)+'</p>'
 +'<div class="asset-specs"><div><span>Resolución original</span><strong>'+label(active)+'</strong></div><div><span>Formato</span><strong>PNG original</strong></div><div><span>Fondo</span><strong>'+(active.transparent?'Transparente (alfa)':'Integrado en la imagen')+'</strong></div><div><span>Relación</span><strong>'+(active.w>active.h?'Horizontal':active.w<active.h?'Vertical':'Cuadrada 1:1')+'</strong></div><div><span>Nombre original en Word</span><strong>'+esc(active.file)+'</strong></div></div>'
 +'<div class="actions"><a class="btn primary" href="'+esc(active.src)+'" download="'+esc(active.filename)+'">↓ Descargar PNG</a><button class="btn" type="button" data-asset="'+esc(active.src)+'">Ver tamaño original ↗</button></div></div></div>'
 +'<div class="asset-filmstrip" role="group" aria-label="Carrusel de las ocho imágenes">'+entries.map((a,i)=>'<button class="asset-thumb '+(i===carouselIndex?'active':'')+'" data-select-slide="'+i+'" aria-label="'+esc(a.nombre)+'" aria-pressed="'+(i===carouselIndex?'true':'false')+'"><span class="timg"><img src="'+esc(a.src)+'" loading="lazy" alt="'+esc(a.nombre)+'" onerror="this.hidden=true"></span><b>'+esc(a.nombre)+'</b><small>'+label(a)+'</small></button>').join("")+'</div>'
 +section("Todas las imágenes originales",entries.length+" recursos individuales")
 +'<div class="media-grid">'+entries.map((a,i)=>'<article class="card media"><div class="preview"><img src="'+esc(a.src)+'" loading="lazy" alt="'+esc(a.nombre)+'" onerror="this.hidden=true;this.nextElementSibling.hidden=false"><span class="symbol" hidden>Sin archivo</span></div><b>'+esc(a.nombre)+'</b><small>'+a.w+' × '+a.h+' px • PNG '+(a.transparent?'transparente':'con fondo')+'</small><p>'+esc(a.uso||"")+'</p><div class="actions"><a class="btn primary sm" href="'+esc(a.src)+'" download="'+esc(a.filename)+'">↓ Descargar</a><button class="btn sm" data-select-slide="'+i+'">Ver</button></div></article>').join("")+'</div>'
 +section("Normas visuales")+card("Identidad de TaskFlow",'<p class="text-block">'+esc(r.identidad?.estilo)+'</p>'+tags(r.identidad?.colores));
}
function social(){
const r=selected();if(!r)return "";
return top("Redes sociales",r.nombre+" · Cuentas oficiales, propuestas y pendientes.","IDENTIDAD DIGITAL")
+'<div class="notice">Los nombres de usuario son propuestas y las cuentas sociales permanecen pendientes hasta su creación o confirmación.</div>'
+'<div class="grid cards2">'+(r.redes||[]).map(s=>'<div class="card social"><div class="social-top"><b>'+esc(s.plataforma)+'</b><span class="status">'+esc(s.estado)+'</span></div>'
+field("Nombre visible",s.nombre)+field("Usuario principal",s.usuario)+field("Usuario alternativo",s.alternativo)+field("Correo asociado",s.correo)
+field("Enlace",s.url,false)+link("Abrir cuenta",s.url)+'</div>').join("")+'</div>';
}
function access(){
const r=selected();if(!r)return "";
return top("Accesos y seguridad",r.nombre+" · Cuentas y contraseñas protegidas.","ACCESOS DEL SISTEMA")
+'<div class="notice"><b>Protección de contraseñas:</b> el repositorio público no contiene credenciales reales. Puedes guardar contraseñas cifradas solo en este navegador. No se sincronizan entre dispositivos y necesitas recordar tu clave maestra.</div>'
+'<div class="grid cards2">'+(r.cuentas||[]).map(c=>card(c.nombre,field("Usuario",c.usuario||"No registrado")+field("Correo",c.correo||"No registrado")+field("Repositorio",c.repositorio,false)+field("Estado",c.estado,false)+'<p class="mini-note">'+esc(c.notas)+'</p>'+link("Abrir enlace",c.url))).join("")+'</div>'
+section("Caja fuerte local")+'<div class="card pad"><h3>Contraseñas en este dispositivo</h3><p class="text-block">Usa cifrado AES-GCM con una clave maestra creada por ti. Las credenciales nunca se incluyen en GitHub y no se comparten con otras personas o dispositivos.</p><div class="actions">'+btn(unlocked?"Gestionar contraseñas":"Configurar / abrir caja fuerte","vault","primary")+(unlocked?btn("Bloquear","vault-lock"):"")+'</div><div id="vaultFields"></div></div>'
+section("Verificación adicional")+card("Autenticación de dos pasos",tags(r.seguridad?.dos_pasos)+'<p class="mini-note">'+esc(r.seguridad?.separacion)+'</p>');
}
function links(){
const r=selected();if(!r)return "";
return top("Enlaces y pendientes",r.nombre+" · Recursos digitales y asuntos por confirmar.","CONTROL DE INFORMACIÓN")
+'<div class="grid cards2">'
+card("Sitios y repositorios",field("Página principal",r.web?.url)+link("Abrir página oficial",r.web?.url)+field("Repositorio GitHub",r.web?.repositorio)+link("Abrir repositorio",r.web?.repositorio)+field("Propietario",r.web?.propietario)+field("Enlace original proporcionado",r.web?.original)+field("Nota del repositorio",r.web?.nota_repositorio,false))
+card("Pendientes de confirmar",'<div class="rows">'+(r.pendientes||[]).map((p,i)=>'<div class="field"><label>PENDIENTE '+(i+1)+'</label><span>'+esc(p)+'</span></div>').join("")+'</div>')+'</div>'
+section("Notas importantes")+card("Registro de observaciones",'<div class="rows">'+(r.notas||[]).map((n,i)=>'<div class="field"><span>'+esc((i+1)+". "+n)+'</span></div>').join("")+'</div>');
}
const pages={inicio:home,registros:allRecords,ficha:detail,identidad:identity,redes:social,accesos:access,enlaces:links};
function render(){
document.title="UYC · "+names[view];
$("#crumb").textContent=names[view];
document.querySelectorAll("[data-view]").forEach(x=>{x.classList.toggle("active",x.dataset.view===view);x.setAttribute("aria-current",x.dataset.view===view?"page":"false")});
$("#page").innerHTML=pages[view]();
if(view==="accesos")renderVaultFields();
}
function navigate(v){if(!pages[v])return;view=v;filter="";$("#search").value="";render();closeMenu();window.scrollTo(0,0)}
function openRecord(id){if(records.some(r=>r.id===id)){current=id;navigate("ficha")}}
function toast(msg){clearTimeout(toastTimer);const el=$("#toast");el.textContent=msg;el.hidden=false;toastTimer=setTimeout(()=>el.hidden=true,2600)}
async function copy(value){try{await navigator.clipboard.writeText(value);toast("Copiado correctamente")}catch{toast("No se pudo copiar; revisa los permisos del navegador")}}
function closeMenu(){$("#side").classList.remove("open");$("#overlay").classList.remove("open")}
function closeModal(){$("#modalCover").hidden=true;$("#modalBody").innerHTML=""}
function showModal(html){$("#modalBody").innerHTML=html;$("#modalCover").hidden=false}
const keyFor=()=> "uyc:vault:"+selected().id+":v1";
function hasVault(){try{return !!localStorage.getItem(keyFor())}catch{return false}}
function b64(u){let s="";u.forEach(n=>s+=String.fromCharCode(n));return btoa(s)}
function ub64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
const enc=new TextEncoder(),dec=new TextDecoder();
async function derive(pass,salt,n=220000){const passKey=await crypto.subtle.importKey("raw",enc.encode(pass),"PBKDF2",false,["deriveKey"]);return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations:n,hash:"SHA-256"},passKey,{name:"AES-GCM",length:256},false,["encrypt","decrypt"])}
async function encrypt(pass,data){const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));const key=await derive(pass,salt);const result=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,enc.encode(JSON.stringify(data)));return {v:1,salt:b64(salt),iv:b64(iv),ct:b64(new Uint8Array(result))}}
async function decrypt(pass){const obj=JSON.parse(localStorage.getItem(keyFor()));const k=await derive(pass,ub64(obj.salt));const r=await crypto.subtle.decrypt({name:"AES-GCM",iv:ub64(obj.iv)},k,ub64(obj.ct));return JSON.parse(dec.decode(r))}
function renderVaultFields(){const el=$("#vaultFields");if(!el)return;if(!unlocked){el.innerHTML='<p class="fineprint">Caja fuerte '+(hasVault()?"configurada, actualmente bloqueada":"todavía no configurada")+'.</p>';return}el.innerHTML='<div class="field"><label>Contraseña principal del correo</label><div class="value"><span>'+(visible.has("email")?esc(unlocked.email||"No registrada"):"••••••••")+'</span><div class="actions"><button class="btn sm" data-secret="email">Mostrar / ocultar</button><button class="btn copy" data-secret-copy="email">Copiar</button></div></div></div><div class="field"><label>Contraseña general de redes sociales</label><div class="value"><span>'+(visible.has("redes")?esc(unlocked.redes||"No registrada"):"••••••••")+'</span><div class="actions"><button class="btn sm" data-secret="redes">Mostrar / ocultar</button><button class="btn copy" data-secret-copy="redes">Copiar</button></div></div></div>'}
function vaultModal(){if(!crypto?.subtle){toast("El cifrado no está disponible en este navegador");return}if(unlocked){showModal('<h2>Administrar caja fuerte</h2><p>Para modificar las credenciales bloquea y vuelve a abrir con tu clave maestra.</p><div class="actions"><button class="btn" data-action="vault-lock">Bloquear</button><button class="btn" data-action="vault-delete">Eliminar datos locales</button></div>');return}if(hasVault()){showModal('<h2>Desbloquear caja fuerte</h2><p>La contraseña maestra nunca se almacena.</p><form id="unlockForm"><label for="masterUnlock">Clave maestra</label><input id="masterUnlock" type="password" required autocomplete="current-password"><div class="actions"><button class="btn primary" type="submit">Desbloquear</button><button class="btn" type="button" data-action="close-modal">Cancelar</button></div></form>');return}showModal('<h2>Crear caja fuerte local</h2><p>Estos valores se cifrarán únicamente en este navegador, con tu clave maestra personal.</p><form id="createForm"><label for="masterCreate">Nueva clave maestra (mínimo 12 caracteres)</label><input id="masterCreate" type="password" minlength="12" required autocomplete="new-password"><label for="masterAgain">Confirmar clave maestra</label><input id="masterAgain" type="password" minlength="12" required autocomplete="new-password"><label for="passwordEmail">Contraseña de correo</label><input id="passwordEmail" type="password" autocomplete="off"><label for="passwordRedes">Contraseña de redes sociales</label><input id="passwordRedes" type="password" autocomplete="off"><div class="actions"><button class="btn primary" type="submit">Guardar cifrado</button><button class="btn" type="button" data-action="close-modal">Cancelar</button></div></form>')}
async function handleVaultForm(form){const b=form.querySelector('[type="submit"]');b.disabled=true;try{if(form.id==="createForm"){const m=$("#masterCreate").value;if(m.length<12||m!==$("#masterAgain").value){toast("La clave maestra no coincide");return}const values={email:$("#passwordEmail").value,redes:$("#passwordRedes").value};localStorage.setItem(keyFor(),JSON.stringify(await encrypt(m,values)));unlocked=values;toast("Credenciales cifradas en este dispositivo")}else{unlocked=await decrypt($("#masterUnlock").value);toast("Caja fuerte desbloqueada")}visible.clear();closeModal();render()}catch{toast("No se pudo validar o guardar la caja fuerte")}finally{if(b.isConnected)b.disabled=false}}
document.addEventListener("click",async e=>{
const download=e.target.closest("a[download]");if(download){if(download.dataset.ready==="true")return;e.preventDefault();try{const res=await fetch(download.href,{method:"HEAD"});if(!res.ok)throw Error("missing");download.dataset.ready="true";download.click();delete download.dataset.ready}catch{toast("El archivo PNG original aún no está alojado en UYC")}return}
const slide=e.target.closest("[data-select-slide]");if(slide){carouselIndex=Number(slide.dataset.selectSlide);if(view!=="identidad")navigate("identidad");else render();return}
const step=e.target.closest("[data-slide]");if(step){const len=assetInfo(selected()).length;carouselIndex=(carouselIndex+Number(step.dataset.slide)+len)%len;render();return}
const nav=e.target.closest("[data-view]");if(nav){navigate(nav.dataset.view);return}
const rec=e.target.closest("[data-open]");if(rec){openRecord(rec.dataset.open);return}
const c=e.target.closest("[data-copy]");if(c){await copy(c.dataset.copy);return}
const s=e.target.closest("[data-secret]");if(s){const k=s.dataset.secret;if(!unlocked?.[k]){toast("Esta contraseña no está registrada");return}visible.has(k)?visible.delete(k):visible.add(k);renderVaultFields();if(visible.has(k))setTimeout(()=>{visible.delete(k);renderVaultFields()},15000);return}
const sc=e.target.closest("[data-secret-copy]");if(sc){const val=unlocked?.[sc.dataset.secret];val?copy(val):toast("Contraseña no registrada");return}
const asset=e.target.closest("[data-asset]");if(asset){const url=asset.dataset.asset;try{const rsp=await fetch(url,{method:"HEAD"});if(!rsp.ok)throw Error("missing");window.open(url,"_blank","noopener,noreferrer")}catch{toast("El original todavía no está publicado en UYC")};return}
const ac=e.target.closest("[data-action]");if(!ac)return;
const action=ac.dataset.action;if(action.startsWith("goto:"))return navigate(action.slice(5));
if(action==="vault")return vaultModal();
if(action==="close-modal")return closeModal();
if(action==="vault-lock"){unlocked=null;visible.clear();closeModal();render();toast("Caja fuerte bloqueada");return}
if(action==="vault-delete"){if(!confirm("¿Eliminar las credenciales cifradas de ESTE dispositivo? No se pueden recuperar después."))return;localStorage.removeItem(keyFor());unlocked=null;visible.clear();closeModal();render();toast("Credenciales locales eliminadas");return}
});
document.addEventListener("submit",e=>{if(!e.target.matches("#createForm,#unlockForm"))return;e.preventDefault();handleVaultForm(e.target)});
$("#search").addEventListener("input",e=>{filter=e.target.value;if(filter&&!["registros"].includes(view))view="registros";render()});
$("#hamb").addEventListener("click",()=>{$("#side").classList.toggle("open");$("#overlay").classList.toggle("open")});
$("#overlay").addEventListener("click",closeMenu);
$("#closeModal").addEventListener("click",closeModal);
$("#modalCover").addEventListener("click",e=>{if(e.target.id==="modalCover")closeModal()});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeModal();closeMenu()}});
render();
})();