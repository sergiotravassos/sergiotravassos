/* ═══════════════════════════════════════════════════════════════
 *  O MIOLO: TÍTULOS DE SECÇÃO E CARTÕES DE PROJETO
 *
 *  Mesma razão do cabeçalho — o GitHub descarta CSS num README e
 *  aceita SVG. A diferença aqui é o FUNDO: o cabeçalho traz o seu
 *  próprio painel escuro, estes não.
 *
 *  TÍTULOS: fundo transparente, e o README é lido em tema claro E
 *  escuro. Uma cor que se lê num não se lê no outro. Daí o degradé
 *  #FF2D6F → #E8590C: medidos, dão 3,59:1 e 3,58:1 sobre branco, e
 *  5,28:1 e 5,29:1 sobre o #0d1117 do tema escuro — acima dos 3:1 que
 *  texto grande exige, dos dois lados. O laranja do cabeçalho
 *  (#FF9500) NÃO serve aqui: sobre branco mede 2,20:1.
 *
 *  CARTÕES: trazem painel próprio, escuro, portanto assentam nos dois
 *  temas sem terem de mudar de cor.
 *
 *    node gerar-miolo.mjs <pasta-de-saida>
 * ═══════════════════════════════════════════════════════════════ */

import { mkdir, writeFile } from 'node:fs/promises';

const SAIDA = process.argv[2] || 'dist';
const LETRA = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, Helvetica, Arial, sans-serif";

const ROSA = '#FF2D6F';
const FOGO = '#E8590C';   // e não #FF9500 — ver o cabeçalho do ficheiro
const PAINEL = '#17151A';
const PAINEL2 = '#241E28';
const CINZA = '#B9AEC4';

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* ── títulos ─────────────────────────────────────────────────── */

const TITULOS = [
  ['projetos', 'O que ando a construir'],
  ['certificacoes', 'Certificações'],
  ['stack', 'Stack'],
  ['contacto', 'Onde me encontrar'],
];

function titulo(texto) {
  const A = 46;
  /* Largura pela contagem de caracteres: 13,2px por letra a 24px de
     corpo com peso 800. Sobra de propósito — um viewBox curto cortava
     a última letra em quem tem a pilha de tipos a resolver para Arial,
     que é o mais largo dos três. */
  const L = Math.round(texto.length * 13.2) + 40;
  const hex = Array.from({ length: 6 }, (_, i) => {
    const ang = (Math.PI / 180) * (60 * i - 90);
    return `${(11 + 10 * Math.cos(ang)).toFixed(1)},${(24 + 10 * Math.sin(ang)).toFixed(1)}`;
  }).join(' ');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}"
     viewBox="0 0 ${L} ${A}" role="img" aria-label="${esc(texto)}">
  <title>${esc(texto)}</title>
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="${ROSA}"/>
      <stop offset="1" stop-color="${FOGO}"/>
    </linearGradient>
  </defs>
  <polygon points="${hex}" fill="url(#g)"/>
  <text x="32" y="32" font-size="24" font-weight="800" font-family="${LETRA}"
        letter-spacing="-0.3" fill="url(#g)">${esc(texto)}</text>
</svg>
`;
}

/* ── cartões ─────────────────────────────────────────────────── */

const CARTOES = [
  {
    ficheiro: 'projeto-esposas',
    cor: '#C9A227',
    titulo: 'esposasliterarias.com',
    etiqueta: 'NO AR',
    texto: 'Site de um clube de leitura. Sem build: HTML, CSS e JS puro, copiados tal e qual. Publica sozinho na Cloudflare e só sobe se passar em quatro conferências.',
    chips: ['HTML', 'CSS', 'JS', 'Cloudflare', 'Apps Script'],
  },
  {
    ficheiro: 'projeto-dotfiles',
    cor: '#89E051',
    titulo: 'dotfiles',
    etiqueta: 'PÚBLICO',
    texto: 'A máquina de trabalho, versionada. Um clone e o ambiente volta ao sítio.',
    chips: ['Shell', 'macOS'],
  },
  {
    ficheiro: 'projeto-redhat',
    cor: '#EE0000',
    titulo: 'Red Hat · AD221 · DO288 · DO180',
    etiqueta: 'LABS',
    texto: 'Integração cloud-native com Red Hat Fuse, e as aplicações dos cursos de OpenShift.',
    chips: ['Fuse', 'OpenShift', 'Camel'],
  },
];

const LC = 300;

/* Quebra de linha à mão: um <text> de SVG não quebra sozinho. A conta
   de 5,55px por carácter a 11,5px é conservadora — mais vale uma linha
   curta do que uma palavra a sair pela borda do cartão. */
function quebrar(texto, larguraPx, corpo) {
  const porChar = corpo * 0.482;
  const max = Math.floor(larguraPx / porChar);
  const linhas = [];
  let atual = '';
  for (const p of texto.split(' ')) {
    if ((atual + ' ' + p).trim().length > max) { linhas.push(atual.trim()); atual = p; }
    else atual += ' ' + p;
  }
  if (atual.trim()) linhas.push(atual.trim());
  return linhas;
}

function cartao(c, AC) {
  const linhas = quebrar(c.texto, LC - 36, 11.5).slice(0, 5);

  /* Os chips quebram de linha. Sem isto, "Apps Script" saía pela borda
     do cartão — cinco chips somam mais do que os 264px úteis. */
  const UTIL = LC - 36;
  /* Duas passagens: primeiro contam-se as filas, e só depois se
     desenha. É preciso saber quantas são ANTES, porque o bloco é
     alinhado pelo FUNDO do cartão — ancorado no topo, a segunda fila
     caía para fora da moldura e o chip ficava cortado ao meio. */
  let filas = 1, xm = 0;
  for (const n of c.chips) {
    const w = Math.round(n.length * 6.1 + 18);
    if (xm > 0 && xm + w > UTIL) { xm = 0; filas += 1; }
    xm += w + 6;
  }
  const chipsY = AC - 34 - (filas - 1) * 26;

  let cx = 0, fila = 0;
  const chips = c.chips.map((n) => {
    const w = Math.round(n.length * 6.1 + 18);
    if (cx > 0 && cx + w > UTIL) { cx = 0; fila += 1; }
    const g = `<g transform="translate(${cx},${fila * 26})">
      <rect width="${w}" height="20" rx="10" fill="${c.cor}" fill-opacity="0.13"/>
      <text x="${w / 2}" y="13.5" font-size="10" font-weight="600" font-family="${LETRA}"
            fill="${c.cor}" text-anchor="middle">${esc(n)}</text>
    </g>`;
    cx += w + 6;
    return g;
  }).join('\n    ');
  /* A altura do cartão acompanha as filas de chips, e é a MESMA para os
     três: cartões lado a lado com alturas diferentes leem-se como
     defeito. Manda quem tiver mais chips. */

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${LC}" height="${AC}"
     viewBox="0 0 ${LC} ${AC}" role="img" aria-label="${esc(c.titulo)} — ${esc(c.texto)}">
  <title>${esc(c.titulo)}</title>
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PAINEL2}"/>
      <stop offset="1" stop-color="${PAINEL}"/>
    </linearGradient>
    <clipPath id="m"><rect width="${LC}" height="${AC}" rx="12"/></clipPath>
  </defs>
  <g clip-path="url(#m)">
    <rect width="${LC}" height="${AC}" fill="url(#p)"/>
    <rect width="${LC}" height="4" fill="${c.cor}"/>
    <circle cx="${LC - 30}" cy="${AC - 24}" r="70" fill="${c.cor}" fill-opacity="0.05"/>
  </g>
  <rect x="0.5" y="0.5" width="${LC - 1}" height="${AC - 1}" rx="12"
        fill="none" stroke="${c.cor}" stroke-opacity="0.28"/>

  <g transform="translate(18, 0)">
    <rect x="0" y="22" width="${c.etiqueta.length * 6.4 + 16}" height="17" rx="4"
          fill="${c.cor}" fill-opacity="0.16"/>
    <text x="${(c.etiqueta.length * 6.4 + 16) / 2}" y="34" font-size="9" font-weight="700"
          font-family="${LETRA}" fill="${c.cor}" letter-spacing="0.6"
          text-anchor="middle">${esc(c.etiqueta)}</text>

    <text x="0" y="62" font-size="15" font-weight="700" font-family="${LETRA}"
          fill="#FFFFFF">${esc(c.titulo)}</text>

    ${linhas.map((l, i) => `<text x="0" y="${86 + i * 17}" font-size="11.5"
          font-family="${LETRA}" fill="${CINZA}">${esc(l)}</text>`).join('\n    ')}

    <g transform="translate(0, ${chipsY})">
    ${chips}
    </g>
  </g>
</svg>
`;
}

/* ── escrever ────────────────────────────────────────────────── */
await mkdir(SAIDA, { recursive: true });
for (const [nome, texto] of TITULOS) {
  await writeFile(`${SAIDA}/titulo-${nome}.svg`, titulo(texto), 'utf8');
  console.log(`  ${SAIDA}/titulo-${nome}.svg`);
}
const filasDe = (c) => {
  let x = 0, f = 1;
  for (const n of c.chips) {
    const w = Math.round(n.length * 6.1 + 18);
    if (x > 0 && x + w > LC - 36) { x = 0; f += 1; }
    x += w + 6;
  }
  return f;
};
const AC = 198 + (Math.max(...CARTOES.map(filasDe)) - 1) * 26;
for (const c of CARTOES) {
  await writeFile(`${SAIDA}/${c.ficheiro}.svg`, cartao(c, AC), 'utf8');
  console.log(`  ${SAIDA}/${c.ficheiro}.svg`);
}
