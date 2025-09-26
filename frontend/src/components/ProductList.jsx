import React, { useState, useEffect, useCallback, useRef } from 'react';
import StockAdjustModal from './StockAdjustModal';
import axios from 'axios';
import '../style/ProductList.css';
import CompetitorModal from './CompetitorModal';
import PriceSimulationModal from './PriceSimulationModal';
import { FaEdit, FaBoxOpen, FaTrash, FaSearch, FaChartLine, FaBalanceScale } from 'react-icons/fa';
import { NotificationContext } from '../contexts/NotificationContext';
import { useContext } from 'react';

export default function ProductList({ onEdit, reload }) {
  const [products, setProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
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
        params: { q, category: category || undefined, page, limit: 10 },
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data.data || []);
      setPages(res.data.pages || 1);
    } catch (err) {
      console.error('Error fetching products:', err.response?.data?.message || err.message);
      showNotification(`Erreur chargement produits: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`, 'error');
    }
  }, [q, category, page, showNotification]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts, reload]);

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
        <button onClick={() => fetchProducts()} className="search-button">
          <FaSearch /> Rechercher
        </button>
      </div>

      <div className="products-grid">
        {products.map(p => (
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
              <p className="product-price">
                Prix : {p.price} €
              </p>
              <p className="product-stock">
                Stock : {p.stock}
              </p>
              <p className="product-category">
                Catégorie : {p.category || 'Non spécifiée'}
              </p>
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

      <div className="pagination">
        <button
          disabled={page <= 1}
          onClick={() => setPage(page - 1)}
          className="pagination-button prev"
        >
          Précédent
        </button>
        <span className="pagination-info">
          Page {page} sur {pages}
        </span>
        <button
          disabled={page >= pages}
          onClick={() => setPage(page + 1)}
          className="pagination-button next"
        >
          Suivant
        </button>
      </div>

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
