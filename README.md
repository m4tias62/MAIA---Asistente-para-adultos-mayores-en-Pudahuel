# MAIA · Salud Pudahuel (MVP accesible)

**Qué es**: prototipo web estático (HTML+CSS+JS) con voz (TTS) y dictado (si el navegador lo soporta). Pensado para personas mayores de Pudahuel con alfabetización digital baja. 

**Principios**: frases cortas, confirmaciones paso a paso, repetir a demanda, botones grandes, alto contraste opcional, una sola pantalla, español chileno, sin guardar PII.

## 1) Cómo correr y publicar

### Local
- Opción 1 (rápida): abrir `index.html` con doble clic (algunas funciones pueden requerir servidor).
- Opción 2 (recomendada): servir con un servidor simple:
  - **Python**: `python3 -m http.server 8000` → abre `http://localhost:8000`.
  - **Node**: `npx serve` → abre la URL que indique.

### GitHub Pages
1. Crea un repo, sube estos archivos.
2. Settings → Pages → **Deploy from a branch** → `main` → `/root` → Save.
3. Espera el build y prueba la URL pública.

## 2) Activación por NFC/QR (Smart Poster)

- **URL base**: tu URL pública de Pages. 
- **Auto‑arranque**: agrega `?auto=1` al final para que MAIA salude de inmediato.
- **Código QR**: genera uno con la URL completa (ej.: `https://tudominio.github.io/maia/?auto=1`).
- **NFC (NDEF URI record)**:
  - Tag recomendado: NTAG213/NTAG215 (adhesivo). 
  - Escribe un registro **URI** con la misma URL. 
  - Android: app *NFC Tools* (Wakdev) → Write → Add a record → URL/URI → Write.
  - iPhone (iOS 13+): *NFC Tools* o apps similares → Write → URL/URI → acercar el iPhone al tag.
  - Consejo físico: pega el tag en la parte superior del dispositivo y una calcomanía “📶 Acerca tu celular aquí”.

## 3) Conectar un backend ligero (cuando sea necesario)

Este MVP intenta primero `POST /api/ask` y, si falla, usa un **mock local**.

- **Esquema de request** (JSON):
```json
{
  "input_text": "Quiero pedir hora en el CESFAM",
  "user_locale": "es-CL",
  "channel": "voice",
  "history": [
    {"role":"user","content":"…"},
    {"role":"assistant","content":"…"}
  ],
  "context": {"kb_ids":["pudahuel_salud"], "device":"web", "time":"2025-09-30T16:00:00-03:00"}
}
```
- **Esquema de response** (JSON):
```json
{
  "type": "steps | info | handoff",
  "say": "texto para leer en voz alta, breve y cálido",
  "display": "opcional, HTML simple (negritas, listas)",
  "suggestions": ["siguiente paso 1", "siguiente paso 2"],
  "kb_refs": ["id-1", "id-2"],
  "escalate": {"phone":"131"}
}
```
- **Guardrails** (mínimos):
  1. **No recolectar PII** (RUT, direcciones, fichas clínicas). Si el flujo exige datos, **derivar** a web oficial o llamada.
  2. **Sin diagnóstico**. Solo orientación de trámites y rutas oficiales.
  3. **Emergencias** → **131 (SAMU)**.
  4. **Lenguaje**: claro, local, respetuoso. Confirmar y resumir.

- **Prompt de sistema sugerido (LLM)**:
```
Eres MAIA, asistente de salud de Pudahuel (Chile). Rol: orientar trámites y servicios locales (CESFAM/SAPU, vacunación, Farmacia Comunal, exámenes, salud mental, dental, rehabilitación, etc.). No das diagnósticos ni recetas. 

Estilo: español chileno, frases cortas, tono amable. Siempre confirma lo entendido, entrega el siguiente paso y ofrece ayuda humana (Salud Responde 600 360 7777). Si el usuario dice "repite" o "más lento", acorta y repite. 

Privacidad: no recolectes datos personales. Si un trámite los requiere, deriva a la web/llamada oficial. 

Salida: devuelve JSON con campos {type, say, suggestions, kb_refs}. "say" debe ser legible en voz alta. 
```

## 4) Estructura del KB (`/kb/pudahuel_salud.json`)

- Campos: 
  - `id`, `category`, `name`, `description`, `eligibility`, `documents`, `steps`, `cost`, `location` (address, geo opcional), `contact` (phone, email, web), `hours`, `booking` (web, phone), `notes`, `last_verified`, `sources` (URLs).
- Se incluyen 3 entradas iniciales verificadas a 30‑09‑2025.

## 5) Guión de test y métricas (`/tests/guion_test.md`)

- **Tareas**: 1) Pedir hora en CESFAM. 2) Ver dónde vacunarse hoy. 3) Encontrar Farmacia Comunal abierta. 4) Hallar SAPU abierto.
- **Métricas**: Comprensión (Likert 1–5), Tiempo de tarea (min), Confianza (1–5), Nº de repeticiones pedidas, Nº de errores de toque/voz.
- **Criterios de éxito**: ≥ 80% completa cada tarea sin ayuda directa, confianza ≥ 4/5.

## 6) Hardware (borrador)

- Raspberry Pi Zero 2 W (o Pi 4) + lector NFC SPI (PN532/RC522), amplificador I2S (MAX98357A) + parlante 3W 4Ω, botón grande iluminado. 
- Montaje: lector al frente (zona de toque), botón arriba (Repetir/Pausa), parlante frontal.

```
SPI: PN532/RC522 ↔ Pi (3V3). I2S: MAX98357A DIN/BCLK/LRCLK ↔ GPIO. Alimentación 5V 2.5A.
```
- Probar primero con la **web + parlante Bluetooth** para validar voz.
