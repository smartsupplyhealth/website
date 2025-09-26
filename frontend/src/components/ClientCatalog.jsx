// src/pages/ClientCatalog.jsx
import React, { useState, useEffect, useMemo, useCallback, useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../contexts/CartContext";
import ClientNavbar from "./dashboard/ClientNavbar";
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
  },
  green: { background: "#10b981" },
  blue: { background: "#2563eb" },
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
  const [pageSize, setPageSize] = useState(10);   // défaut 10, choix 5/10
  const [pages, setPages] = useState(1);

  const [categories, setCategories] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // recommandations
  const [recommendations, setRecommendations] = useState([]);
  const [clientId, setClientId] = useState(null);
  const [recLoading, setRecLoading] = useState(false);

  const navigate = useNavigate();
  const { addToCart } = useContext(CartContext);

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
      } catch {}
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
      } catch {}
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
      case "priceAsc":  arr.sort((a,b)=>Number(a.price||0)-Number(b.price||0)); break;
      case "priceDesc": arr.sort((a,b)=>Number(b.price||0)-Number(a.price||0)); break;
      case "recent":
      default: {
        const toTime = (p) => p?.createdAt ? new Date(p.createdAt).getTime() : 0;
        arr.sort((a,b)=>toTime(b)-toTime(a));
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
    <div className="product-list-container">
      <ClientNavbar />
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
        <button className="search-button" onClick={() => setPage(1)}>Rechercher</button>
      </div>

      {/* Recommandations (déjà avec 2 boutons) */}
      {(recLoading || recommendations.length > 0) && (
        <section className="recommendations-carousel-section">
          <div className="recommendations-header">
            <h2>✨ Nos recommandations pour vous</h2>
            <p>Produits choisis selon votre activité</p>
          </div>

          <div className="recommendations-carousel">
            <div className="carousel-container">
              <div className="carousel-track">
                {recLoading
                  ? [...Array(4)].map((_, i) => <div className="recommendation-card skeleton" key={i} />)
                  : recommendations.map((p) => {
                      const out = (p.stock ?? 0) <= 0;
                      return (
                        <article className="recommendation-card" key={p._id}>
                          <div className="rec-image-container">
                            {p.images?.length
                              ? <img className="rec-image" src={`${API_BASE}${p.images[0]}`} alt={p.name} />
                              : <div className="rec-image-placeholder">📦</div>}
                            <div className="rec-card-badge"><span>Recommandé</span></div>
                          </div>

                          <div className="rec-content">
                            <div className="rec-category-tag">{p.category || "Produit"}</div>
                            <h3 className="rec-title">{p.name}</h3>
                            <p className="rec-description">
                              {p.description?.length > 70 ? p.description.slice(0, 70) + "…" : p.description}
                            </p>

                            <div className="rec-info">
                              <span className="rec-price">{money.format(Number(p.price || 0))}</span>
                              <span className="rec-stock">
                                Stock : <StockBadge value={p.stock} />
                              </span>
                            </div>

                            <div className="rec-actions">
                              <button
                                className={`rec-add-btn ${out ? "disabled" : ""}`}
                                disabled={out}
                                onClick={() => handleOrder(p)}
                              >
                                🛒 Ajouter au panier
                              </button>
                              <button className="rec-details-btn" onClick={() => setSelectedProduct(p)}>
                                Détails
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })
                }
              </div>
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
                      Détails
                    </button>
                    <button
                      style={{ ...BTN.base, ...BTN.blue, ...(out ? BTN.disabled : {}) }}
                      disabled={out}
                      onClick={() => handleOrder(p)}
                    >
                      {out ? "En rupture" : "Ajouter au panier"}
                    </button>
                  </div>
                </article>
              );
            })
        }
      </section>

      {/* Pagination */}
      <div className="pagination">
        <button
          className="pagination-button prev"
          disabled={page <= 1}
          onClick={() => setPage(p => p - 1)}
        >
          Précédent
        </button>
        <span className="pagination-info">Page {page} sur {pages}</span>
        <button
          className="pagination-button next"
          disabled={page >= pages}
          onClick={() => setPage(p => p + 1)}
        >
          Suivant
        </button>
        <select
          className="page-size-select"
          value={pageSize}
          onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
        >
          <option value={5}>5 / page</option>
          <option value={10}>10 / page</option>
        </select>
      </div>

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
              ) : null}
              <div>
                <p className="modal-description">{selectedProduct.description}</p>
                <p><strong>Prix :</strong> {money.format(Number(selectedProduct.price || 0))}</p>
                <p><strong>Stock :</strong> <span className={`badge-stock ${selectedProduct.stock <= 0 ? "zero" : ""}`}>{selectedProduct.stock}</span></p>
                <p><strong>Catégorie :</strong> {selectedProduct.category || "Non spécifiée"}</p>
              </div>
            </div>
            <div className="modal-footer">
              <button className="modal-button cancel" onClick={() => setSelectedProduct(null)}>Fermer</button>
              <button
                style={{ ...BTN.base, ...BTN.blue, ...(selectedProduct.stock <= 0 ? BTN.disabled : {}) }}
                disabled={selectedProduct.stock <= 0}
                onClick={() => handleOrder(selectedProduct)}
              >
                {selectedProduct.stock <= 0 ? "En rupture" : "Ajouter au panier"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
