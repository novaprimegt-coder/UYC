/* UYC 3.0.0 · Catálogo de lectura, descargas y contraseñas locales cifradas. */
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
const homeButton=$("#brandHome"),directoryButton=$("#goDirectory"),search=$("#search"),mount=$("#app");
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
 return '<div class="data-row"><div class="data-meta"><span class="data-label">'+esc(label)+'</span><span class="data-value '+(!exists(value)?'missing':'')+'">'+esc(exists(value)?value:"Pendiente de registrar")+'</span></div>'+(canCopy?copyBtn(value):"")+'</div>';
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
 const num=allAssets(r).length;
 return '<article class="company-card"><div class="company-card-top">'+logo(r)+'<div><span class="company-overline">'+esc(r.categoria||r.tipo||"REGISTRO UYC")+'</span><h3>'+esc(r.nombre)+'</h3><p>'+esc(r.tipo||"Organización registrada")+'</p></div></div>'
 +'<div class="company-card-bottom">'+status(r.estado)+'<button class="btn primary" type="button" data-open="'+esc(r.id)+'">Ver empresa →</button></div>'
 +'<div class="under">'+num+' recursos gráficos · '+(r.redes||[]).length+' redes · información independiente</div></article>';
}
function directory(){
 const list=records.filter(r=>norm([r.nombre,r.tipo,r.categoria,r.estado,r.descripcion].join(" ")).includes(norm(filter)));
 const totalAssets=records.reduce((n,r)=>n+allAssets(r).length,0),totalSocial=records.reduce((n,r)=>n+(r.redes||[]).length,0);
 return '<div class="content-in">'
 +'<section class="hero"><div><span class="hero-label">UYC · REGISTRO CENTRAL</span><h1>Todas tus marcas.<br><em>Un solo lugar.</em></h1><p>Explora empresas, consulta información oficial, copia datos importantes y descarga imágenes originales. Cada organización conserva su identidad, sus enlaces y sus recursos.</p>'+btn("Ver empresas","scroll-directory","primary")+'</div>'
 +'<div class="hero-note"><span class="hero-note-title">Simple, ordenado y seguro</span>'
 +'<div class="hero-feature"><span>01</span><div><strong>Selecciona una empresa</strong><small>Todo empieza desde su ficha oficial.</small></div></div>'
 +'<div class="hero-feature"><span>02</span><div><strong>Consulta y copia</strong><small>La información pública solo se edita desde el código.</small></div></div>'
 +'<div class="hero-feature"><span>03</span><div><strong>Descarga originales</strong><small>Logos PNG sin alteraciones; claves cifradas localmente.</small></div></div>'
 +'</div></section>'
 +'<div class="stats"><div class="stat"><strong>'+records.length+'</strong><span>Empresas</span><small>Registradas en UYC</small></div><div class="stat"><strong>'+totalAssets+'</strong><span>Imágenes</span><small>Recursos oficiales</small></div><div class="stat"><strong>'+totalSocial+'</strong><span>Redes</span><small>Perfiles vinculados</small></div></div>'
 +'<section id="directoryList">'+heading("Directorio de empresas","Selecciona una ficha para consultar sus apartados.",list.length+" disponibles")+'</section>'
 +(list.length?'<div class="company-grid">'+list.map(directoryItem).join("")+'</div>':'<div class="empty"><strong>Sin coincidencias</strong>Prueba otro nombre o categoría.</div>')
 +'<p class="copyable-hint">◈ Los registros se mantienen desde el código de UYC. La web solo permite consultar, copiar y descargar.</p></div>';
}
function companyHeading(r){
 const tabs=[["ficha","Ficha"],["imagenes","Imágenes"],["redes","Redes"],["enlaces","Enlaces y repositorios"],["claves","Claves"]];
 return '<section class="company-heading">'+
 '<div class="company-title">'+logo(r)+'<div><span class="company-overline">'+esc(r.categoria||"Organización registrada")+'</span><h1>'+esc(r.nombre)+'</h1><p>'+esc(r.tipo||"Empresa")+'</p></div></div>'
 +'<div class="company-summary">'+status(r.estado)+'<small>Información oficial de '+esc(r.nombre)+'</small></div></section>'
 +'<nav class="company-tabs" aria-label="Apartados de '+esc(r.nombre)+'">'+tabs.map(([key,label])=>'<button type="button" data-tab="'+key+'" class="'+(tab===key?"active":"")+'" aria-current="'+(tab===key?"page":"false")+'">'+label+'</button>').join("")+'</nav>';
}
function profile(r){
 const main=card("Datos principales",field("Nombre oficial",r.nombre,true)+field("Categoría",r.categoria||r.tipo,true)+field("Estado",r.estado)+field("Correo oficial",r.contacto?.correo,true)+field("Usuario principal",r.contacto?.usuario,true));
 const web=card("Página de presentación",field("Enlace oficial",r.web?.url,true)+field("Versión de presentación",r.web?.version)+field("Última actualización",r.web?.ultima_actualizacion)+external("Abrir página",r.web?.url,"small"));
 const mainFacts='<div class="grid-two">'+main+web+'</div>';
 const values=card("Valores institucionales",'<div class="taglist">'+(r.valores||[]).map(v=>'<span class="tag">'+esc(v)+'</span>').join("")+'</div>',(r.valores||[]).join(", "));
 const sections=[["Descripción",r.descripcion],["Misión",r.mision],["Visión",r.vision],["Propósito",r.proposito],["Objetivo general",r.objetivo]];
 const app=r.aplicacion?card("Aplicación o sistema",field("Versión actual",r.aplicacion.version)+field("Compilación",r.aplicacion.compilacion)+field("Disponibilidad",r.aplicacion.disponibilidad)+field("Plataformas",(r.aplicacion.plataformas||[]).join(", "))+field("Lanzamiento",r.aplicacion.lanzamiento)+field("Google Play",r.aplicacion.google_play_estado)+external("Descargar aplicación",r.aplicacion.descarga_url,"small primary")):"";
 return heading("Ficha empresarial","Consulta la información registrada; copia cada apartado cuando lo necesites.")
 +mainFacts
 +heading("Identidad y filosofía","Información oficial de "+r.nombre)
 +'<div class="grid-two">'+sections.map(([label,body])=>card(label,'<div class="copy-text">'+textBlock(body)+'</div>',body)).join("")+'</div>'
 +heading("Valores y producto")
 +'<div class="grid-two">'+values+(app||card("Aplicación o sistema","<p class='under'>No aplica o aún no se ha registrado.</p>"))+'</div>';
}
function social(r){
 const items=r.redes||[];
 const shared=card("Identidad digital compartida",field("Usuario principal",r.contacto?.usuario,true)+field("Correo principal",r.contacto?.correo,true)+field("Estado del correo",r.contacto?.correo_estado));
 const support=card("Atención y soporte",field("Canal",r.soporte?.canal||"PENDIENTE")+field("Correo de soporte",r.soporte?.correo,true)+field("Atención",r.soporte?.atencion)+field("Teléfono",r.soporte?.telefono||r.contacto?.telefono));
 return heading("Redes y contacto","Usuario y correo comunes cuando así lo indique la empresa.")
 +'<div class="grid-two">'+shared+support+'</div>'
 +heading("Perfiles registrados","Cada red tiene su enlace y estado independiente.",items.length+" redes")
 +(items.length?'<div class="social-grid">'+items.map(a=>'<article class="surface social-card"><div class="social-head"><h3>'+esc(a.plataforma)+'</h3>'+status(a.estado)+'</div>'
 +field("Nombre visible",a.nombre)+field("Usuario",a.usuario||r.contacto?.usuario,true)+field("Correo",a.correo||r.contacto?.correo,true)+field("Enlace oficial",a.url,true)+field("Verificación en dos pasos",a.dos_pasos||"PENDIENTE")
 +'<div class="btn-row">'+external("Abrir "+a.plataforma,a.url,"small")+'</div></article>').join("")+'</div>':'<div class="empty"><strong>Sin redes registradas</strong>Podrás agregarlas desde el archivo de datos, sin alterar otras empresas.</div>');
}
function repoCard(kind,obj){
 const badge=kind==="sistema"?"01 · REPOSITORIO DEL SISTEMA":"02 · REPOSITORIO DE PRESENTACIÓN";
 const label=kind==="sistema"?"Sistema o programa":"Página demostrativa o informativa";
 if(!obj||!obj.url)return '<div class="surface pad repo-card"><span class="repo-badge">'+badge+'</span><h3>'+label+'</h3><p>Pendiente de registrar en el código de UYC.</p></div>';
 const site=obj.pagina?'<div>'+field("Página visible",obj.pagina,true)+external("Ver presentación",obj.pagina,"small")+'</div>':"";
 const spec=obj.version?field("Versión de presentación",obj.version):"";
 const date=obj.actualizacion?field("Última actualización",obj.actualizacion):"";
 return '<article class="surface pad repo-card"><span class="repo-badge">'+badge+'</span><h3>'+label+'</h3><p>'+esc(obj.descripcion||"Repositorio oficial de la empresa")+'</p><strong>'+esc(obj.nombre||"Repositorio GitHub")+'</strong><span class="repo-url">'+esc(obj.url)+'</span>'
 +'<div>'+spec+date+site+'</div><div class="btn-row">'+copyBtn(obj.url,"Copiar enlace")+external("Abrir repositorio",obj.url,"primary small")+'</div></article>';
}
function repositories(r){
 const repos=r.repositorios||{},web=r.web||{},apk=r.aplicacion||{};
 const webUrl=repos.presentacion?.pagina||web.url;
 return heading("Enlaces y repositorios","El código del programa y la página informativa son proyectos independientes.")
 +'<div class="grid-two">'+repoCard("sistema",repos.sistema)+repoCard("presentacion",repos.presentacion)+'</div>'
 +heading("Otros enlaces oficiales","Consulta sin confundir sistema, página informativa y aplicación descargable.")
 +'<div class="grid-two">'+card("Página de presentación",field("Enlace",webUrl,true)+field("Versión",web.version||repos.presentacion?.version)+field("Tipo de proyecto",web.tipo_proyecto||"Página informativa")+external("Visitar página",webUrl,"small"))
 +card("Aplicación descargable",field("Plataformas",(apk.plataformas||[]).join(", "))+field("Versión",apk.version)+field("Enlace de descarga",apk.descarga_url,true)+external("Descargar APK",apk.descarga_url,"small primary"))+'</div>'
 +heading("Notas y asuntos pendientes","Estos datos también se actualizan desde el código.")
 +'<div class="grid-two">'+card("Pendientes",'<div class="copy-text">'+(r.pendientes?.length?r.pendientes.map((x,i)=>'<p><strong>'+String(i+1)+'.</strong> '+esc(x)+'</p>').join(""):"Sin asuntos pendientes")+'</div>')+
 card("Observaciones",'<div class="copy-text">'+(r.notas?.length?r.notas.map((x,i)=>'<p><strong>'+String(i+1)+'.</strong> '+esc(x)+'</p>').join(""):"Sin observaciones registradas")+'</div>')+'</div>';
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
 +'<div class="asset-thumbs" role="group" aria-label="Seleccionar imagen">'+entries.map((a,i)=>'<button class="asset-thumb '+(i===imageIndex?'active':'')+'" type="button" data-image="'+i+'" aria-pressed="'+(i===imageIndex)+'">'+
 '<img src="'+esc(a.thumb||a.src)+'" data-original-src="'+esc(a.src)+'" loading="lazy" decoding="async" alt="'+esc(a.nombre)+'"><strong>'+esc(a.nombre)+'</strong></button>').join("")+'</div>'
 +heading("Biblioteca completa","Descarga individual de los PNG originales.")
 +'<div class="asset-grid">'+entries.map((a,i)=>'<article class="surface asset-card"><div class="asset-card-image">'+thumbImg(r,a.src,a.nombre)+'</div><h3>'+esc(a.nombre)+'</h3><small>'+esc(dimension(a))+'</small>'
 +'<div class="btn-row"><a class="btn primary" href="'+esc(a.src)+'" download="'+esc(a.archivo)+'">↓ PNG</a><button class="btn" type="button" data-image="'+i+'">Ver</button></div></article>').join("")+'</div>';
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
function render(){
 const selected=current();
 document.title="UYC · "+(selected?selected.nombre:"Directorio empresarial");
 directoryButton.hidden=!selected;
 mount.innerHTML=selected?companyHeading(selected)+'<div class="content-in">'+({ficha:profile,imagenes:identity,redes:social,enlaces:repositories,claves:vault}[tab]||profile)(selected)+'</div>':directory();
}
function goHome(){selectedId=null;tab="ficha";imageIndex=0;vaultValues=null;revealed.clear();render();window.scrollTo(0,0)}
function openCompany(id){
 if(!records.some(r=>r.id===id))return;
 if(selectedId!==id){vaultValues=null;revealed.clear();}
 selectedId=id;tab="ficha";imageIndex=0;filter="";search.value="";
 render();window.scrollTo(0,0);
}
function openTab(which){
 if(!sectionTitles[which])return;
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
search.addEventListener("input",e=>{filter=e.target.value;selectedId=null;vaultValues=null;tab="ficha";render()});
$("#closeModal").addEventListener("click",hideModal);
$("#modalCover").addEventListener("click",e=>{if(e.target.id==="modalCover")hideModal()});
document.addEventListener("keydown",e=>{
 if(e.key==="Escape")hideModal();
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