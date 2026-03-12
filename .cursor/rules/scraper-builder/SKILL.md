---
name: scraper-builder
description: Generate complete, runnable web scraper projects using the PageObject pattern with Playwright and TypeScript. Use when the user wants to scrape a website, extract data, build a web scraper, create site-specific data extraction, or automate site analysis. Produces typed scrapers with Docker deployment.
---

# Scraper Builder

Generate complete, runnable web scraper projects using the PageObject pattern with Playwright and TypeScript. Produces site-specific scrapers with typed data extraction, Docker deployment, and optional agent-browser integration for automated site analysis.

## When to Use This Skill

Use this skill when:
- Creating reusable scraping components (pagination, data tables)
- Scaffolding a complete scraper project with Docker support
- Generating PageObject classes for a target website
- Building a site-specific web scraper for data extraction

Do NOT use this skill when:
- Scraping sites that require authentication bypass or CAPTCHA solving
- Mass crawling or spidering entire domains
- Writing QA/E2E test suites

## Core Principles

### 1. PageObject Encapsulation
Each page maps to one PageObject class. Locators in constructor, scraping logic in methods. No assertions or business logic in page objects.

### 2. Selector Resilience
Prefer in order: `data-testid` → `id` → semantic HTML (`role`, `aria-label`) → structured CSS classes → text content. Avoid positional selectors.

### 3. Composition Over Inheritance
Reusable UI patterns (pagination, data tables) are component classes. Only `BasePage` uses inheritance.

### 4. Typed Data Extraction
All scraped data flows through Zod schemas for validation — catches selector drift at extraction time.

### 5. Docker-First Deployment
Generated projects include Dockerfile using Microsoft's official Playwright images.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Playwright (not @playwright/test) |
| Language | TypeScript strict mode, ES2022 |
| Validation | Zod schemas |
| Output | JSON + CSV |
| Docker | mcr.microsoft.com/playwright:v1.48.0-jammy |
| Retry | Exponential backoff, 3 attempts |

## Generation Process

### Step 1: Gather Requirements
Ask the user for:
- Target site URL(s)
- Data fields to extract
- Output format preference (JSON, CSV, both)
- Whether Docker deployment is needed

### Step 2: Analyze the Site
Understand page structure — dynamic content, pagination patterns, selector strategies.

### Step 3: Design Page Object Map
Create a plan listing:
- Each PageObject class and its URL pattern
- Component classes needed (Pagination, DataTable, etc.)
- Data schema fields and types per page
- Navigation flow between pages

### Step 4: Present the Plan
Show user the plan before generating any code. Wait for confirmation.

### Step 5: Generate Code
Generate in this order:
1. `src/schemas/` — Zod validation schemas
2. `src/pages/BasePage.ts` — Abstract base class
3. `src/pages/[Page]Page.ts` — Site-specific page objects
4. `src/components/` — Reusable components (Pagination, etc.)
5. `src/scraper.ts` — ScraperRunner orchestrator
6. `Dockerfile` + `docker-compose.yml`
7. `tsconfig.json`, `package.json`
8. `README.md` — How to run

## Code Patterns

### BasePage
```typescript
export abstract class BasePage {
  constructor(protected readonly page: Page) {}
  async navigate(url: string): Promise<void> { /* ... */ }
  async screenshot(name: string): Promise<void> { /* ... */ }
  async getText(locator: Locator): Promise<string> { /* ... */ }
}
```

### PageObject
```typescript
export class ProductListingPage extends BasePage {
  readonly productCards: Locator;
  readonly nextButton: Locator;

  constructor(page: Page) {
    super(page);
    this.productCards = page.locator('[data-testid="product-card"]');
    this.nextButton = page.locator('[aria-label="Next page"]');
  }

  async scrapeProducts(): Promise<Product[]> { /* ... */ }
  async goToNextPage(): Promise<boolean> { /* ... */ }
}
```

### Zod Schema
```typescript
export const ProductSchema = z.object({
  title: z.string().min(1),
  price: z.number().positive(),
  rating: z.number().min(0).max(5).optional(),
  imageUrl: z.string().url().optional(),
});
export type Product = z.infer<typeof ProductSchema>;
```

### ScraperRunner
```typescript
export class SiteScraper {
  async run(): Promise<void> {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const listingPage = new ProductListingPage(page);
    await listingPage.navigate('https://example.com/products');
    const allProducts: Product[] = [];
    let hasMore = true;
    while (hasMore) {
      const products = await listingPage.scrapeProducts();
      allProducts.push(...products);
      hasMore = await listingPage.goToNextPage();
    }
    await browser.close();
    await writeOutput(allProducts, 'products');
  }
}
```

## Anti-Patterns to Avoid

| Anti-Pattern | Solution |
|---|---|
| Monolith Scraper | Split into PageObject classes per page |
| Sleep Waiter (`setTimeout`) | Use Playwright auto-wait and `networkidle` |
| Unvalidated Pipeline | Add Zod schemas for every data type |
| Selector Lottery (positional) | Use resilient selector hierarchy |
| Silent Failure | Log failures, save debug screenshots |
| Unthrottled Crawler | Add configurable request delays |
| Hardcoded Config | Use environment variables and config files |
| No Retry Logic | Implement exponential backoff |

## Docker Template

```dockerfile
FROM mcr.microsoft.com/playwright:v1.48.0-jammy
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
CMD ["node", "dist/scraper.js"]
```

```yaml
# docker-compose.yml
services:
  scraper:
    build: .
    volumes:
      - ./output:/app/output
      - ./screenshots:/app/screenshots
    environment:
      - TARGET_URL=${TARGET_URL}
```

## What This Skill Does NOT Do
- Bypass CAPTCHA or bot detection
- Violate robots.txt
- Scrape sites requiring login bypass
- Generate JavaScript-only output (always TypeScript)
- Spider entire domains
