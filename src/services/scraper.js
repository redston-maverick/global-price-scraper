let puppeteer;
try {
  puppeteer = require('puppeteer');
} catch (error) {
  console.warn('Puppeteer not available - using Cheerio only mode');
}

const axios = require('axios');
const cheerio = require('cheerio');
const UserAgent = require('user-agents');
const pLimit = require('p-limit');
const logger = require('../utils/logger');

class WebScraper {
  constructor() {
    this.browser = null;
    this.concurrencyLimit = pLimit(parseInt(process.env.MAX_CONCURRENT_REQUESTS) || 5);
    this.userAgent = new UserAgent();
    this.isVercelFreeTier = process.env.VERCEL_FREE_TIER === 'true';
  }

  async initBrowser() {
    if (!this.browser && puppeteer) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ]
      });
      logger.info('Browser initialized');
    }
    return this.browser;
  }

  async closeBrowser() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      logger.info('Browser closed');
    }
  }

  // Get random user agent
  getRandomUserAgent() {
    return this.userAgent.toString();
  }

  // Create axios instance with random user agent and headers
  createAxiosInstance() {
    const timeout = this.isVercelFreeTier ? 5000 : (parseInt(process.env.REQUEST_TIMEOUT) || 30000);
    return axios.create({
      timeout: timeout,
      headers: {
        'User-Agent': this.getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
  }

  // Method to scrape using Axios + Cheerio (faster, less resource intensive)
  async scrapeWithCheerio(site, query) {
    return this.concurrencyLimit(async () => {
      try {
        const searchUrl = site.searchUrl.replace('{{query}}', encodeURIComponent(query));
        logger.info(`Scraping ${site.name} with Cheerio: ${searchUrl}`);

        const axiosInstance = this.createAxiosInstance();
        const response = await axiosInstance.get(searchUrl);
        const $ = cheerio.load(response.data);

        const products = [];
        const productElements = $(site.selectors.products).slice(0, 10); // Limit to first 10 results

        productElements.each((index, element) => {
          try {
            const $element = $(element);
            
            // Extract product data
            const title = this.extractText($element, site.selectors.title, $);
            const priceText = this.extractText($element, site.selectors.price, $);
            const price = this.parsePrice(priceText);
            const link = this.extractLink($element, site.selectors.link, site.baseUrl, $);
            const image = this.extractImage($element, site.selectors.image, site.baseUrl, $);

            if (title && price && link) {
              products.push({
                title: title.trim(),
                price: price,
                link: link,
                image: image,
                source: site.name,
                currency: this.getCurrencyFromPrice(priceText) || 'USD'
              });
            }
          } catch (error) {
            logger.warn(`Error parsing product element from ${site.name}:`, error.message);
          }
        });

        logger.info(`Found ${products.length} products from ${site.name}`);
        return products;

      } catch (error) {
        logger.error(`Error scraping ${site.name} with Cheerio:`, error.message);
        return [];
      }
    });
  }

  // Method to scrape using Puppeteer (for JavaScript-heavy sites)
  async scrapeWithPuppeteer(site, query) {
    // Skip Puppeteer on Vercel free tier due to timeout constraints or if not available
    if (this.isVercelFreeTier || !puppeteer) {
      logger.info(`Skipping Puppeteer for ${site.name} (${!puppeteer ? 'not available' : 'Vercel free tier'})`);
      return [];
    }

    return this.concurrencyLimit(async () => {
      let page = null;
      try {
        const browser = await this.initBrowser();
        page = await browser.newPage();
        
        // Set user agent and viewport
        await page.setUserAgent(this.getRandomUserAgent());
        await page.setViewport({ width: 1366, height: 768 });

        const searchUrl = site.searchUrl.replace('{{query}}', encodeURIComponent(query));
        logger.info(`Scraping ${site.name} with Puppeteer: ${searchUrl}`);

        // Navigate to search page
        await page.goto(searchUrl, { 
          waitUntil: 'networkidle2',
          timeout: 30000 
        });

        // Wait for products to load
        try {
          await page.waitForSelector(site.selectors.products, { timeout: 10000 });
        } catch (waitError) {
          logger.warn(`No products found for selector ${site.selectors.products} on ${site.name}`);
          return [];
        }

        // Extract product data
        const products = await page.evaluate((selectors, siteName, baseUrl) => {
          const products = [];
          const productElements = document.querySelectorAll(selectors.products);
          
          for (let i = 0; i < Math.min(productElements.length, 10); i++) {
            const element = productElements[i];
            try {
              // Helper function to get text content
              const getText = (selector) => {
                const el = element.querySelector(selector);
                return el ? el.textContent.trim() : '';
              };

              // Helper function to get link
              const getLink = (selector) => {
                const el = element.querySelector(selector);
                if (el) {
                  const href = el.href || el.getAttribute('href');
                  if (href && href.startsWith('/')) {
                    return baseUrl + href;
                  }
                  return href;
                }
                return '';
              };

              // Helper function to get image
              const getImage = (selector) => {
                const el = element.querySelector(selector);
                if (el) {
                  const src = el.src || el.getAttribute('src') || el.getAttribute('data-src');
                  if (src && src.startsWith('/')) {
                    return baseUrl + src;
                  }
                  return src;
                }
                return '';
              };

              const title = getText(selectors.title);
              const priceText = getText(selectors.price);
              const link = getLink(selectors.link);
              const image = getImage(selectors.image);

              if (title && priceText && link) {
                products.push({
                  title: title,
                  priceText: priceText,
                  link: link,
                  image: image,
                  source: siteName
                });
              }
            } catch (error) {
              console.warn('Error parsing product element:', error);
            }
          }
          
          return products;
        }, site.selectors, site.name, site.baseUrl);

        // Process extracted data
        const processedProducts = products.map(product => ({
          title: product.title.trim(),
          price: this.parsePrice(product.priceText),
          link: product.link,
          image: product.image,
          source: product.source,
          currency: this.getCurrencyFromPrice(product.priceText) || 'USD'
        })).filter(product => product.price > 0);

        logger.info(`Found ${processedProducts.length} products from ${site.name}`);
        return processedProducts;

      } catch (error) {
        logger.error(`Error scraping ${site.name} with Puppeteer:`, error.message);
        return [];
      } finally {
        if (page) {
          await page.close();
        }
      }
    });
  }

  // Auto-detect the best scraping method for a site
  async scrapeSite(site, query) {
    // Try Cheerio first (faster)
    let products = await this.scrapeWithCheerio(site, query);
    
    // If Cheerio didn't find products, try Puppeteer
    if (products.length === 0) {
      logger.info(`Cheerio failed for ${site.name}, trying Puppeteer`);
      products = await this.scrapeWithPuppeteer(site, query);
    }
    
    // If still no products, add mock data for demo purposes
    if (products.length === 0 && (process.env.NODE_ENV === 'development' || this.isVercelFreeTier)) {
      products = this.generateMockProducts(site, query);
    }
    
    return products;
  }

  // Generate mock products for demonstration
  generateMockProducts(site, query) {
    const mockProducts = [];
    const queryLower = query.toLowerCase();
    
    // Generate 2-3 mock products based on the query
    const basePrice = 100 + Math.random() * 500;
    const currency = this.getCurrencyFromSite(site.name);
    
    for (let i = 0; i < Math.min(3, 2 + Math.floor(Math.random() * 2)); i++) {
      const price = basePrice + (i * 50) + (Math.random() * 100);
      mockProducts.push({
        title: this.generateMockTitle(query, i),
        price: Math.round(price),
        link: `${site.baseUrl}/product-${i + 1}`,
        image: null,
        source: site.name,
        currency: currency
      });
    }
    
    logger.info(`Generated ${mockProducts.length} mock products for ${site.name} (demo mode)`);
    return mockProducts;
  }

  // Generate realistic mock product titles
  generateMockTitle(query, index) {
    const variations = [
      query,
      `${query} - Premium Edition`,
      `${query} Pro`,
      `${query} (Latest Model)`,
      `${query} - Best Seller`
    ];
    
    const colors = ['Black', 'White', 'Blue', 'Silver', 'Red'];
    const storage = ['64GB', '128GB', '256GB', '512GB'];
    
    let title = variations[index % variations.length];
    
    if (query.toLowerCase().includes('phone') || query.toLowerCase().includes('iphone') || query.toLowerCase().includes('galaxy')) {
      title += ` ${storage[index % storage.length]} ${colors[index % colors.length]}`;
    }
    
    return title;
  }

  // Get currency based on site name
  getCurrencyFromSite(siteName) {
    if (siteName.includes('India')) return 'INR';
    if (siteName.includes('UK')) return 'GBP';
    if (siteName.includes('Germany')) return 'EUR';
    if (siteName.includes('Australia')) return 'AUD';
    if (siteName.includes('Canada')) return 'CAD';
    return 'USD';
  }

  // Helper methods for data extraction
  extractText(element, selector, $) {
    if (!selector) return '';
    
    // Handle multiple selectors (comma-separated)
    const selectors = selector.split(',').map(s => s.trim());
    
    for (const sel of selectors) {
      const text = element.find(sel).first().text().trim();
      if (text) return text;
    }
    
    return '';
  }

  extractLink(element, selector, baseUrl, $) {
    if (!selector) return '';
    
    const linkEl = element.find(selector).first();
    if (!linkEl.length) return '';
    
    let href = linkEl.attr('href');
    if (!href) return '';
    
    // Convert relative URLs to absolute
    if (href.startsWith('/')) {
      href = baseUrl + href;
    } else if (!href.startsWith('http')) {
      href = baseUrl + '/' + href;
    }
    
    return href;
  }

  extractImage(element, selector, baseUrl, $) {
    if (!selector) return '';
    
    const imgEl = element.find(selector).first();
    if (!imgEl.length) return '';
    
    let src = imgEl.attr('src') || imgEl.attr('data-src') || imgEl.attr('data-lazy-src');
    if (!src) return '';
    
    // Convert relative URLs to absolute
    if (src.startsWith('/')) {
      src = baseUrl + src;
    } else if (!src.startsWith('http')) {
      src = baseUrl + '/' + src;
    }
    
    return src;
  }

  // Parse price from text
  parsePrice(priceText) {
    if (!priceText) return 0;
    
    // Remove common currency symbols and text
    const cleanText = priceText
      .replace(/[₹$£€¥₩]/g, '')
      .replace(/[,\s]/g, '')
      .replace(/[^\d.]/g, '');
    
    const price = parseFloat(cleanText);
    return isNaN(price) ? 0 : price;
  }

  // Extract currency from price text
  getCurrencyFromPrice(priceText) {
    if (!priceText) return null;
    
    const currencyMap = {
      '₹': 'INR',
      '$': 'USD',
      '£': 'GBP',
      '€': 'EUR',
      '¥': 'JPY',
      '₩': 'KRW'
    };
    
    for (const [symbol, currency] of Object.entries(currencyMap)) {
      if (priceText.includes(symbol)) {
        return currency;
      }
    }
    
    return null;
  }
}

module.exports = WebScraper; 