// src/components/ClientInventory.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import axios from 'axios';
import '../style/ClientInventory.css';
import ClientNavbar from './dashboard/ClientNavbar';

export default function ClientInventory() {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [simulRows, setSimulRows] = useState([]);
  const [days, setDays] = useState(7);
  const token = useMemo(() => localStorage.getItem('token'), []);

  const axiosAuth = useMemo(() => {
    return axios.create({
      baseURL: 'http://localhost:5000',
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
      alert('Erreur lors du chargement de l\'inventaire.');
    } finally {
      setLoading(false);
    }
  }, [axiosAuth]);

  useEffect(() => { fetchInventory(); }, [fetchInventory]);

  // --- HELPERS ---
  const humanDate = (d) =>
    d instanceof Date && !isNaN(d) ? d.toLocaleDateString('fr-FR') : '—';

  const safeProductName = (obj) =>
    obj?.product?.name ?? obj?.productName ?? obj?.name ?? '';

  const getKey = (obj) => obj?.product?._id ?? obj?._id ?? null;

  const computeReorderDate = (row) => {
    // chercher la ligne d’inventaire correspondante
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
      alert('Enregistrement réussi !');
    } catch (e) {
      console.error('Failed to save changes for item', inventoryId, e);
      alert('La sauvegarde a échoué.');
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
      alert('Erreur lors de l\'ajustement du stock.');
    } finally {
      setLoading(false);
    }
  };

  // --- SIMULATION (filtrée sur les produits affichés) ---
  const simulate = async () => {
    try {
      setLoading(true);
      const { data } = await axiosAuth.get('/api/client-inventory/simulate-consumption', { params: { days } });

      const raw = Array.isArray(data) ? data : [];

      // produits visibles dans le tableau du haut (stock > 0)
      const visibleInventory = inventory.filter(i => Number(i?.currentStock ?? 0) > 0);

      // clés visibles et ordre d’affichage
      const visibleKeys = new Set(visibleInventory.map(getKey).filter(Boolean));
      const orderIndex = new Map(visibleInventory.map((it, idx) => [getKey(it), idx]));

      // filtrer: présent + stock>0 + nom non vide
      const filtered = raw
        .filter(r => {
          const key = getKey(r);
          const name = safeProductName(r);
          return key && visibleKeys.has(key) && Number(r?.currentStock ?? 0) > 0 && name.trim() !== '';
        })
        // trier dans le même ordre que l’inventaire visible
        .sort((a, b) => (orderIndex.get(getKey(a)) ?? 9999) - (orderIndex.get(getKey(b)) ?? 9999));

      setSimulRows(filtered);
    } catch (e) {
      console.error(e);
      alert('Erreur de simulation.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="inventory-container">
      <ClientNavbar />
      <header className="inventory-header">
        <h1 className="title">Gestion de l'Inventaire</h1>
        <p>Les produits apparaissent ici automatiquement après la livraison d'une commande.</p>
        {/* Bouton de test enlevé */}
      </header>

      <div className="card">
        <div className="simulation-controls">
          <h2 className="card-header">Mon Inventaire</h2>
          <div className="controls-group">
            <input
              type="number"
              min="1"
              value={days}
              onChange={e => setDays(Number(e.target.value))}
              className="field-input"
              aria-label="Jours pour la simulation"
            />
            <button
              className="action-button info"
              onClick={simulate}
              disabled={loading}
            >
              Simuler {days} jours
            </button>
            {/* Bouton "Vérifier Commande Auto" supprimé */}
          </div>
        </div>

        <div className="table-container">
          <table className="table">
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
              {inventory.filter(item => Number(item?.currentStock ?? 0) > 0).length === 0 ? (
                <tr>
                  <td colSpan="8" className="empty-state">
                    Aucun produit avec stock &gt; 0.
                  </td>
                </tr>
              ) : (
                inventory
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

        {!!simulRows.length && (
          <div className="simulation-results">
            <h3 className="card-header">Résultats de la Simulation ({days} jours)</h3>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Produit</th>
                    <th>Stock Actuel</th>
                    <th>Stock Prévu</th>
                    <th>Seuil Mini</th>
                    <th>Alerte</th>
                  </tr>
                </thead>
                <tbody>
                  {simulRows.map(r => {
                    const reorderDate = computeReorderDate(r);
                    const startOfToday = new Date(); startOfToday.setHours(0,0,0,0);
                    const withinWindow =
                      reorderDate &&
                      (reorderDate.getTime() - startOfToday.getTime()) / (1000*60*60*24) <= days;

                    const alertText =
                      reorderDate && withinWindow
                        ? `Commande auto le ${humanDate(reorderDate)}`
                        : 'OK';

                    return (
                      <tr key={getKey(r) ?? r._id}>
                        <td>{safeProductName(r)}</td>
                        <td>{r.currentStock}</td>
                        <td>{r.projectedStock}</td>
                        <td>{r.reorderPoint}</td>
                        <td className={reorderDate && withinWindow ? 'alert-danger' : 'alert-success'}>
                          {alertText}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {loading && <div className="loading-indicator">Chargement...</div>}
    </div>
  );
}
