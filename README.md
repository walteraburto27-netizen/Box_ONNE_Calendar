# Box ONNE — Calendar App

App mobile-first para gestión del Box ONNE. Conecta con Google Calendar como backend real.

---

## 🗂 Estructura del proyecto

```
box-onne/
├── index.html        ← App completa (frontend)
├── api/
│   └── calendar.js   ← Serverless proxy → Google Calendar API
├── vercel.json       ← Configuración Vercel
└── README.md
```

---

## 🚀 Deploy en Vercel (15 min total)

### Paso 1 — Subir a GitHub

1. Crea un repo nuevo en github.com (ej: `box-onne-calendar`)
2. Sube los archivos tal como están
3. No necesitas `npm install` ni `package.json`

### Paso 2 — Conectar a Vercel

1. Entra a vercel.com → **Add New Project**
2. Importa el repo de GitHub
3. Framework: **Other** (no Next.js)
4. Deploy → Vercel genera una URL automáticamente

### Paso 3 — Configurar Google Calendar API

#### 3a. Crear credenciales en Google Cloud Console

1. Ve a [console.cloud.google.com](https://console.cloud.google.com)
2. Crea un proyecto nuevo: "Box ONNE Calendar"
3. Activa la API: **Google Calendar API**
4. Ve a **Credenciales → Crear credenciales → ID de cliente OAuth 2.0**
5. Tipo: **Aplicación web**
6. URIs de redireccionamiento autorizados: `https://developers.google.com/oauthplayground`
7. Guarda el **Client ID** y **Client Secret**

#### 3b. Obtener el Refresh Token

1. Ve a [OAuth 2.0 Playground](https://developers.google.com/oauthplayground)
2. Haz clic en ⚙️ → "Use your own OAuth credentials"
3. Ingresa tu Client ID y Client Secret
4. En el campo de scope, escribe: `https://www.googleapis.com/auth/calendar`
5. Autoriza → obtendrás un **Refresh Token**

#### 3c. Obtener el Calendar ID

1. Abre Google Calendar en web
2. Busca el calendario "Box ONNE" → ⋮ → **Configuración**
3. Baja hasta "ID de calendario" — se ve como `xxx@group.calendar.google.com`

### Paso 4 — Variables de entorno en Vercel

En el dashboard de tu proyecto en Vercel → **Settings → Environment Variables**, agrega:

| Variable | Valor |
|---|---|
| `GOOGLE_CLIENT_ID` | El Client ID de Google Cloud |
| `GOOGLE_CLIENT_SECRET` | El Client Secret de Google Cloud |
| `GOOGLE_REFRESH_TOKEN` | El Refresh Token del Playground |
| `CALENDAR_ID` | El ID del calendario Box ONNE |
| `ADMIN_PIN` | PIN de 4 dígitos para Zelena (ej: 2847) |
| `STAFF_PIN` | PIN de 4 dígitos para profesores (ej: 1193) |

Después de agregar las variables → **Redeploy**.

### Paso 5 — Actualizar PINs en index.html

En `index.html`, busca estas líneas y cámbia los valores al mismo PIN que pusiste en Vercel:

```javascript
const ADMIN_PIN = '1234';   // ← cambia al ADMIN_PIN de Vercel
const STAFF_PIN = '0000';   // ← cambia al STAFF_PIN de Vercel
```

> **Nota:** Los PINs en el HTML son solo para la validación del lado del cliente (UX). La validación real ocurre en el servidor con las variables de entorno.

---

## 🎨 Personalización

### Cambiar PINs
- Modifica `ADMIN_PIN` y `STAFF_PIN` en Vercel Environment Variables
- Actualiza los mismos valores en `index.html`
- Redeploy

### Mover a onne.cl
1. En Vercel → Settings → Domains
2. Agrega `box.onne.cl` o `calendario.onne.cl`
3. Configura el CNAME en tu registrador de dominio

---

## 📱 Cómo usar

### Zelena (Admin PIN)
- Ve disponibilidad completa del box semana a semana
- Crea evaluaciones directamente desde la app
- Elimina eventos si es necesario
- Los eventos se sincronizan al Google Calendar compartido en tiempo real

### Profesores (Staff PIN)
- Ven disponibilidad del box
- Pueden reservar o bloquear horas
- No pueden eliminar eventos ajenos

### Tipos de evento
- 🟢 **Evaluación** — sesiones de Zelena con socios
- 🔵 **Clase / Box** — clases grupales o uso del box
- 🟡 **Nutrición** — consultas nutricionales
- 🔴 **Bloqueado** — mantención, reserva exclusiva

---

## ⚡ Modo demo

Si la API no está configurada, la app funciona con eventos de ejemplo. Perfecto para mostrar a los profesores cómo se ve antes de conectar Google Calendar.
