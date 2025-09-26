const axios = require('axios');
const cheerio = require('cheerio');

// --- Fonctions d'extraction de prix ---

/**
 * Extrait le prix à partir d'un snippet de texte.
 * @param {string} snippet - Le texte où chercher le prix.
 * @returns {number|null} Le prix trouvé ou null.
 */
const extractPriceFromSnippet = (snippet) => {
  if (!snippet) return null;
  // Regex améliorée pour détecter €, $, EUR, USD
  const priceMatch = snippet.match(/(\d+[.,]?\d*)\s?(€|euros|EUR|\$|USD)/i);
  return priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : null;
};

/**
 * Scrape une page web pour trouver le prix.
 * @param {string} url - L'URL de la page à scraper.
 * @returns {number|null} Le prix trouvé ou null.
 */
const scrapePriceFromPage = async (url) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);

    // Sélecteurs CSS courants pour les prix
    const priceSelectors = [
      '.price',
      '[class*="price"]',
      '[id*="price"]',
      '.product-price',
      '.offer-price'
    ];

    for (const selector of priceSelectors) {
      const priceText = $(selector).first().text();
      if (priceText) {
        const price = extractPriceFromSnippet(priceText + ' €'); // Ajoute € pour la détection
        if (price) return price;
      }
    }
    return null;
  } catch (error) {
    console.error(`Erreur de scraping pour ${url}:`, error.message);
    return null;
  }
};


// --- Fonction principale de recherche ---

const searchGoogle = async (query) => {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_CX_ID;
  const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&key=${apiKey}&cx=${cx}`;

  try {
    const res = await axios.get(url);
    const items = res.data.items || [];

    const results = await Promise.all(items.map(async (item) => {
      let price = extractPriceFromSnippet(item.snippet);

      // Si aucun prix n'est trouvé, on scrape la page
      if (!price) {
        console.log(`Prix non trouvé dans le snippet pour "${item.title}". Lancement du scraping...`);
        price = await scrapePriceFromPage(item.link);
        if (price) {
          console.log(`Prix trouvé par scraping sur ${item.link}: ${price}€`);
        }
      }

      return {
        title: item.title,
        link: item.link,
        snippet: item.snippet,
        price
      };
    }));

    return results;

  } catch (err) {
    console.error("Erreur Google Search:", err.message);
    return [];
  }
};

module.exports = searchGoogle;
