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
| `operario.tienda` | `Operario123*` | Imprimir y ver **su propio** historial |
| `supervisor.tienda` | `Supervisor123*` | Además: reimprimir con motivo, ver todo el historial |
| `admin.tienda` | `Admin123*` | Además: indicadores operativos |

---

## Pantallas

**`/impresion`** — formulario (LPN, zona, usuario), preview de la ETQ con sus productos
y disponibilidad, y resultado como banner de **Éxito / Rechazo + motivo** con badge
`Impresión` o `Reimpresión`.

**`/historial`** — filtros por LPN, zona, usuario, resultado, tipo de evento y rango de
fechas, con paginación. Tabla en escritorio, tarjetas en móvil.

Ambas exigen sesión (`authGuard`).

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

`public/_redirects` (`/* /index.html 200`) hace que una recarga en `/historial` no
devuelva 404 en Cloudflare Pages.

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
