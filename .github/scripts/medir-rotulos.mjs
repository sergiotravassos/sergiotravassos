/* ═══════════════════════════════════════════════════════════════
 *  MEDE OS RÓTULOS DA STACK, UMA VEZ, E GUARDA A TABELA
 *
 *  Existe porque calcular a largura do texto por uma média de pixels
 *  por carácter não funciona: um M é três vezes mais largo que um I.
 *  Com 7,3px fixos, o PROMETHEUS saía 16,7px fora da tile.
 *
 *  E uma tabela por CARÁCTER também não chega: a 11px o navegador
 *  arredonda o avanço de cada glifo, portanto a escala a partir de um
 *  corpo grande fica sempre curta. Só medir o rótulo inteiro, no corpo
 *  em que vai ser desenhado, dá o número certo.
 *
 *  Corre-se à mão quando se acrescenta uma tecnologia:
 *    node .github/scripts/medir-rotulos.mjs
 *
 *  Precisa do Playwright, que NÃO é dependência do workflow: o
 *  gerar-stack.mjs só lê o ficheiro que isto escreve.
 * ═══════════════════════════════════════════════════════════════ */
import { webkit } from 'playwright';
import { readFile, writeFile } from 'node:fs/promises';

const { GRUPOS, ROTULOS } = JSON.parse(await readFile('.github/assets/stack.json', 'utf8'));
const ICONES = JSON.parse(await readFile('.github/assets/icones.json', 'utf8'));
const rotulos = [...new Set(GRUPOS.flatMap(([, itens]) =>
  itens.map((k) => (ROTULOS[k] || ICONES[k]?.nome || k).toUpperCase())))];

const nav = await webkit.launch();
const pag = await nav.newPage();
const larguras = await pag.evaluate((rs) => {
  const s = document.createElement('span');
  s.style.cssText = "position:absolute;visibility:hidden;white-space:pre;font-size:11px;font-weight:700;letter-spacing:1px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Ubuntu,Roboto,Helvetica,Arial,sans-serif";
  document.body.appendChild(s);
  return Object.fromEntries(rs.map((t) => { s.textContent = t; return [t, +s.getBoundingClientRect().width.toFixed(1)]; }));
}, rotulos);
await nav.close();
await writeFile('.github/assets/larguras-rotulos.json', JSON.stringify(larguras, null, 1), 'utf8');
console.log(`  ${Object.keys(larguras).length} rótulos medidos`);
