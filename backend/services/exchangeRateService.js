const axios = require('axios');

/**
 * Service de taux de change en temps réel pour les crypto-monnaies
 * Utilise plusieurs APIs pour obtenir des taux précis et fiables
 */

class ExchangeRateService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
        this.fallbackRates = {
            BTC: 50000,  // Taux de fallback si les APIs échouent
            ETH: 3000,
            SOL: 100
        };
    }

    /**
     * Obtient le taux de change actuel pour une crypto-monnaie
     * @param {string} crypto - Code de la crypto (BTC, ETH, SOL)
     * @param {string} fiat - Devise fiat (EUR par défaut)
     * @returns {Promise<number>} Taux de change (1 EUR = X crypto)
     */
    async getExchangeRate(crypto, fiat = 'EUR') {
        const cacheKey = `${crypto}_${fiat}`;
        const cached = this.cache.get(cacheKey);

        // Vérifier le cache
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log(`📊 Taux de change ${crypto}/${fiat} depuis le cache: ${cached.rate}`);
            return cached.rate;
        }

        try {
            // Essayer plusieurs APIs en parallèle
            const rates = await Promise.allSettled([
                this.getRateFromCoinGecko(crypto, fiat),
                this.getRateFromCoinCap(crypto, fiat),
                this.getRateFromCryptoCompare(crypto, fiat)
            ]);

            // Prendre le premier taux valide
            const validRates = rates
                .filter(result => result.status === 'fulfilled' && result.value > 0)
                .map(result => result.value);

            if (validRates.length > 0) {
                const rate = validRates[0];
                console.log(`📊 Taux de change ${crypto}/${fiat} obtenu: ${rate}`);

                // Mettre en cache
                this.cache.set(cacheKey, {
                    rate: rate,
                    timestamp: Date.now()
                });

                return rate;
            } else {
                throw new Error('Aucun taux valide obtenu des APIs');
            }

        } catch (error) {
            console.error(`❌ Erreur lors de la récupération du taux ${crypto}/${fiat}:`, error.message);

            // Utiliser le taux de fallback
            const fallbackRate = this.fallbackRates[crypto];
            console.log(`🔄 Utilisation du taux de fallback pour ${crypto}: ${fallbackRate}`);
            return fallbackRate;
        }
    }

    /**
     * API CoinGecko (gratuite, 50 requêtes/minute)
     */
    async getRateFromCoinGecko(crypto, fiat) {
        const cryptoId = this.getCoinGeckoId(crypto);
        const response = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${cryptoId}&vs_currencies=${fiat.toLowerCase()}`, {
            timeout: 5000
        });

        const rate = response.data[cryptoId][fiat.toLowerCase()];
        if (!rate || rate <= 0) {
            throw new Error('Taux invalide de CoinGecko');
        }

        return rate;
    }

    /**
     * API CoinCap (gratuite, 200 requêtes/minute)
     */
    async getRateFromCoinCap(crypto, fiat) {
        const cryptoId = this.getCoinCapId(crypto);
        const response = await axios.get(`https://api.coincap.io/v2/assets/${cryptoId}`, {
            timeout: 5000
        });

        const priceUsd = parseFloat(response.data.data.priceUsd);
        if (!priceUsd || priceUsd <= 0) {
            throw new Error('Prix USD invalide de CoinCap');
        }

        // Convertir USD vers EUR (taux approximatif)
        const usdToEur = 0.85; // Taux approximatif, idéalement récupérer depuis une API
        return priceUsd * usdToEur;
    }

    /**
     * API CryptoCompare (gratuite, 100 requêtes/jour)
     */
    async getRateFromCryptoCompare(crypto, fiat) {
        const response = await axios.get(`https://min-api.cryptocompare.com/data/price?fsym=${crypto}&tsyms=${fiat}`, {
            timeout: 5000
        });

        const rate = response.data[fiat];
        if (!rate || rate <= 0) {
            throw new Error('Taux invalide de CryptoCompare');
        }

        return rate;
    }

    /**
     * Convertit un montant EUR vers une crypto-monnaie
     * @param {number} eurAmount - Montant en EUR
     * @param {string} crypto - Code de la crypto
     * @returns {Promise<number>} Montant en crypto
     */
    async convertEurToCrypto(eurAmount, crypto) {
        const rate = await this.getExchangeRate(crypto, 'EUR');
        const cryptoAmount = eurAmount / rate;

        // Arrondir selon la crypto
        const decimals = this.getCryptoDecimals(crypto);
        return parseFloat(cryptoAmount.toFixed(decimals));
    }

    /**
     * Obtient l'ID CoinGecko pour une crypto
     */
    getCoinGeckoId(crypto) {
        const mapping = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana'
        };
        return mapping[crypto] || crypto.toLowerCase();
    }

    /**
     * Obtient l'ID CoinCap pour une crypto
     */
    getCoinCapId(crypto) {
        const mapping = {
            'BTC': 'bitcoin',
            'ETH': 'ethereum',
            'SOL': 'solana'
        };
        return mapping[crypto] || crypto.toLowerCase();
    }

    /**
     * Obtient le nombre de décimales pour une crypto
     */
    getCryptoDecimals(crypto) {
        const decimals = {
            'BTC': 8,
            'ETH': 6,
            'SOL': 4
        };
        return decimals[crypto] || 8;
    }

    /**
     * Vide le cache
     */
    clearCache() {
        this.cache.clear();
        console.log('🗑️ Cache des taux de change vidé');
    }

    /**
     * Obtient les statistiques du cache
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            entries: Array.from(this.cache.entries()).map(([key, value]) => ({
                key,
                rate: value.rate,
                age: Date.now() - value.timestamp
            }))
        };
    }
}

// Instance singleton
const exchangeRateService = new ExchangeRateService();

module.exports = exchangeRateService;


