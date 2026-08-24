# Impresión de Etiquetas ETQ · Frontend

Interfaz operativa del **Submódulo de Impresión de ETQ** (prueba técnica Homecenter ·
Dev Experto GTL Tienda).

Angular 20 con componentes **standalone**, estado en **signals** y una capa de
**facades** que aísla los componentes del transporte HTTP.

> El backend, la documentación de arquitectura, los diagramas C4 y el runbook de
> incidentes viven en
> [Homecenter.Microservice.Api.LabelPrinting](https://github.com/anfegave98/Homecenter.Microservice.Api.LabelPrinting).

---

## Ejecución local

```bash
npm install && npm start
```

Queda en `http://localhost:4200`. Necesita el **API corriendo en `http://localhost:5080`**
(ver el README del backend); ese origen ya está declarado en su configuración de CORS.

```bash
npm test
```

```bash
npm run build
```

El build sale en `dist/homecenter-labelprinting-site/browser`.

---

## Credenciales de prueba

| Usuario | Contraseña | Puede |
|---|---|---|
| `operario.tienda` | `Operario123*` | Imprimir, **solicitar** reimpresión con motivo y ver **su propio** historial |
| `supervisor.tienda` | `Supervisor123*` | Además: reimprimir directo, **autorizar** las solicitudes pendientes y ver todo el historial |
| `admin.tienda` | `Admin123*` | Además: indicadores operativos |

---

## Pantallas

**`/impresion`** — formulario (LPN, zona, usuario), preview de la ETQ con sus productos
y disponibilidad, y resultado como banner de **Éxito / Rechazo + motivo** con badge
`Impresión` o `Reimpresión`.

La **zona es obligatoria aquí aunque el API la acepte vacía**. No es una inconsistencia:
el contrato debe seguir aceptando `{ "lpn": "..." }` a secas porque así llega el anexo
`requetEtq.json`, pero en la interfaz hay una persona que sabe dónde está parada. La zona
decide contra qué stock se valida —el mismo LPN aprueba en `ZONA-PICKING-A` y se rechaza
en `ZONA-PICKING-B`— y un valor por defecto la convertiría en una suposición del sistema,
con el operario recibiendo un rechazo correcto pero incomprensible.

Al descargar la etiqueta se entregan **dos archivos**: el `.zpl` que va a la impresora y
un `.png` para verla. El ZPL es el artefacto real, pero es ilegible para una persona y
durante la evaluación no hay impresora conectada; el PNG permite comprobar de un vistazo
que la etiqueta se genera con los datos correctos.

La imagen se dibuja en canvas a partir del bloque de metadatos que el propio `.zpl` trae
embebido como comentario `^FX`. Así ambos archivos salen de la misma fuente y no pueden
divergir. El `.zpl` se guarda primero y siempre: si el dibujo falla, el operario se queda
con el archivo que realmente necesita en vez de perder la descarga completa.

> El código de barras del `.png` es una representación y **no se puede leer con pistola**.
> La lectura real la da el `.zpl`.

**`/aprobaciones`** — bandeja de reimpresiones pendientes, ordenada de la más antigua a
la más reciente. Cada solicitud muestra el motivo que escribió quien la pidió, que es lo
único con lo que el autorizador decide. Solo `Supervisor` y `Admin` (`roleGuard`).

**`/historial`** — filtros por LPN, zona, usuario, resultado, tipo de evento y rango de
fechas, con paginación. Tabla en escritorio, tarjetas en móvil.

Todas exigen sesión (`authGuard`); el guard de rol solo evita mostrar una pantalla
inútil, la autorización vinculante está en el backend.

---

## Estructura

```
src/app/
├── auth/
│   ├── components/login/
│   ├── facades/                 AuthFacade — estado de sesión en signals
│   ├── guards/                  authGuard · roleGuard (functional)
│   ├── interceptors/            jwtInterceptor · errorInterceptor
│   └── services/                AuthService · TokenStorageService
├── printing/
│   ├── components/              print-form · label-preview · print-result
│   │                            history-filters · history-table · páginas
│   ├── facades/                 PrintingFacade · HistoryFacade
│   ├── models/                  interfaces alineadas 1:1 con los DTOs del backend
│   └── services/                PrintingService · CatalogService
└── shared/
    ├── ui/                      alert · badge · spinner · empty-state · pagination
    ├── models/                  ApiResponse<T>
    └── utils/                   crypto.util.ts
```

---

## Por qué no se partió de la plantilla base

La prueba entrega `PLANTILLA_BASE_ANGULAR_FRONT_APPS_2025`, cuyo uso no es obligatorio.

Esa plantilla es un **micro-frontend del Hub de Proveedores** y su documentación es
explícita: *"No tiene login propio: recibe la sesión de la app contenedora"* mediante
`postMessage`. Ese supuesto rompe la prueba en su punto central — **HU-01 exige
identificar al usuario solicitante y la sección 9 pide el campo Usuario en pantalla**.
Sin aplicación contenedora no hay sesión que heredar, y una app que espera un
`postMessage` que nunca llega no se puede abrir para evaluarla.

Su despliegue además apunta a Azure Blob Storage u OpenShift con `subscriptionKey` de
Azure API Management; esta entrega va a Cloudflare Pages contra un API en Render.

**Lo que sí se conservó de sus convenciones:** capa de servicios separada de la de
presentación, interceptor que adjunta el Bearer token, envelope `ApiResponse` uniforme
con `meta`, configuración por ambiente en `environments/` y Tailwind.

**Dónde se divergió a conciencia:** la plantilla usa **PrimeNG** y aquí los componentes
de `shared/ui` son propios sobre Tailwind. Para cinco componentes —alert, badge,
spinner, empty-state, pagination— agregar una librería de UI completa habría pesado más
que lo que resuelve. La sección 9 evalúa usabilidad, componentización, responsive,
validaciones y manejo de errores; no la librería.

También se usa **Web Crypto nativo** en lugar del `crypto-js` de la plantilla: la misma
capacidad sin sumar una dependencia.

---

## Tres decisiones que conviene conocer

### El rechazo de negocio no pasa por el interceptor de errores

Un rechazo de regla llega como **HTTP 200 con `success: false`**. Rechazar una impresión
por falta de inventario no es un error técnico, y mezclarlos haría que la interfaz
mostrara *"algo salió mal"* cuando el sistema funcionó correctamente.

Por eso `PrintingService.print()` devuelve el **envelope completo** en lugar de
desenvolver `data`: el motivo del rechazo vive en `error`, y desenvolver ahí borraría
justo lo que el operario necesita ver.

### El campo Usuario es de solo lectura

Se llena desde el JWT. Si el operario pudiera escribirlo, la auditoría dejaría de ser un
control y pasaría a ser un campo de texto libre.

Por la misma lógica, `AuthFacade.canReprint()` solo decide qué mostrar. **La
autorización vinculante es la del backend**, y el historial de un operario se restringe
allá, no ocultando filas aquí.

### El cifrado del payload es una capa adicional, no un reemplazo de HTTPS

`crypto.util.ts` cifra las credenciales con AES-256-CBC (Web Crypto), interoperable con
el backend. **La llave viaja dentro del bundle**, así que cualquiera puede leerla: frente
a un atacante que ya intercepta el tráfico no agrega secreto — eso lo aporta HTTPS. Lo
que sí evita es que las credenciales queden en claro en registros intermedios.

Viene **apagado por defecto** (`encryptCredentials: false`) y debe coincidir con
`Encryption:Enabled` del backend: encendido de un solo lado, el login responde 400.

---

## Configuración

`src/environments/environment.production.ts` fija el `apiUrl`, y se resuelve **en tiempo
de build**: la URL definitiva del API debe conocerse antes de publicar.

`wrangler.jsonc` declara `not_found_handling: "single-page-application"`, que hace que
una recarga en `/historial` entregue `index.html` en vez de un 404. En Cloudflare
Workers eso reemplaza al `_redirects` de Pages: mantener ambos rompe el despliegue,
porque la regla `/* /index.html 200` se detecta como bucle infinito.

---

## Manejo de errores

El `errorInterceptor` traduce cada fallo a un mensaje accionable:

| Situación | Qué ve el usuario |
|---|---|
| Sin respuesta (`0`) | Aviso de que el servidor puede estar reactivándose — el plan gratuito de Render suspende por inactividad |
| `401` | Se limpia la sesión y se redirige a `/login?expired=true` |
| `403` | "Tu rol no tiene permiso para ejecutar esta acción" |
| `429` | Los **segundos concretos** a esperar, leídos del header `Retry-After` |
| `5xx` | Mensaje controlado **+ el `correlationId`**, que es lo único citable ante soporte |

Cuando el backend envía su propio mensaje en el envelope, se respeta ese en lugar del
genérico.
