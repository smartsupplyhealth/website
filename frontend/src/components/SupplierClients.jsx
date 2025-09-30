import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import "../style/Client.css";
import SupplierNavbar from "./dashboard/SupplierNavbar";
import NotificationButton from "./NotificationButton";
import NotificationPanel from "./NotificationPanel";
import { API_URL } from '../config/environment';

const formatPrice = (price) =>
  new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" })
    .format(Number(price || 0));

export default function SupplierClients() {
  const { token } = useAuth();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderStats, setOrderStats] = useState({
    totalOrders: 0,
    cancelledOrders: 0,
    netOrders: 0,
    totalRevenue: 0,
    cancelledRevenue: 0,
    netRevenue: 0
  });
  const [q, setQ] = useState("");
  const [sortKey, setSortKey] = useState("totalSpent");
  const [sortDir, setSortDir] = useState("desc"); // "asc" | "desc"

  const toggleSort = (key) => {
    setSortKey((prevKey) => {
      if (prevKey !== key) {
        setSortDir("asc");
        return key;
      } else {
        setSortDir((d) => (d === "asc" ? "desc" : "asc"));
        return prevKey;
      }
    });
  };

  const fetchClients = useCallback(async () => {
    try {
      if (!token) {
        setError("Session expirée ou non connectée.");
        setClients([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError("");

      const res = await fetch(`${API_URL}/api/supplier/orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      if (!json.success) {
        setError(json.message || "Erreur lors du chargement des clients.");
        setClients([]);
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

      // Agréger les commandes par client (net revenue from non-cancelled orders)
      const netMap = new Map();
      (json.data || []).forEach((order) => {
        const c = order?.client;
        if (!c || !c._id) return;
        if (!netMap.has(c._id)) {
          netMap.set(c._id, {
            _id: c._id,
            name: c.name || "—",
            email: c.email || "—",
            phone: c.phone || "",
            clinicName: c.clinicName || "—", // affiché comme "Projet"
            clinicType: c.clinicType || "",
            orderCount: 0,        // Net orders (non-cancelled)
            cancelledOrderCount: 0, // Cancelled orders only
            totalOrderCount: 0,    // Total orders (including cancelled)
            netSpent: 0,
            cancelledSpent: 0,     // Revenue from cancelled orders
            totalSpent: 0,         // Will be calculated from all orders
          });
        }
        const row = netMap.get(c._id);
        row.orderCount += 1;
        row.netSpent += Number(order?.totalAmount || 0);
      });

      // Calculate total revenue and order count (including cancelled) for each client
      const allOrders = json.allOrders || [];
      allOrders.forEach((order) => {
        const c = order?.client;
        if (!c || !c._id) return;
        if (netMap.has(c._id)) {
          const row = netMap.get(c._id);
          row.totalSpent += Number(order?.totalAmount || 0);
          row.totalOrderCount += 1;

          // Count cancelled orders separately
          if (order.status === 'cancelled') {
            row.cancelledOrderCount += 1;
            row.cancelledSpent += Number(order?.totalAmount || 0);
          }
        }
      });

      setClients(Array.from(netMap.values()));
    } catch (e) {
      console.error(e);
      setError("Erreur de connexion au serveur. Veuillez réessayer.");
      setClients([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Recherche + tri
  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    let rows = !query
      ? clients
      : clients.filter((c) =>
        [c.name, c.email, c.clinicName, c.clinicType]
          .join(" ")
          .toLowerCase()
          .includes(query)
      );

    rows = [...rows].sort((a, b) => {
      const dir = sortDir === "asc" ? 1 : -1;
      if (sortKey === "name") {
        return a.name.localeCompare(b.name) * dir;
      }
      if (sortKey === "orderCount") {
        return (a.orderCount - b.orderCount) * dir;
      }
      return (a.totalSpent - b.totalSpent) * dir; // totalSpent
    });

    return rows;
  }, [clients, q, sortKey, sortDir]);

  // KPIs
  const totals = useMemo(() => {
    const totalClients = clients.length;
    return {
      totalClients,
      totalOrders: orderStats.totalOrders,      // Total including cancelled
      cancelledOrders: orderStats.cancelledOrders, // Only cancelled
      netOrders: orderStats.netOrders,          // Net excluding cancelled
      totalRevenue: orderStats.totalRevenue,    // Revenue including cancelled
      cancelledRevenue: orderStats.cancelledRevenue, // Revenue from cancelled
      netRevenue: orderStats.netRevenue         // Revenue excluding cancelled
    };
  }, [clients, orderStats]);

  return (
    <div className="orders-container">
      <SupplierNavbar />
      <NotificationButton />
      <NotificationPanel />
      <div className="orders-header">
        <h1>Mes Clients</h1>
        <p>Aperçu consolidé de vos clients et de leurs dépenses.</p>
      </div>
      <div className="main-content">
        <div className="search-container">
          <div className="search-bar">
            <div className="search-icon">🔍</div>
            <input
              type="text"
              className="search-input"
              placeholder="Rechercher (nom, email, projet)…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label="Rechercher des clients"
            />
            {q && (
              <button className="btn ghost" onClick={() => setQ("")} aria-label="Effacer la recherche">
                ✕
              </button>
            )}
          </div>
          <button className="btn primary" onClick={fetchClients} aria-label="Rafraîchir">
            Rafraîchir
          </button>
        </div>

        {/* KPIs */}
        <section className="clients-kpis">
          <div className="kpi-card">
            <div className="kpi-label">Clients</div>
            <div className="kpi-value">{totals.totalClients}</div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Commandes</div>
            <div className="kpi-value" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                {totals.totalOrders} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>total</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                {totals.cancelledOrders} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666' }}>cancelled</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                {totals.netOrders} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666' }}>net</span>
              </div>
            </div>
          </div>
          <div className="kpi-card">
            <div className="kpi-label">Total dépensé</div>
            <div className="kpi-value" style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <div style={{ fontSize: '16px', fontWeight: 'bold', color: '#3b82f6' }}>
                {formatPrice(totals.totalRevenue)} <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#666' }}>total</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#ef4444' }}>
                {formatPrice(totals.cancelledRevenue)} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666' }}>cancelled</span>
              </div>
              <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#10b981' }}>
                {formatPrice(totals.netRevenue)} <span style={{ fontSize: '11px', fontWeight: 'normal', color: '#666' }}>net</span>
              </div>
            </div>
          </div>
        </section>

        {/* Erreurs / Loading */}
        {error && (
          <div className="notice error">
            <span>{error}</span>
            <button className="btn ghost" onClick={fetchClients}>Réessayer</button>
          </div>
        )}

        {loading ? (
          <div className="orders-table-container">
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
            <div className="skeleton-row"></div>
          </div>
        ) : (
          <>
            {(!error && filtered.length === 0) ? (
              <div className="notice empty">
                <div className="emoji">👥</div>
                <h3>Aucun résultat</h3>
                <p>Essayez un autre terme de recherche.</p>
              </div>
            ) : (
              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th onClick={() => toggleSort("name")} className="emph">
                        Nom {sortKey === "name" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="emph">Projet</th>
                      <th className="emph">Email</th>
                      <th className="num" onClick={() => toggleSort("orderCount")}>
                        Commandes {sortKey === "orderCount" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </th>
                      <th className="num" onClick={() => toggleSort("totalSpent")}>
                        Total Dépensé {sortKey === "totalSpent" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((c) => (
                      <tr key={c._id}>
                        <td data-label="Nom" className="emph">
                          <div className="client-cell">
                            <div className="avatar">{(c.name || "—").slice(0, 1).toUpperCase()}</div>
                            <div className="client-meta">
                              <div className="client-name">{c.name || "—"}</div>
                              <div className="client-sub">
                                {c.phone ? <span className="pill">{c.phone}</span> : null}
                                {c.clinicType ? <span className="pill soft">{c.clinicType}</span> : null}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Projet" className="emph">{c.clinicName || "—"}</td>
                        <td data-label="Email" className="emph">{c.email || "—"}</td>
                        <td data-label="Commandes" className="num">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>
                              {c.totalOrderCount || c.orderCount} <span style={{ fontSize: '9px', fontWeight: 'normal', color: '#666' }}>total</span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>
                              {c.cancelledOrderCount || 0} <span style={{ fontSize: '8px', fontWeight: 'normal', color: '#666' }}>cancelled</span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                              {c.orderCount} <span style={{ fontSize: '8px', fontWeight: 'normal', color: '#666' }}>net</span>
                            </div>
                          </div>
                        </td>
                        <td data-label="Total Dépensé" className="num">
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'flex-end' }}>
                            <div style={{ fontSize: '13px', fontWeight: 'bold', color: '#3b82f6' }}>
                              {formatPrice(c.totalSpent || 0)} <span style={{ fontSize: '9px', fontWeight: 'normal', color: '#666' }}>total</span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#ef4444' }}>
                              {formatPrice(c.cancelledSpent || 0)} <span style={{ fontSize: '8px', fontWeight: 'normal', color: '#666' }}>cancelled</span>
                            </div>
                            <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#10b981' }}>
                              {formatPrice(c.netSpent || 0)} <span style={{ fontSize: '8px', fontWeight: 'normal', color: '#666' }}>net</span>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
