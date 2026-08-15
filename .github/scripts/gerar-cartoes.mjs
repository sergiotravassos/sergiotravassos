/* ═══════════════════════════════════════════════════════════════
 *  CARTÕES DO PERFIL — gerados aqui, servidos do próprio repositório
 *
 *  Existe porque os cartões antigos vinham de um fork do
 *  github-readme-stats num Vercel de terceiros. Ficou sem token, bateu
 *  no limite da API do GitHub e passou a devolver "Something went
 *  wrong! Maximum retries exceeded" — com HTTP 200, portanto sem nada
 *  a avisar. Esteve assim no perfil durante meses.
 *
 *  Aqui não há servidor a que chamar quando alguém abre o perfil: o SVG
 *  é um ficheiro no branch output. Se a geração falhar, falha na
 *  Action, à vista, e o perfil continua a mostrar o cartão de ontem.
 *
 *  Sem dependências. Node 18+ (fetch nativo).
 *
 *    node gerar-cartoes.mjs <utilizador> <pasta-de-saida>
 *
 *  Precisa de GITHUB_TOKEN no ambiente — nas Actions vem de graça.
 * ═══════════════════════════════════════════════════════════════ */

const UTILIZADOR = process.argv[2] || 'sergiotravassos';
const SAIDA = process.argv[3] || 'dist';
const TOKEN = process.env.GITHUB_TOKEN;

if (!TOKEN) {
  console.error('Falta o GITHUB_TOKEN no ambiente.');
  process.exit(1);
}

/* ── 1. Os dados ───────────────────────────────────────────────
 * Uma pergunta só. As linguagens vêm por BYTES e não por número de
 * repositórios: dez repositórios de exercício em JavaScript não valem
 * mais do que um serviço inteiro em Java, e por contagem de repos
 * valeriam. */
const PERGUNTA = `
query($login: String!) {
  user(login: $login) {
    name
    createdAt
    contributionsCollection {
      contributionCalendar { totalContributions }
    }
    repositories(first: 100, ownerAffiliations: OWNER, isFork: false) {
      totalCount
      nodes {
        languages(first: 12, orderBy: {field: SIZE, direction: DESC}) {
          edges { size node { name color } }
        }
      }
    }
  }
}`;

const resposta = await fetch('https://api.github.com/graphql', {
  method: 'POST',
  headers: {
    authorization: `bearer ${TOKEN}`,
    'content-type': 'application/json',
    'user-agent': 'cartoes-do-perfil',
  },
  body: JSON.stringify({ query: PERGUNTA, variables: { login: UTILIZADOR } }),
});

if (!resposta.ok) {
  console.error(`A API respondeu ${resposta.status}: ${await resposta.text()}`);
  process.exit(1);
}

const corpo = await resposta.json();
if (corpo.errors) {
  console.error('A API devolveu erros:', JSON.stringify(corpo.errors, null, 2));
  process.exit(1);
}

const u = corpo.data.user;

/* Guarda contra o pior caso silencioso: a pergunta responde, mas sem
   linguagem nenhuma. Sem isto o cartão saía com uma barra vazia e
   ninguém percebia que estava avariado — que é exactamente o defeito
   que este ficheiro veio substituir. */
const bytes = new Map();
const cores = new Map();
for (const repo of u.repositories.nodes) {
  for (const { size, node } of repo.languages.edges) {
    bytes.set(node.name, (bytes.get(node.name) || 0) + size);
    cores.set(node.name, node.color || '#8b949e');
  }
}
if (bytes.size === 0) {
  console.error('Nenhuma linguagem devolvida — não vale a pena escrever um cartão vazio.');
  process.exit(1);
}

const total = [...bytes.values()].reduce((a, b) => a + b, 0);
const TOP = 6;
const ordenadas = [...bytes.entries()].sort((a, b) => b[1] - a[1]);
const principais = ordenadas.slice(0, TOP);
const restoBytes = ordenadas.slice(TOP).reduce((a, [, v]) => a + v, 0);
const linhas = restoBytes > 0
  ? [...principais, ['Outras', restoBytes]]
  : principais;
if (restoBytes > 0) cores.set('Outras', '#8b949e');

const anos = new Date().getUTCFullYear() - new Date(u.createdAt).getUTCFullYear();
const factos = [
  `${u.contributionsCollection.contributionCalendar.totalContributions} contribuições no último ano`,
  `${u.repositories.totalCount} repositórios`,
  `no GitHub há ${anos} anos`,
].join('  ·  ');

/* ── 2. O desenho ──────────────────────────────────────────────
 * Sem tipos de letra da web: um SVG carregado por <img> não os
 * descarrega, e o texto sairia na letra de recurso com outra métrica,
 * a transbordar da caixa. Daí a pilha de tipos de sistema. */
const LETRA = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Ubuntu, Roboto, Helvetica, Arial, sans-serif";

const TEMAS = {
  claro: { fundo: '#ffffff', borda: '#d0d7de', titulo: '#1f2328', texto: '#59636e', trilho: '#eaeef2' },
  escuro: { fundo: '#0d1117', borda: '#30363d', titulo: '#e6edf3', texto: '#8b949e', trilho: '#21262d' },
};

const L = 480;          // largura
const M = 25;           // margem
const BARRA_Y = 74;
const BARRA_H = 10;
const UTIL = L - M * 2;

const escapar = (s) => String(s).replace(/[&<>"]/g, (c) =>
  ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

function cartao(tema) {
  const t = TEMAS[tema];

  /* A barra empilhada. Cada fatia é proporcional aos bytes, com um
     mínimo de 2px: uma linguagem com 0,4% desapareceria da barra mas
     continuaria na legenda, e uma legenda que aponta para nada
     confunde mais do que ajuda. */
  let x = 0;
  const fatias = linhas.map(([nome, v]) => {
    const w = Math.max(2, (v / total) * UTIL);
    const r = `<rect x="${x.toFixed(1)}" y="${BARRA_Y}" width="${w.toFixed(1)}" height="${BARRA_H}"
      fill="${cores.get(nome)}"/>`;
    x += w;
    return r;
  }).join('\n      ');

  /* Legenda em duas colunas. Colunas fixas e não centradas: com
     larguras variáveis os pontos coloridos ficavam desalinhados entre
     as linhas, e é o alinhamento deles que faz a lista ler-se. */
  const COLS = 2;
  const largCol = UTIL / COLS;
  const legenda = linhas.map(([nome, v], i) => {
    const cx = (i % COLS) * largCol;
    const cy = 112 + Math.floor(i / COLS) * 23;
    const pct = ((v / total) * 100).toFixed(1);
    return `<g transform="translate(${cx.toFixed(1)}, ${cy})">
        <circle cx="6" cy="-4" r="6" fill="${cores.get(nome)}"/>
        <text x="20" y="0" fill="${t.titulo}" font-size="13" font-family="${LETRA}">${escapar(nome)}</text>
        <text x="${(largCol - 14).toFixed(1)}" y="0" fill="${t.texto}" font-size="13"
              font-family="${LETRA}" text-anchor="end">${pct}%</text>
      </g>`;
  }).join('\n      ');

  /* A altura sai da última LINHA DE BASE, não do número de linhas: o
     `112 + n*23` deixava sempre uma linha inteira de ar a mais no fundo
     e o cartão ficava pesado em baixo. 22px abaixo da última base é o
     mesmo respiro que há por cima do título. */
  const filas = Math.ceil(linhas.length / COLS);
  const ultimaBase = 112 + (filas - 1) * 23;
  const A = ultimaBase + 22;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${L}" height="${A}"
     viewBox="0 0 ${L} ${A}" role="img"
     aria-label="Linguagens de ${escapar(u.name)} por volume de código">
  <title>Linguagens de ${escapar(u.name)}</title>
  <defs>
    <!-- Arredonda as DUAS pontas da barra. Um rx na primeira fatia só
         arredondava a esquerda, e a direita ficava em esquadria. -->
    <clipPath id="barra">
      <rect x="0" y="${BARRA_Y}" width="${UTIL}" height="${BARRA_H}" rx="${BARRA_H / 2}"/>
    </clipPath>
  </defs>
  <rect x="0.5" y="0.5" width="${L - 1}" height="${A - 1}" rx="10"
        fill="${t.fundo}" stroke="${t.borda}"/>
  <g transform="translate(${M}, 0)">
    <text x="0" y="38" fill="${t.titulo}" font-size="16" font-weight="600"
          font-family="${LETRA}">Onde o código passa o tempo</text>
    <text x="0" y="58" fill="${t.texto}" font-size="12" font-family="${LETRA}">${escapar(factos)}</text>
    <g clip-path="url(#barra)">
      <rect x="0" y="${BARRA_Y}" width="${UTIL}" height="${BARRA_H}" fill="${t.trilho}"/>
      ${fatias}
    </g>
    <g>
      ${legenda}
    </g>
  </g>
</svg>
`;
}

/* ── 3. Escrever ───────────────────────────────────────────────── */
const { mkdir, writeFile } = await import('node:fs/promises');
await mkdir(SAIDA, { recursive: true });
for (const tema of Object.keys(TEMAS)) {
  const caminho = `${SAIDA}/linguagens-${tema}.svg`;
  await writeFile(caminho, cartao(tema), 'utf8');
  console.log(`  ${caminho}`);
}
console.log(`\n${linhas.length} linguagens, ${(total / 1024 / 1024).toFixed(1)} MB de código lidos.`);
