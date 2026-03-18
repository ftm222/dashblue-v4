import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotsDir = './screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

const pages = [
  { name: 'visao-geral', url: 'https://dashblueocean.com/' },
  { name: 'closer', url: 'https://dashblueocean.com/closer' },
  { name: 'sdr', url: 'https://dashblueocean.com/sdr' },
  { name: 'squads', url: 'https://dashblueocean.com/squads' },
  { name: 'financeiro', url: 'https://dashblueocean.com/financeiro' },
  { name: 'trafego', url: 'https://dashblueocean.com/trafego' },
  { name: 'admin', url: 'https://dashblueocean.com/admin' }
];

async function explorePage(page, pageInfo) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Explorando: ${pageInfo.name.toUpperCase()}`);
  console.log(`URL: ${pageInfo.url}`);
  console.log('='.repeat(80));
  
  try {
    await page.goto(pageInfo.url, { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });

    await page.waitForSelector('#root', { timeout: 10000 });
    await page.waitForTimeout(3000);

    // Capturar screenshot
    const screenshotPath = path.join(screenshotsDir, `${pageInfo.name}.png`);
    await page.screenshot({ 
      path: screenshotPath,
      fullPage: true 
    });
    console.log(`✓ Screenshot salvo: ${screenshotPath}`);

    // Extrair informações da página
    const pageData = await page.evaluate(() => {
      // Função auxiliar para extrair texto limpo
      const getText = (selector) => {
        const el = document.querySelector(selector);
        return el ? el.textContent.trim() : null;
      };

      // Pegar todos os headings
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
        tag: h.tagName,
        text: h.textContent.trim(),
        className: h.className
      }));

      // Pegar cards/métricas (elementos com números grandes)
      const metrics = Array.from(document.querySelectorAll('[class*="card"], [class*="metric"], [class*="stat"]')).map(el => ({
        text: el.textContent.trim().substring(0, 200),
        className: el.className
      })).filter(m => m.text.length > 0);

      // Pegar tabelas
      const tables = Array.from(document.querySelectorAll('table')).map(table => {
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const rows = Array.from(table.querySelectorAll('tbody tr')).slice(0, 5).map(tr => 
          Array.from(tr.querySelectorAll('td')).map(td => td.textContent.trim())
        );
        return { headers, rows: rows.slice(0, 5) };
      });

      // Pegar botões e links importantes
      const buttons = Array.from(document.querySelectorAll('button')).map(btn => ({
        text: btn.textContent.trim(),
        className: btn.className
      })).filter(b => b.text.length > 0 && b.text.length < 50);

      // Pegar filtros/inputs
      const inputs = Array.from(document.querySelectorAll('input, select')).map(input => ({
        type: input.type,
        name: input.name,
        id: input.id,
        placeholder: input.placeholder,
        value: input.value
      }));

      // Pegar todo o texto visível (limitado)
      const bodyText = document.body.innerText.substring(0, 3000);

      // Verificar se há gráficos (canvas, svg)
      const hasCharts = document.querySelectorAll('canvas, svg[class*="chart"], [class*="recharts"]').length > 0;

      return {
        title: document.title,
        url: window.location.href,
        headings,
        metrics: metrics.slice(0, 20),
        tables,
        buttons: buttons.slice(0, 15),
        inputs: inputs.slice(0, 10),
        bodyText,
        hasCharts,
        chartCount: document.querySelectorAll('canvas, svg[class*="chart"], [class*="recharts"]').length
      };
    });

    // Salvar dados em JSON
    const jsonPath = path.join(screenshotsDir, `${pageInfo.name}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(pageData, null, 2));
    console.log(`✓ Dados salvos: ${jsonPath}`);

    // Imprimir resumo
    console.log(`\nResumo da página:`);
    console.log(`- Título: ${pageData.title}`);
    console.log(`- Headings: ${pageData.headings.length}`);
    console.log(`- Métricas/Cards: ${pageData.metrics.length}`);
    console.log(`- Tabelas: ${pageData.tables.length}`);
    console.log(`- Gráficos: ${pageData.chartCount}`);
    console.log(`- Botões: ${pageData.buttons.length}`);
    console.log(`- Inputs: ${pageData.inputs.length}`);

    if (pageData.headings.length > 0) {
      console.log(`\nPrincipais headings:`);
      pageData.headings.slice(0, 5).forEach(h => {
        console.log(`  ${h.tag}: ${h.text}`);
      });
    }

    return pageData;

  } catch (error) {
    console.error(`❌ Erro ao explorar ${pageInfo.name}:`, error.message);
    return null;
  }
}

async function exploreAllPages() {
  console.log('Iniciando browser...');
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  });
  
  const page = await context.newPage();

  const results = {};

  for (const pageInfo of pages) {
    const data = await explorePage(page, pageInfo);
    if (data) {
      results[pageInfo.name] = data;
    }
    // Pequena pausa entre páginas
    await page.waitForTimeout(1000);
  }

  // Salvar resumo geral
  const summaryPath = path.join(screenshotsDir, 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  console.log(`\n${'='.repeat(80)}`);
  console.log(`✅ Exploração completa! Resumo salvo em: ${summaryPath}`);
  console.log('='.repeat(80));

  await browser.close();
  console.log('Browser fechado.');
}

exploreAllPages().catch(console.error);
