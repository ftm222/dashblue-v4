import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotsDir = './screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function exploreSite() {
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

  console.log('Navegando para https://dashblueocean.com/...');
  
  try {
    await page.goto('https://dashblueocean.com/', { 
      waitUntil: 'domcontentloaded',
      timeout: 45000 
    });

    console.log('Aguardando carregamento da aplicação React...');
    
    // Aguardar o root do React carregar
    await page.waitForSelector('#root', { timeout: 10000 });
    
    // Aguardar mais um pouco para o conteúdo renderizar
    await page.waitForTimeout(3000);

    // Capturar screenshot da página inicial
    console.log('Capturando screenshot...');
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-page.png'),
      fullPage: true 
    });

    const title = await page.title();
    const url = page.url();
    
    console.log(`\nTítulo: ${title}`);
    console.log(`URL: ${url}`);

    // Extrair todo o HTML renderizado
    const htmlContent = await page.content();
    fs.writeFileSync('./screenshots/page-html.html', htmlContent);
    console.log('HTML salvo em screenshots/page-html.html');

    // Verificar se há formulário de login
    const hasLoginForm = await page.evaluate(() => {
      const emailInput = document.querySelector('input[type="email"], input[name="email"], input[id*="email"], input[placeholder*="mail"]');
      const passwordInput = document.querySelector('input[type="password"]');
      return !!(emailInput && passwordInput);
    });
    
    if (hasLoginForm) {
      console.log('\n========================================');
      console.log('PÁGINA DE LOGIN DETECTADA');
      console.log('========================================\n');
      
      // Extrair informações detalhadas do formulário
      const loginInfo = await page.evaluate(() => {
        const form = document.querySelector('form');
        const inputs = Array.from(document.querySelectorAll('input')).map(input => ({
          type: input.type,
          name: input.name,
          id: input.id,
          placeholder: input.placeholder,
          required: input.required,
          className: input.className,
          value: input.value
        }));
        
        const buttons = Array.from(document.querySelectorAll('button, input[type="submit"]')).map(btn => ({
          type: btn.type,
          text: btn.textContent?.trim() || btn.value,
          className: btn.className
        }));

        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim(),
          className: h.className
        }));

        const links = Array.from(document.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href,
          className: a.className
        })).filter(l => l.text);

        const images = Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          className: img.className
        }));

        // Extrair cores principais
        const bodyStyles = window.getComputedStyle(document.body);
        const rootStyles = window.getComputedStyle(document.documentElement);
        
        // Buscar variáveis CSS
        const cssVars = {};
        for (let i = 0; i < rootStyles.length; i++) {
          const name = rootStyles[i];
          if (name.startsWith('--')) {
            cssVars[name] = rootStyles.getPropertyValue(name).trim();
          }
        }

        // Pegar todo o texto visível
        const allText = document.body.innerText;

        return {
          form: form ? {
            action: form.action,
            method: form.method,
            className: form.className
          } : null,
          inputs,
          buttons,
          headings,
          links,
          images,
          styles: {
            backgroundColor: bodyStyles.backgroundColor,
            color: bodyStyles.color,
            fontFamily: bodyStyles.fontFamily
          },
          cssVariables: cssVars,
          bodyText: allText,
          pageStructure: {
            hasNav: !!document.querySelector('nav'),
            hasSidebar: !!document.querySelector('[class*="sidebar"]'),
            hasHeader: !!document.querySelector('header'),
            hasFooter: !!document.querySelector('footer')
          }
        };
      });

      console.log('=== INFORMAÇÕES DO FORMULÁRIO ===');
      console.log(JSON.stringify(loginInfo, null, 2));

      // Salvar em arquivo JSON
      fs.writeFileSync('./screenshots/login-info.json', JSON.stringify(loginInfo, null, 2));
      console.log('\nInformações salvas em screenshots/login-info.json');

    } else {
      console.log('\n========================================');
      console.log('PÁGINA PRINCIPAL (SEM LOGIN)');
      console.log('========================================\n');
      
      // Explorar a página
      const pageInfo = await page.evaluate(() => {
        const nav = document.querySelector('nav, [role="navigation"], [class*="sidebar"]');
        const navLinks = nav ? Array.from(nav.querySelectorAll('a')).map(a => ({
          text: a.textContent.trim(),
          href: a.href,
          className: a.className
        })) : [];

        const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
          tag: h.tagName,
          text: h.textContent.trim()
        }));

        const allText = document.body.innerText;

        return {
          title: document.title,
          navigation: navLinks,
          headings,
          bodyText: allText.substring(0, 2000)
        };
      });

      console.log(JSON.stringify(pageInfo, null, 2));
      fs.writeFileSync('./screenshots/page-info.json', JSON.stringify(pageInfo, null, 2));
    }

    console.log('\n✅ Exploração concluída!');

  } catch (error) {
    console.error('❌ Erro ao navegar:', error.message);
    console.error(error.stack);
  } finally {
    await browser.close();
    console.log('Browser fechado.');
  }
}

exploreSite().catch(console.error);
