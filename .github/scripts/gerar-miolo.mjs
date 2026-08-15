/* ═══════════════════════════════════════════════════════════════
 *  O MIOLO: TÍTULOS, PROJETOS E CERTIFICAÇÕES
 *
 *  Mesma razão do cabeçalho — o GitHub descarta CSS num README e
 *  aceita SVG.
 *
 *  UMA IMAGEM POR SECÇÃO, e todas com a MESMA LARGURA (900).
 *  Os cartões já foram três imagens lado a lado, e numa janela mais
 *  estreita que 900px partiam em 2+1: três imagens soltas quebram onde
 *  calhar. Uma imagem só nunca quebra — encolhe inteira, e a secção
 *  chega ao telemóvel com a mesma composição que tem no monitor.
 *
 *  O preço é os cartões deixarem de ser clicáveis um a um: um <a>
 *  dentro de um SVG não funciona quando o SVG entra por <img>, e é
 *  assim que o GitHub o serve. Os endereços passam a ir por escrito
 *  numa linha por baixo, que é markdown a sério e continua a ser lido
 *  por um leitor de ecrã.
 *
 *  TÍTULOS: fundo transparente, e o README é lido em tema claro E
 *  escuro. Uma cor que se lê num não se lê no outro. Daí o degradé
 *  #FF2D6F → #E8590C: medidos, 3,59:1 e 3,58:1 sobre branco, e 5,28:1
 *  e 5,29:1 sobre o #0d1117. Acima dos 3:1 dos dois lados. O laranja
 *  do cabeçalho (#FF9500) NÃO serve: sobre branco mede 2,20:1.
 *
 *  PAINÉIS: trazem fundo escuro próprio, portanto não têm esse
 *  problema e não mudam de cor entre temas.
 *
 *    node gerar-miolo.mjs <pasta-de-saida>
 * ═══════════════════════════════════════════════════════════════ */

import { readFile, mkdir, writeFile } from 'node:fs/promises';

const SAIDA = process.argv[2] || 'dist';
const ICONES = JSON.parse(await readFile('.github/assets/icones.json', 'utf8'));

const LETRA = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, Helvetica, Arial, sans-serif";
const ROSA = '#FF2D6F';
const FOGO = '#E8590C';
const PAINEL = '#17151A';
const PAINEL2 = '#241E28';
const CINZA = '#B9AEC4';

const L = 900;   // a largura de toda a gente

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Um <text> de SVG não quebra linha sozinho. Conta conservadora por
   carácter: mais vale uma linha curta do que uma palavra fora da caixa. */
function quebrar(texto, larguraPx, corpo) {
  const max = Math.floor(larguraPx / (corpo * 0.482));
  const linhas = [];
  let atual = '';
  for (const p of texto.split(' ')) {
    if ((atual + ' ' + p).trim().length > max) { linhas.push(atual.trim()); atual = p; }
    else atual += ' ' + p;
  }
  if (atual.trim()) linhas.push(atual.trim());
  return linhas;
}

function tintaSobre(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b) > 0.42 ? '#12100F' : '#FFFFFF';
}

/* ── títulos ─────────────────────────────────────────────────── */

const TITULOS = [
  ['projetos', 'O que ando a construir'],
  ['certificacoes', 'Certificações'],
  ['stack', 'Stack'],
  ['contacto', 'Onde me encontrar'],
];

function titulo(texto) {
  const A = 46;
  const Lt = Math.round(texto.length * 13.2) + 40;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const ang = (Math.PI / 180) * (60 * i - 90);
    return `${(11 + 10 * Math.cos(ang)).toFixed(1)},${(24 + 10 * Math.sin(ang)).toFixed(1)}`;
  }).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Lt}" height="${A}"
     viewBox="0 0 ${Lt} ${A}" role="img" aria-label="${esc(texto)}">
  <title>${esc(texto)}</title>
  <defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="${ROSA}"/><stop offset="1" stop-color="${FOGO}"/>
  </linearGradient></defs>
  <polygon points="${hex}" fill="url(#g)"/>
  <text x="32" y="32" font-size="24" font-weight="800" font-family="${LETRA}"
        letter-spacing="-0.3" fill="url(#g)">${esc(texto)}</text>
</svg>
`;
}

/* ── projetos: três cartões, UMA imagem ──────────────────────── */

const CARTOES = [
  {
    cor: '#C9A227', titulo: 'esposasliterarias.com', etiqueta: 'NO AR',
    texto: 'Site de um clube de leitura. Sem build: HTML, CSS e JS puro, copiados tal e qual. Publica sozinho na Cloudflare e só sobe se passar em quatro conferências.',
    chips: ['HTML', 'CSS', 'JS', 'Cloudflare', 'Apps Script'],
  },
  {
    cor: '#89E051', titulo: 'dotfiles', etiqueta: 'PÚBLICO',
    texto: 'A máquina de trabalho, versionada. Um clone e o ambiente volta ao sítio.',
    chips: ['Shell', 'macOS'],
  },
  {
    cor: '#EE0000', titulo: 'Red Hat · AD221 · DO288 · DO180', etiqueta: 'LABS',
    texto: 'Integração cloud-native com Red Hat Fuse, e as aplicações dos cursos de OpenShift.',
    chips: ['Fuse', 'OpenShift', 'Camel'],
  },
];

const LC = 288;        // 3 × 288 + 2 × 18 = 900
const GAP = 18;

function filasDe(c) {
  let x = 0, f = 1;
  for (const n of c.chips) {
    const w = Math.round(n.length * 6.1 + 18);
    if (x > 0 && x + w > LC - 36) { x = 0; f += 1; }
    x += w + 6;
  }
  return f;
}

function cartao(c, AC, dx, i) {
  const linhas = quebrar(c.texto, LC - 36, 11.5).slice(0, 5);
  /* Duas passagens: contam-se as filas antes de desenhar, porque o
     bloco é alinhado pelo FUNDO. Ancorado no topo, a segunda fila caía
     para fora da moldura e o chip ficava cortado ao meio. */
  const chipsY = AC - 34 - (filasDe(c) - 1) * 26;
  let cx = 0, fila = 0;
  const chips = c.chips.map((n) => {
    const w = Math.round(n.length * 6.1 + 18);
    if (cx > 0 && cx + w > LC - 36) { cx = 0; fila += 1; }
    const g = `<g transform="translate(${cx},${fila * 26})">
          <rect width="${w}" height="20" rx="10" fill="${c.cor}" fill-opacity="0.13"/>
          <text x="${w / 2}" y="13.5" font-size="10" font-weight="600" font-family="${LETRA}"
                fill="${c.cor}" text-anchor="middle">${esc(n)}</text>
        </g>`;
    cx += w + 6;
    return g;
  }).join('\n        ');

  return `  <g transform="translate(${dx},0)">
    <g clip-path="url(#m${i})">
      <rect width="${LC}" height="${AC}" fill="${PAINEL}"/>
      <rect width="${LC}" height="4" fill="${c.cor}"/>
      <circle cx="${LC - 30}" cy="${AC - 24}" r="70" fill="${c.cor}" fill-opacity="0.05"/>
    </g>
    <rect x="0.5" y="0.5" width="${LC - 1}" height="${AC - 1}" rx="12"
          fill="none" stroke="${c.cor}" stroke-opacity="0.28"/>
    <g transform="translate(18,0)">
      <rect x="0" y="22" width="${c.etiqueta.length * 6.4 + 16}" height="17" rx="4"
            fill="${c.cor}" fill-opacity="0.16"/>
      <text x="${(c.etiqueta.length * 6.4 + 16) / 2}" y="34" font-size="9" font-weight="700"
            font-family="${LETRA}" fill="${c.cor}" letter-spacing="0.6"
            text-anchor="middle">${esc(c.etiqueta)}</text>
      <text x="0" y="62" font-size="14.5" font-weight="700" font-family="${LETRA}"
            fill="#FFFFFF">${esc(c.titulo)}</text>
      ${linhas.map((l, k) => `<text x="0" y="${86 + k * 17}" font-size="11.5"
            font-family="${LETRA}" fill="${CINZA}">${esc(l)}</text>`).join('\n      ')}
      <g transform="translate(0,${chipsY})">
        ${chips}
      </g>
    </g>
  </g>`;
}

/* Altura comum aos três: cartões lado a lado com alturas diferentes
   leem-se como defeito. Manda quem tiver mais filas de chips. */
const AC = 198 + (Math.max(...CARTOES.map(filasDe)) - 1) * 26;

const projetos = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${AC}"
     viewBox="0 0 ${L} ${AC}" role="img"
     aria-label="${esc(CARTOES.map((c) => `${c.titulo}: ${c.texto}`).join(' '))}">
  <title>Projetos</title>
  <defs>
${CARTOES.map((_, i) => `    <clipPath id="m${i}"><rect width="${LC}" height="${AC}" rx="12"/></clipPath>`).join('\n')}
  </defs>
${CARTOES.map((c, i) => cartao(c, AC, i * (LC + GAP), i)).join('\n')}
</svg>
`;

/* ── certificações ───────────────────────────────────────────── */

const CERTS = [
  { chave: 'Red Hat', texto: 'Certified Specialist in API Management', nota: '2024 · válida até 2027' },
  { chave: 'Anthropic', texto: 'AI Fluency Framework & Foundations · Claude 101 · Claude Code in Action', nota: '2026' },
];
const RODAPE = 'Também: Cloud Fundamentals, Administration and Solution Architect (FIAP) e Java Spring (DevSuperior).';

const ACERT = 22 + CERTS.length * 48 + 26;

/* Coluna de tiles com largura FIXA, a do rótulo mais comprido. Com
   larguras variáveis, "RED HAT" e "ANTHROPIC" empurravam o texto para
   sítios diferentes e as duas linhas ficavam desalinhadas — o olho
   apanha isso antes de ler qualquer palavra. */
const larguraTile = (chave) => Math.round(12 + 16 + 7 + chave.length * 7.3 + 12);
const COLTILE = Math.max(...CERTS.map((c) => larguraTile(c.chave)));

const certs = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${ACERT}"
     viewBox="0 0 ${L} ${ACERT}" role="img"
     aria-label="${esc(CERTS.map((c) => `${c.chave}: ${c.texto}, ${c.nota}`).join('. ') + '. ' + RODAPE)}">
  <title>Certificações</title>
  <defs>
    <linearGradient id="pc" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PAINEL2}"/><stop offset="1" stop-color="${PAINEL}"/>
    </linearGradient>
  </defs>
  <rect width="${L}" height="${ACERT}" rx="14" fill="url(#pc)"/>
${CERTS.map((c, i) => {
  const d = ICONES[c.chave];
  const y = 22 + i * 48;
  const tinta = tintaSobre(d.cor);
  const [vx, vy, vw, vh] = d.vb.split(/\s+/).map(Number);
  const s = 16 / Math.max(vw, vh);
  const wTile = larguraTile(c.chave);
  return `  <g transform="translate(22,${y})">
    <rect width="${wTile}" height="30" rx="6" fill="${d.cor}"/>
    <g transform="translate(12,7) scale(${s.toFixed(4)}) translate(${-vx},${-vy})">
      <path d="${d.path}" fill="${d.tinta === 'white' ? tinta : d.tinta}"/>
    </g>
    <text x="${12 + 16 + 7}" y="19.5" font-size="11" font-weight="700" font-family="${LETRA}"
          letter-spacing="1" fill="${tinta}">${esc(c.chave.toUpperCase())}</text>
    <text x="${COLTILE + 18}" y="14" font-size="13.5" font-weight="600" font-family="${LETRA}"
          fill="#FFFFFF">${esc(c.texto)}</text>
    <text x="${COLTILE + 18}" y="29" font-size="11.5" font-family="${LETRA}"
          fill="${CINZA}">${esc(c.nota)}</text>
  </g>`;
}).join('\n')}
  <text x="22" y="${ACERT - 12}" font-size="11.5" font-family="${LETRA}"
        fill="${CINZA}">${esc(RODAPE)}</text>
</svg>
`;


/* ── contactos ───────────────────────────────────────────────
   Três ficheiros e não um, ao contrário do resto: aqui o link É o
   ponto. Um <a> dentro de um SVG não funciona quando o SVG entra por
   <img>, portanto uma imagem só matava os três destinos. São pequenos
   e cabem lado a lado mesmo num telemóvel.

   O LinkedIn fica sem logótipo. Não é esquecimento: a marca foi
   retirada do simple-icons a pedido da própria LinkedIn, e o shields
   também já não a serve — o badge antigo deste README já aparecia sem
   ícone. Desenhá-la à mão era fazer o que eles pediram para não se
   fazer. O rótulo escrito chega. */

const CONTACTOS = [
  { ficheiro: 'contacto-linkedin',  chave: 'LinkedIn',  texto: 'sergiotfigueiredo' },
  { ficheiro: 'contacto-x',         chave: 'X',         texto: 'sergiortf' },
  { ficheiro: 'contacto-instagram', chave: 'Instagram', texto: 'sergiotravassos' },
];

function contacto(c) {
  const d = ICONES[c.chave];
  /* Sem isto, uma chave em falta rebentava com um TypeError a apontar
     para dentro do desenho, e não para a causa. */
  if (!d) { console.error(`Falta "${c.chave}" no icones.json.`); process.exit(1); }
  const A = 36;
  const temIcone = Boolean(d.path);
  const ICO = 16;
  const rotulo = `${c.chave} · ${c.texto}`;
  const Lc = Math.round(14 + (temIcone ? ICO + 8 : 0) + rotulo.length * 6.9 + 14);
  const [vx, vy, vw, vh] = d.vb.split(/\s+/).map(Number);
  const e = ICO / Math.max(vw, vh);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${Lc}" height="${A}"
     viewBox="0 0 ${Lc} ${A}" role="img" aria-label="${esc(rotulo)}">
  <title>${esc(rotulo)}</title>
  <rect width="${Lc}" height="${A}" rx="8" fill="${PAINEL}"/>
  <rect x="0.5" y="0.5" width="${Lc - 1}" height="${A - 1}" rx="8"
        fill="none" stroke="${d.cor}" stroke-opacity="0.45"/>
  ${temIcone ? `<g transform="translate(14,${(A - ICO) / 2}) scale(${e.toFixed(4)}) translate(${-vx},${-vy})">
    <path d="${d.path}" fill="${d.cor}"/>
  </g>` : ''}
  <text x="${14 + (temIcone ? ICO + 8 : 0)}" y="${A / 2 + 4.5}" font-size="12.5" font-weight="600"
        font-family="${LETRA}" fill="#FFFFFF">${esc(rotulo)}</text>
</svg>
`;
}

/* ── escrever ────────────────────────────────────────────────── */
await mkdir(SAIDA, { recursive: true });
for (const [nome, texto] of TITULOS) {
  await writeFile(`${SAIDA}/titulo-${nome}.svg`, titulo(texto), 'utf8');
}
await writeFile(`${SAIDA}/projetos.svg`, projetos, 'utf8');
await writeFile(`${SAIDA}/certificacoes.svg`, certs, 'utf8');
for (const c of CONTACTOS) {
  await writeFile(`${SAIDA}/${c.ficheiro}.svg`, contacto(c), 'utf8');
}
console.log(`  ${TITULOS.length} títulos`);
console.log(`  ${SAIDA}/projetos.svg       ${L}x${AC}`);
console.log(`  ${SAIDA}/certificacoes.svg  ${L}x${ACERT}`);
console.log(`  ${CONTACTOS.length} contactos`);
