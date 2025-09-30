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
  const [showAIAssistant, setShowAIAssistant] = useState(null);
  // Store all products for similar product lookup

  // recommandations
  const [recommendations, setRecommendations] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

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

  useEffect(() => {
    (async () => {
      if (!clientId) return;
      try {
        setRecLoading(true);
        const token = localStorage.getItem("token");
        const res = await axios.get(`${API_BASE}/api/recommendations/${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setRecommendations(Array.isArray(res.data) ? res.data : []);
      } catch {
        setRecommendations([]);
      } finally {
        setRecLoading(false);
      }
    })();
  }, [clientId]);

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

        {/* Recommandations - Design amélioré */}
        {(recLoading || recommendations.length > 0) && (
          <section className="recommendations-section">
            <div className="recommendations-header">
              <div className="recommendations-title-container">
                <div className="recommendations-icon">✨</div>
                <h2 className="recommendations-title">Nos recommandations pour vous</h2>
              </div>
              <p className="recommendations-subtitle">
                Produits choisis selon votre activité et vos préférences
              </p>
            </div>

            <div className="recommendations-container">
              <div className="recommendations-grid">
                {recLoading
                  ? [...Array(4)].map((_, i) => (
                    <div className="recommendation-card skeleton-card" key={i}>
                      <div className="recommendation-image-container skeleton" />
                      <div className="recommendation-content">
                        <div className="recommendation-category skeleton skeleton-text" />
                        <div className="recommendation-title skeleton skeleton-text" />
                        <div className="recommendation-description skeleton skeleton-text" />
                        <div className="recommendation-info">
                          <div className="recommendation-price skeleton skeleton-text" />
                          <div className="recommendation-stock skeleton skeleton-text" />
                        </div>
                      </div>
                      <div className="recommendation-actions">
                        <div className="recommendation-btn skeleton skeleton-btn" />
                        <div className="recommendation-btn skeleton skeleton-btn" />
                      </div>
                    </div>
                  ))
                  : recommendations.map((p) => {
                    const out = (p.stock ?? 0) <= 0;
                    return (
                      <article className="recommendation-card" key={p._id}>
                        <div className="recommendation-image-container">
                          {p.images?.length ? (
                            <img
                              className="recommendation-image"
                              src={`${API_BASE}${p.images[0]}`}
                              alt={p.name}
                            />
                          ) : (
                            <div className="recommendation-image-placeholder">
                              <span>📦</span>
                            </div>
                          )}
                          <div className="recommendation-badge">
                            <span>⭐ Recommandé</span>
                          </div>
                        </div>

                        <div className="recommendation-content">
                          <div className="recommendation-category">
                            {p.category || "Produit"}
                          </div>
                          <h3 className="recommendation-title">{p.name}</h3>
                          <p className="recommendation-description">
                            {p.description?.length > 100 ? p.description.slice(0, 100) + "…" : p.description || "Description non disponible"}
                          </p>

                          <div className="recommendation-info">
                            <div className="recommendation-price">
                              <span className="price-label">Prix</span>
                              <span className="price-value">{money.format(Number(p.price || 0))}</span>
                            </div>
                            <div className="recommendation-stock">
                              <span className="stock-label">Stock</span>
                              <span className={`stock-value ${(p.stock ?? 0) <= 0 ? "zero" : ""}`}>
                                {p.stock ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="recommendation-actions">
                          <button
                            className="recommendation-btn details-btn"
                            onClick={() => setSelectedProduct(p)}
                          >
                            <FaEye />
                            Détails
                          </button>
                          <button
                            className={`recommendation-btn cart-btn ${out ? "disabled" : ""}`}
                            disabled={out}
                            onClick={() => handleOrder(p)}
                          >
                            <FaShoppingCart />
                            {out ? "Rupture" : "Au panier"}
                          </button>
                        </div>
                      </article>
                    );
                  })
                }
              </div>
            </div>
          </section>
        )}

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
                      style={{ ...BTN.base, ...BTN.blue, ...(out ? BTN.disabled : {}) }}
                      disabled={out}
                      onClick={() => handleOrder(p)}
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
                  style={{ ...BTN.base, ...BTN.blue, ...(selectedProduct.stock <= 0 ? BTN.disabled : {}) }}
                  disabled={selectedProduct.stock <= 0}
                  onClick={() => handleOrder(selectedProduct)}
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

      </div>
    </div>
  );
}
