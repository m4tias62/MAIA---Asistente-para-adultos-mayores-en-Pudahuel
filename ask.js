// Serverless endpoint de ejemplo (Vercel/Netlify). 
// No llama a un LLM real: hace routing simple y usa el KB.

export default async function handler(req, res){
  if(req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});
  const { input_text = '', user_locale = 'es-CL' } = req.body || {};

  // Guardrails básicos
  const mayContainPII = /\b(\d{7,10}|rut|RUT|pasaporte|domicilio|direccion|dirección|correo)\b/i.test(input_text);
  if(mayContainPII){
    return res.json({ type:'handoff', say:'Por tu privacidad, no necesitas darme datos personales. Si el trámite los pide, te derivo a la página o al teléfono oficial. ¿Seguimos?', suggestions:['Seguir sin datos','Llamar Salud Responde','Abrir web oficial'] });
  }

  // Cargar KB (en producción: lee desde /kb o BLOB)
  const KB = await loadKB();
  const q = input_text.toLowerCase();

  // Router simple por intención
  if(/cesfam|hora|agendar/.test(q)){
    const ces = KB.find(x=>/CESFAM Pudahuel Poniente/i.test(x.name)) || KB[0];
    return res.json({ type:'steps', say:`Para pedir hora en ${ces.name}: 1) Ten tu carnet a mano. 2) Puedes llamar o ir al mesón. Dirección: ${ces.location.address}. Teléfono: ${ces.contact.phone}. ¿Te dicto el número o te abro el mapa?`, suggestions:['Llamar ahora','Cómo llegar','Otra consulta'], kb_refs:[ces.id] });
  }
  if(/vacun/.test(q)){
    return res.json({ type:'info', say:'Los puntos de vacunación cambian por semana. Puedo leerte los puntos activos hoy o abrir el calendario comunal.', suggestions:['Leer puntos','Abrir calendario','Otra consulta'] });
  }
  if(/farmacia|popular/.test(q)){
    const fps = KB.filter(x=>x.category==='farmacia');
    const names = fps.map(x=>`${x.name.split('(')[0].trim()} – ${x.location.address}`).join('; ');
    return res.json({ type:'info', say:`Farmacia Comunal disponible: ${names}. Puedo darte indicaciones o revisar horarios.`, suggestions:['Cómo llegar','¿Horarios?','Otra consulta'], kb_refs: fps.map(x=>x.id) });
  }
  if(/sapu|urgenc/.test(q)){
    const sapu = KB.find(x=>/Gustavo Molina/i.test(x.name)) || KB.find(x=>x.category==='sapu');
    return res.json({ type:'info', say:`SAPU cercano: ${sapu.name}, ${sapu.location.address}. Atención ${sapu.hours}. ¿Deseas llamar?`, suggestions:['Llamar SAPU','Cómo llegar','Otra consulta'], kb_refs:[sapu.id] });
  }
  if(/examen/.test(q)){
    const ces = KB.find(x=>/CESFAM Pudahuel Poniente/i.test(x.name)) || KB[0];
    return res.json({ type:'steps', say:`Para exámenes: revisa tu orden médica y consulta disponibilidad en tu CESFAM (${ces.contact.phone}) o laboratorio indicado. ¿Te doy el número del CESFAM?`, suggestions:['Teléfono CESFAM','Buscar laboratorio','Otra consulta'], kb_refs:[ces.id] });
  }

  return res.json({ type:'info', say:'Puedo ayudarte con salud en Pudahuel: pedir hora, vacunas, Farmacia Comunal, SAPU y exámenes. ¿Con qué partimos?', suggestions:['Pedir hora CESFAM','Vacunación','Farmacia Comunal'] });
}

async function loadKB(){
  try{
    const fs = await import('fs');
    const path = await import('path');
    const p = path.resolve(process.cwd(), 'kb', 'pudahuel_salud.json');
    const raw = fs.readFileSync(p, 'utf8');
    return JSON.parse(raw).services;
  }catch(err){
    // Fallback mínimo si el archivo no está
    return [
      { id:'cesfam_poniente', category:'cesfam', name:'CESFAM Pudahuel Poniente', location:{address:'Av. Federico Errázuriz 620, Pudahuel'}, contact:{phone:'+56 2 2993 6110'}, hours:'horario hábil' },
      { id:'sapu_gmolina', category:'sapu', name:'SAPU Dr. Gustavo Molina', location:{address:'Av. Laguna Sur 8708, Pudahuel'}, contact:{phone:'+56 2 2749 5991'}, hours:'24 horas' }
    ];
  }
}
