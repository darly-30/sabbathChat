# MiChat

MiChat es una aplicación web de chat conversacional (estilo ChatGPT) construida con Next.js. La interfaz actúa como cliente y puede utilizar dos tipos de backends:
1. n8n: para generación de respuestas mediante flujos en n8n mediante webhooks HTTP
2. Python: backend de Python para procesamiento de documentos PDF y generación de respuestas con OpenAI

Incluye autenticación (NextAuth/Prisma), manejo de conversaciones, historial de mensajes y subida de archivos.

## Resumen rápido
- Frontend: Next.js 14 (App Router) + TypeScript
- UI: Tailwind CSS, framer-motion, lucide-react
- Autenticación: next-auth con adaptador Prisma y soporte OAuth (p. ej. Google)
- Base de datos: PostgreSQL (Prisma ORM)
- Integración RAG / LLM: 
  - n8n: webhooks configurables vía variables de entorno
  - Python: backend Flask con procesamiento de PDF, embeddings y OpenAI
- Tests E2E: Playwright

## Requisitos
- Node.js >= 18.19.0
- pnpm >= 8.0.0
- PostgreSQL o cualquier datasource compatible que uses con `DATABASE_URL`
- Para el backend Python:
  - Python >= 3.8
  - pip (gestor de paquetes de Python)

## Instalación (local)
1. Clona el repositorio

```bash
git clone <repo-url>
cd mi-grupo-ja
```

2. Instala dependencias

```bash
pnpm install
```

3. Copia las variables de entorno y edita `.env.local` con tus valores

```bash
cp .env.example .env.local
```

Variables importantes (ejemplos):
- `DATABASE_URL` – URL de conexión a la base de datos (Postgres)
- `NEXT_PUBLIC_APP_NAME` – Nombre de la app
- `NEXT_PUBLIC_ACTIVE_BACKEND` - Backend activo ('n8n' o 'python')
- `NEXT_PUBLIC_PYTHON_API_URL` - URL del backend Python (ej. http://localhost:5000)
- `N8N_BASE_URL` – URL base de n8n (ej. http://localhost:5678)
- `N8N_WEBHOOK_PATH` – Ruta del webhook en n8n (ej. /webhook/rag-chat)
- `N8N_API_KEY` o cualquier variable que uses en `lib/env.ts` para autenticar llamadas a n8n
- Variables para OAuth/NextAuth (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, etc.)

Consulta `lib/env.ts` y `lib/backend-config.ts` para ver la configuración concreta que la app espera.

4. Genera el cliente de Prisma (se ejecuta automáticamente en postinstall, pero puedes ejecutarlo manualmente):

```bash
pnpm prisma generate
```

5. Ejecuta migraciones si es necesario (opcional):

```bash
pnpm prisma migrate dev
```

6. Configura el backend Python (si vas a utilizarlo):

```bash
cd backend
python -m venv venv
# En Windows
venv\Scripts\activate
# En Linux/Mac
source venv/bin/activate
pip install -r requirements.txt
```

7. Configura la API key de OpenAI en el archivo `.env` en la carpeta `backend`:

```properties
OPEN_AI_API_KEY=tu_api_key_de_openai
```

8. Inicia el backend Python:

```bash
# En la carpeta backend
flask run
# O directamente
python app.py
```

9. Ejecuta la app en desarrollo:

```bash
pnpm dev
```

La app por defecto quedará disponible en http://localhost:3000

## Configuración de backends

La aplicación permite elegir entre dos backends diferentes:

### Backend n8n
- Utiliza webhooks de n8n para procesamiento RAG y generación de respuestas
- Configuración en `lib/env.ts` con todas las URLs necesarias
- Ideal para flujos de trabajo complejos y procesamiento avanzado

### Backend Python
- Backend Flask que procesa documentos PDF
- Crea embeddings y almacena en una base de vectores ChromaDB
- Utiliza OpenAI para generar respuestas
- Ideal para casos de uso simples o desarrollo local

Puedes cambiar entre backends utilizando el selector en la interfaz o configurando la variable `NEXT_PUBLIC_ACTIVE_BACKEND` en tu `.env.local`.

## Requisitos del Backend Python

- Python 3.8 o superior
- Paquetes requeridos:
  - Flask
  - Flask-CORS
  - python-dotenv
  - PyPDF2
  - openai (versión compatible con la API de GPT-3.5-turbo)
  - chromadb

Se recomienda instalar los paquetes mediante:

```bash
pip install flask flask-cors python-dotenv PyPDF2 openai chromadb
```

## Scripts útiles
- `pnpm dev` — iniciar servidor de desarrollo
- `pnpm build` — generar prisma client y construir la app
- `pnpm start` — iniciar la app construida
- `pnpm test:e2e` — ejecutar tests E2E con Playwright
- `pnpm type-check` — ejecutar TypeScript type check

## API / Endpoints principales
- `POST /api/auth/register` — registro manual de usuario (valida email y password). Implementado en `app/api/auth/register/route.ts`.
- NextAuth: rutas en `app/api/auth/[...nextauth]/route.ts` (OAuth, sesiones).
- `GET|POST /api/chat/send` — endpoint SSE para enviar mensajes y recibir la respuesta por partes (stream). Implementado en `app/api/chat/send/route.ts`. Este endpoint envía la petición al backend seleccionado.
- `POST /api/uploads` — endpoint para subir archivos desde el cliente (componente `FileUpload.tsx`). El backend envía el archivo al flujo de n8n o al servicio configurado.

Endpoints del backend Python:
- `POST /build_chatbot` — recibe un archivo PDF y crea embeddings
- `POST /ask_chatbot/<chatbot_id>` — recibe una pregunta y devuelve respuesta con fuentes

Formato esperado por n8n (request):

```json
{
   "chatInput": "texto del usuario",
   "topK": 5,
   "temperature": 0.7,
   "history": [{ "role": "USER|ASSISTANT|SYSTEM", "content": "..." }]
}
```

Formato esperado de respuesta desde n8n:

```json
{
   "output": "texto con la respuesta completa",
   "sources": [{ "title": "...", "url": "...", "snippet": "..." }],
   "usage": { "tokensInput": 0, "tokensOutput": 0 }
}
```

La aplicación fragmenta `output` en chunks y los transmite al cliente como eventos SSE para simular escritura progresiva.

## Base de datos y Prisma
- El esquema Prisma se encuentra en `prisma/schema.prisma`. Modelos principales: `User`, `Conversation`, `Message`, `Account`, `Session`, `DriveToken`, `UserRole`.
- Mensajes guardan `content`, `role` (USER/ASSISTANT/SYSTEM), `sources`, `usage` y relaciones de threading (`parentId` / `children`).

## Internacionalización
- Soporta `es-ES`, `es-CO` y `en-US`. Las traducciones están en `messages/{locale}/index.json` y `app/[locale]/layout.tsx` carga los mensajes dinámicamente.

## Notas sobre seguridad y despliegue
- Asegúrate de no exponer claves de API (n8n, OpenAI) o tokens en el frontend. Usa variables de entorno en el servidor.
- Para producción configura todas las URLs y tokens necesarios.
- Considera usar contenedores Docker para el despliegue conjunto de frontend y backend Python.

## Desarrollo y pruebas
- Type-check: `pnpm type-check`
- Lint: `pnpm lint` (usa la configuración de `eslint-config-next`)
- E2E: `pnpm test:e2e` (Playwright)

## Contribuciones y estructura del proyecto (rápido)
- `app/` — rutas y layouts de Next.js (App Router). Locales en `app/[locale]`.
- `app/api/` — endpoints server (auth, chat, uploads, conversations)
- `components/` — componentes React reutilizables (auth, chat, upload, ui)
- `lib/` — utilidades y clientes (db, auth helpers, env, servicios como n8n-client, python-client)
- `prisma/` — esquema y migraciones
- `messages/` — archivos de traducción
- `backend/` — backend Python con Flask, procesamiento de PDF y OpenAI

## Contacto / Ayuda
Si necesitas más información o ayuda con la configuración, por favor contacta al equipo de desarrollo.

---
Actualizado: información consolidada y pasos de ejecución.
