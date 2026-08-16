/* ═══════════════════════════════════════════════════════════════
 *  A STACK, DESENHADA AQUI
 *
 *  Eram 35 pedidos ao img.shields.io de cada vez que alguém abre o
 *  perfil. Serviço de fora, capaz de partir sem aviso — foi o que
 *  aconteceu aos cartões de estatísticas, que estiveram meses a
 *  devolver caixas de erro com HTTP 200.
 *
 *  Os logótipos são os MESMOS: vieram dos próprios badges, extraídos
 *  uma vez e guardados em .github/assets/icones.json. Ficam 27 com
 *  logótipo e 8 só com texto — que são exactamente os 8 que o shields
 *  já servia sem logótipo (Java, CSS3, Oracle, SQL Server, AWS, Azure,
 *  Heroku e VS Code saíram do simple-icons por questões de marca).
 *
 *  Painel escuro próprio, como os cartões: assim as etiquetas de grupo
 *  têm fundo garantido e leem-se nos dois temas do GitHub sem terem de
 *  mudar de cor.
 *
 *    node gerar-stack.mjs <pasta-de-saida>
 * ═══════════════════════════════════════════════════════════════ */

import { readFile, mkdir, writeFile } from 'node:fs/promises';

const SAIDA = process.argv[2] || 'dist';
const ICONES = JSON.parse(await readFile('.github/assets/icones.json', 'utf8'));
/* Larguras MEDIDAS dos rótulos, no corpo em que são desenhados.
   Antes calculava-se 7,3px por carácter, e um M é três vezes mais largo
   que um I: o PROMETHEUS saía 16,7px fora da tile. Uma tabela por
   carácter também não chega — a 11px o navegador arredonda o avanço de
   cada glifo e a escala fica sempre curta. Só medir o rótulo inteiro
   acerta. Regenera-se com .github/scripts/medir-rotulos.mjs. */
const LARGURAS = JSON.parse(await readFile('.github/assets/larguras-rotulos.json', 'utf8'));

const LETRA = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, Helvetica, Arial, sans-serif";
const PAINEL = '#17151A';
const PAINEL2 = '#241E28';
const CINZA = '#9C93A6';

/* Os grupos e os rótulos vivem em .github/assets/stack.json e não
   aqui: o medir-rotulos.mjs precisa da MESMA lista, e escrita em dois
   sítios acabaria com uma tecnologia acrescentada num deles e por
   medir no outro — que é exactamente o defeito que a tabela de
   larguras veio corrigir. */
const { GRUPOS, ROTULOS } = JSON.parse(await readFile('.github/assets/stack.json', 'utf8'));

const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

/* Texto branco não serve em cima de tudo. O amarelo do AWS ou o ciano
   do Jaeger pedem tinta escura, senão o rótulo desaparece dentro da
   própria tile — é o defeito que se vê em metade dos perfis do GitHub.
   A conta é a luminância relativa da WCAG, a mesma do contraste. */
function tintaSobre(hex) {
  const h = hex.replace('#', '');
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255);
  const f = (v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
  const lum = 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
  return lum > 0.42 ? '#12100F' : '#FFFFFF';
}

const L = 900;
const PAD = 22;
const UTIL = L - PAD * 2;
const ALT = 30;         // altura da tile
const ESP = 7;          // espaço entre tiles
const ICO = 15;

let y = PAD + 4;
const partes = [];

for (const [grupo, itens] of GRUPOS) {
  partes.push(`  <text x="${PAD}" y="${y + 10}" font-size="11" font-weight="700" font-family="${LETRA}"
        fill="${CINZA}" letter-spacing="1.1">${esc(grupo.toUpperCase())}</text>`);
  y += 24;

  let x = PAD;
  for (const chave of itens) {
    const d = ICONES[chave];
    if (!d) { console.error(`Falta o ícone de ${chave} no icones.json.`); process.exit(1); }
    const rotulo = (ROTULOS[chave] || d.nome || chave).toUpperCase();
    const temIcone = Boolean(d.path);

    /* Medido, não estimado. Se faltar na tabela — alguém acrescentou
       uma tecnologia e não correu o medir-rotulos.mjs — cai numa
       estimativa com 12% de folga: uma tile larga a mais não se nota,
       um rótulo cortado nota-se sempre. */
    const larguraTexto = LARGURAS[rotulo] ?? rotulo.length * 8.2;
    if (LARGURAS[rotulo] === undefined) {
      console.warn(`  ⚠ "${rotulo}" não está medido — corre medir-rotulos.mjs`);
    }
    const w = Math.round(12 + (temIcone ? ICO + 7 : 0) + larguraTexto + 12);

    if (x > PAD && x + w > PAD + UTIL) { x = PAD; y += ALT + ESP; }

    const tinta = tintaSobre(d.cor);
    const [vx, vy, vw, vh] = d.vb.split(/\s+/).map(Number);
    const escala = ICO / Math.max(vw, vh);
    const corIcone = d.tinta === 'white' ? tinta : d.tinta;

    partes.push(`  <g transform="translate(${x},${y})">
    <rect width="${w}" height="${ALT}" rx="6" fill="${d.cor}"/>
    ${temIcone ? `<g transform="translate(12,${(ALT - ICO) / 2}) scale(${escala.toFixed(4)}) translate(${-vx},${-vy})">
      <path d="${d.path}" fill="${corIcone}"/>
    </g>` : ''}
    <text x="${12 + (temIcone ? ICO + 7 : 0)}" y="${ALT / 2 + 4}" font-size="11" font-weight="700"
          font-family="${LETRA}" letter-spacing="1" fill="${tinta}">${esc(rotulo)}</text>
  </g>`);

    x += w + ESP;
  }
  y += ALT + 20;
}

const A = y - 20 + PAD - 4;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}"
     viewBox="0 0 ${L} ${A}" role="img"
     aria-label="Stack: ${GRUPOS.map(([g, i]) => `${g} — ${i.join(', ')}`).join('; ')}">
  <title>Stack</title>
  <defs>
    <linearGradient id="p" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="${PAINEL2}"/>
      <stop offset="1" stop-color="${PAINEL}"/>
    </linearGradient>
  </defs>
  <rect width="${L}" height="${A}" rx="14" fill="url(#p)"/>
${partes.join('\n')}
</svg>
`;

await mkdir(SAIDA, { recursive: true });
await writeFile(`${SAIDA}/stack.svg`, svg, 'utf8');
const semIcone = Object.entries(ICONES).filter(([, d]) => !d.path).map(([k]) => k);
console.log(`  ${SAIDA}/stack.svg  ${L}x${A}  ${(svg.length / 1024).toFixed(0)} KB`);
console.log(`  ${Object.keys(ICONES).length - semIcone.length} com logótipo, ${semIcone.length} só texto: ${semIcone.join(', ')}`);
