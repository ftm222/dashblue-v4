import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const screenshotsDir = './screenshots';
if (!fs.existsSync(screenshotsDir)) {
  fs.mkdirSync(screenshotsDir);
}

async function exploreSite() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('Navegando para https://dashblueocean.com/...');
  
  try {
    await page.goto('https://dashblueocean.com/', { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // Aguardar um pouco para garantir que a página carregou
    await page.waitForTimeout(2000);

    // Capturar screenshot da página inicial
    await page.screenshot({ 
      path: path.join(screenshotsDir, '01-initial-page.png'),
      fullPage: true 
    });

    // Obter informações da página
    const title = await page.title();
    const url = page.url();
    
    console.log(`Título: ${title}`);
    console.log(`URL: ${url}`);

    // Verificar se há formulário de login
    const loginForm = await page.$('form');
    const emailInput = await page.$('input[type="email"], input[name="email"], input[id*="email"]');
    const passwordInput = await page.$('input[type="password"]');
    
    if (loginForm || (emailInput && passwordInput)) {
      console.log('\n=== PÁGINA DE LOGIN DETECTADA ===');
      
      // Extrair informações do formulário
      const formHTML = await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          return {
            action: form.action,
            method: form.method,
            inputs: Array.from(form.querySelectorAll('input')).map(input => ({
              type: input.type,
              name: input.name,
              id: input.id,
              placeholder: input.placeholder,
              required: input.required
            })),
            buttons: Array.from(form.querySelectorAll('button, input[type="submit"]')).map(btn => ({
              type: btn.type,
              text: btn.textContent || btn.value
            }))
          };
        }
        return null;
      });
      
      console.log('Formulário:', JSON.stringify(formHTML, null, 2));

      // Extrair todo o conteúdo visível da página
      const pageContent = await page.evaluate(() => {
        return {
          bodyText: document.body.innerText,
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
            tag: h.tagName,
            text: h.textContent.trim()
          })),
          links: Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          })),
          images: Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt
          })),
          styles: {
            backgroundColor: window.getComputedStyle(document.body).backgroundColor,
            color: window.getComputedStyle(document.body).color,
            fontFamily: window.getComputedStyle(document.body).fontFamily
          }
        };
      });

      console.log('\n=== CONTEÚDO DA PÁGINA ===');
      console.log(JSON.stringify(pageContent, null, 2));

      // Tentar extrair informações de branding
      const branding = await page.evaluate(() => {
        const logo = document.querySelector('img[alt*="logo"], img[class*="logo"], .logo img, [class*="brand"] img');
        const brandText = document.querySelector('[class*="brand"], [class*="logo"]');
        
        return {
          logo: logo ? { src: logo.src, alt: logo.alt } : null,
          brandText: brandText ? brandText.textContent.trim() : null,
          title: document.title,
          metaDescription: document.querySelector('meta[name="description"]')?.content
        };
      });

      console.log('\n=== BRANDING ===');
      console.log(JSON.stringify(branding, null, 2));

      // Extrair CSS customizado
      const colors = await page.evaluate(() => {
        const styles = window.getComputedStyle(document.documentElement);
        const cssVars = {};
        for (let i = 0; i < styles.length; i++) {
          const name = styles[i];
          if (name.startsWith('--')) {
            cssVars[name] = styles.getPropertyValue(name).trim();
          }
        }
        return cssVars;
      });

      console.log('\n=== CSS VARIABLES ===');
      console.log(JSON.stringify(colors, null, 2));

    } else {
      console.log('\n=== PÁGINA NÃO É DE LOGIN ===');
      
      // Explorar a página atual
      const pageInfo = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText.substring(0, 1000),
          headings: Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => h.textContent.trim()),
          navigation: Array.from(document.querySelectorAll('nav a, [role="navigation"] a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          }))
        };
      });

      console.log(JSON.stringify(pageInfo, null, 2));
    }

  } catch (error) {
    console.error('Erro ao navegar:', error.message);
  } finally {
    await browser.close();
  }
}

exploreSite();
