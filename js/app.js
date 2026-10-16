/* UYC 5.2.0 · Controles alineados, información sin duplicados y enlaces TaskFlow confirmados. */
(function(){
"use strict";
const records=Array.isArray(window.UYC_RECORDS)?window.UYC_RECORDS:[];
const $=(q,context=document)=>context.querySelector(q);
const esc=s=>String(s===null||s===undefined?"":s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const validUrl=s=>typeof s==="string"&&/^https?:\/\/[^\s]+$/i.test(s)?s:null;
const exists=v=>!(v===null||v===undefined||String(v).trim()==="");
const missingText=v=>!exists(v)||/^(PENDIENTE|NO APLICA|PROPONER)$/i.test(String(v));
const clipboardSupported=()=>!!navigator.clipboard?.writeText;
let selectedId=null,tab="ficha",filter="",imageIndex=0;
let vaultValues=null,revealed=new Set(),toastTimer,working=false;
const homeButton=$("#brandHome"),directoryButton=$("#goDirectory"),search=$("#search"),mount=$("#app"),menuToggle=$("#menuToggle"),menuClose=$("#menuClose"),menu=$("#siteMenu"),menuBackdrop=$("#menuBackdrop"),menuLinks=$("#menuLinks"),mobileDock=$("#mobileDock");
const sectionTitles={ficha:"Ficha empresarial",imagenes:"Identidad visual",redes:"Redes y contacto",enlaces:"Repositorios y enlaces",claves:"Claves protegidas"};
function current(){return records.find(r=>r.id===selectedId)||null}
function textBlock(v){return esc(v||"PENDIENTE").replace(/\n/g,"<br>")}
function btn(label,action,style=""){return '<button class="btn '+style+'" type="button" data-action="'+esc(action)+'">'+esc(label)+'</button>'}
function external(label,link,style=""){
 const url=validUrl(link);
 return url?'<a class="btn '+style+'" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer">'+esc(label)+' ↗</a>':'<span class="under">Enlace pendiente de confirmar</span>';
}
function copyBtn(text,label="Copiar",style=""){
 if(!exists(text)||missingText(text))return "";
 return '<button class="btn small '+style+'" type="button" data-copy="'+esc(text)+'" aria-label="'+esc(label)+'">'+esc(label)+'</button>';
}
function status(s){return '<span class="status">'+esc(s||"PENDIENTE")+'</span>'}
function overline(s){return '<span class="eyebrow">'+esc(s)+'</span>'}
function heading(t,description="",suffix=""){return '<div class="section-heading"><div><h2>'+esc(t)+'</h2>'+(description?'<p>'+esc(description)+'</p>':"")+'</div>'+(suffix?'<span>'+esc(suffix)+'</span>':"")+'</div>'}
function field(label,value,canCopy=false){
 const raw=exists(value)?String(value):"Pendiente de registrar";
 const isLong=/^https?:\/\//i.test(raw)||raw.length>57;
 const classes="data-row"+(isLong&&canCopy?" data-row--long":"");
 return '<div class="'+classes+'"><div class="data-meta"><span class="data-label">'+esc(label)+'</span><span class="data-value '+(!exists(value)?'missing':'')+'">'+esc(raw)+'</span></div>'+(canCopy?copyBtn(value):"")+'</div>';
}
function card(title,body,copyValue=null){
 return '<section class="surface pad"><div class="card-heading"><h3>'+esc(title)+'</h3>'+(copyValue===null?"":copyBtn(copyValue))+'</div>'+body+'</section>';
}
function imageSource(r,kind="cuadrado"){
 const candidate=r.visual?.[kind]||r.imagenes?.[kind];
 if(candidate)return candidate;
 if(r.id==="taskflow")return kind==="hero"?"assets/taskflow/image1.png":"assets/taskflow/image4.png";
 return null;
}
function previewSource(r,source){
 if(!source)return null;
 if(r.id==="taskflow"){
  const m=source.match(/(?:^|\/)image([1-8])\.png$/);
  if(m)return "assets/taskflow/optimized/thumb-image"+m[1]+".webp";
 }
 return r.visual?.miniaturas?.[source]||source;
}
function thumbImg(r,source,alt,extra=""){
 if(!source)return "";
 const thumb=previewSource(r,source);
 return '<img src="'+esc(thumb)+'" data-original-src="'+esc(source)+'" decoding="async" loading="lazy" draggable="false" alt="'+esc(alt)+'" '+extra+'>';
}
function logo(r){
 const source=imageSource(r);
 return '<span class="company-mark">'+(source?thumbImg(r,source,"Logo de "+r.nombre):esc((r.nombre||"??").slice(0,2).toUpperCase()))+'</span>';
}
function allAssets(r){
 if(!r)return [];
 if(r.id==="taskflow"){
  const files=["image2.png","image3.png","image4.png","image5.png","image6.png","image1.png","image7.png","image8.png"];
  const ids=[2,3,4,5,6,1,7,8],dims=[[256,384],[1254,1254],[1254,1254],[2172,724],[1254,1254],[1672,941],[1254,1254],[1254,1254]];
  const filenames=["TaskFlow_logo-principal_256x384.png","TaskFlow_logo-secundario_1254x1254.png","TaskFlow_logo-cuadrado_1254x1254.png","TaskFlow_logo-horizontal_2172x724.png","TaskFlow_isotipo_1254x1254.png","TaskFlow_arte-hero_1672x941.png","TaskFlow_variante-complementaria-A_1254x1254.png","TaskFlow_variante-complementaria-B_1254x1254.png"];
  return (r.activos||[]).map((a,i)=>({nombre:a.nombre,uso:a.uso,src:"assets/taskflow/"+files[i],thumb:"assets/taskflow/optimized/thumb-image"+ids[i]+".webp",archivo:filenames[i],ancho:dims[i][0],alto:dims[i][1],transparente:i!==5})).filter(x=>x.src);
 }
 return (r.activos||[]).filter(a=>a.src||a.archivo).map(a=>{
  const src=a.src||a.archivo;
  return {nombre:a.nombre||"Recurso gráfico",uso:a.uso||"",src,thumb:a.thumb||a.miniatura||src,archivo:a.filename||src.split("/").pop(),ancho:a.w||a.ancho||null,alto:a.h||a.alto||null,transparente:a.transparent??a.transparente??null};
 });
}
function dimension(a){return a.ancho&&a.alto?a.ancho+" × "+a.alto+" px":"Original sin dimensiones registradas"}
function officialAsset(src){return !!(current()&&allAssets(current()).some(a=>a.src===src))}
function directoryItem(r){
 const assets=allAssets(r).length,socials=(r.redes||[]).length;
 return '<article class="company-row">'
 +'<div class="company-row-identity">'+logo(r)+'<div class="company-row-copy"><span class="company-overline">'+esc(r.categoria||r.tipo||"MARCA")+'</span><h3>'+esc(r.nombre)+'</h3>'
 +'<p>'+esc(r.tipo||"Empresa, marca o plataforma")+'</p></div></div>'
 +'<div class="company-row-metrics"><span><strong>'+assets+'</strong> logos</span><span><strong>'+socials+'</strong> redes</span></div>'
 +'<div class="company-row-actions"><button class="btn subtle" data-open-tab="'+esc(r.id)+':imagenes" type="button">Ver logos</button>'
 +'<button class="btn primary" data-open="'+esc(r.id)+'" type="button">Abrir empresa <span aria-hidden="true">↗</span></button></div>'
 +'</article>';
}
function directory(){
 const list=records.filter(r=>norm([r.nombre,r.tipo,r.categoria,r.estado,r.descripcion].join(" ")).includes(norm(filter)));
 return '<section class="directory-view">'
 +'<header class="directory-header"><div><span class="eyebrow">UYC / CATÁLOGO GENERAL</span>'
 +'<h1>Tu archivo de <em>empresas.</em></h1>'
 +'<p>Selecciona una marca para consultar su ficha, sus logos y sus enlaces oficiales.</p></div>'
 +'<div class="directory-counter"><strong>'+String(records.length).padStart(2,"0")+'</strong><span>'+(records.length===1?"Empresa registrada":"Empresas registradas")+'</span></div></header>'
 +'<div id="directoryList" class="directory-heading"><div><strong>Empresas registradas</strong><small>Información organizada por empresa</small></div><span>'+list.length+' '+(list.length===1?"resultado":"resultados")+'</span></div>'
 +(list.length?'<div class="company-list">'+list.map(directoryItem).join("")+'</div>':'<div class="empty"><strong>No se encontraron empresas</strong>Prueba con otro nombre o categoría.</div>')
 +'<div class="directory-bottom"><span aria-hidden="true">✦</span><p>UYC solo muestra información oficial. Para actualizar datos empresariales se modifica el código, no la página.</p></div>'
 +'</section>';
}
function companyHeading(r){
 const parts=[["ficha","Ficha","▤"],["imagenes","Logos","▧"],["redes","Redes","◎"],["enlaces","Enlaces","↗"],["claves","Claves","◇"]];
 return '<section class="company-header"><button class="crumb" type="button" data-menu-home>← Todas las empresas</button>'
 +'<div class="company-banner"><div class="company-banner-main">'+logo(r)+'<div><span class="company-overline">'+esc(r.categoria||"Empresa o marca")+'</span><h1>'+esc(r.nombre)+'</h1><p>'+esc(r.tipo||"Registro UYC")+'</p></div></div>'
 +'<div class="company-banner-status">'+status(r.estado)+'</div></div>'
 +'<nav class="company-shortcuts" aria-label="Información de '+esc(r.nombre)+'">'
 +parts.map(([key,title,symbol])=>'<button type="button" data-tab="'+key+'" class="shortcut '+(tab===key?"active":"")+'" aria-current="'+(tab===key?"page":"false")+'"><span class="shortcut-icon" aria-hidden="true">'+symbol+'</span><span>'+title+'</span></button>').join("")
 +'</nav></section>';
}
function profile(r){
 const mission=card("Misión",'<div class="copy-text">'+textBlock(r.mision)+'</div>',r.mision);
 const vision=card("Visión",'<div class="copy-text">'+textBlock(r.vision)+'</div>',r.vision);
 const extras=[["Descripción completa",r.descripcion],["Propósito",r.proposito],["Objetivo general",r.objetivo]];
 const values=card("Valores institucionales",'<div class="taglist">'+(r.valores||[]).map(v=>'<span class="tag">'+esc(v)+'</span>').join("")+'</div>',(r.valores||[]).join(", "));
 const app=r.aplicacion?card("Información de la aplicación",
  field("Versión actual",r.aplicacion.version)
 +field("Compilación",r.aplicacion.compilacion)
 +field("Disponibilidad",r.aplicacion.disponibilidad)
 +field("Compatible con",(r.aplicacion.plataformas||[]).join(", "))
 +field("Lanzamiento",r.aplicacion.lanzamiento)
 +field("Google Play",r.aplicacion.google_play_estado)):"";
 return '<div class="profile-page"><div class="profile-topline"><div><span class="eyebrow">FICHA OFICIAL</span><h2>Información esencial</h2></div><small>Copia únicamente lo que necesites</small></div>'
 +'<div class="info-rail">'
 +'<div class="info-rail-item"><span>Correo oficial</span><strong>'+esc(r.contacto?.correo||"Pendiente")+'</strong>'+copyBtn(r.contacto?.correo,"Copiar correo")+'</div>'
 +'<div class="info-rail-item"><span>Usuario principal</span><strong>'+esc(r.contacto?.usuario||"Pendiente")+'</strong>'+copyBtn(r.contacto?.usuario,"Copiar usuario")+'</div>'
 +'<div class="info-rail-item"><span>Categoría empresarial</span><strong>'+esc(r.categoria||r.tipo||"Pendiente")+'</strong>'+copyBtn(r.categoria||r.tipo,"Copiar categoría")+'</div></div>'
 +'<div class="section-heading feature-heading"><div><h2>Misión y visión</h2><p>Textos oficiales, disponibles para copiar.</p></div></div>'
 +'<div class="grid-two feature-cards">'+mission+vision+'</div>'
 +'<details class="detail-group"><summary><span><strong>Información complementaria</strong><small>Descripción, propósito, objetivos, valores y aplicación</small></span><span class="detail-toggle"><span class="detail-toggle-label"><span class="when-closed">Ver más</span><span class="when-open">Ocultar</span></span><span class="detail-expand" aria-hidden="true"></span></span></summary>'
 +'<div class="detail-group-body"><div class="grid-two">'
 +extras.map(([label,body])=>card(label,'<div class="copy-text">'+textBlock(body)+'</div>',body)).join("")
 +values+(app||"")+'</div></div></details></div>';
}
function social(r){
 const items=r.redes||[],mainUser=r.contacto?.usuario||"",mainEmail=r.contacto?.correo||"";
 const shared=card("Identidad digital común",
  field("Usuario principal",mainUser,true)
 +field("Correo principal",mainEmail,true)
 +field("Estado del correo",r.contacto?.correo_estado));
 const supportEmail=r.soporte?.correo||"";
 const support=card("Soporte y atención",
  field("Canal de atención",r.soporte?.canal||"PENDIENTE")
 +(supportEmail&&supportEmail!==mainEmail?field("Correo de soporte",supportEmail,true):"")
 +field("Atención disponible",r.soporte?.atencion||"PENDIENTE")
 +field("Teléfono",r.soporte?.telefono||r.contacto?.telefono));
 return heading("Redes y contacto","Los datos compartidos aparecen una sola vez; cada red conserva su información particular.")
 +'<div class="grid-two">'+shared+support+'</div>'
 +heading("Perfiles oficiales","Abre cada plataforma o copia exclusivamente su enlace.",items.length+" redes")
 +(items.length?'<div class="social-grid">'+items.map(a=>{
   const identityDiff=(a.nombre&&a.nombre!==r.nombre?field("Nombre de la cuenta",a.nombre):"")
     +(a.usuario&&a.usuario!==mainUser?field("Usuario propio",a.usuario,true):"")
     +(a.correo&&a.correo!==mainEmail?field("Correo propio",a.correo,true):"");
   return '<article class="surface social-card">'
    +'<div class="social-head"><h3>'+esc(a.plataforma)+'</h3>'+status(a.estado)+'</div>'
    +'<div class="social-record">'+identityDiff
    +field("Enlace oficial",a.url,true)
    +field("Verificación en dos pasos",a.dos_pasos||"PENDIENTE")
    +'</div><div class="social-actions"><span class="social-action-spacer" aria-hidden="true"></span>'+external("Abrir "+a.plataforma,a.url,"primary")+'</div></article>';
  }).join("")+'</div>'
  :'<div class="empty"><strong>Sin redes registradas</strong>Las nuevas cuentas se incorporan desde el código de UYC.</div>');
}
function repoCard(kind,obj){
 const badge=kind==="sistema"?"01 · REPOSITORIO DEL SISTEMA":"02 · REPOSITORIO DE PRESENTACIÓN";
 const label=kind==="sistema"?"Sistema o programa":"Página demostrativa o informativa";
 if(!obj||!obj.url)return '<div class="surface pad repo-card"><span class="repo-badge">'+badge+'</span><h3>'+label+'</h3><p>Pendiente de registrar en el código de UYC.</p></div>';
 const site=obj.pagina?field("Página de presentación",obj.pagina,true):"";
 const spec=obj.version?field("Versión",obj.version):"";
 const date=obj.actualizacion?field("Última actualización",obj.actualizacion):"";
 return '<article class="surface pad repo-card"><span class="repo-badge">'+badge+'</span><h3>'+label+'</h3>'
 +'<p>'+esc(obj.descripcion||"Repositorio oficial de la empresa")+'</p>'
 +'<strong>'+esc(obj.nombre||"Repositorio GitHub")+'</strong>'
 +field("Repositorio GitHub",obj.url,true)
 +spec+date+site
 +'<div class="repo-actions">'+external("Abrir repositorio",obj.url,"primary")+(obj.pagina?external("Ver página",obj.pagina):"")+'</div></article>';
}
function repositories(r){
 const repos=r.repositorios||{},apk=r.aplicacion||{};
 return heading("Repositorios oficiales","Cada empresa puede tener su sistema y su página informativa por separado.")
 +'<div class="grid-two">'+repoCard("sistema",repos.sistema)+repoCard("presentacion",repos.presentacion)+'</div>'
 +(apk.descarga_url?
   heading("Descarga de la aplicación","Acceso independiente de los repositorios.")
   +'<div class="grid-two"><section class="surface pad download-panel"><div><h3>Aplicación descargable</h3><p class="under">Instalador oficial de '+esc(r.nombre)+'.</p></div>'
   +field("Enlace de descarga",apk.descarga_url,true)
   +'<div class="card-actions">'+external("Abrir descarga oficial",apk.descarga_url,"primary")+'</div></section></div>':"")
 +((r.pendientes?.length||r.notas?.length)?
 '<details class="detail-group notes-group"><summary><span><strong>Notas y seguimiento</strong><small>Consulta los asuntos pendientes y las observaciones adicionales.</small></span><span class="detail-toggle"><span class="detail-toggle-label"><span class="when-closed">Ver notas</span><span class="when-open">Ocultar</span></span><span class="detail-expand" aria-hidden="true"></span></span></summary>'
 +'<div class="detail-group-body"><div class="grid-two">'
 +(r.pendientes?.length?card("Pendientes",'<div class="copy-text">'+[...new Set(r.pendientes)].map((x,i)=>'<p><strong>'+String(i+1)+'.</strong> '+esc(x)+'</p>').join("")+'</div>'):"")
 +(r.notas?.length?card("Observaciones",'<div class="copy-text">'+[...new Set(r.notas)].map((x,i)=>'<p><strong>'+String(i+1)+'.</strong> '+esc(x)+'</p>').join("")+'</div>'):"")
 +'</div></div></details>':"");
}
function identity(r){
 const entries=allAssets(r);
 if(!entries.length)return heading("Identidad visual","Los logos e imágenes solo se mostrarán cuando estén registrados en el código.")+
 '<div class="empty"><strong>Identidad visual pendiente</strong>Esta empresa todavía no tiene archivos visuales publicados. No se mostrarán imágenes inventadas ni descargas vacías.</div>';
 imageIndex=(imageIndex+entries.length)%entries.length;
 const chosen=entries[imageIndex];
 return heading("Identidad visual oficial","Vista previa ligera; los botones descargan el archivo original sin cambios.",entries.length+" archivos")
 +'<div class="surface asset-stage"><div class="asset-visual" id="assetVisual">'
 +'<button class="asset-step prev" data-step="-1" aria-label="Imagen anterior" type="button">‹</button>'
 +'<img src="'+esc(chosen.thumb||chosen.src)+'" data-original-src="'+esc(chosen.src)+'" alt="'+esc(chosen.nombre)+'" decoding="async" fetchpriority="high">'
 +'<div class="asset-error">No se pudo cargar la imagen. '+btn("Reintentar","retry-image","small")+'</div>'
 +'<button class="asset-step next" data-step="1" aria-label="Siguiente imagen" type="button">›</button></div>'
 +'<div class="asset-panel"><span class="small-overline">RECURSO '+(imageIndex+1)+' / '+entries.length+'</span><h2>'+esc(chosen.nombre)+'</h2><p>'+esc(chosen.uso||"Imagen oficial de la empresa")+'</p>'
 +'<div class="asset-attributes">'+field("Resolución original",dimension(chosen))+field("Formato","PNG original")+field("Transparencia",chosen.transparente===true?"Con transparencia":chosen.transparente===false?"Con fondo":"Según el archivo original")+field("Nombre del archivo",chosen.archivo)+'</div>'
 +'<div class="asset-actions"><a class="btn primary" download="'+esc(chosen.archivo)+'" href="'+esc(chosen.src)+'">↓ Descargar PNG</a>'
 +'<button type="button" class="btn" data-preview="'+esc(chosen.src)+'">Ver tamaño original</button>'
 +'<button type="button" class="btn subtle" data-copy-png="'+esc(chosen.src)+'">Copiar PNG</button></div></div></div>'
 +heading("Todos los recursos oficiales","Selecciona una imagen para verla arriba o descarga su PNG original.")
 +'<div class="asset-grid">'+entries.map((a,i)=>'<article class="surface asset-card '+(i===imageIndex?"chosen":"")+'"><button class="asset-card-select" type="button" data-image="'+i+'" aria-label="Ver '+esc(a.nombre)+'">'
 +'<span class="asset-card-image">'+thumbImg(r,a.src,a.nombre)+'</span><strong>'+esc(a.nombre)+'</strong><small>'+esc(dimension(a))+'</small></button>'
 +'<div class="btn-row"><button type="button" class="btn" data-image="'+i+'">Ver</button><a class="btn primary" href="'+esc(a.src)+'" download="'+esc(a.archivo)+'">↓ PNG</a></div></article>').join("")+'</div>';
}
const vaultKey=()=>current()?"uyc:vault:"+current().id+":v1":null;
function hasVault(){try{return !!localStorage.getItem(vaultKey())}catch{return false}}
const encoder=new TextEncoder(),decoder=new TextDecoder();
function toB64(u){let s="";for(const n of u)s+=String.fromCharCode(n);return btoa(s)}
function fromB64(s){return Uint8Array.from(atob(s),c=>c.charCodeAt(0))}
async function deriveKey(master,salt,iterations=220000){
 const secret=await crypto.subtle.importKey("raw",encoder.encode(master),"PBKDF2",false,["deriveKey"]);
 return crypto.subtle.deriveKey({name:"PBKDF2",salt,iterations,hash:"SHA-256"},secret,{name:"AES-GCM",length:256},false,["encrypt","decrypt"]);
}
async function seal(master,values){
 const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
 const key=await deriveKey(master,salt);
 const payload=await crypto.subtle.encrypt({name:"AES-GCM",iv},key,encoder.encode(JSON.stringify(values)));
 return {v:1,salt:toB64(salt),iv:toB64(iv),ct:toB64(new Uint8Array(payload))};
}
async function unseal(master){
 const item=JSON.parse(localStorage.getItem(vaultKey()));
 if(!item||item.v!==1)throw Error("Datos cifrados no compatibles");
 const key=await deriveKey(master,fromB64(item.salt));
 const result=await crypto.subtle.decrypt({name:"AES-GCM",iv:fromB64(item.iv)},key,fromB64(item.ct));
 const v=JSON.parse(decoder.decode(result));
 if(!v||typeof v!=="object")throw Error("Datos inválidos");
 return {email:typeof v.email==="string"?v.email:"",redes:typeof v.redes==="string"?v.redes:""};
}
function vault(r){
 const hasCrypto=!!crypto?.subtle;
 const hdr='<div class="vault-hero"><span class="vault-symbol">♙</span><div><h2>Claves generales de '+esc(r.nombre)+'</h2><p>Única sección editable. Los datos se cifran en este navegador y nunca se incluyen en GitHub.</p></div></div>';
 if(!hasCrypto)return heading("Contraseñas protegidas")+hdr+'<p class="notice">Este navegador no permite almacenar contraseñas cifradas. Abre la página mediante HTTPS con un navegador compatible.</p>';
 const intro=heading("Caja fuerte local","Solo dos campos: contraseña del correo principal y contraseña compartida de redes sociales.");
 if(!vaultValues)return intro+hdr+'<section class="surface pad" style="margin-top:16px"><h3>'+(hasVault()?"Caja fuerte bloqueada":"Caja fuerte sin configurar")+'</h3><p class="under">'+(hasVault()?"Introduce tu clave maestra para consultar las contraseñas guardadas.":"Crea una clave maestra para guardar las contraseñas de forma cifrada únicamente en este dispositivo.")+'</p><div class="btn-row">'+btn(hasVault()?"Desbloquear":"Crear caja fuerte","vault-start","primary")+'</div></section>'
 +'<p class="vault-warning">La clave maestra no se almacena y no existe recuperación automática. Si borras los datos del navegador, también se perderán las contraseñas. Para cuentas importantes, se recomienda un gestor de contraseñas especializado.</p>';
 return intro+hdr+'<div class="grid-two" style="margin-top:18px">'
 +secretRow("Contraseña del correo principal","email")+secretRow("Contraseña general de redes sociales","redes")+'</div>'
 +'<div class="btn-row" style="margin-top:17px">'+btn("Actualizar contraseñas","vault-edit","primary")+btn("Bloquear caja fuerte","vault-lock")+btn("Eliminar claves locales","vault-delete","subtle")+'</div>'
 +'<p class="vault-warning">Estas claves no se sincronizan entre dispositivos ni se publican en el repositorio. Usa contraseñas distintas para servicios independientes cuando sea posible.</p>';
}
function secretRow(label,key){
 const value=vaultValues?.[key]||"",show=revealed.has(key);
 return '<div class="vault-secret"><div><strong>'+esc(label)+'</strong><span class="secret">'+(show?esc(value||"No registrada"):"••••••••••")+'</span></div>'
 +'<div class="btn-row"><button class="btn small" type="button" data-secret-show="'+key+'">'+(show?"Ocultar":"Mostrar")+'</button>'+('<button class="btn small primary" type="button" data-secret-copy="'+key+'">Copiar</button>')+'</div></div>';
}
function vaultForm(isNew=false){
 return '<h2>'+(isNew?"Crear caja fuerte de "+esc(current().nombre):"Desbloquear caja fuerte")+'</h2>'
 +'<p>'+(isNew?"Una clave maestra larga protege los dos campos de contraseña. No se comparte ni se publica.":"Introduce la clave maestra creada en este dispositivo.")+'</p>'
 +'<form id="'+(isNew?"vaultCreate":"vaultUnlock")+'"><label class="form-field">Clave maestra<input type="password" name="master" minlength="12" autocomplete="'+(isNew?"new-password":"current-password")+'" required></label>'
 +(isNew?'<label class="form-field">Repetir clave maestra<input type="password" name="repeat" minlength="12" required autocomplete="new-password"></label><label class="form-field">Contraseña del correo<input type="password" name="email" autocomplete="off"></label><label class="form-field">Contraseña compartida de redes<input type="password" name="redes" autocomplete="off"></label>':"")
 +'<div class="btn-row"><button class="btn primary" type="submit">'+(isNew?"Guardar cifrado":"Desbloquear")+'</button>'+btn("Cancelar","modal-close")+'</div></form>';
}
function editForm(){
 return '<h2>Actualizar claves generales</h2><p>Introduce tu clave maestra para autenticar el cambio. Se actualizarán exclusivamente las contraseñas de esta empresa en este dispositivo.</p>'
 +'<form id="vaultEdit"><label class="form-field">Clave maestra actual<input type="password" name="master" minlength="12" required autocomplete="current-password"></label>'
 +'<label class="form-field">Contraseña del correo<input type="password" name="email" autocomplete="off" value="'+esc(vaultValues?.email||"")+'"></label>'
 +'<label class="form-field">Contraseña general de redes<input type="password" name="redes" autocomplete="off" value="'+esc(vaultValues?.redes||"")+'"></label>'
 +'<div class="btn-row"><button class="btn primary" type="submit">Actualizar cifrado</button>'+btn("Cancelar","modal-close")+'</div></form>';
}
function showModal(content,wide=false){
 $("#modalBox").classList.toggle("wide",wide);
 $("#modalBody").innerHTML=content;
 $("#modalCover").hidden=false;
 document.body.style.overflow="hidden";
}
function hideModal(){
 $("#modalCover").hidden=true;
 $("#modalBody").innerHTML="";
 document.body.style.overflow="";
}
function toast(message){
 clearTimeout(toastTimer);const el=$("#toast");el.textContent=message;el.hidden=false;
 toastTimer=setTimeout(()=>el.hidden=true,2700);
}
async function writeText(value){
 try{
  if(clipboardSupported())await navigator.clipboard.writeText(value);
  else{
   const t=document.createElement("textarea");t.value=value;t.style.position="fixed";t.style.opacity="0";document.body.appendChild(t);t.select();
   if(!document.execCommand("copy"))throw Error("clipboard");
   t.remove();
  }
  toast("Copiado al portapapeles");
 }catch{toast("No se pudo copiar en este navegador")}
}
const menuTargets=[["ficha","Ficha"],["imagenes","Imágenes"],["redes","Redes sociales"],["enlaces","Enlaces y repositorios"],["claves","Claves protegidas"]];
function isDesktop(){return !!window.matchMedia?.("(min-width: 1000px)")?.matches}
let drawerOpen=false;
const dockLabels=[["ficha","Ficha","▤"],["imagenes","Logos","▧"],["redes","Redes","◎"],["enlaces","Enlaces","↗"],["claves","Claves","◇"]];
function updateMenu(){
 const r=current();
 let content='<span class="menu-section-label">ESPACIO DE TRABAJO</span>'
 +'<button class="menu-link '+(!r?"selected":"")+'" data-menu-home type="button"><span class="menu-link-icon">⌂</span><span>Todas las empresas</span></button>';
 if(r){
  content+='<span class="menu-section-label">EMPRESA SELECCIONADA</span><div class="side-company"><strong>'+esc(r.nombre)+'</strong><small>'+esc(r.categoria||"Registro oficial")+'</small></div>'
  +'<span class="menu-section-label">CONSULTAR</span>';
  content+=menuTargets.map(([key,label],i)=>'<button class="menu-link '+(tab===key?"selected":"")+'" type="button" data-menu-tab="'+key+'"><span class="menu-link-icon">'+["▤","▧","◎","↗","◇"][i]+'</span><span>'+label+'</span>'+(tab===key?'<span class="menu-link-active"></span>':"")+'</button>').join("");
 }else{
  content+='<span class="menu-section-label">EMPRESAS REGISTRADAS</span>';
  content+=records.map(item=>'<button class="menu-link" type="button" data-menu-company="'+esc(item.id)+'"><span class="menu-link-icon">◆</span><span>'+esc(item.nombre)+'</span></button>').join("");
 }
 menuLinks.innerHTML=content;
}
function syncNavigation(){
 menu.hidden=!drawerOpen;
 menuBackdrop.hidden=!drawerOpen;
 menu.setAttribute("aria-hidden",drawerOpen?"false":"true");
 menuToggle.setAttribute("aria-expanded",drawerOpen?"true":"false");
 document.body.classList.toggle("menu-open",drawerOpen);
 mobileDock.hidden=true;mobileDock.innerHTML="";
}
function setMenuOpen(open){
 drawerOpen=!!open;
 syncNavigation();
 if(drawerOpen){updateMenu();menuClose.focus()}
 else menuToggle.focus({preventScroll:true});
}
function closeSiteMenu(){if(drawerOpen)setMenuOpen(false)}

function render(){
 const selected=current();
 document.title="UYC · "+(selected?selected.nombre:"Directorio empresarial");
 document.body.classList.toggle("is-company",!!selected);
 directoryButton.hidden=!selected;
 updateMenu();
 syncNavigation();
 mount.innerHTML=selected?companyHeading(selected)+'<div class="content-in">'+({ficha:profile,imagenes:identity,redes:social,enlaces:repositories,claves:vault}[tab]||profile)(selected)+'</div>':directory();
}
function goHome(){closeSiteMenu();selectedId=null;tab="ficha";imageIndex=0;vaultValues=null;revealed.clear();render();window.scrollTo(0,0)}
function openCompany(id){
 if(!records.some(r=>r.id===id))return;
 closeSiteMenu();
 if(selectedId!==id){vaultValues=null;revealed.clear();}
 selectedId=id;tab="ficha";imageIndex=0;filter="";search.value="";
 render();window.scrollTo(0,0);
}
function openTab(which){
 if(!sectionTitles[which])return;
 closeSiteMenu();
 tab=which;render();window.scrollTo({top:0,behavior:"instant"});
}
async function submitVault(form){
 if(working)return;working=true;
 const submit=$('[type="submit"]',form);if(submit)submit.disabled=true;
 const type=form.id,values=new FormData(form),master=String(values.get("master")||"");
 try{
  if(master.length<12)throw Error("La clave maestra debe tener al menos 12 caracteres");
  if(type==="vaultCreate"){
   if(hasVault())throw Error("La caja fuerte ya existe");
   if(values.get("repeat")!==master)throw Error("Las claves maestras no coinciden");
   const next={email:String(values.get("email")||""),redes:String(values.get("redes")||"")};
   if(!next.email&&!next.redes)throw Error("Escribe al menos una contraseña para guardar");
   const item=await seal(master,next);localStorage.setItem(vaultKey(),JSON.stringify(item));vaultValues=next;
   toast("Claves cifradas y guardadas");
  }else if(type==="vaultUnlock"){
   vaultValues=await unseal(master);toast("Caja fuerte desbloqueada");
  }else if(type==="vaultEdit"){
   await unseal(master);
   const next={email:String(values.get("email")||""),redes:String(values.get("redes")||"")};
   if(!next.email&&!next.redes)throw Error("Escribe al menos una contraseña");
   const item=await seal(master,next);localStorage.setItem(vaultKey(),JSON.stringify(item));vaultValues=next;
   toast("Contraseñas actualizadas");
  }
  revealed.clear();hideModal();render();
 }catch(error){toast(error.message?.includes("clave")||error.message?.includes("contraseña")||error.message?.includes("caja")||error.message?.includes("Escribe")?error.message:"Clave incorrecta o almacenamiento no disponible")}
 finally{working=false;if(submit?.isConnected)submit.disabled=false}
}
async function copyPng(source){
 if(!officialAsset(source)){toast("Archivo no autorizado");return}
 try{
  if(!navigator.clipboard?.write||typeof ClipboardItem==="undefined")throw Error("No compatible");
  const response=await fetch(source);
  if(!response.ok)throw Error("Archivo no disponible");
  const blob=await response.blob();
  const image=blob.type==="image/png"?blob:new Blob([blob],{type:"image/png"});
  await navigator.clipboard.write([new ClipboardItem({"image/png":image})]);
  toast("Imagen PNG copiada");
 }catch{toast("No se pudo copiar. Usa «Descargar PNG».")}
}
document.addEventListener("click",async event=>{
 const el=event.target;
 const menuHome=el.closest("[data-menu-home]");if(menuHome){goHome();return}
 const menuTab=el.closest("[data-menu-tab]");if(menuTab){openTab(menuTab.dataset.menuTab);return}
 const menuCompany=el.closest("[data-menu-company]");if(menuCompany){openCompany(menuCompany.dataset.menuCompany);return}
 const tileTab=el.closest("[data-open-tab]");if(tileTab){const [id,targetTab]=String(tileTab.dataset.openTab||"").split(":");openCompany(id);if(sectionTitles[targetTab])openTab(targetTab);return}
 const download=el.closest("a[download]");
 if(download){
  const path=download.getAttribute("href");
  if(!officialAsset(path)){event.preventDefault();toast("Solo se descargan imágenes oficiales");}
  return;
 }
 const open=el.closest("[data-open]");if(open){openCompany(open.dataset.open);return}
 const switcher=el.closest("[data-tab]");if(switcher){openTab(switcher.dataset.tab);return}
 const copy=el.closest("[data-copy]");if(copy){writeText(copy.dataset.copy);return}
 const image=el.closest("[data-image]");if(image){imageIndex=Number(image.dataset.image);tab="imagenes";render();$("#assetVisual")?.scrollIntoView({behavior:"smooth",block:"center"});return}
 const step=el.closest("[data-step]");if(step){const n=allAssets(current()).length;if(n){imageIndex=(imageIndex+Number(step.dataset.step)+n)%n;render()}return}
 const preview=el.closest("[data-preview]");
 if(preview){
  const source=preview.dataset.preview;
  if(!officialAsset(source))return;
  const a=allAssets(current()).find(x=>x.src===source);
  showModal('<h2>'+esc(a.nombre)+'</h2><p>Visualización del archivo original. La descarga conserva el PNG sin alteraciones.</p><figure><img src="'+esc(a.src)+'" alt="'+esc(a.nombre)+'" draggable="false"></figure><div class="btn-row" style="margin-top:14px"><a href="'+esc(a.src)+'" class="btn primary" download="'+esc(a.archivo)+'">Descargar PNG</a></div>',true);
  return;
 }
 const png=el.closest("[data-copy-png]");if(png){copyPng(png.dataset.copyPng);return}
 const secret=el.closest("[data-secret-show]");
 if(secret){
  if(!vaultValues)return;
  const key=secret.dataset.secretShow;
  if(!vaultValues[key]){toast("No hay contraseña guardada");return}
  revealed.has(key)?revealed.delete(key):revealed.add(key);
  render();if(revealed.has(key))setTimeout(()=>{revealed.delete(key);if(tab==="claves"&&current())render()},12000);
  return;
 }
 const secretCopy=el.closest("[data-secret-copy]");
 if(secretCopy){const value=vaultValues?.[secretCopy.dataset.secretCopy];value?writeText(value):toast("Contraseña no registrada");return}
 const action=el.closest("[data-action]");if(!action)return;
 switch(action.dataset.action){
 case "scroll-directory":$("#directoryList")?.scrollIntoView({behavior:"smooth",block:"start"});break;
 case "vault-start":if(!crypto?.subtle){toast("Cifrado no disponible");return}showModal(vaultForm(!hasVault()));break;
 case "vault-edit":if(vaultValues)showModal(editForm());break;
 case "vault-lock":vaultValues=null;revealed.clear();render();toast("Caja fuerte bloqueada");break;
 case "vault-delete":
  if(!confirm("¿Eliminar todas las contraseñas cifradas de esta empresa guardadas en ESTE navegador? La acción no se puede deshacer."))return;
  try{localStorage.removeItem(vaultKey());vaultValues=null;revealed.clear();render();toast("Claves locales eliminadas")}
  catch{toast("No se pudo eliminar el almacenamiento local")}break;
 case "modal-close":hideModal();break;
 case "retry-image":{
  const img=$("#assetVisual img");if(img){img.dataset.failed="";$("#assetVisual")?.classList.remove("broken");img.src=img.dataset.originalSrc+"?r="+Date.now()}break;
 }
 }
});
document.addEventListener("submit",e=>{
 if(e.target.matches("#vaultCreate,#vaultUnlock,#vaultEdit")){e.preventDefault();submitVault(e.target)}
});
homeButton.addEventListener("click",goHome);
directoryButton.addEventListener("click",goHome);
menuToggle.addEventListener("click",()=>setMenuOpen(!drawerOpen));
menuClose.addEventListener("click",closeSiteMenu);
menuBackdrop.addEventListener("click",closeSiteMenu);
window.addEventListener?.("resize",syncNavigation);
search.addEventListener("input",e=>{filter=e.target.value;selectedId=null;vaultValues=null;tab="ficha";render()});
$("#closeModal").addEventListener("click",hideModal);
$("#modalCover").addEventListener("click",e=>{if(e.target.id==="modalCover")hideModal()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape"){hideModal();closeSiteMenu();}
 else if(tab==="imagenes"&&current()&&["ArrowLeft","ArrowRight"].includes(e.key)&&!e.target.closest("input,textarea")){
  const n=allAssets(current()).length;if(!n)return;
  imageIndex=(imageIndex+(e.key==="ArrowRight"?1:-1)+n)%n;render();
 }
});
let touchStart=null;
document.addEventListener("touchstart",e=>{
 if(tab!=="imagenes"||!e.target.closest("#assetVisual"))return;
 const t=e.changedTouches?.[0];if(t)touchStart={x:t.clientX,y:t.clientY};
},{passive:true});
document.addEventListener("touchend",e=>{
 if(!touchStart||tab!=="imagenes"||!current())return;
 const t=e.changedTouches?.[0];if(!t)return;
 const dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;
 if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy)*1.4){
  const n=allAssets(current()).length;if(n){imageIndex=(imageIndex+(dx<0?1:-1)+n)%n;render()}
 }
},{passive:true});
document.addEventListener("error",e=>{
 const img=e.target;
 if(img?.tagName!=="IMG"||!img.dataset.originalSrc)return;
 if(img.dataset.failed!=="yes"&&img.src.indexOf(img.dataset.originalSrc)===-1){
  img.dataset.failed="yes";img.src=img.dataset.originalSrc;return;
 }
 const area=img.closest(".asset-visual");
 if(area)area.classList.add("broken");
 else{img.style.visibility="hidden";img.setAttribute("aria-label","Imagen no disponible")}
},true);
document.addEventListener("load",e=>{
 const img=e.target;if(img?.tagName!=="IMG")return;
 img.closest(".asset-visual")?.classList.remove("broken");
},true);
document.addEventListener("selectstart",e=>{if(!e.target.closest("input,textarea"))e.preventDefault()});
document.addEventListener("copy",e=>{if(!e.target.closest("input,textarea"))e.preventDefault()});
document.addEventListener("contextmenu",e=>{if(!e.target.closest("input,textarea"))e.preventDefault()});
document.addEventListener("dragstart",e=>{if(e.target.tagName==="IMG")e.preventDefault()});
document.addEventListener("wheel",e=>{if(e.ctrlKey||e.metaKey)e.preventDefault()},{passive:false});
document.addEventListener("gesturestart",e=>e.preventDefault(),{passive:false});
document.addEventListener("gesturechange",e=>e.preventDefault(),{passive:false});
document.addEventListener("touchmove",e=>{if(e.touches?.length>1)e.preventDefault()},{passive:false});
document.addEventListener("keydown",e=>{
 if((e.ctrlKey||e.metaKey)&&["=","+","-","0"].includes(e.key))e.preventDefault();
},{capture:true});
render();
})();