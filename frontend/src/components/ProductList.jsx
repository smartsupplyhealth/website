import React, { useState, useEffect, useCallback, useRef } from 'react';
import StockAdjustModal from './StockAdjustModal';
import axios from 'axios';
import '../style/ProductList.css';
import CompetitorModal from './CompetitorModal';
import PriceSimulationModal from './PriceSimulationModal';
import { FaEdit, FaBoxOpen, FaTrash, FaChartLine, FaBalanceScale, FaPlus, FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import { useNotifications } from '../contexts/NotificationContext';

export default function ProductList({ onEdit, reload, onAdd }) {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [q, setQ] = useState('');
  const [category, setCategory] = useState('');
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [pageSize, setPageSize] = useState(8);
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
  const [showActionModal, setShowActionModal] = useState(false);
  const [selectedProductForActions, setSelectedProductForActions] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  const dropdownRef = useRef(null);
  const { showNotification } = useNotifications();


  // Close dropdown when clicking outside
  useEffect(() => {
    if (!openDropdownId) return;

    const handleClickOutside = (event) => {
      // Check if the click is outside the dropdown
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        console.log('Clicking outside, closing dropdown');
        setOpenDropdownId(null);
      }
    };

    // Add event listener with a small delay
    const timeoutId = setTimeout(() => {
      document.addEventListener('click', handleClickOutside);
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleClickOutside);
    };
  }, [openDropdownId]);

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

        if (res.data.success) {
          setOffers(res.data.offers || []);
          showNotification(res.data.message || 'Analyse des concurrents terminée', 'success');
        } else {
          setCompetitorError(res.data.message || 'Erreur lors de l\'analyse');
          showNotification(res.data.message || 'Erreur d\'analyse', 'error');
        }
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
        params: { limit: 10000 }, // Get all products, not just first page
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

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setShowDeleteModal(true);
    setShowActionModal(false);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      await axios.delete(`http://localhost:5000/api/products/${productToDelete._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      showNotification('Produit supprimé avec succès.', 'success');
      fetchProducts();
      setShowDeleteModal(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err.response?.data?.message || err.message);
      showNotification(`Erreur suppression produit: ${err.response?.data?.message || 'Vérifiez votre connexion ou authentification'}`, 'error');
    }
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setProductToDelete(null);
  };

  const analyzeCompetitors = async (productId) => {
    console.log('Starting competitor analysis for product:', productId);
    setOffers([]);
    setIsAnalyzing(true);
    setCompetitorError(null);
    setShowCompetitorModal(true);
    setAnalyzingProductId(productId);
    console.log('Competitor modal should be open now');

    try {
      const token = localStorage.getItem('token');
      console.log('Calling backend API for competitor analysis...');

      const res = await axios.post(`http://localhost:5000/api/scrape/${productId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Backend response:', res.data);
      console.log('Number of offers received:', res.data.offers?.length || 0);

      if (res.data.offers && res.data.offers.length > 0) {
        setOffers(res.data.offers);
        console.log('Offers set successfully:', res.data.offers);
      } else {
        console.log('No offers received from backend');
        setCompetitorError('Aucun concurrent trouvé pour ce produit.');
      }
    } catch (err) {
      console.error('Error in competitor analysis:', err);
      const errorMsg = err.response?.data?.message || 'Une erreur est survenue lors de l\'analyse.';
      setCompetitorError(errorMsg);
      showNotification(`Erreur d'analyse: ${errorMsg}`, 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const simulatePrice = async (productId) => {
    console.log('Starting price simulation for product:', productId);
    setIsSimulating(true);
    setSimulationError(null);
    setSimulationData(null);
    setShowSimulationModal(true);
    console.log('Simulation modal should be open now');

    try {
      const token = localStorage.getItem('token');
      console.log('Calling backend API for price simulation...');

      const res = await axios.get(`http://localhost:5000/api/simulate/${productId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      console.log('Price simulation response:', res.data);

      if (res.data.success) {
        setSimulationData(res.data);
        showNotification(res.data.message || 'Simulation de prix terminée', 'success');
      } else {
        setSimulationError(res.data.message || 'Erreur lors de la simulation');
        showNotification(res.data.message || 'Erreur de simulation', 'error');
      }
    } catch (err) {
      console.error('Error in price simulation:', err);
      console.error('Error details:', err.response?.data);

      let errorMsg = 'Une erreur est survenue lors de la simulation.';

      if (err.response?.status === 400) {
        errorMsg = 'Aucune donnée de prix disponible. Veuillez d\'abord analyser la concurrence pour ce produit.';
      } else if (err.response?.status === 500) {
        errorMsg = 'Erreur serveur. Veuillez réessayer.';
      } else if (err.response?.data?.message) {
        errorMsg = err.response.data.message;
      }

      setSimulationError(errorMsg);
      showNotification(`Erreur de simulation: ${errorMsg}`, 'error');
    } finally {
      setIsSimulating(false);
    }
  };

  const openActionModal = (product) => {
    console.log('Opening action modal for product:', product._id);
    setSelectedProductForActions(product);
    setShowActionModal(true);
  };

  const closeActionModal = () => {
    setShowActionModal(false);
    setSelectedProductForActions(null);
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
              <button
                onClick={() => openActionModal(p)}
                className="actions-toggle-button"
              >
                <FaPlus />
                Actions
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Action Modal */}
      {showActionModal && selectedProductForActions && (
        <div className="action-modal-overlay" onClick={closeActionModal}>
          <div className="action-modal" onClick={(e) => e.stopPropagation()}>
            <div className="action-modal-header">
              <h3>Actions pour: {selectedProductForActions.name}</h3>
              <button className="close-modal-btn" onClick={closeActionModal}>×</button>
            </div>
            <div className="action-modal-content">
              <button
                onClick={() => { onEdit(selectedProductForActions); closeActionModal(); }}
                className="action-modal-btn edit"
              >
                <FaEdit />
                <span>Éditer le produit</span>
              </button>
              <button
                onClick={() => { setSelectedProduct(selectedProductForActions); closeActionModal(); }}
                className="action-modal-btn stock"
              >
                <FaBoxOpen />
                <span>Ajuster le stock</span>
              </button>
              <button
                onClick={() => {
                  console.log('Analyze competitors clicked');
                  analyzeCompetitors(selectedProductForActions._id);
                  closeActionModal();
                }}
                className="action-modal-btn analysis"
              >
                <FaBalanceScale />
                <span>Analyser la concurrence</span>
              </button>
              <button
                onClick={() => {
                  console.log('Simulate price clicked');
                  simulatePrice(selectedProductForActions._id);
                  closeActionModal();
                }}
                className="action-modal-btn simulation"
              >
                <FaChartLine />
                <span>Simuler le prix</span>
              </button>
              <button
                onClick={() => handleDeleteClick(selectedProductForActions)}
                className="action-modal-btn delete"
              >
                <FaTrash />
                <span>Supprimer le produit</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
                <option value={4}>4</option>
                <option value={8}>8</option>
                <option value={12}>12</option>
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
      {console.log('Rendering modals - Competitor:', showCompetitorModal, 'Simulation:', showSimulationModal)}

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

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="modal-overlay" onClick={cancelDelete}>
          <div className="modal-content delete-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-icon delete-icon">
                <FaTrash />
              </div>
              <h2>Supprimer le produit</h2>
              <button className="modal-close" onClick={cancelDelete}>
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <div className="delete-warning">
                <div className="warning-icon">
                  <FaExclamationTriangle />
                </div>
                <p>
                  Êtes-vous sûr de vouloir supprimer le produit <strong>"{productToDelete?.name}"</strong> ?
                </p>
                <p className="warning-text">
                  Cette action est irréversible et supprimera définitivement le produit de votre catalogue.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="modal-btn cancel-btn"
                onClick={cancelDelete}
              >
                <FaTimes />
                Annuler
              </button>
              <button
                className="modal-btn confirm-btn delete-confirm"
                onClick={confirmDelete}
              >
                <FaTrash />
                Supprimer définitivement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
