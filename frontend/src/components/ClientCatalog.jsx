// src/pages/ClientCatalog.jsx
import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../contexts/CartContext";
import ClientNavbar from "./dashboard/ClientNavbar";
import { FaShoppingCart, FaEye } from 'react-icons/fa';
import AIAssistantModal from './AIAssistantModal';
import NotificationButton from './NotificationButton';
import NotificationPanel from './NotificationPanel';
import "../style/ProductList.css";

const API_BASE = process.env.REACT_APP_API_BASE || "http://localhost:5000";
const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

// Styles inline pour neutraliser tout conflit CSS
const CARD_STYLE = { display: "flex", flexDirection: "column" };
const CONTENT_STYLE = { flex: "1 1 auto" };
const ACTIONS_STYLE = { display: "flex", gap: 10, marginTop: 12, paddingTop: 8 };
const BTN = {
  base: {
    padding: "10px 12px",
    border: 0,
    borderRadius: 10,
    fontWeight: 800,
    color: "#fff",
    cursor: "pointer",
    boxShadow: "0 10px 20px rgba(17,24,39,.2)",
    flex: "1 1 0",
    transition: "all 0.3s ease",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "6px",
  },
  green: {
    background: "#10b981",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 15px 30px rgba(16, 185, 129, 0.4)",
    }
  },
  blue: {
    background: "#2563eb",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: "0 15px 30px rgba(37, 99, 235, 0.4)",
    }
  },
  disabled: { opacity: .5, cursor: "not-allowed" },
};

export default function ClientCatalog({ reload }) {
  const [rawProducts, setRawProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  // UI
  const [q, setQ] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recent");
  const [inStockOnly, setInStockOnly] = useState(false);

  // pagination
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);   // défaut 8, choix 4/8/12
  const [pages, setPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [quantities, setQuantities] = useState({});
  const [showAIAssistant, setShowAIAssistant] = useState(null);
  const [showQuantityModal, setShowQuantityModal] = useState(false);
  const [productToAdd, setProductToAdd] = useState(null);
  const [notification, setNotification] = useState({ message: '', type: '', showOptions: false });
  // Store all products for similar product lookup

  const [clientId, setClientId] = useState(null);

  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

  // Simple notification function
  const notify = (message, type = 'info') => {
    alert(message); // Simple alert for now, you can replace with a proper notification component
  };

  // --- CSS embarqué pour forcer l’affichage des boutons (si une règle externe les masque)
  const forceCss = `
    .products-grid .product-card .product-actions{display:flex!important;gap:10px;margin-top:12px;padding-top:8px}
  `;

  /* ==================== DATA ==================== */
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No auth token");

      const res = await axios.get(`${API_BASE}/api/products/client-dashboard/catalog`, {
        params: { limit: 10000 }, // on pagine côté client
        headers: { Authorization: `Bearer ${token}` },
      });

      const arr = Array.isArray(res?.data?.data) ? res.data.data
        : Array.isArray(res?.data) ? res.data
          : [];
      setRawProducts(arr);
    } catch (e) {
      console.error("products:", e.response?.data?.message || e.message);
      alert(`Erreur chargement produits: ${e.response?.data?.message || "Vérifiez votre connexion"}`);
      setRawProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts, reload]);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No auth token");
        const res = await axios.get(`${API_BASE}/api/products/categories`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch { }
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return;
        const me = await axios.get(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const id = me?.data?.data?.user?._id;
        if (id) setClientId(id);
      } catch { }
    })();
  }, []);


  /* ==================== FILTRES / TRI ==================== */
  const filteredSorted = useMemo(() => {
    let arr = [...rawProducts];
    const text = q.trim().toLowerCase();
    if (text) {
      arr = arr.filter((p) => {
        const name = (p.name || "").toLowerCase();
        const desc = (p.description || "").toLowerCase();
        const cat = (p.category || p.category?.name || "").toLowerCase();
        return name.includes(text) || desc.includes(text) || cat.includes(text);
      });
    }
    if (category) {
      arr = arr.filter((p) => (p.category?.name || p.category || "") === category);
    }
    if (inStockOnly) {
      arr = arr.filter((p) => Number(p.stock ?? 0) > 0);
    }
    switch (sort) {
      case "priceAsc": arr.sort((a, b) => Number(a.price || 0) - Number(b.price || 0)); break;
      case "priceDesc": arr.sort((a, b) => Number(b.price || 0) - Number(a.price || 0)); break;
      case "recent":
      default: {
        const toTime = (p) => p?.createdAt ? new Date(p.createdAt).getTime() : 0;
        arr.sort((a, b) => toTime(b) - toTime(a));
      }
    }
    return arr;
  }, [rawProducts, q, category, inStockOnly, sort]);

  // pagination dérivée
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(filteredSorted.length / pageSize));
    setPages(totalPages);
    setPage((p) => Math.min(p, totalPages));
  }, [filteredSorted.length, pageSize]);

  const pageItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSorted.slice(start, start + pageSize);
  }, [filteredSorted, page, pageSize]);

  /* ==================== HELPERS ==================== */
  const handleOrder = (p) => { addToCart(p); navigate("/client-dashboard/new-order"); };

  const handleAddToCartClick = (product) => {
    if (product.stock <= 0) return;
    setProductToAdd(product);
    setShowQuantityModal(true);
  };

  const handleConfirmQuantity = () => {
    if (!productToAdd) return;
    const quantity = quantities[productToAdd._id] || 1;

    // Ajouter la quantité spécifiée au panier
    for (let i = 0; i < quantity; i++) {
      addToCart(productToAdd);
    }

    // Afficher une notification avec options
    setNotification({
      message: `${quantity} produit(s) ajouté(s) au panier`,
      type: "success",
      showOptions: true,
      productName: productToAdd.name
    });

    // Fermer la modal et réinitialiser
    setShowQuantityModal(false);
    setProductToAdd(null);
    setQuantities(prev => ({
      ...prev,
      [productToAdd._id]: 1
    }));
  };

  const handleQuantityChange = (productId, newQuantity) => {
    setQuantities(prev => ({
      ...prev,
      [productId]: Math.max(1, Math.min(newQuantity, productToAdd?.stock || 999))
    }));
  };

  const handleContinueShopping = () => {
    setNotification({ message: '', type: '', showOptions: false });
  };

  const handleFinalizeOrder = () => {
    setNotification({ message: '', type: '', showOptions: false });
    navigate("/client-dashboard/new-order");
  };

  const onEnter = (e) => { if (e.key === "Enter") setPage(1); };
  const StockBadge = ({ value }) => (
    <span className={`badge-stock ${Number(value) <= 0 ? "zero" : ""}`}>{value}</span>
  );

  /* ==================== RENDU ==================== */
  return (
    <div className="orders-container">
      <ClientNavbar />
      <NotificationButton />
      <NotificationPanel />
      <div className="orders-header">
        <h1>Catalogue Produits</h1>
        <p>Découvrez notre gamme complète de produits médicaux</p>
      </div>
      <div className="main-content">
        <style>{forceCss}</style>

        {/* Filtres */}
        <div className="search-section" role="region" aria-label="Filtres catalogue">
          <input
            className="search-input"
            placeholder="Rechercher un produit…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            onKeyDown={onEnter}
          />
          <div className="filters-row">
            <select
              className="category-select"
              value={category}
              onChange={(e) => { setCategory(e.target.value); setPage(1); }}
            >
              <option value="">Toutes catégories</option>
              {categories.map((c) => (<option key={c} value={c}>{c}</option>))}
            </select>
            <select
              className="category-select"
              value={sort}
              onChange={(e) => { setSort(e.target.value); setPage(1); }}
              aria-label="Trier par"
            >
              <option value="recent">Plus récents</option>
              <option value="priceAsc">Prix croissant</option>
              <option value="priceDesc">Prix décroissant</option>
            </select>
            <button
              className={`chip ${inStockOnly ? "chip-on" : ""}`}
              onClick={() => { setInStockOnly(v => !v); setPage(1); }}
              aria-pressed={inStockOnly}
            >
              Stock uniquement
            </button>
          </div>
        </div>


        {/* Grille produits (chaque carte : Détails + Ajouter au panier) */}
        <section className="products-grid">
          {loading
            ? [...Array(pageSize)].map((_, i) => (
              <div className="product-card" style={CARD_STYLE} key={i}>
                <div className="product-image-container skeleton" />
                <div className="product-content" style={CONTENT_STYLE}>
                  <div className="skeleton-line" />
                  <div className="skeleton-line" style={{ width: "80%" }} />
                  <div className="skeleton-line" style={{ width: "60%" }} />
                </div>
                <div className="product-actions" style={ACTIONS_STYLE}>
                  <div className="skeleton sk-btn" />
                  <div className="skeleton sk-btn" />
                </div>
              </div>
            ))
            : pageItems.map((p) => {
              const out = (p.stock ?? 0) <= 0;
              return (
                <article className="product-card" style={CARD_STYLE} key={p._id}>
                  <div className="product-image-container">
                    {p.images?.length
                      ? <img className="product-image" src={`${API_BASE}${p.images[0]}`} alt={p.name} />
                      : <div className="product-image-placeholder">Aucune image</div>}
                  </div>

                  <div className="product-content" style={CONTENT_STYLE}>
                    <span className="tag">{p.category || "Produit"}</span>
                    <h3 className="product-title">{p.name}</h3>
                    <p className="product-description">{p.description}</p>
                    <div className="rec-info">
                      <span className="rec-price">Prix : {money.format(Number(p.price || 0))}</span>
                      <span className="rec-stock">
                        Stock : <StockBadge value={p.stock} />
                      </span>
                    </div>
                  </div>

                  {/* >>> Les 2 boutons en bas de CHAQUE carte (forcés en flex) <<< */}
                  <div className="product-actions" style={ACTIONS_STYLE}>
                    <button
                      style={{ ...BTN.base, ...BTN.green }}
                      onClick={() => setSelectedProduct(p)}
                    >
                      <FaEye />
                      Détails
                    </button>
                    <button
                      style={{
                        ...BTN.base,
                        ...(out ? {
                          ...BTN.disabled,
                          background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                          color: "white",
                          boxShadow: "0 10px 20px rgba(220, 38, 38, 0.3)"
                        } : BTN.blue)
                      }}
                      disabled={out}
                      onClick={() => handleAddToCartClick(p)}
                    >
                      <FaShoppingCart />
                      {out ? "En rupture" : "Ajouter au panier"}
                    </button>
                  </div>
                </article>
              );
            })
          }
        </section>

        {/* Pagination */}
        {filteredSorted.length > 0 && (
          <div className="pagination-container">
            <div className="pagination-info">
              <span>
                Affichage de {((page - 1) * pageSize) + 1} à {Math.min(page * pageSize, filteredSorted.length)} sur {filteredSorted.length} produits
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

        {/* Modal détails */}
        {selectedProduct && (
          <div className="modal-overlay" onClick={() => setSelectedProduct(null)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 className="modal-title">{selectedProduct.name}</h2>
                <button className="modal-close" onClick={() => setSelectedProduct(null)}>×</button>
              </div>
              <div className="modal-body">
                {selectedProduct.images?.length ? (
                  <img
                    className="modal-image"
                    src={`${API_BASE}${selectedProduct.images[0]}`}
                    alt={selectedProduct.name}
                  />
                ) : (
                  <div className="modal-image" style={{
                    background: 'linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '48px',
                    color: '#9ca3af'
                  }}>
                    📦
                  </div>
                )}
                <div className="modal-info">
                  <p className="modal-description">
                    {selectedProduct.description || "Aucune description disponible pour ce produit."}
                  </p>
                  <p><strong>Prix :</strong> {money.format(Number(selectedProduct.price || 0))}</p>
                  <p><strong>Stock :</strong> <span className={`badge-stock ${selectedProduct.stock <= 0 ? "zero" : ""}`}>{selectedProduct.stock}</span></p>
                  <p><strong>Catégorie :</strong> {selectedProduct.category || "Non spécifiée"}</p>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  style={{
                    ...BTN.base,
                    ...(selectedProduct.stock <= 0 ? {
                      ...BTN.disabled,
                      background: "linear-gradient(135deg, #dc2626, #b91c1c)",
                      color: "white",
                      boxShadow: "0 10px 20px rgba(220, 38, 38, 0.3)"
                    } : BTN.blue)
                  }}
                  disabled={selectedProduct.stock <= 0}
                  onClick={() => handleAddToCartClick(selectedProduct)}
                >
                  {selectedProduct.stock <= 0 ? "En rupture" : "Ajouter au panier"}
                </button>
                <button
                  style={{ ...BTN.base, ...BTN.green }}
                  onClick={() => setShowAIAssistant(selectedProduct)}
                >
                  🤖 IA Assistant
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Assistant Modal */}
        <AIAssistantModal
          product={showAIAssistant}
          isOpen={!!showAIAssistant}
          onClose={() => setShowAIAssistant(null)}
          onProductClick={(product) => {
            setSelectedProduct(product);
            setShowAIAssistant(null);
          }}
          onAddToCart={(product) => {
            addToCart(product);
            notify(`Produit ajouté au panier: ${product.name}`, 'success');
          }}
          onOrderNow={(product) => {
            addToCart(product);
            navigate('/client-dashboard/new-order');
          }}
        />

        {/* Modal de sélection de quantité */}
        {showQuantityModal && productToAdd && (
          <div className="quantity-modal-overlay" onClick={() => setShowQuantityModal(false)}>
            <div className="quantity-modal" onClick={(e) => e.stopPropagation()}>
              <div className="quantity-modal-header">
                <h3>Choisir la quantité</h3>
                <button
                  className="quantity-modal-close"
                  onClick={() => setShowQuantityModal(false)}
                >
                  ×
                </button>
              </div>

              <div className="quantity-modal-body">
                <div className="product-preview">
                  <img
                    src={productToAdd.images?.length ? `${API_BASE}${productToAdd.images[0]}` : '/placeholder-product.png'}
                    alt={productToAdd.name}
                    className="product-preview-image"
                  />
                  <div className="product-preview-info">
                    <h4>{productToAdd.name}</h4>
                    <p className="product-preview-price">{money.format(Number(productToAdd.price || 0))}</p>
                    <p className="product-preview-stock">Stock disponible : {productToAdd.stock}</p>
                  </div>
                </div>

                <div className="quantity-selection">
                  <label>Quantité :</label>
                  <div className="quantity-controls-large">
                    <button
                      className="qty-btn-large minus"
                      onClick={() => handleQuantityChange(productToAdd._id, (quantities[productToAdd._id] || 1) - 1)}
                      disabled={(quantities[productToAdd._id] || 1) <= 1}
                    >
                      -
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={productToAdd.stock}
                      value={quantities[productToAdd._id] || 1}
                      onChange={(e) => handleQuantityChange(productToAdd._id, parseInt(e.target.value) || 1)}
                      className="quantity-input-large"
                    />
                    <button
                      className="qty-btn-large plus"
                      onClick={() => handleQuantityChange(productToAdd._id, (quantities[productToAdd._id] || 1) + 1)}
                      disabled={(quantities[productToAdd._id] || 1) >= productToAdd.stock}
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              <div className="quantity-modal-footer">
                <button
                  className="quantity-cancel-btn"
                  onClick={() => setShowQuantityModal(false)}
                >
                  Annuler
                </button>
                <button
                  className="quantity-confirm-btn"
                  onClick={handleConfirmQuantity}
                >
                  <FaShoppingCart />
                  Ajouter {quantities[productToAdd._id] || 1} au panier
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notification personnalisée avec options */}
        {notification.message && (
          <div className="custom-notification-overlay">
            <div className="custom-notification">
              <div className="notification-header">
                <div className="notification-icon">✅</div>
                <h3>Produit ajouté !</h3>
              </div>
              <div className="notification-body">
                <p>{notification.message}</p>
                {notification.showOptions && (
                  <div className="notification-actions">
                    <p>Que souhaitez-vous faire maintenant ?</p>
                    <div className="action-buttons">
                      <button
                        className="continue-btn"
                        onClick={handleContinueShopping}
                      >
                        🛒 Continuer les achats
                      </button>
                      <button
                        className="finalize-btn"
                        onClick={handleFinalizeOrder}
                      >
                        ✅ Finaliser la commande
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
