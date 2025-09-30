// /functions/api/ask.js — serverless handler (Node.js)

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const body = typeof req.body === 'string' ? JSON.parse(req.body||'{}') : (req.body||{});
  const { input_text = '', user_locale = 'es-CL' } = body;

  const emergencyPattern = /\b(auxilio|emergencia|desmay(o|é)|infarto|fuego|incendio|violencia|asalto)\b/i;
  if (emergencyPattern.test(input_text)) {
    return res.json({ type:'handoff', say:'Si es una emergencia, llama al 131 ahora. ¿Te ayudo con otra cosa?', suggestions:['Llamar 131','Otra consulta'], escalate:{phone:'131'} });
  }

  const domain = categoryOf(input_text);
  const system = pickSystemPrompt(domain);
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
  const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';

  if(!OPENAI_API_KEY){
    return res.json(mockAnswer(input_text));
  }

  try{
    const messages = [
      { role: 'system', content: system },
      { role: 'user', content: sanitize(input_text) }
    ];
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        temperature: 0.2,
        max_tokens: 250,
        messages
      })
    });
    if(!r.ok){
      const err = await r.text();
      return res.status(200).json({ type:'info', say:'Estoy con dificultad para responder ahora. Probemos con pasos simples. ¿Qué tarea quieres hacer: salud, beneficios, comunicación o trámites?', suggestions:['Salud','Beneficios','Comunicación','Trámites'], error: err.slice(0,200) });
    }
    const data = await r.json();
    const text = data?.choices?.[0]?.message?.content?.trim() || 'Puedo ayudarte con pasos simples. ¿Qué necesitas ahora?';
    return res.json(shapeLLM(text));
  }catch(e){
    return res.json({ type:'info', say:'Tuve un problema de conexión. Te propongo pasos simples. ¿Qué necesitas: salud, beneficios, comunicación o trámites?', suggestions:['Salud','Beneficios','Comunicación','Trámites'] });
  }
}

function categoryOf(q=''){
  q = q.toLowerCase();
  if(/cesfam|vacun|examen|sapu|receta|medic/i.test(q)) return 'salud';
  if(/beneficio|subsidio|bono|pensión|chileatiende|estado/i.test(q)) return 'beneficios';
  if(/whatsapp|llamar|videollamada|mensaje|foto|familia/i.test(q)) return 'comunicacion';
  if(/contraseña|password|cuenta|pagar|boleta|luz|agua|internet|recuperar/i.test(q)) return 'tramites';
  return 'general';
}
function sanitize(t=''){ return t.replace(/\b(\d{7,10}|\d{2}\.\d{3}\.\d{3}-[\dkK])\b/g, '[dato]'); }
function pickSystemPrompt(domain){
  const base = (name)=>`Eres MAIA, asistente por voz para personas mayores en Chile. Dominios: salud, beneficios del Estado, comunicación y trámites digitales.
- Estilo: español chileno, frases cortas, confirmas lo entendido, das SIEMPRE el siguiente paso y ofreces ayuda humana.
- Privacidad: no pidas RUT ni datos personales. Si se requieren, deriva a sitio/llamada oficial.
- Seguridad: no das diagnósticos. Para emergencias, sugiere 131.
- Salida: SOLO texto breve (máx. 3 frases) y al final 2–3 sugerencias entre corchetes [Sugerencia: ...].`;
  const map = {
    salud: base('salud') + `\nContexto: pedir hora CESFAM, vacunación, SAPU, exámenes.`,
    beneficios: base('beneficios') + `\nContexto: orientar sobre requisitos y pasos generales. No inventes enlaces.`,
    comunicacion: base('comunicación') + `\nContexto: WhatsApp/llamadas/video y compartir contenido.`,
    tramites: base('trámites') + `\nContexto: recuperación de contraseñas y pagos en línea con buenas prácticas.`,
    general: base('general')
  };
  return map[domain] || map.general;
}
function shapeLLM(text){
  const sugs = Array.from(text.matchAll(/\[Sugerencia:\s*([^\]]+)\]/gi)).map(m=>m[1].trim()).slice(0,4);
  const say = text.replace(/\[Sugerencia:[^\]]+\]/gi,'').trim();
  return { type: sugs.length ? 'steps':'info', say, suggestions: sugs };
}
function mockAnswer(input){
  const d = categoryOf(input);
  if(d==='salud') return { type:'steps', say:'Para salud, partamos simple: ¿pedir hora, ver vacunación o ubicar un SAPU?', suggestions:['Pedir hora','Ver vacunación','Buscar SAPU'] };
  if(d==='beneficios') return { type:'steps', say:'Para beneficios, elige tipo: pensión, subsidio o bono. Luego revisamos requisitos.', suggestions:['Pensión','Subsidio','Bono'] };
  if(d==='comunicacion') return { type:'steps', say:'¿Enviar WhatsApp, hacer videollamada o compartir una foto? Te doy los pasos.', suggestions:['Enviar WhatsApp','Videollamar','Compartir foto'] };
  if(d==='tramites') return { type:'steps', say:'¿Recuperar contraseña o pagar una cuenta desde el celular?', suggestions:['Recuperar contraseña','Pagar cuenta'] };
  return { type:'info', say:'Soy MAIA. Puedo ayudarte con salud, beneficios, comunicación y trámites. ¿Con qué partimos?', suggestions:['Salud','Beneficios','Comunicación','Trámites'] };
}
