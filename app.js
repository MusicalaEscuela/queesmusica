/* ==================================================
   Demos sonoros con WebAudio — ¿Qué es música?
   ================================================== */
let ctx = null;

const btnAudio = document.getElementById('btnAudio');
const demoButtons = document.querySelectorAll('.play-example');

btnAudio?.addEventListener('click', async () => {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
  }
  // En iOS/Safari a veces requiere una pequeña interacción
  await ctx.resume();
  btnAudio.textContent = 'Audio activado ✔';
  btnAudio.disabled = true;
  btnAudio.classList.remove('primary');
});

demoButtons.forEach(b => {
  b.addEventListener('click', async () => {
    if (!ctx) {
      // Si el usuario no activó el audio aún, intentamos iniciarlo aquí también.
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      await ctx.resume();
      btnAudio?.setAttribute('aria-pressed', 'true');
      btnAudio?.setAttribute('disabled', 'true');
      if (btnAudio) btnAudio.textContent = 'Audio activado ✔';
    }
    const type = b.dataset.type;
    const value = b.dataset.value;
    playExample(type, value);
    // micro feedback visual
    b.style.transform = 'translateY(-1px)';
    setTimeout(() => (b.style.transform = ''), 120);
  });
});

function playExample(type, value){
  switch(type){
    case 'ritmo': return ritmo(value);
    case 'melodia': return melodia(value);
    case 'armonia': return armonia(value);
    case 'timbre': return timbre(value);
    case 'textura': return textura(value);
    default: break;
  }
}

/* Utilidades de audio */
function beep({time=0, freq=440, dur=0.15, type='sine', gain=0.2}={}){
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = 0;

  osc.connect(g); g.connect(ctx.destination);
  const t0 = ctx.currentTime + time;
  const t1 = t0 + dur;

  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t1);

  osc.start(t0); osc.stop(t1 + 0.02);
}

function click({time=0, dur=0.02, gain=0.25}={}){
  // “percusión” sencilla: ruido muy corto con filtro
  const bufferSize = 256;
  const noise = ctx.createScriptProcessor(bufferSize,1,1);
  const g = ctx.createGain();
  g.gain.value = gain;

  noise.onaudioprocess = e=>{
    const out = e.outputBuffer.getChannelData(0);
    for(let i=0;i<bufferSize;i++){
      out[i] = (Math.random()*2 - 1) * Math.exp(-i/24);
    }
  };
  noise.connect(g); g.connect(ctx.destination);
  const t0 = ctx.currentTime + time;
  setTimeout(()=>{ noise.disconnect(); }, (dur*1000)+25);
}

/* ===== Ritmo ===== */
function ritmo(kind){
  const bpm = 96;
  const beat = 60 / bpm;
  // limpio latido previo: (no guardamos refs; usamos eventos cortos)
  if (kind === 'simple'){
    // 1 compás 4/4: pulso + acento en 1
    for (let i=0;i<4;i++){
      const t = i*beat;
      click({time:t, gain: i===0?0.35:0.22});
    }
  } else if (kind === 'claves'){
    // patrón de claves 3–2 en dos compases (8 pulsos)
    const pattern = [0, beat*1.5, beat*2.5, beat*4, beat*6]; // ubicaciones
    pattern.forEach((t, idx)=> click({time:t, gain: idx<3?0.32:0.26}));
  }
}

/* ===== Melodía ===== */
function melodia(kind){
  const base = 440; // A4
  const major = [0,2,4,5,7,9,11,12]; // semitonos
  if (kind === 'asc'){
    major.forEach((st,i)=> beep({time:i*0.15, freq: base * Math.pow(2, st/12), gain:0.18}));
  } else if (kind === 'motivo'){
    const seq = [0,2,4,2,0,-2,0].map(s=> base*Math.pow(2, s/12));
    seq.forEach((f,i)=> beep({time:i*0.14, freq:f, gain:0.2}));
  }
}

/* ===== Armonía ===== */
function armonia(kind){
  const base = 261.63; // C4
  if (kind === 'triada'){
    chord([0,4,7], base, 0);
  } else if (kind === 'cadencia'){
    // I (C), V (G), I (C)
    chord([0,4,7], base, 0);
    chord([ -2,2,7 ], base, 0.8); // G: B D G (relativo a C)
    chord([0,4,7], base, 1.6);
  }
}

function chord(semitones, root, time){
  const dur = 0.9;
  semitones.forEach(st => beep({time, freq: root*Math.pow(2, st/12), dur, gain:0.16, type:'sine'}));
}

/* ===== Timbre ===== */
function timbre(wave){
  const freq = 392; // G4
  const dur = 0.6;
  beep({freq, dur, type: wave==='sierra'?'sawtooth': wave==='cuadrada'?'square':'sine', gain:0.22});
}

/* ===== Textura ===== */
function textura(kind){
  const base = 392; // G4
  if (kind === 'mono'){
    // una sola línea
    [0,2,4,5,7,5,4,2].forEach((st,i)=> beep({time:i*0.12, freq: base*Math.pow(2, st/12), gain:0.18}));
  } else if (kind === 'homo'){
    // melodía + acorde simple abajo
    [0,2,4,5,7,5,4,2].forEach((st,i)=> {
      beep({time:i*0.14, freq: base*Math.pow(2, st/12), gain:0.18});
      // pedal de tónica + tercera
      beep({time:i*0.14, freq: base*Math.pow(2, -12/12), gain:0.10, dur:0.2});
      beep({time:i*0.14, freq: base*Math.pow(2, -8/12), gain:0.08, dur:0.2});
    });
  } else if (kind === 'poli'){
    // dos líneas independientes que se cruzan un poquito
    const up = [0,2,4,5,7,9].map(st=> base*Math.pow(2, st/12));
    const down = [12,10,9,7,5,4].map(st=> base*Math.pow(2, st/12));
    up.forEach((f,i)=> beep({time:i*0.16, freq:f, gain:0.16}));
    down.forEach((f,i)=> beep({time:i*0.16+0.08, freq:f, gain:0.14}));
  }
}
