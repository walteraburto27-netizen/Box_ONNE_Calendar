/* Accesibilidad: axe-core (el motor que usa Lighthouse) sobre el panel.
   Falla si aparece cualquier violación WCAG 2.1 nivel A o AA.

   Origen (10-sep-2026): un barrido con axe sobre los 10 paneles de la suite ONNE
   encontró violaciones en 5, varias CRITICAL — selects sin nombre accesible (un
   lector de pantalla los anuncia como "combo box" a secas), inputs sin etiqueta,
   contraste por debajo del mínimo y, en un caso, el zoom bloqueado. Ninguna se
   veía a simple vista y todas habían pasado revisiones manuales.

   Los profes usan estos paneles desde el teléfono, muchas veces en el gimnasio
   con luz complicada: el contraste no es un tecnicismo, es si se lee o no.

   Corre sobre el HTML estático (file://), sin API ni datos: eso alcanza para lo
   estructural, que es donde estaban TODAS las violaciones encontradas.

   Requiere el navegador de Playwright: npx playwright install chromium
   (o CHROMIUM_PATH apuntando a un binario ya instalado). */
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const AXE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'];
const PAGINAS = ["index.html"];

(async () => {
  const executablePath = process.env.CHROMIUM_PATH
    || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath });
  let fallos = 0;

  for (const rel of PAGINAS) {
    const f = path.join(__dirname, '..', rel);
    if (!fs.existsSync(f)) { console.error(`FAIL ${rel} no existe`); fallos++; continue; }
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    /* Sin API los scripts de la página fallan; el DOM igual se audita. */
    page.on('pageerror', () => {});
    try {
      await page.goto('file://' + f, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1200);
      await page.evaluate(AXE);
      const r = await page.evaluate(async (tags) =>
        await axe.run(document, { runOnly: { type: 'tag', values: tags } }), TAGS);
      if (r.violations.length) {
        fallos += r.violations.length;
        console.error(`FAIL ${rel} — ${r.violations.length} violaciones:`);
        for (const v of r.violations) {
          console.error(`  [${String(v.impact).toUpperCase()}] ${v.id} — ${v.help}`);
          v.nodes.slice(0, 3).forEach(n => console.error(`     · ${n.target.join(' ').slice(0, 100)}`));
          if (v.nodes.length > 3) console.error(`     … y ${v.nodes.length - 3} más`);
        }
      } else {
        console.log(`OK  ${rel} — 0 violaciones · ${r.passes.length} checks`);
      }
    } catch (e) {
      console.error(`FAIL ${rel} — ${e && e.message || e}`);
      fallos++;
    }
    await page.close();
  }

  await browser.close();
  if (!fallos) console.log('\nA11Y OK — 0 violaciones WCAG 2.1 A/AA');
  process.exit(fallos ? 1 : 0);
})();
