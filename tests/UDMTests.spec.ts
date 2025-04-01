import { test, expect, Page } from '@playwright/test';

// Configuration globale des tests
test.describe('Tests Complets du Site Web', () => {
  const BASE_URL = 'https://bzssjmpz.elementor.cloud/';

  // Fonction utilitaire pour se connecter (si nécessaire)
  const loginIfRequired = async (page: Page) => {
    // Ajoutez ici la logique de connexion si votre site requiert une authentification
    // Exemple :
    // await page.goto(`${BASE_URL}/login`);
    // await page.fill('#username', 'votreusername');
    // await page.fill('#password', 'votremotdepasse');
    // await page.click('button[type="submit"]');
  };

  // Tests de chargement et de performance
  test.describe('Performance et Chargement', () => {
    test('Charge la page principale rapidement', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(BASE_URL, { timeout: 30000 });

      // Calculer le temps de chargement
      const loadTime = Date.now() - startTime;

      // Vérifier que la page se charge en moins de 3 secondes
      expect(loadTime).toBeLessThan(3000);

      // Vérifier que les éléments principaux sont chargés
      await expect(page.locator('body')).toBeVisible({ timeout: 5000 });
    });

    test('Vérification du temps de chargement des ressources', async ({ page }) => {
      const responses: { url: string; status: number }[] = [];

      // Écoute des réponses réseau
      page.on('response', response => {
        responses.push({
          url: response.url(),
          status: response.status(),
        });
      });

      await page.goto(BASE_URL, { timeout: 30000 });

      // Attendre que le réseau soit inactif
      await page.waitForLoadState('networkidle');

      // Vérifier que toutes les ressources principales sont chargées avec succès
      const failedResponses = responses.filter(response => response.status >= 400);
      expect(failedResponses.length).toBe(0);
    });
  });

  // Test du titre de la page
  test('has title', async ({ page }) => {
    await page.goto(BASE_URL, { timeout: 30000 });

    // Attendre que le titre soit disponible
    await page.waitForFunction(() => document.title !== '', { timeout: 5000 });

    // Vérifie que le titre de la page contient un texte spécifique
    await expect(page).toHaveTitle(/Elementor/);
  });

  // Tests de Navigation
  test.describe('Navigation', () => {
    test('Navigation principale', async ({ page }) => {
      await page.goto(BASE_URL, { timeout: 30000 });

      // Liste des liens de navigation à tester
      const navLinks = [
        { text: 'Accueil', expectedPath: '/' },
        { text: 'Services', expectedPath: '/services' },
        { text: 'Contact', expectedPath: '/contact' }
      ];

      for (const link of navLinks) {
        const navLink = page.getByRole('link', { name: link.text });

        // Attendre que l'élément soit visible
        await navLink.waitFor({ state: 'visible', timeout: 5000 });

        // Cliquer sur le lien
        await navLink.click();

        // Attendre que l'URL change
        await page.waitForURL(`**${link.expectedPath}`, { timeout: 10000 });

        // Vérifier que le titre de la page correspond au lien
        await expect(page).toHaveTitle(new RegExp(link.text, 'i'));
      }
    });

    test('Liens internes fonctionnels', async ({ page }) => {
      await page.goto(BASE_URL);

      // Collecter et tester tous les liens internes
      const links = await page.$$('a[href^="/"]');
      for (const link of links) {
        const href = await link.getAttribute('href');
        if (href) {
          await page.goto(`${BASE_URL}${href.replace(/^\//, '')}`);
          await expect(page).toHaveTitle(/.+/);
        }
      }
    });
  });

  // Tests de Formulaire
  test.describe('Formulaires', () => {
    test('Formulaire de contact', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`, { timeout: 30000 });

      // Attendre que le formulaire soit visible
      await page.waitForSelector('form', { state: 'visible', timeout: 5000 });

      // Remplir les champs
      await page.fill('input[name="nom"]', 'Utilisateur Test');
      await page.fill('input[name="email"]', 'test@example.com');
      await page.fill('textarea[name="message"]', 'Message de test automatisé');

      // Soumettre le formulaire
      await page.click('button[type="submit"]');

      // Vérifier la confirmation
      await page.waitForSelector('.confirmation-message', { state: 'visible', timeout: 5000 });
    });

    test('Validation des champs de formulaire', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`);

      // Test de validation d'email
      await page.fill('input[name="email"]', 'invalid-email');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-email')).toBeVisible();

      // Test de champ obligatoire
      await page.fill('input[name="nom"]', '');
      await page.click('button[type="submit"]');
      await expect(page.locator('.error-nom')).toBeVisible();
    });
  });

  // Tests d'Accessibilité
  test.describe('Accessibilité', () => {
    test('Vérification des attributs ARIA', async ({ page }) => {
      await page.goto(BASE_URL);

      // Vérifier les rôles ARIA
      const ariaRoles = await page.$$('[role]');
      expect(ariaRoles.length).toBeGreaterThan(0);
    });

    test('Contraste des couleurs', async ({ page }) => {
      await page.goto(BASE_URL);

      // Vérification élémentaire du contraste
      const lowContrastElements = await page.$$('.low-contrast');
      expect(lowContrastElements.length).toBe(0);
    });
  });

  // Tests de Responsive Design
  test.describe('Responsive Design', () => {
    const viewports = [
      { width: 375, height: 667, name: 'Mobile' },
      { width: 768, height: 1024, name: 'Tablette' },
      { width: 1280, height: 800, name: 'Desktop' }
    ];

    for (const viewport of viewports) {
      test(`Layout responsive - ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        await page.goto(BASE_URL);

        // Vérifier que les éléments principaux sont visibles
        const mainContent = page.locator('main');
        await expect(mainContent).toBeVisible();

        // Capture d'écran pour vérification visuelle
        await page.screenshot({
          path: `screenshots/responsive-${viewport.name}.png`
        });
      });
    }
  });

  // Tests de Sécurité
  test.describe('Sécurité', () => {
    test('En-têtes de sécurité', async ({ page }) => {
      const response = await page.goto(BASE_URL);
      const headers = response?.headers() || {};

      // Vérifier certains en-têtes de sécurité de base
      expect(headers['x-xss-protection']).toBeDefined();
      expect(headers['x-frame-options']).toBeDefined();
      expect(headers['strict-transport-security']).toBeDefined();
    });

    test('Pas de contenu sensible dans la source', async ({ page }) => {
      await page.goto(BASE_URL);
      const pageSource = await page.content();

      // Vérifier l'absence de commentaires sensibles
      expect(pageSource).not.toContain('password');
      expect(pageSource).not.toContain('secret');
    });
  });
});