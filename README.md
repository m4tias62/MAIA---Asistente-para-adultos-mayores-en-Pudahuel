# MAIA · MVP Universal (multidominio)

**Objetivo**: mostrar un MVP que mantenga el avatar (dormido/activo) y guíe por voz tareas digitales comunes: **salud**, **beneficios del Estado**, **comunicación** y **trámites**.

- Frontend accesible (HTML+CSS+JS): TTS, ASR si está disponible, alto contraste, tamaño de letra.
- Backend **/api/ask** (serverless) listo para LLM (OpenAI u otro), con **guardrails** y **router por dominio**.
- Fallback **offline**: mock local con respuestas y “siguientes pasos”.

## Ejecutar
- Local: `index.html` (o `python3 -m http.server 8000`).
- GitHub Pages: subir y habilitar Pages (root).  
- **Funciones**: desplegar `functions/api/ask.js` en Vercel/Netlify/Cloudflare (en Pages no se ejecuta; el frontend hará fallback).

## Variables de entorno (función)
- `OPENAI_API_KEY` (opcional). Si falta, usa mock.
- `OPENAI_MODEL` (ej.: `gpt-4o-mini`).
- `SYSTEM_SALUD`, `SYSTEM_BENEFICIOS`, `SYSTEM_COMUNICACION`, `SYSTEM_TRAMITES` (opcionales).

## Request / Response
**Request** (POST `/api/ask`):
```json
{ "input_text":"Quiero pedir una hora en el CESFAM", "user_locale":"es-CL", "channel":"voice" }
```
**Response**:
```json
{ "type":"steps", "say":"texto breve", "suggestions":["siguiente 1","siguiente 2"] }
```

## Extender dominios
- Agrega patrones en `categoryOf(...)` (frontend) y en el router del backend.
- Coloca prompts por dominio en `prompts/*.md` o como variables de entorno.
