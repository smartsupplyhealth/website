import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { API_URL } from '../../config/environment';
import StockAdjustModal from '../StockAdjustModal';
import './SalesManagement.css';

const SalesManagement = () => {
    const { token } = useAuth();
    const [products, setProducts] = useState([]); // Current page products
    const [allProducts, setAllProducts] = useState([]); // All products for counters
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [filter, setFilter] = useState('all'); // 'all', 'low_stock', 'out_of_stock', 'stable_stock'

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    const [totalProducts, setTotalProducts] = useState(0);
    const [totalPages, setTotalPages] = useState(0);

    // Stock adjustment modal state
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isStockModalOpen, setIsStockModalOpen] = useState(false);

    // Order statistics state
    const [orderStats, setOrderStats] = useState({
        totalOrders: 0,
        cancelledOrders: 0,
        netOrders: 0,
        totalRevenue: 0,
        cancelledRevenue: 0,
        netRevenue: 0
    });

    // Fetch all products for counters (once)
    useEffect(() => {
        const fetchAllProducts = async () => {
            try {
                const response = await fetch(`${API_URL}/api/products/supplier?page=1&limit=1000`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.data) {
                    const allProductsData = data.data || [];
                    console.log('📦 All products loaded for counters:', allProductsData.length);

                    setAllProducts(allProductsData);
                    setTotalProducts(allProductsData.length);

                    // Filter low stock products from ALL products
                    const lowStock = allProductsData.filter(product =>
                        product.stock !== undefined && product.stock < 50
                    );
                    console.log('⚠️ Low stock products found:', lowStock.length);

                    setLowStockProducts(lowStock);
                }
            } catch (err) {
                console.error('Error fetching all products for counters:', err);
            }
        };

        if (token) {
            fetchAllProducts();
        }
    }, [token]);

    // Fetch products data for current page
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const response = await fetch(`${API_URL}/api/products/supplier?page=${currentPage}&limit=${itemsPerPage}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                const data = await response.json();

                if (data.data) {
                    const productsData = data.data || [];
                    console.log('📦 Products loaded for page:', productsData.length);
                    console.log('📦 Pagination info:', { currentPage, totalPages: data.totalPages });

                    setProducts(productsData);
                    setTotalPages(data.totalPages || 1);
                    // Use the count from the API response
                    setTotalProducts(data.totalCount || (data.totalPages * itemsPerPage));
                } else {
                    console.error('❌ No data in response:', data);
                    setError('Erreur lors du chargement des produits');
                }
            } catch (err) {
                console.error('Error fetching products:', err);
                setError('Erreur de connexion');
            } finally {
                setLoading(false);
            }
        };

        if (token) {
            fetchProducts();
        }
    }, [token, currentPage, itemsPerPage]);

    const getStockStatus = (stock) => {
        if (stock === undefined || stock === null) return { status: 'unknown', label: 'Inconnu' };
        if (stock === 0) return { status: 'out_of_stock', label: 'Rupture' };
        if (stock < 20) return { status: 'critical', label: 'Critique' };
        if (stock < 50) return { status: 'low', label: 'Faible' };
        return { status: 'good', label: 'Bon' };
    };

    const getFilteredProducts = () => {
        switch (filter) {
            case 'low_stock':
                return products.filter(p => p.stock !== undefined && p.stock >= 20 && p.stock <= 49);
            case 'out_of_stock':
                return products.filter(p => p.stock === 0);
            case 'critical_stock':
                return products.filter(p => p.stock !== undefined && p.stock < 20 && p.stock > 0);
            case 'stable_stock':
                return products.filter(p => p.stock !== undefined && p.stock >= 50);
            default:
                // Sort by priority: rupture, critique, faible, bon
                return [...products].sort((a, b) => {
                    const getPriority = (stock) => {
                        if (stock === 0) return 0; // Rupture - highest priority
                        if (stock < 20) return 1; // Critique
                        if (stock < 50) return 2; // Faible
                        return 3; // Bon - lowest priority
                    };
                    return getPriority(a.stock) - getPriority(b.stock);
                });
        }
    };

    // Handle opening stock adjustment modal
    const handleOpenStockModal = (product) => {
        setSelectedProduct(product);
        setIsStockModalOpen(true);
    };

    // Handle closing stock adjustment modal
    const handleCloseStockModal = () => {
        setSelectedProduct(null);
        setIsStockModalOpen(false);
    };

    // Handle stock update success
    const handleStockUpdated = async () => {
        // Refresh products data after stock adjustment
        await fetchProducts();
    };

    // Fetch products function
    const fetchProducts = async () => {
        try {
            setLoading(true);
            setError('');

            const res = await fetch(`${API_URL}/api/supplier/orders`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();

            if (!json.success) {
                setError(json.message || "Erreur lors du chargement des données.");
                setProducts([]);
                return;
            }

            // Set order statistics
            if (json.stats) {
                setOrderStats({
                    totalOrders: json.stats.totalOrders || 0,
                    cancelledOrders: json.stats.cancelledOrders || 0,
                    netOrders: json.stats.netOrders || 0,
                    totalRevenue: json.stats.totalRevenue || 0,
                    cancelledRevenue: json.stats.cancelledRevenue || 0,
                    netRevenue: json.stats.netRevenue || 0
                });
            }

            // Extract unique products from orders
            const productMap = new Map();
            (json.data || []).forEach((order) => {
                order.items?.forEach((item) => {
                    if (item.product && item.product._id) {
                        const product = item.product;
                        if (!productMap.has(product._id)) {
                            productMap.set(product._id, {
                                _id: product._id,
                                name: product.name || "Produit inconnu",
                                stock: product.stock || 0,
                                price: product.price || 0,
                                category: product.category || "Non catégorisé"
                            });
                        }
                    }
                });
            });

            setProducts(Array.from(productMap.values()));
            setTotalProducts(Array.from(productMap.values()).length);
            setTotalPages(Math.ceil(Array.from(productMap.values()).length / itemsPerPage));

        } catch (e) {
            console.error(e);
            setError("Erreur de connexion au serveur. Veuillez réessayer.");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="sales-management-loading">
                <div className="loading-spinner"></div>
                <p>Chargement des données de vente...</p>
            </div>
        );
    }

    // Calculate display range for "Affichage de X à Y sur Z produits"
    const startIndex = (currentPage - 1) * itemsPerPage + 1;
    const endIndex = Math.min(currentPage * itemsPerPage, totalProducts);

    return (
        <div className="sales-management">
            <div className="sales-header">
                <h2>🔎 Gestion des ventes et produits</h2>
                <p>Produits en rupture / stock faible avec alertes et possibilité de réapprovisionnement rapide.</p>
            </div>



            {/* Products Table */}
            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th>Produit</th>
                            <th>Statut</th>
                            <th>Prix</th>
                        </tr>
                    </thead>
                    <tbody>
                        {getFilteredProducts().map((product) => {
                            const stockStatus = getStockStatus(product.stock);
                            return (
                                <tr key={product._id} className={`product-row ${stockStatus.status}`}>
                                    <td className={`product-info ${stockStatus.status}`}>
                                        <div
                                            className="product-name clickable-product-name"
                                            onClick={() => handleOpenStockModal(product)}
                                            title="Cliquer pour ajuster le stock"
                                        >
                                            {product.name}
                                        </div>
                                    </td>
                                    <td className={`status-info ${stockStatus.status}`}>
                                        <span
                                            className={`stock-status-badge ${stockStatus.status}`}
                                        >
                                            {stockStatus.label}
                                        </span>
                                    </td>
                                    <td className={`price-info ${stockStatus.status}`}>
                                        {product.price ? `€${product.price.toFixed(2)}` : 'N/A'}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {getFilteredProducts().length === 0 && (
                    <div className="no-products">
                        <p>Aucun produit trouvé avec ce filtre.</p>
                    </div>
                )}
            </div>

            {/* New Pagination Container - matches the image design */}
            {totalProducts > 0 && (
                <div className="pagination-container">
                    <div className="pagination-summary">
                        Affichage de {startIndex} à {endIndex} sur {totalProducts} produits
                    </div>

                    <div className="pagination-controls-group">
                        <div className="items-per-page-selector">
                            <label>Par page:</label>
                            <select
                                value={itemsPerPage}
                                onChange={(e) => {
                                    setItemsPerPage(parseInt(e.target.value));
                                    setCurrentPage(1); // Reset to first page when changing items per page
                                }}
                                className="items-select"
                            >
                                <option value={4}>4</option>
                                <option value={8}>8</option>
                                <option value={12}>12</option>
                            </select>
                        </div>

                        <div className="pagination-buttons">
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(1)}
                                disabled={currentPage === 1}
                            >
                                ««
                            </button>
                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                            >
                                «
                            </button>

                            <div className="page-numbers">
                                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                    let pageNum;
                                    if (totalPages <= 5) {
                                        pageNum = i + 1;
                                    } else if (currentPage <= 3) {
                                        pageNum = i + 1;
                                    } else if (currentPage >= totalPages - 2) {
                                        pageNum = totalPages - 4 + i;
                                    } else {
                                        pageNum = currentPage - 2 + i;
                                    }

                                    return (
                                        <button
                                            key={pageNum}
                                            className={`page-btn ${currentPage === pageNum ? 'active' : ''}`}
                                            onClick={() => setCurrentPage(pageNum)}
                                        >
                                            {pageNum}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                className="pagination-btn"
                                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                disabled={currentPage === totalPages}
                            >
                                »
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Stock Adjustment Modal */}
            {isStockModalOpen && selectedProduct && (
                <StockAdjustModal
                    product={selectedProduct}
                    onClose={handleCloseStockModal}
                    onStockUpdated={handleStockUpdated}
                />
            )}

        </div>
    );
};

export default SalesManagement;
