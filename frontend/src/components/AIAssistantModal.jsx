import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/environment';
import './AIAssistantModal.css';

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";

export default function AIAssistantModal({ product, isOpen, onClose, onProductClick, onAddToCart, onOrderNow }) {
    const [clientStock, setClientStock] = useState(0);
    const [dailyConsumption, setDailyConsumption] = useState(0);
    const [stockDepletionDate, setStockDepletionDate] = useState(null);
    const [similarProducts, setSimilarProducts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [aiRecommendation, setAiRecommendation] = useState('');
    const [recommendationType, setRecommendationType] = useState('default');
    const [purchasePrediction, setPurchasePrediction] = useState(null);

    useEffect(() => {
        if (!isOpen || !product) return;

        // Load all data first, then generate the recommendation to avoid timing issues
        const load = async () => {
            setLoading(true);
            try {
                await Promise.all([
                    fetchClientData(),
                    fetchSimilarProducts(),
                    fetchPurchasePrediction()
                ]);

                // Prefer our data-driven recommendation that reflects real demand
                generateFallbackRecommendation();
            } finally {
                setLoading(false);
            }
        };

        load();
    }, [isOpen, product]);

    const fetchClientData = async () => {
        try {
            setLoading(true);
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/api/client-inventory/product/${product._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const inventory = response.data;
            setClientStock(inventory?.currentStock || 0);
            setDailyConsumption(inventory?.dailyUsage || 0);

            // Calculate stock depletion date - only if we have both stock and consumption
            if (inventory?.dailyUsage > 0 && inventory?.currentStock > 0) {
                const daysUntilDepletion = Math.ceil(inventory.currentStock / inventory.dailyUsage);
                const depletionDate = new Date();
                depletionDate.setDate(depletionDate.getDate() + daysUntilDepletion);
                setStockDepletionDate(depletionDate);
            } else {
                // No stock or no consumption = no depletion date
                setStockDepletionDate(null);
            }
        } catch (error) {
            console.error('Error fetching client data:', error);
            setClientStock(0);
            setDailyConsumption(0);
        } finally {
            setLoading(false);
        }
    };

    const fetchSimilarProducts = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/api/products/similar/${product._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSimilarProducts(response.data.slice(0, 4)); // Show max 4 similar products
        } catch (error) {
            console.error('Error fetching similar products:', error);
            setSimilarProducts([]);
        }
    };

    const fetchPurchasePrediction = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await axios.get(`${API_BASE}/api/products/prediction/${product._id}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setPurchasePrediction(response.data.data);
        } catch (error) {
            console.error('Error fetching purchase prediction:', error);
            setPurchasePrediction(null);
        }
    };

    // We disable the remote chatbot for this modal to avoid generic fallback responses
    // and rely on a locally generated, data-driven recommendation instead.

    const generateFallbackRecommendation = () => {
        const daysUntilDepletion = dailyConsumption > 0 ? Math.ceil(clientStock / dailyConsumption) : 0;
        const supplierStock = product.stock || 0;

        // Determine recommendation based on supplier stock status and purchase prediction
        let recommendation = '';
        let recommendationType = '';
        let recommendationColor = '';

        // Use purchase prediction data if available
        if (purchasePrediction) {
            const prediction = purchasePrediction.prediction;
            const sales = purchasePrediction.sales;

            recommendation = `🤖 ANALYSE INTELLIGENTE - ${product.name}\n\n`;

            // Add sales data
            recommendation += `📊 DONNÉES DE VENTE (90 derniers jours):\n`;
            recommendation += `• Quantité vendue: ${sales.totalQuantitySold} unités\n`;
            recommendation += `• Clients uniques: ${sales.uniqueClients}\n`;
            recommendation += `• Ventes quotidiennes moyennes: ${sales.dailySalesRate} unités/jour\n`;
            recommendation += `• Ventes hebdomadaires moyennes: ${sales.weeklySalesRate} unités/semaine\n\n`;

            // Add stability prediction
            recommendation += `🔮 PRÉDICTION DE STABILITÉ:\n`;
            recommendation += `${prediction.message}\n\n`;

            // Determine recommendation type based on prediction
            // If there is actual demand in sales but prediction says no_demand, correct it
            const hasDemand = (sales.totalQuantitySold || 0) > 0 || (sales.dailySalesRate || 0) > 0;
            const effectiveStability = (prediction.stability === 'no_demand' && hasDemand)
                ? (prediction.daysUntilSoldOut && prediction.daysUntilSoldOut <= 30 ? 'warning' : 'stable')
                : prediction.stability;

            if (effectiveStability === 'out_of_stock') {
                recommendationType = 'rupture';
                recommendation += `🚨 PRODUIT EN RUPTURE CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur n'a plus de stock. Aucune commande possible actuellement.\n\n`;
                recommendation += `💡 ALTERNATIVES RECOMMANDÉES:\n`;
                recommendation += `• Consulter les produits similaires ci-dessous\n`;
                recommendation += `• Contacter le fournisseur pour la date de réapprovisionnement\n`;
            } else if (effectiveStability === 'critical') {
                recommendationType = 'faible';
                recommendation += `⚠️ STOCK CRITIQUE CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur risque d'être en rupture dans ${prediction.daysUntilSoldOut} jours.\n\n`;
                recommendation += `🎯 RECOMMANDATION URGENTE:\n`;
                recommendation += `• Commander immédiatement avant épuisement\n`;
                recommendation += `• Quantité maximale disponible: ${supplierStock} unités\n`;
            } else if (effectiveStability === 'warning') {
                recommendationType = 'moyen';
                recommendation += `📦 STOCK LIMITÉ CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur a ${supplierStock} unités. Rupture prévue dans ${prediction.daysUntilSoldOut} jours.\n\n`;
                recommendation += `🎯 RECOMMANDATION PRUDENTE:\n`;
                recommendation += `• Commander dans les 1-2 semaines\n`;
                recommendation += `• Quantité suggérée: 20-40 unités\n`;
            } else if (effectiveStability === 'stable') {
                recommendationType = 'stable';
                recommendation += `✅ STOCK STABLE CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur dispose de ${supplierStock} unités. Stock stable pour ${prediction.daysUntilSoldOut} jours.\n\n`;
                recommendation += `🎯 RECOMMANDATION FLEXIBLE:\n`;
                recommendation += `• Commander selon vos besoins\n`;
                recommendation += `• Quantité suggérée: 30-60 unités\n`;
            } else if (effectiveStability === 'no_demand') {
                recommendationType = 'faible';
                recommendation += `📉 DEMANDE FAIBLE\n\n`;
                recommendation += `Aucune vente récente de ce produit. Demande faible.\n\n`;
                recommendation += `🎯 RECOMMANDATION:\n`;
                recommendation += `• Commander en petite quantité pour tester la demande\n`;
                recommendation += `• Considérer les produits similaires plus populaires\n`;
            }
        } else {
            // Fallback to basic supplier stock analysis
            if (supplierStock === 0) {
                recommendationType = 'rupture';
                recommendation = `🚨 PRODUIT INDISPONIBLE CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur n'a plus de stock de ce produit.\n\n`;
            } else if (supplierStock <= 10) {
                recommendationType = 'faible';
                recommendation = `⚠️ STOCK LIMITÉ CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur n'a que ${supplierStock} unités en stock.\n\n`;
            } else if (supplierStock <= 50) {
                recommendationType = 'moyen';
                recommendation = `📦 STOCK MOYEN CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur dispose de ${supplierStock} unités.\n\n`;
            } else {
                recommendationType = 'stable';
                recommendation = `✅ STOCK STABLE CHEZ LE FOURNISSEUR\n\n`;
                recommendation += `Le fournisseur dispose de ${supplierStock} unités.\n\n`;
            }
        }

        // Add client stock analysis
        if (clientStock === 0) {
            recommendation += `\n🚨 VOTRE STOCK: RUPTURE\n`;
            recommendation += `Vous n'avez aucun stock. Commande urgente recommandée.\n`;
        } else if (clientStock <= 5) {
            recommendation += `\n⚠️ VOTRE STOCK: FAIBLE (${clientStock} unités)\n`;
            recommendation += `Stock insuffisant. Commande recommandée rapidement.\n`;
        } else if (daysUntilDepletion <= 7) {
            recommendation += `\n📅 VOTRE STOCK: ÉPUISEMENT DANS ${daysUntilDepletion} JOURS\n`;
            recommendation += `Planifiez votre prochaine commande.\n`;
        } else {
            recommendation += `\n✅ VOTRE STOCK: SUFFISANT (${clientStock} unités)\n`;
            recommendation += `Stock actuel adéquat pour le moment.\n`;
        }

        // Add consumption analysis if available
        if (dailyConsumption > 0) {
            const recommendedQty = Math.max(dailyConsumption * 14, 20);
            recommendation += `\n📈 CONSOMMATION: ${dailyConsumption} unités/jour\n`;
            recommendation += `Quantité recommandée pour 2 semaines: ${recommendedQty} unités\n`;
        }

        setAiRecommendation(recommendation);
        setRecommendationType(recommendationType);
    };

    const formatDate = (date) => {
        return date ? date.toLocaleDateString('fr-FR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }) : 'N/A';
    };

    const getStockStatus = () => {
        if (clientStock === 0) return { status: 'Rupture', color: '#ef4444' };
        if (clientStock <= 5) return { status: 'Stock faible', color: '#f59e0b' };
        if (clientStock <= 15) return { status: 'Stock moyen', color: '#3b82f6' };
        return { status: 'Stock suffisant', color: '#10b981' };
    };

    // Calculate supplier risk level (0-10) based on sales velocity and stock
    const getSupplierRiskLevel = () => {
        const supplierStock = product.stock || 0;

        // First check absolute stock levels - these take priority
        if (supplierStock === 0) return 10; // Out of stock - maximum risk
        if (supplierStock <= 5) return 9;   // Critical stock - very high risk
        if (supplierStock <= 10) return 8;  // Very low stock - high risk
        if (supplierStock <= 20) return 7;  // Low stock - high risk
        if (supplierStock <= 50) return 5;  // Moderate stock
        if (supplierStock <= 100) return 3; // Good stock
        if (supplierStock <= 200) return 2; // Very good stock
        return 1; // Excellent stock
    };

    // Calculate client risk level (0-10) based on consumption vs supplier availability
    const getClientRiskLevel = () => {
        const supplierStock = product.stock || 0;
        const daysUntilDepletion = dailyConsumption > 0 ? Math.ceil(clientStock / dailyConsumption) : 999;

        // If client has no stock, maximum risk
        if (clientStock === 0) return 10;

        // If supplier is out of stock, high risk regardless of client stock
        if (supplierStock === 0) return 9;

        // If client will run out soon and supplier has limited stock, high risk
        if (daysUntilDepletion <= 3 && supplierStock <= 10) return 9;
        if (daysUntilDepletion <= 7 && supplierStock <= 20) return 8;
        if (daysUntilDepletion <= 14 && supplierStock <= 50) return 6;
        if (daysUntilDepletion <= 30) return 4;

        return 2; // Low risk
    };

    // Get supplier risk color based on level
    const getSupplierRiskColor = () => {
        const level = getSupplierRiskLevel();
        if (level >= 8) return 'linear-gradient(90deg, #ef4444, #dc2626)'; // Red
        if (level >= 6) return 'linear-gradient(90deg, #f59e0b, #d97706)'; // Orange
        if (level >= 4) return 'linear-gradient(90deg, #3b82f6, #2563eb)'; // Blue
        return 'linear-gradient(90deg, #10b981, #059669)'; // Green
    };

    // Get client risk color based on level
    const getClientRiskColor = () => {
        const level = getClientRiskLevel();
        if (level >= 8) return 'linear-gradient(90deg, #ef4444, #dc2626)'; // Red
        if (level >= 6) return 'linear-gradient(90deg, #f59e0b, #d97706)'; // Orange
        if (level >= 4) return 'linear-gradient(90deg, #3b82f6, #2563eb)'; // Blue
        return 'linear-gradient(90deg, #10b981, #059669)'; // Green
    };

    // Get supplier risk description
    const getSupplierRiskDescription = () => {
        const level = getSupplierRiskLevel();
        const sales = purchasePrediction?.sales;
        const supplierStock = product.stock || 0;

        if (level >= 9) return `🚨 STOCK CRITIQUE - Seulement ${supplierStock} unités restantes ! Commande urgente recommandée.`;
        if (level >= 8) return `⚠️ STOCK TRÈS FAIBLE - ${supplierStock} unités restantes, risque de rupture imminent.`;
        if (level >= 7) return `📦 STOCK FAIBLE - ${supplierStock} unités restantes, commande recommandée rapidement.`;
        if (level >= 6) return `⚠️ Risque élevé - Stock limité (${supplierStock} unités)`;
        if (level >= 4) return `📦 Risque modéré - Stock modéré (${supplierStock} unités)`;
        if (level >= 2) return `✅ Stock bon - Stock suffisant (${supplierStock} unités)`;
        return `✅ Stock excellent - Stock très élevé (${supplierStock} unités)`;
    };

    // Get client risk description
    const getClientRiskDescription = () => {
        const level = getClientRiskLevel();
        const daysUntilDepletion = dailyConsumption > 0 ? Math.ceil(clientStock / dailyConsumption) : 999;
        const supplierStock = product.stock || 0;

        if (level >= 8) return `🚨 Risque critique - Stock client: ${clientStock}, consommation: ${dailyConsumption}/jour`;
        if (level >= 6) return `⚠️ Risque élevé - Épuisement dans ${daysUntilDepletion} jours, stock fournisseur: ${supplierStock}`;
        if (level >= 4) return `📦 Risque modéré - Stock client suffisant pour ${daysUntilDepletion} jours`;
        return `✅ Risque faible - Stock client et fournisseur stables`;
    };

    const stockStatus = getStockStatus();

    if (!isOpen) return null;

    return (
        <div className="ai-assistant-overlay" onClick={onClose}>
            <div className="ai-assistant-modal" onClick={(e) => e.stopPropagation()}>
                <div className="ai-assistant-header">
                    <div className="ai-assistant-title">
                        <h2>🤖 IA Assistant</h2>
                        <h3>{product.name}</h3>
                    </div>
                    <button className="ai-assistant-close" onClick={onClose}>×</button>
                </div>

                <div className="ai-assistant-content">
                    {loading ? (
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Analyse en cours...</p>
                        </div>
                    ) : (
                        <>
                            {/* Stock Analysis Section */}
                            <div className="stock-analysis-section">
                                <h3>📊 Analyse de votre stock</h3>
                                <div className="stock-cards">
                                    <div className="stock-card">
                                        <div className="stock-card-icon">📦</div>
                                        <div className="stock-card-content">
                                            <h4>Stock actuel</h4>
                                            <p className="stock-value" style={{ color: stockStatus.color }}>
                                                {clientStock} unités
                                            </p>
                                            <span className="stock-status" style={{ color: stockStatus.color }}>
                                                {stockStatus.status}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="stock-card">
                                        <div className="stock-card-icon">📈</div>
                                        <div className="stock-card-content">
                                            <h4>Consommation quotidienne</h4>
                                            <p className="consumption-value">{dailyConsumption} unités/jour</p>
                                        </div>
                                    </div>

                                    <div className="stock-card">
                                        <div className="stock-card-icon">⚠️</div>
                                        <div className="stock-card-content">
                                            <h4>Épuisement prévu</h4>
                                            <p className="depletion-date">
                                                {stockDepletionDate ? formatDate(stockDepletionDate) :
                                                    (clientStock === 0 ? 'Pas de stock' :
                                                        dailyConsumption === 0 ? 'Pas de consommation' : 'N/A')}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Assessment Bars */}
                                <div className="risk-assessment-section">
                                    <h3>🎯 Évaluation des risques</h3>

                                    {/* Supplier Stock Risk Bar */}
                                    <div className="risk-bar-container">
                                        <div className="risk-bar-label">
                                            <span className="risk-icon">🏪</span>
                                            <span className="risk-title">Risque fournisseur (ventes récentes)</span>
                                            <span className="risk-value">{getSupplierRiskLevel()}/10</span>
                                        </div>
                                        <div className="risk-bar">
                                            <div
                                                className="risk-bar-fill supplier-risk"
                                                style={{
                                                    width: `${getSupplierRiskLevel() * 10}%`,
                                                    background: getSupplierRiskColor()
                                                }}
                                            ></div>
                                        </div>
                                        <div className="risk-description">
                                            {getSupplierRiskDescription()}
                                        </div>
                                    </div>

                                    {/* Client Stock Risk Bar */}
                                    <div className="risk-bar-container">
                                        <div className="risk-bar-label">
                                            <span className="risk-icon">👤</span>
                                            <span className="risk-title">Votre risque (consommation vs stock)</span>
                                            <span className="risk-value">{getClientRiskLevel()}/10</span>
                                        </div>
                                        <div className="risk-bar">
                                            <div
                                                className="risk-bar-fill client-risk"
                                                style={{
                                                    width: `${getClientRiskLevel() * 10}%`,
                                                    background: getClientRiskColor()
                                                }}
                                            ></div>
                                        </div>
                                        <div className="risk-description">
                                            {getClientRiskDescription()}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* AI Recommendation Section */}
                            <div className="ai-recommendation-section">
                                <h3>🧠 Recommandation IA</h3>
                                <div className="ai-recommendation-box" data-type={recommendationType}>
                                    <p>{aiRecommendation}</p>
                                </div>
                            </div>

                            {/* Similar Products Section */}
                            <div className="similar-products-section">
                                <h3>🔗 Produits recommandés</h3>
                                {similarProducts.length > 0 ? (
                                    <div className="similar-products-grid">
                                        {similarProducts.map((similarProduct) => (
                                            <div key={similarProduct._id} className="similar-product-card">
                                                <div className="similar-product-image">
                                                    {similarProduct.images?.length ? (
                                                        <img
                                                            src={`${API_BASE}${similarProduct.images[0]}`}
                                                            alt={similarProduct.name}
                                                        />
                                                    ) : (
                                                        <div className="no-image">Aucune image</div>
                                                    )}
                                                </div>
                                                <div className="similar-product-info">
                                                    <h4>{similarProduct.name}</h4>
                                                    <p className="similar-product-price">
                                                        {new Intl.NumberFormat("fr-FR", {
                                                            style: "currency",
                                                            currency: "EUR"
                                                        }).format(similarProduct.price)}
                                                    </p>
                                                    <p className="similar-product-stock">
                                                        Stock: {similarProduct.stock}
                                                    </p>
                                                    <button
                                                        className="view-product-btn"
                                                        onClick={() => {
                                                            onClose();
                                                            if (onProductClick) {
                                                                onProductClick(similarProduct);
                                                            }
                                                        }}
                                                    >
                                                        Voir le produit
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="no-similar-products">
                                        <p>Aucun autre produit dans cette catégorie pour le moment.</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            <div className="ai-assistant-actions">
                                <button
                                    className="order-now-btn"
                                    onClick={() => {
                                        if (onOrderNow) {
                                            onOrderNow(product);
                                        }
                                        onClose();
                                    }}
                                >
                                    🛒 Commander maintenant
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
