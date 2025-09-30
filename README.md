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
