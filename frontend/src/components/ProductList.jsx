import React, { useState, useEffect, useCallback, useRef } from 'react';
import StockAdjustModal from './StockAdjustModal';
import axios from 'axios';
import '../style/ProductList.css';
import CompetitorModal from './CompetitorModal';
import PriceSimulationModal from './PriceSimulationModal';
import { FaEdit, FaBoxOpen, FaTrash, FaSearch, FaChartLine, FaBalanceScale, FaPlus } from 'react-icons/fa';
import { NotificationContext } from '../contexts/NotificationContext';
import { useContext } from 'react';

export default function ProductList({ onEdit, reload, onAdd }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [showCompetitorModal, setShowCompetitorModal] = useState(false);
  const [offers, setOffers] = useState([]);
  const [showSimulationModal, setShowSimulationModal] = useState(false);
  const [simulationData, setSimulationData] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingProductId, setAnalyzingProductId] = useState(null);
  const [competitorError, setCompetitorError] = useState(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulationError, setSimulationError] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null);
  const dropdownRef = useRef(null);
  const { showNotification } = useContext(NotificationContext);

  // --- EFFET POUR LANCER L'ANALYSE DES CONCURRENTS ---
  useEffect(() => {
    if (!analyzingProductId) return;

    const fetchCompetitors = async () => {
      setCompetitorError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await axios.post(`http://localhost:5000/api/scrape/${analyzingProductId}`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setOffers(res.data.offers || []);
      } catch (err) {
        const errorMsg = err.response?.data?.message || 'Une erreur est survenue.';
        setCompetitorError(errorMsg);
        showNotification(`Erreur d'analyse: ${errorMsg}`, 'error');
        setOffers([]);
      } finally {
        setIsAnalyzing(false);
        setAnalyzingProductId(null);
      }
    };

    fetchCompetitors();
  }, [analyzingProductId, showNotification]);


  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        const res = await axios.get('http://localhost:5000/api/products/categories', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCategories(res.data);
      } catch (err) {
        console.error('Error fetching categories:', err.response?.data?.message || err.message);
        showNotification(`Erreur chargement catégories: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`, 'error');
      }
    };
    fetchCategories();
  }, [showNotification]);

  const fetchProducts = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      const res = await axios.get('http://localhost:5000/api/products/supplier', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data || []);
    } catch (err) {
      console.error('Error fetching products:', err.response?.data?.message || err.message);
      showNotification(`Erreur chargement produits: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`, 'error');
    }
  }, [showNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, reload]);

  // Filter and paginate products
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (q.trim()) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(q.toLowerCase()) ||
        product.description.toLowerCase().includes(q.toLowerCase()) ||
        product.category.toLowerCase().includes(q.toLowerCase())
      );
    }

    // Apply category filter
    if (category) {
      filtered = filtered.filter(product => product.category === category);
    }

    setFilteredProducts(filtered);

    // Calculate total pages based on filtered results
    const totalPages = Math.ceil(filtered.length / pageSize);
    setPages(totalPages);

    // Reset to page 1 if current page is greater than total pages
    if (page > totalPages && totalPages > 0) {
      setPage(1);
    }
  }, [products, q, category, pageSize, page]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSearchChange = e => {
    setQ(e.target.value);
    setPage(1);
  };

  const handleCategoryChange = e => {
    setCategory(e.target.value);
    setPage(1);
  };

  const remove = async id => {
    if (!window.confirm('Supprimer le produit ?')) return;
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`http://localhost:5000/api/products/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Produit supprimé avec succès.', 'success');
      fetchProducts();
    } catch (err) {
      console.error('Error deleting product:', err.response?.data?.message || err.message);
      showNotification(`Erreur suppression produit: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`, 'error');
    }
  };

  const analyzeCompetitors = (productId) => {
    setOffers([]);
    setIsAnalyzing(true);
    setCompetitorError(null);
    setShowCompetitorModal(true);
    setAnalyzingProductId(productId);
  };

  const simulatePrice = async (productId) => {
    setIsSimulating(true);
    setSimulationError(null);
    setSimulationData(null);
    setShowSimulationModal(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/scrape/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const res = await axios.get(`http://localhost:5000/api/simulate/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSimulationData(res.data);
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Une erreur est survenue.';
      setSimulationError(errorMsg);
      showNotification(`Erreur de simulation: ${errorMsg}`, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const toggleDropdown = (productId) => {
    setOpenDropdownId(openDropdownId === productId ? null : productId);
  };

  return (
    <div className="product-list-container">
      <div className="search-section">
        <input
          value={q}
          onChange={handleSearchChange}
          placeholder="Rechercher..."
          className="search-input"
        />
        <select
          value={category}
          onChange={handleCategoryChange}
          className="category-select"
        >
          <option value="">Toutes catégories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <button onClick={onAdd} className="search-button">
          <FaPlus /> Ajouter un produit
        </button>
      </div>

      <div className="products-grid">
        {filteredProducts.slice((page - 1) * pageSize, page * pageSize).map(p => (
          <div key={p._id} className="product-card">
            <div className="product-image-container">
              {p.images && p.images.length > 0 ? (
                <img
                  src={`http://localhost:5000${p.images[0]}`}
                  alt={p.name}
                  className="product-image"
                />
              ) : (
                <div className="product-image-placeholder">
                  Aucune image
                </div>
              )}
            </div>

            <div className="product-content">
              <h3 className="product-title">{p.name}</h3>
              <p className="product-description">{p.description}</p>
              <div className="product-info">
                <span className="product-price">
                  Prix : {p.price} €
                </span>
                <span className="product-stock">
                  Stock : {p.stock}
                </span>
              </div>
              <div className="product-category-container">
                <span className="product-category">
                  Catégorie : {p.category || 'Non spécifiée'}
                </span>
              </div>
            </div>

            <div className="product-actions">
              <div className="actions-dropdown" ref={openDropdownId === p._id ? dropdownRef : null}>
                <button
                  onClick={() => toggleDropdown(p._id)}
                  className="actions-toggle-button"
                >
                  Actions
                </button>
                {openDropdownId === p._id && (
                  <div className="dropdown-menu show">
                    <button
                      onClick={() => { onEdit(p); setOpenDropdownId(null); }}
                      className="dropdown-item edit"
                    >
                      <FaEdit /> Éditer
                    </button>
                    <button
                      onClick={() => { setSelectedProduct(p); setOpenDropdownId(null); }}
                      className="dropdown-item stock"
                    >
                      <FaBoxOpen /> Ajuster Stock
                    </button>
                    <button
                      onClick={() => { analyzeCompetitors(p._id); setOpenDropdownId(null); }}
                      className="dropdown-item"
                    >
                      <FaBalanceScale /> Analyse Concurrence
                    </button>
                    <button
                      onClick={() => { simulatePrice(p._id); setOpenDropdownId(null); }}
                      className="dropdown-item"
                    >
                      <FaChartLine /> Simuler Prix
                    </button>
                    <button
                      onClick={() => { remove(p._id); setOpenDropdownId(null); }}
                      className="dropdown-item delete"
                    >
                      <FaTrash /> Supprimer
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {filteredProducts.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>
              Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, filteredProducts.length)} sur {filteredProducts.length} produits
            </span>
          </div>

          <div className="pagination-controls">
            <div className="items-per-page">
              <label htmlFor="itemsPerPage">Par page:</label>
              <select
                id="itemsPerPage"
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="items-select"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
              </select>
            </div>

            <div className="page-navigation">
              <button
                onClick={() => setPage(1)}
                disabled={page === 1}
                className="pagination-btn first"
              >
                ««
              </button>
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="pagination-btn prev"
              >
                ‹
              </button>

              <div className="page-numbers">
                {Array.from({ length: Math.min(5, pages) }, (_, i) => {
                  let pageNum;
                  if (pages <= 5) {
                    pageNum = i + 1;
                  } else if (page <= 3) {
                    pageNum = i + 1;
                  } else if (page >= pages - 2) {
                    pageNum = pages - 4 + i;
                  } else {
                    pageNum = page - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className={`pagination-btn page ${page === pageNum ? 'active' : ''}`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => setPage(page + 1)}
                disabled={page === pages}
                className="pagination-btn next"
              >
                ›
              </button>
              <button
                onClick={() => setPage(pages)}
                disabled={page === pages}
                className="pagination-btn last"
              >
                »»
              </button>
            </div>
          </div>
        </div>
      )}

      <StockAdjustModal
        product={selectedProduct}
        onClose={() => {
          setSelectedProduct(null);
          fetchProducts();
        }}
      />
      <CompetitorModal
        open={showCompetitorModal}
        onClose={() => setShowCompetitorModal(false)}
        offers={offers}
        isLoading={isAnalyzing}
        error={competitorError}
      />

      <PriceSimulationModal
        open={showSimulationModal}
        onClose={() => setShowSimulationModal(false)}
        data={simulationData}
        isLoading={isSimulating}
        error={simulationError}
      />
    </div>
  );
}
