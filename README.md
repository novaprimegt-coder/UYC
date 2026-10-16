# UYC — Directorio maestro de empresas

Sitio: https://novaprimegt-coder.github.io/UYC/

## Objetivo

UYC es un catálogo de consulta para mostrar datos oficiales de varias empresas, marcas, sistemas y plataformas. Permite consultar, copiar datos importantes mediante botones específicos y descargar archivos gráficos originales.

La única información que se puede introducir desde la página son las contraseñas generales del correo principal y de las redes sociales de cada empresa. Se cifran localmente en el navegador con una clave maestra; no se envían al repositorio ni se sincronizan.

No es posible modificar misión, visión, descripción, usuarios, correos, redes, categorías, enlaces ni repositorios desde la web. Esos datos se mantienen exclusivamente en código.

## Estructura

- index.html: estructura semántica y carga diferida.
- css/styles.css: diseño cálido y adaptable.
- js/app.js: directorio, fichas, copia, galería y caja fuerte local.
- data/records.js: única fuente pública para añadir o modificar datos empresariales.
- assets/identificador/: originales gráficos de cada empresa.
- assets/identificador/optimized/: miniaturas ligeras.

## Incorporar una nueva empresa (solo desde el código)

1. Revisar el expediente empresarial y los originales de identidad visual aprobados.
2. Incorporar un objeto nuevo en el arreglo window.UYC_RECORDS de data/records.js, con identificador único. No reemplazar ni modificar registros existentes.
3. Dejar PENDIENTE o NO APLICA donde corresponda. Nunca inventar confirmaciones, fechas, cuentas ni repositorios.
4. Usar **dos tipos de repositorios independientes** dentro de repositorios: sistema y presentacion. Los dos objetos pueden contener nombre, url, descripcion; el de presentación, también pagina, version y actualizacion.
5. Para imágenes se requieren archivos que existan. Campos recomendados por activo: nombre, src, thumb, filename, w, h, transparent, uso.
6. Conservar siempre los PNG originales intactos. Los thumbnails optimizados se generan aparte y no sustituyen al original.
7. Actualizar la versión de los recursos enlazados en index.html para evitar caché obsoleta cuando corresponda.
8. Verificar navegación, copias, PNG, móviles, seguridad y aislamiento de cada empresa antes de publicar.

### Ejemplo conceptual de repositorios (NO es un registro válido)

repositorios.sistema: código o aplicación principal, con su enlace GitHub verificable.

repositorios.presentacion: sitio demostrativo/informativo, su enlace GitHub y la página visible.

La APK es una descarga separada: aplicacion.descarga_url.

## Seguridad y credenciales

- PROHIBIDO incluir contraseñas, claves maestras, tokens, claves API u otros secretos en el HTML, archivos JS, imágenes, documentación o repositorios.
- Solo la caja fuerte local admite contraseñas generales para correo y redes, cifradas con PBKDF2 y AES-GCM sobre HTTPS.
- Mantener el formato de almacenamiento anterior para compatibilidad: uyc:vault:identificador:v1.
- La pérdida de la clave maestra o del almacenamiento local puede producir pérdida definitiva de credenciales; preferir un gestor de contraseñas profesional para cuentas importantes.
- La página es pública; bloquear copia contextual no impide técnicamente la extracción de datos públicos.

## Publicación y regresiones

Único repositorio autorizado de este directorio: novaprimegt-coder/UYC. No editar otros repositorios sin autorización separada.

- El inicio siempre es general, nunca exclusivo de TaskFlow.
- Una empresa nueva nunca hereda imágenes, redes o claves de otra.
- Copia de misión y visión mediante botones funcionales.
- Enlaces de repositorios independientes y correctamente etiquetados.
- Descarga de PNG con tamaño y transparencia originales.
- Sin formularios para editar datos empresariales desde la página.
- La caja fuerte solo almacena credenciales cifradas, separadas por empresa y navegador.
- Si se solicitan mejoras, preservar las funciones ya comprobadas.
