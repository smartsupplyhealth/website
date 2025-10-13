// src/components/ClientInventory.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import { API_URL } from '../config/environment';
import '../style/ClientInventory.css';
import ClientNavbar from './dashboard/ClientNavbar';
import Notification from './common/Notification';
import NotificationButton from './NotificationButton';
import NotificationPanel from './NotificationPanel';

export default function ClientInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulRows, setSimulRows] = useState([]);
  const [days, setDays] = useState(3);
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Pagination for simulation results
  const [simulationPage, setSimulationPage] = useState(1);
  const [simulationPageSize] = useState(4);
  const [simulationPages, setSimulationPages] = useState(1);

  // Track if simulation has already run to prevent unnecessary regeneration
  const [simulationHasRun, setSimulationHasRun] = useState(false);

  // Pagination for main inventory table
  const [inventoryPage, setInventoryPage] = useState(1);
  const [inventoryPageSize] = useState(4);
  const [inventoryPages, setInventoryPages] = useState(1);
  const token = useMemo(() => localStorage.getItem('token'), []);

  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: API_URL,
      headers: { Authorization: `Bearer ${token}` }
    });
  }, [token]);

  // --- DATA FETCHING ---
  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.get('/api/client-inventory');
      setInventory(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Erreur lors du chargement de l\'inventaire. ❌', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  // --- HELPERS ---
  const humanDate = (d) =>
    d instanceof Date && !isNaN(d) ? d.toLocaleDateString('fr-FR') : '—';

  const safeProductName = (obj) =>
    obj?.product?.name ?? obj?.productName ?? obj?.name ?? '';

  const getKey = (obj) => obj?.product?._id ?? obj?._id ?? null;

  const getInventoryMode = (item) => {
    // Vérifier si l'auto-commande est activée
    if (item.autoOrder?.enabled) {
      return <span className="status-badge status-auto">Auto</span>;
    }

    // Sinon, c'est manuel
    return <span className="status-badge status-manual">Manuelle</span>;
  };

  // Get paginated simulation results
  const paginatedSimulRows = useMemo(() => {
    const start = (simulationPage - 1) * simulationPageSize;
    return simulRows.slice(start, start + simulationPageSize);
  }, [simulRows, simulationPage, simulationPageSize]);

  // Get paginated inventory results
  const paginatedInventory = useMemo(() => {
    const start = (inventoryPage - 1) * inventoryPageSize;
    return inventory.slice(start, start + inventoryPageSize);
  }, [inventory, inventoryPage, inventoryPageSize]);

  const computeReorderDate = (row) => {
    // chercher la ligne d'inventaire correspondante
    const match =
      inventory.find(i => i?._id === row?._id) ||
      inventory.find(i => i?.product?._id && i.product?._id === row?.product?._id);

    const dailyUsage = Number(row?.dailyUsage ?? match?.dailyUsage ?? 0);
    const currentStock = Number(row?.currentStock ?? 0);
    const reorderPoint = Number(row?.reorderPoint ?? 0);

    if (dailyUsage <= 0) return null;

    const raw = (currentStock - reorderPoint) / dailyUsage;
    const daysLeft = Math.ceil(raw);
    if (daysLeft <= 0) return new Date();

    const target = new Date();
    target.setDate(target.getDate() + daysLeft);
    return target;
  };

  // --- SIMULATION (filtrée sur les produits affichés) ---
  const simulate = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.get('/api/client-inventory/simulate-consumption', { params: { days } });

      const raw = Array.isArray(data) ? data : [];

      // produits visibles dans le tableau du haut (stock > 0)
      const visibleInventory = inventory.filter(i => Number(i?.currentStock ?? 0) > 0);

      // clés visibles et ordre d'affichage
      const visibleKeys = new Set(visibleInventory.map(getKey).filter(Boolean));
      const orderIndex = new Map(visibleInventory.map((it, idx) => [getKey(it), idx]));

      // filtrer: présent + stock>0 + nom non vide
      const filtered = raw
        .filter(r => {
          const key = getKey(r);
          const name = safeProductName(r);
          return key && visibleKeys.has(key) && Number(r?.currentStock ?? 0) > 0 && name.trim() !== '';
        })
        // trier dans le même ordre que l'inventaire visible
        .sort((a, b) => (orderIndex.get(getKey(a)) ?? 9999) - (orderIndex.get(getKey(b)) ?? 9999));

      setSimulRows(filtered);

      // Update pagination for simulation results
      const totalPages = Math.max(1, Math.ceil(filtered.length / simulationPageSize));
      setSimulationPages(totalPages);
      setSimulationPage(1);

      // Mark simulation as completed
      setSimulationHasRun(true);
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Erreur de simulation. ❌', type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [axiosAuth, days, inventory, simulationPageSize]);

  // --- USEEFFECTS ---
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Auto-run simulation when inventory is loaded and has data (only once)
  useEffect(() => {
    if (inventory.length > 0 && !loading && !simulationHasRun) {
      // Small delay to ensure inventory is fully rendered
      const timer = setTimeout(() => {
        simulate();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [inventory.length, loading, simulate, simulationHasRun]);

  // Update inventory pagination when inventory data changes
  useEffect(() => {
    const totalPages = Math.max(1, Math.ceil(inventory.length / inventoryPageSize));
    setInventoryPages(totalPages);
    setInventoryPage(1); // Reset to first page when inventory changes
  }, [inventory.length, inventoryPageSize]);

  // --- ACTIONS ---
  const handleInputChange = (inventoryId, field, value) => {
    setInventory(prev =>
      prev.map(item => {
        if (item._id === inventoryId) {
          if (field === 'autoOrder') return { ...item, autoOrder: { enabled: value } };
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  const saveRowChanges = async (inventoryId) => {
    const itemToSave = inventory.find(item => item._id === inventoryId);
    if (!itemToSave) return;

    setLoading(true);
    try {
      const body = {
        dailyUsage: itemToSave.dailyUsage,
        reorderPoint: itemToSave.reorderPoint,
        reorderQty: itemToSave.reorderQty,
        autoOrder: { enabled: itemToSave.autoOrder?.enabled ?? false },
      };
      const { data } = await axiosAuth.put(`/api/client-inventory/${inventoryId}`, body);
      setInventory(prev => prev.map(item => (item._id === data._id ? data : item)));
      setNotification({ message: 'Enregistrement réussi ! ✅', type: 'success' });
    } catch (e) {
      console.error('Failed to save changes for item', inventoryId, e);
      setNotification({ message: 'La sauvegarde a échoué. ❌', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const adjustStock = async (inventoryId, delta) => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.patch(`/api/client-inventory/${inventoryId}/adjust`, { delta });
      setInventory(prev => prev.map(x => (x._id === data._id ? data : x)));
    } catch (e) {
      console.error(e);
      setNotification({ message: 'Erreur lors de l\'ajustement du stock. ❌', type: 'error' });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="orders-container">
      <ClientNavbar />
      <NotificationButton />
      <NotificationPanel />
      <Notification
        message={notification.message}
        type={notification.type}
        onClose={() => setNotification({ message: '', type: '' })}
      />
      <div className="orders-header">
        <h1>Gestion de l'Inventaire</h1>
        <p>Les produits apparaissent ici automatiquement après la livraison d'une commande.</p>
      </div>
      <div className="main-content">
        <div className="search-container">
          <h2 className="card-header">Mon Inventaire</h2>
        </div>

        <div className="orders-table-container">
          <table className="orders-table">
            <thead>
              <tr>
                <th>Produit</th>
                <th>Stock Actuel</th>
                <th>Conso/Jour</th>
                <th>Seuil Mini</th>
                <th>Qté Auto</th>
                <th>Auto</th>
                <th>Ajustement</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {paginatedInventory.filter(item => Number(item?.currentStock ?? 0) > 0).length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    Aucun produit avec stock &gt; 0.
                  </td>
                </tr>
              ) : (
                paginatedInventory
                  .filter(item => Number(item?.currentStock ?? 0) > 0)
                  .map(item => (
                    <tr key={item._id}>
                      <td>
                        <strong>{safeProductName(item) || '—'}</strong>
                        <br />
                        <small className="text-muted">{item.product?.reference || ''}</small>
                      </td>
                      <td>{item.currentStock ?? 0}</td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.dailyUsage ?? 0}
                          onChange={e => handleInputChange(item._id, 'dailyUsage', Number(e.target.value))}
                          className="field-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.reorderPoint ?? 0}
                          onChange={e => handleInputChange(item._id, 'reorderPoint', Number(e.target.value))}
                          className="field-input"
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          min="0"
                          value={item.reorderQty ?? 0}
                          onChange={e => handleInputChange(item._id, 'reorderQty', Number(e.target.value))}
                          className="field-input"
                        />
                      </td>
                      <td>
                        <input
                          type="checkbox"
                          checked={item.autoOrder?.enabled ?? false}
                          onChange={e => handleInputChange(item._id, 'autoOrder', e.target.checked)}
                        />
                      </td>
                      <td>
                        <div className="action-group" style={{ display: 'flex', gap: 10 }}>
                          <button
                            className="action-button stock"
                            onClick={() => adjustStock(item._id, 1)}
                            disabled={loading}
                          >+</button>
                          <button
                            className="action-button delete"
                            onClick={() => adjustStock(item._id, -1)}
                            disabled={loading}
                          >-</button>
                        </div>
                      </td>
                      <td>
                        <button
                          className="action-button edit"
                          onClick={() => saveRowChanges(item._id)}
                          disabled={loading}
                        >
                          Enregistrer
                        </button>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Inventory Pagination */}
        {inventory.filter(item => Number(item?.currentStock ?? 0) > 0).length > inventoryPageSize && (
          <div className="inventory-pagination">
            <div className="pagination-info">
              <span>
                Affichage de {((inventoryPage - 1) * inventoryPageSize) + 1} à {Math.min(inventoryPage * inventoryPageSize, inventory.filter(item => Number(item?.currentStock ?? 0) > 0).length)} sur {inventory.filter(item => Number(item?.currentStock ?? 0) > 0).length} produits
              </span>
            </div>

            <div className="pagination-controls">
              <div className="page-navigation">
                <button
                  onClick={() => setInventoryPage(1)}
                  disabled={inventoryPage === 1}
                  className="pagination-btn first"
                >
                  ««
                </button>
                <button
                  onClick={() => setInventoryPage(inventoryPage - 1)}
                  disabled={inventoryPage === 1}
                  className="pagination-btn prev"
                >
                  ‹
                </button>

                <div className="page-numbers">
                  {Array.from({ length: Math.min(5, inventoryPages) }, (_, i) => {
                    let pageNum;
                    if (inventoryPages <= 5) {
                      pageNum = i + 1;
                    } else if (inventoryPage <= 3) {
                      pageNum = i + 1;
                    } else if (inventoryPage >= inventoryPages - 2) {
                      pageNum = inventoryPages - 4 + i;
                    } else {
                      pageNum = inventoryPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => setInventoryPage(pageNum)}
                        className={`pagination-btn page ${inventoryPage === pageNum ? 'active' : ''}`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => setInventoryPage(inventoryPage + 1)}
                  disabled={inventoryPage === inventoryPages}
                  className="pagination-btn next"
                >
                  ›
                </button>
                <button
                  onClick={() => setInventoryPage(inventoryPages)}
                  disabled={inventoryPage === inventoryPages}
                  className="pagination-btn last"
                >
                  »»
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Simulation Controls */}
        <div className="ai-simulation-section">
          <h3 className="card-header">🤖 Simulation IA</h3>
          <div className="controls-group">
            <div className="input-group">
              <label htmlFor="simulation-days">Simulation pour :</label>
              <input
                id="simulation-days"
                type="number"
                min="1"
                max="365"
                value={days}
                onChange={e => {
                  setDays(Number(e.target.value));
                  setSimulationHasRun(false); // Reset flag when days change
                }}
                className="field-input"
                aria-label="Nombre de jours pour la simulation"
                disabled={loading}
              />
              <span className="input-suffix">jours</span>
            </div>
            <button
              className="action-button info ai-simulate-btn"
              onClick={() => {
                setSimulationHasRun(false); // Reset flag for manual simulation
                simulate();
              }}
              disabled={loading}
            >
              {loading ? '🔄 Simulation...' : `🤖 Simuler ${days} jours`}
            </button>
            <p className="auto-simulation-note">
              ✨ Simulation automatique au chargement de la page
            </p>
          </div>
          <p className="simulation-description">
            L'IA analysera vos produits en stock et prédira les besoins de réapprovisionnement.
          </p>
          {loading && (
            <div className="simulation-loading">
              <div className="loading-spinner"></div>
              <span>Analyse en cours...</span>
            </div>
          )}
        </div>

        {/* Simulation Results - Below */}
        <div className="simulation-results-container">
          {loading ? (
            <div className="simulation-results-skeleton">
              <div className="skeleton-header"></div>
              <div className="skeleton-cards">
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
                <div className="skeleton-card"></div>
              </div>
            </div>
          ) : simulRows.length > 0 ? (
            <div className="simulation-results-below">
              <h3 className="card-header">📊 Résultats IA ({days} jours)</h3>
              <div className="results-grid">
                {paginatedSimulRows.map(r => {
                  const reorderDate = computeReorderDate(r);
                  const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
                  const withinWindow =
                    reorderDate &&
                    (reorderDate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24) <= days;

                  // Calculate risk level for AI recommendation
                  const currentStock = Number(r.currentStock || 0);
                  const projectedStock = Number(r.projectedStock || 0);
                  const reorderPoint = Number(r.reorderPoint || 0);
                  const dailyUsage = Number(r.dailyUsage || 0);

                  // Check if daily consumption exceeds available stock for simulation period
                  const totalConsumption = dailyUsage * days;
                  const stockShortage = totalConsumption - currentStock;
                  const hasInsufficientStock = stockShortage > 0;

                  // Calculate depletion date
                  const calculateDepletionDate = () => {
                    if (dailyUsage <= 0 || currentStock <= 0) return null;
                    const daysUntilDepletion = Math.ceil(currentStock / dailyUsage);
                    const depletionDate = new Date();
                    depletionDate.setDate(depletionDate.getDate() + daysUntilDepletion);
                    return depletionDate;
                  };

                  const depletionDate = calculateDepletionDate();
                  const formatDepletionDate = (date) => {
                    if (!date) return '';
                    return date.toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    });
                  };

                  let riskLevel = 'stable';
                  let riskColor = '#10b981';
                  let aiRecommendation = 'Stock stable';

                  // Check for insufficient stock first (highest priority)
                  if (hasInsufficientStock) {
                    riskLevel = 'critical';
                    riskColor = '#dc2626';

                    // Calculate which day the stock will run out
                    const daysUntilStockout = Math.ceil(currentStock / dailyUsage);
                    aiRecommendation = `🚨 STOCK INSUFFISANT - Manque ${stockShortage} unités au jour numéro ${daysUntilStockout}`;
                  } else if (projectedStock <= 0) {
                    riskLevel = 'critical';
                    riskColor = '#ef4444';
                    if (depletionDate) {
                      aiRecommendation = `🚨 RUPTURE PRÉVUE le ${formatDepletionDate(depletionDate)}`;
                    } else {
                      aiRecommendation = '🚨 RUPTURE PRÉVUE';
                    }
                  } else if (projectedStock <= reorderPoint) {
                    riskLevel = 'high';
                    riskColor = '#f59e0b';
                    aiRecommendation = '⚠️ STOCK FAIBLE';
                  } else if (projectedStock <= reorderPoint * 1.5) {
                    riskLevel = 'medium';
                    riskColor = '#3b82f6';
                    aiRecommendation = '📦 SURVEILLANCE';
                  } else {
                    // Stock is well above reorder point
                    riskLevel = 'stable';
                    riskColor = '#10b981';
                    aiRecommendation = 'Stock stable';
                  }

                  return (
                    <div key={getKey(r) ?? r._id} className={`result-card ${hasInsufficientStock ? 'insufficient-stock' : ''}`}>
                      <div className="result-product">
                        <h5>{safeProductName(r)}</h5>
                        <div className="result-stats">
                          <span className="stock-current">
                            {r.currentStock} → {hasInsufficientStock ?
                              `${Math.max(0, r.currentStock - totalConsumption)} (manque ${stockShortage})` :
                              r.projectedStock}
                          </span>
                          <span className="stock-threshold">Seuil: {r.reorderPoint}</span>
                        </div>
                      </div>
                      <div className="result-risk">
                        <span
                          className={`risk-badge ${hasInsufficientStock ? 'insufficient-badge' : ''}`}
                          style={{
                            backgroundColor: riskColor,
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '6px',
                            fontSize: '0.75rem',
                            fontWeight: '600'
                          }}
                        >
                          {riskLevel === 'critical' ?
                            (hasInsufficientStock ? '🚨 Insuffisant' : '🚨 Critique') :
                            riskLevel === 'high' ? '⚠️ Élevé' :
                              riskLevel === 'medium' ? '📦 Moyen' :
                                riskLevel === 'stable' ? '✅ Stable' : '✅ Faible'}
                        </span>
                        <p className="recommendation-text">{aiRecommendation}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination for simulation results */}
              {simulRows.length > simulationPageSize && (
                <div className="simulation-pagination">
                  <div className="pagination-info">
                    <span>
                      Affichage de {((simulationPage - 1) * simulationPageSize) + 1} à {Math.min(simulationPage * simulationPageSize, simulRows.length)} sur {simulRows.length} produits
                    </span>
                  </div>

                  <div className="pagination-controls">
                    <div className="page-navigation">
                      <button
                        onClick={() => setSimulationPage(1)}
                        disabled={simulationPage === 1}
                        className="pagination-btn first"
                      >
                        ««
                      </button>
                      <button
                        onClick={() => setSimulationPage(simulationPage - 1)}
                        disabled={simulationPage === 1}
                        className="pagination-btn prev"
                      >
                        ‹
                      </button>

                      <div className="page-numbers">
                        {Array.from({ length: Math.min(5, simulationPages) }, (_, i) => {
                          let pageNum;
                          if (simulationPages <= 5) {
                            pageNum = i + 1;
                          } else if (simulationPage <= 3) {
                            pageNum = i + 1;
                          } else if (simulationPage >= simulationPages - 2) {
                            pageNum = simulationPages - 4 + i;
                          } else {
                            pageNum = simulationPage - 2 + i;
                          }

                          return (
                            <button
                              key={pageNum}
                              onClick={() => setSimulationPage(pageNum)}
                              className={`pagination-btn page ${simulationPage === pageNum ? 'active' : ''}`}
                            >
                              {pageNum}
                            </button>
                          );
                        })}
                      </div>

                      <button
                        onClick={() => setSimulationPage(simulationPage + 1)}
                        disabled={simulationPage === simulationPages}
                        className="pagination-btn next"
                      >
                        ›
                      </button>
                      <button
                        onClick={() => setSimulationPage(simulationPages)}
                        disabled={simulationPage === simulationPages}
                        className="pagination-btn last"
                      >
                        »»
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="simulation-results-placeholder">
              <p>Les résultats de simulation apparaîtront ici après l'analyse IA.</p>
            </div>
          )}
        </div>

      </div>

      {loading && <div className="loading-indicator">Chargement...</div>}
    </div>
  );
}
