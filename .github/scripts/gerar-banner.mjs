/* ═══════════════════════════════════════════════════════════════
 *  O CABEÇALHO DO PERFIL
 *
 *  Um README não aceita CSS — o GitHub descarta `style=` e folhas de
 *  estilo. Aceita SVG. É por isso que o cabeçalho é desenhado aqui em
 *  vez de ser montado em HTML: dentro de um SVG há gradientes, formas
 *  e tipografia a sério, e o GitHub serve-o como serve uma imagem.
 *
 *  Um só ficheiro para os dois temas. O painel é escuro por desenho,
 *  portanto assenta tanto no GitHub claro como no escuro — e assim a
 *  foto não vai embutida duas vezes.
 *
 *  A FOTO:
 *  Vem de .github/assets/foto.jpg, e esse ficheiro tem de estar SEM
 *  EXIF. O original, que ainda vive no gist antigo, trazia as
 *  coordenadas GPS de onde foi tirada — São Paulo, 20/10/2019 — e ia
 *  em base64 para dentro do SVG, ao alcance de quem soubesse abrir o
 *  ficheiro. Ver docs no README do repositório.
 *
 *  Um SVG carregado por <img> não descarrega nada de fora: nem tipos
 *  de letra, nem imagens. Daí a foto embutida e a pilha de tipos de
 *  sistema.
 *
 *    node gerar-banner.mjs <pasta-de-saida>
 * ═══════════════════════════════════════════════════════════════ */

import { readFile, mkdir, writeFile } from 'node:fs/promises';

const SAIDA = process.argv[2] || 'dist';
const FOTO = process.env.FOTO || '.github/assets/foto.jpg';

const L = 900;
const A = 300;

const LETRA = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, Helvetica, Arial, sans-serif";

/* As cores da ficha antiga, que é a identidade que já existe: o
   rosa-para-laranja do topo e o painel quase preto por baixo. */
const ROSA = '#FF2D6F';
const LARANJA = '#FF9500';
const PAINEL = '#17151A';
const PAINEL2 = '#241E28';

const CHIPS = [
  ['Java', '#ED8B00'],
  ['Quarkus', '#4695EB'],
  ['Kafka', '#FFFFFF'],
  ['OpenShift', '#EE0000'],
  ['Kubernetes', '#326CE5'],
  ['LLM', '#8B5CF6'],
];

const foto = await readFile(FOTO).catch(() => {
  console.error(`Falta ${FOTO}. O cabeçalho não se desenha sem ela.`);
  process.exit(1);
});
const foto64 = foto.toString('base64');

/* ── o hexágono ──
   A ficha antiga punha a foto num hexágono. Mantém-se: é o que já
   identifica o perfil, e trocar por um círculo era deitar fora a
   única marca visual que lá estava. */
const HX = 152, HY = 156, HR = 106;
const hexagono = Array.from({ length: 6 }, (_, i) => {
  const ang = (Math.PI / 180) * (60 * i - 90);
  return `${(HX + HR * Math.cos(ang)).toFixed(1)},${(HY + HR * Math.sin(ang)).toFixed(1)}`;
}).join(' ');

/* Os chips medem-se pelo texto: 7.4px por carácter a 13px de corpo é
   o que a pilha de tipos de sistema dá, com folga para o Arial, que é
   o mais largo dos três. Sem isto o texto sai da cápsula. */
let cx = 0;
const chips = CHIPS.map(([nome, cor]) => {
  const w = Math.round(nome.length * 7.4 + 26);
  const g = `<g transform="translate(${cx}, 0)">
        <rect x="0" y="0" width="${w}" height="26" rx="13" fill="${cor}" fill-opacity="0.14"/>
        <rect x="0.5" y="0.5" width="${w - 1}" height="25" rx="12.5" fill="none" stroke="${cor}" stroke-opacity="0.55"/>
        <text x="${w / 2}" y="17.5" fill="${cor}" font-size="12" font-weight="600"
              font-family="${LETRA}" text-anchor="middle">${nome}</text>
      </g>`;
  cx += w + 8;
  return g;
}).join('\n      ');

const svg = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
     width="${L}" height="${A}" viewBox="0 0 ${L} ${A}" role="img"
     aria-label="Sérgio Travassos — Principal Engineer na Timestamp, Lisboa">
  <title>Sérgio Travassos — Principal Engineer</title>
  <defs>
    <linearGradient id="quente" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${ROSA}"/>
      <stop offset="1" stop-color="${LARANJA}"/>
      <!-- Deriva lenta. Se o renderizador ignorar SMIL fica o primeiro
           quadro, que já é o desenho certo — nunca fica em branco. -->
      <animate attributeName="x1" values="0;0.35;0" dur="14s" repeatCount="indefinite"/>
    </linearGradient>
    <linearGradient id="fundo" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PAINEL2}"/>
      <stop offset="1" stop-color="${PAINEL}"/>
    </linearGradient>
    <linearGradient id="fio" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ROSA}"/>
      <stop offset="0.55" stop-color="${LARANJA}"/>
      <stop offset="1" stop-color="${LARANJA}" stop-opacity="0"/>
    </linearGradient>
    <clipPath id="hex"><polygon points="${hexagono}"/></clipPath>
    <clipPath id="moldura"><rect x="0" y="0" width="${L}" height="${A}" rx="14"/></clipPath>
  </defs>

  <g clip-path="url(#moldura)">
    <rect width="${L}" height="${A}" fill="url(#fundo)"/>

    <!-- As facetas: mesma ideia da ficha antiga, deitada.
         A faixa quente FICA POR CIMA do nome e não atrás dele. Branco
         sobre este laranja mede 2,1:1, e texto grande exige 3:1 — com o
         nome a cavalo na faixa, metade dele ficava por baixo do mínimo.
         Assente no painel escuro, mede 15:1. -->
    <polygon points="0,0 ${L},0 ${L},56 0,104" fill="url(#quente)" opacity="0.95"/>
    <polygon points="0,104 ${L},56 ${L},84 0,132" fill="url(#quente)" opacity="0.26"/>
    <polygon points="${L * 0.62},0 ${L},0 ${L},${A} ${L * 0.78},${A}" fill="${LARANJA}" opacity="0.07"/>

    <!-- o hexágono da foto -->
    <g>
      <polygon points="${hexagono}" fill="${PAINEL}"/>
      <image clip-path="url(#hex)" x="${HX - HR}" y="${HY - HR}" width="${HR * 2}" height="${HR * 2}"
             preserveAspectRatio="xMidYMid slice"
             xlink:href="data:image/jpeg;base64,${foto64}"/>
      <polygon points="${hexagono}" fill="none" stroke="#FFFFFF" stroke-opacity="0.85" stroke-width="2.5"/>
    </g>

    <!-- o texto -->
    <g transform="translate(300, 0)">
      <text x="0" y="158" fill="#FFFFFF" font-size="40" font-weight="800"
            font-family="${LETRA}" letter-spacing="-0.5">Sérgio Travassos</text>
      <rect x="0" y="174" width="330" height="3" rx="1.5" fill="url(#fio)"/>

      <text x="0" y="206" fill="#FFFFFF" font-size="16" font-weight="700" font-family="${LETRA}">
        Principal Engineer<tspan fill="#B9AEC4" font-weight="400"> · Timestamp · Lisboa</tspan>
      </text>
      <text x="0" y="230" fill="#B9AEC4" font-size="13.5" font-family="${LETRA}">
        Arquiteturas de microserviços para sistemas de muita carga,
      </text>
      <text x="0" y="249" fill="#B9AEC4" font-size="13.5" font-family="${LETRA}">
        e as equipas que as constroem. Mais de 10 anos em Java.
      </text>

      <g transform="translate(0, 266)">
      ${chips}
      </g>
    </g>
  </g>
</svg>
`;

await mkdir(SAIDA, { recursive: true });
await writeFile(`${SAIDA}/banner.svg`, svg, 'utf8');
console.log(`  ${SAIDA}/banner.svg  ${(svg.length / 1024).toFixed(0)} KB`);
