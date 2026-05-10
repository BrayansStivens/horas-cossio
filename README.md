# 3TC · Horas Cossio

SPA para registrar y exportar las horas extras de **Eucadio de Jesús Cossio Brand** en el formato **F-TH-16** de Transportes Terrestres Toro Cano S.A.S.

- Astro 5 + Svelte 5 + Tailwind v4
- Supabase (auth + Postgres con RLS)
- ExcelJS para exportar XLSX en el formato oficial
- Deploy gratis a GitHub Pages

---

## 🚀 Setup completo paso a paso

### 1. Crear el proyecto de Supabase

1. Entra a [supabase.com](https://supabase.com) y crea cuenta (gratis).
2. **New project** → ponle nombre `horas-cossio` (o el que quieras).
3. Elige una contraseña fuerte para la BD (no es la que usará Eucadio).
4. Región: la más cercana (South America-São Paulo).
5. Espera ~2 min a que se aprovisione.

### 2. Crear las tablas

En el dashboard de Supabase:

1. **SQL Editor → New query**.
2. Abre el archivo [`supabase/schema.sql`](./supabase/schema.sql) de este repo, copia TODO su contenido, pégalo y haz click en **Run**.
3. Debe responder "Success. No rows returned".

### 3. Crear el usuario de Eucadio

1. **Authentication → Users → Add user → Create new user**.
2. Llena:
   - **Email:** `cc8039507@horas3tc.local`
   - **Password:** `8039507`
   - **Auto Confirm User:** ✅ activado (importantísimo)
3. Click **Create user**.

> 🔑 Si en algún momento Eucadio te pide cambiar la "contraseña", entras acá y editas el password de este usuario. Si quiere también cambiar el usuario, hay que cambiar tanto la `cedula` en [`src/lib/constants.ts`](./src/lib/constants.ts) como el email de Supabase.

### 4. Copiar las llaves al proyecto

1. En Supabase: **Project Settings → API**.
2. Copia:
   - **Project URL** (algo como `https://xxxxxx.supabase.co`)
   - **anon public** key (la llave larga que empieza con `eyJ...`)
3. En tu carpeta del proyecto:
   ```bash
   cp .env.example .env
   ```
4. Edita `.env` y pega los valores:
   ```
   PUBLIC_SUPABASE_URL=https://xxxxxx.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
   ```

> ⚠️ La `anon` key es pública por diseño; la seguridad real la dan las políticas de RLS que ya están aplicadas.

### 5. Correr en local

```bash
npm install      # solo la primera vez
npm run dev
```

Abre `http://localhost:4321`. Ingresa la cédula `8039507` y debería entrar.

### 6. Crear el repo en GitHub

```bash
git init
git add -A
git commit -m "Initial commit: 3TC horas Cossio"
git branch -M main
gh repo create horas-cossio --public --source=. --push
```

(O créalo en github.com y haz `git remote add origin ...` + `git push -u origin main`).

### 7. Configurar GitHub Pages

1. En GitHub, ve a tu repo: **Settings → Pages**.
2. **Source:** `GitHub Actions` (no "Deploy from a branch").
3. **Settings → Secrets and variables → Actions → New repository secret**, crea estos dos:
   - `PUBLIC_SUPABASE_URL` = el mismo del `.env`
   - `PUBLIC_SUPABASE_ANON_KEY` = el mismo del `.env`
4. Ve a la pestaña **Actions** y verás el workflow corriendo automáticamente. Cuando termine (~2 min) tu app estará en:

   ```
   https://<TU_USUARIO_GITHUB>.github.io/horas-cossio/
   ```

5. Cada `git push` a `main` redeploys automáticamente.

> Si tu usuario de GitHub es distinto, abre [`astro.config.mjs`](./astro.config.mjs) y ajusta el campo `site` (no es obligatorio pero ayuda al SEO).

### 8. Que Eucadio la agregue a la pantalla de inicio del celular

En Safari (iPhone) o Chrome (Android):
- Abre la URL de GitHub Pages.
- Botón compartir → **Añadir a pantalla de inicio**.
- Aparecerá como una app con el icono 3TC.

---

## 🧞 Comandos

| Comando | Acción |
| :--- | :--- |
| `npm install` | Instala dependencias |
| `npm run dev` | Servidor local en `http://localhost:4321` |
| `npm run build` | Genera el sitio en `./dist/` |
| `npm run preview` | Previsualiza el build localmente |

---

## 📂 Estructura

```
src/
├── components/        # UI en Svelte 5 (runes)
│   ├── App.svelte           # auth gate + ruteo
│   ├── Login.svelte         # entrada con cédula
│   ├── Dashboard.svelte     # lista de registros + hero
│   ├── EntryModal.svelte    # crear/editar entrada
│   ├── EntryCard.svelte     # tarjeta de una entrada
│   ├── ExportModal.svelte   # selector de quincena + descarga XLSX
│   ├── ConfirmDialog.svelte # diálogo de confirmación
│   ├── Aurora.svelte        # fondo animado
│   └── Logo.svelte          # logo 3TC
├── lib/
│   ├── constants.ts         # datos fijos de Eucadio
│   ├── supabase.ts          # cliente Supabase
│   ├── auth.ts              # login/logout con CC
│   ├── store.ts             # estado global (entradas, sesión)
│   ├── date-utils.ts        # quincenas, formato fecha
│   └── excel.ts             # generación XLSX en formato F-TH-16
├── pages/
│   └── index.astro          # punto de entrada
└── styles/
    └── global.css           # tailwind v4 + glassmorphism
supabase/
└── schema.sql               # crear tabla + RLS
.github/workflows/
└── deploy.yml               # CI/CD a GitHub Pages
```

---

## 🛡️ Sobre la seguridad

- La cédula 8039507 funciona como usuario y contraseña en el cliente.
- Internamente se envía al `signInWithPassword` de Supabase con un email sintético (`cc8039507@horas3tc.local`).
- La sesión queda en `localStorage` (JWT firmado por Supabase con expiración + refresh).
- Las políticas de RLS de Postgres garantizan que cada usuario solo lee/escribe sus propias filas.
- Si alguien con la cédula entra a la app desde otro dispositivo, también podrá ver/registrar horas (es la misma cuenta). No hay segundo factor.

---

## 🆘 Troubleshooting

**"Cédula incorrecta"**: la cédula que escribió Eucadio no coincide con la que está en [`src/lib/constants.ts`](./src/lib/constants.ts). Verifica que sea `8039507` sin puntos.

**"No se pudo iniciar sesión"**: revisa que en Supabase el usuario `cc8039507@horas3tc.local` exista, tenga `Auto Confirm` activo y la contraseña sea `8039507`. También verifica las variables de entorno.

**El build de GitHub Actions falla**: confirma que los dos secrets (`PUBLIC_SUPABASE_URL`, `PUBLIC_SUPABASE_ANON_KEY`) estén creados a nivel del repo.

**La URL muestra 404**: ve a **Settings → Pages** y verifica que `Source` esté en `GitHub Actions`. El primer deploy puede tardar ~3 min.
