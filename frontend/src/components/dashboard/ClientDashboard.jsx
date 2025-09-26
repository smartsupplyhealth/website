// src/components/dashboard/ClientDashboard.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import ClientNavbar from "./ClientNavbar";
import api from "../../services/api";
import { useNotification } from "../../contexts/NotificationContext";
import "./Dashboard.css";

const money = new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR" });

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { showNotification } = useNotification();

  // ===== KPI =====
  const [stats, setStats] = useState({
    pendingOrders: 0,
    processingOrders: 0,
    cancelledOrders: 0,
    deliveredOrders: 0,
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== Inventaire (Auto-commandes) =====
  const [inventory, setInventory] = useState([]);
  const [invLoading, setInvLoading] = useState(true);

  
  // ===== Auto Order Status =====
  const [autoOrderStatus, setAutoOrderStatus] = useState({
    autoOrdersToday: 0,
    manualOrdersToday: 0,
    canPlaceAutoOrder: true,
    statusMessage: ''
  });

  const clinicLabel = useMemo(() => user?.clinicName || "Votre établissement", [user]);

  /* ----------------------- Helpers ----------------------- */
  const humanDate = (d) => (d ? d.toLocaleDateString("fr-FR") : "—");
  const humanDateLong = (d) =>
    d
      ? d.toLocaleDateString("fr-FR", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" })
      : "—";

  const productName = (row) => row?.product?.name || row?.productName || row?.name || "—";

  // Function to check auto order limits and show notification
  const checkAutoOrderLimits = (ordersList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayOrders = ordersList.filter(order => {
      const orderDate = new Date(order.createdAt);
      return orderDate >= today && orderDate < tomorrow;
    });

    let autoOrders = 0;
    let manualOrders = 0;

    todayOrders.forEach(order => {
      // Auto orders: CMD{timestamp} (like CMD1758467520055)
      if (/^CMD\d{13}$/.test(order.orderNumber)) {
        autoOrders++;
      }
      // Manual orders: CMD-{6-digit-number} (like CMD-000010)
      else if (/^CMD-\d{6}$/.test(order.orderNumber)) {
        manualOrders++;
      }
    });

    // Determine status
    let canPlaceAutoOrder = true;
    let statusMessage = '';

    if (autoOrders >= 2) {
      canPlaceAutoOrder = false;
      if (manualOrders === 0) {
        statusMessage = 'Limite atteinte - Commande manuelle requise';
        showNotification(
          "🔒 Limite de sécurité atteinte: Vous avez effectué 2 commandes automatiques. Veuillez effectuer une commande manuelle pour débloquer d'autres commandes automatiques.",
          "warning"
        );
      } else {
        statusMessage = 'Limite atteinte - Attendez demain';
      }
    } else if (autoOrders === 1 && manualOrders === 0) {
      statusMessage = 'Commande manuelle requise avant la prochaine auto-commande';
      showNotification(
        "⚠️ Rappel: Vous avez effectué 1 commande automatique. Une commande manuelle sera requise avant la prochaine commande automatique.",
        "info"
      );
    } else if (autoOrders === 0) {
      statusMessage = 'Auto-commandes disponibles (max 2/jour)';
    } else {
      statusMessage = `${2 - autoOrders} auto-commande(s) restante(s)`;
    }

    // Update status
    setAutoOrderStatus({
      autoOrdersToday: autoOrders,
      manualOrdersToday: manualOrders,
      canPlaceAutoOrder,
      statusMessage
    });
  };

  const daysToReorder = (row) => {
    const current = Number(row?.currentStock ?? 0);
    const daily = Number(row?.dailyUsage ?? 0);
    const seuil = Number(row?.reorderPoint ?? 0);
    if (daily <= 0) return Infinity; // pas de conso => pas de déclenchement
    return Math.ceil((current - seuil) / daily); // <= 0 => déjà sous le seuil
  };
  const expectedDate = (row) => {
    const dleft = daysToReorder(row);
    if (!Number.isFinite(dleft)) return null;
    const base = new Date();
    if (dleft <= 0) return base; // aujourd’hui
    const out = new Date(base);
    out.setDate(out.getDate() + dleft);
    return out;
  };

  /* ----------------------- Fetch commandes ----------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const { data } = await api.get("/orders/my-orders");
        const list = data?.data || [];

        const pendingOrders = list.filter((o) => ["pending", "confirmed", "shipped"].includes(o.status)).length;
        const processingOrders = list.filter((o) => o.status === "processing").length;
        const cancelledOrders = list.filter((o) => o.status === "cancelled").length;
        const deliveredOrders = list.filter((o) => o.status === "delivered").length;

        if (mounted) {
          setStats({ pendingOrders, processingOrders, cancelledOrders, deliveredOrders });
          setOrders([...list].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
          
          // Check auto order limits and show notification
          checkAutoOrderLimits(list);
        }

      } catch (e) {
        console.error("Erreur dashboard:", e);
      } finally {
        mounted && setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------- Fetch inventaire ----------------------- */
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setInvLoading(true);
        const { data } = await api.get("/client-inventory");
        mounted && setInventory(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("Erreur inventaire:", e);
      } finally {
        mounted && setInvLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  /* ----------------------- Auto-commandes dérivées ----------------------- */
  const autoOrders = useMemo(() => {
    return inventory
      .filter((x) => x?.autoOrder?.enabled)
      .filter((x) => Number(x?.currentStock ?? 0) > 0)
      .filter((x) => Number(x?.dailyUsage ?? 0) > 0)
      .map((x) => ({
        ...x,
        _days: daysToReorder(x),
        _expectedDate: expectedDate(x),
      }))
      .sort((a, b) => (a._days ?? 9999) - (b._days ?? 9999));
  }, [inventory]);

  const toggleAutoOrder = async (row, checked) => {
    try {
      await api.put(`/client-inventory/${row._id}`, { autoOrder: { enabled: checked } });
    } catch (e) {
      console.error("toggleAutoOrder:", e);
      alert("Impossible de modifier l’auto-commande.");
    } finally {
      // maj optimiste
      setInventory((prev) => prev.map((i) => (i._id === row._id ? { ...i, autoOrder: { enabled: checked } } : i)));
    }
  };




  /* ----------------------- Styles inline ----------------------- */
  const s = {
    autoRow: {
      display: "grid",
      gridTemplateColumns: "1fr auto 210px 100px", // nom | métriques | date | toggle
      alignItems: "center",
      gap: 16,
      padding: "12px 0",
    },
    autoName: { fontWeight: 700 },
    autoMetrics: { display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap", color: "#111" },
    autoChip: {
      fontSize: 12,
      padding: "4px 8px",
      borderRadius: 999,
      background: "#fff3e0",
      border: "1px solid #ffd4a3",
    },
    autoDate: { textAlign: "right", fontWeight: 700 },
    autoToggle: { display: "flex", alignItems: "center", gap: 8, justifyContent: "flex-end" },
    legend: {
      background: "#f8fafc",
      border: "1px solid #e8eef5",
      borderRadius: 12,
      padding: "10px 12px",
      marginBottom: 8,
      fontSize: 13,
    },
    cardRow: {
      display: "grid",
      gridTemplateColumns: "1fr 120px 120px 140px", // Produit | Dépenses | Qté | Action
      alignItems: "center",
      gap: 12,
      padding: "10px 0",
    },
    pillWarn: {
      fontSize: 11,
      padding: "2px 8px",
      borderRadius: 999,
      background: "#fff2f2",
      border: "1px solid #ffb3b3",
      color: "#c11",
      marginLeft: 8,
    },
    muted: { color: "var(--muted)", fontSize: 12 },
  };

  /* ----------------------- Rendu ----------------------- */
  return (
    <div className="dashboard-layout">
      <ClientNavbar />

      <main className="dashboard-main">
        {/* En-tête */}
        <header className="page-header">
          <div className="page-header__title">
            <h1>Tableau de bord</h1>
            <p>Bienvenue {user?.name ? `, ${user.name}` : ""} — {clinicLabel}</p>
          </div>
          <div className="page-header__actions">
            <button className="ph-btn" onClick={() => navigate("/client-dashboard/new-order")}>
              <span>+ Nouvelle commande</span>
            </button>
            <button className="ph-btn secondary" onClick={() => navigate("/client-dashboard/catalog")}>
              Catalogue
            </button>
          </div>
        </header>

        {/* KPI principaux */}
        <section className="stats-grid">
          <article className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-icon blue">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M8 11v6h8v-6M8 11H6a2 2 0 00-2 2v6a2 2 0 002 2h12a2 2 0 002-2v-6a2 2 0 00-2-2h-2"/></svg>
              </div>
              <div className="stat-card-info">
                <p className="stat-card-label">Commandes en cours</p>
                <p className="stat-card-value">{loading ? <span className="sk sk-text" /> : stats.pendingOrders}</p>
              </div>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-icon amber">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3M12 3a9 9 0 100 18 9 9 0 000-18z"/></svg>
              </div>
              <div className="stat-card-info">
                <p className="stat-card-label">En traitement</p>
                <p className="stat-card-value">{loading ? <span className="sk sk-text" /> : stats.processingOrders}</p>
              </div>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-icon red">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg>
              </div>
              <div className="stat-card-info">
                <p className="stat-card-label">Commandes annulées</p>
                <p className="stat-card-value">{loading ? <span className="sk sk-text" /> : stats.cancelledOrders}</p>
              </div>
            </div>
          </article>
          <article className="stat-card">
            <div className="stat-card-content">
              <div className="stat-card-icon green">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div className="stat-card-info">
                <p className="stat-card-label">Commandes livrées</p>
                <p className="stat-card-value">{loading ? <span className="sk sk-text" /> : stats.deliveredOrders}</p>
              </div>
            </div>
          </article>
        </section>

        {/* Auto Order Status Card */}
        <section className="auto-order-status">
          <article className="status-card">
            <div className="status-card-content">
              <div className={`status-card-icon ${autoOrderStatus.canPlaceAutoOrder ? 'green' : 'red'}`}>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div className="status-card-info">
                <h3 className="status-card-title">Statut des Auto-commandes</h3>
                <p className="status-card-message">{autoOrderStatus.statusMessage}</p>
                <div className="status-card-stats">
                  <span className="stat-item">
                    <strong>{autoOrderStatus.autoOrdersToday}</strong> auto-commande(s) aujourd'hui
                  </span>
                  <span className="stat-item">
                    <strong>{autoOrderStatus.manualOrdersToday}</strong> commande(s) manuelle(s) aujourd'hui
                  </span>
                </div>
              </div>
            </div>
          </article>
        </section>


        {/* ===== (1) AUTO-COMMANDES À VENIR ===== */}
        <section className="recent-orders">
          <div className="recent-header">
            <h2>Auto-commandes à venir</h2>
            <button className="link-btn" onClick={() => navigate("/client-dashboard/inventory")}>Gérer l’inventaire</button>
          </div>

          {/* Guide de lecture (ordre demandé) */}
          <div style={s.legend}>
            {autoOrders.length ? (
              <>
                <strong>Exemple (lecture)&nbsp;:</strong>&nbsp;
                <b>{productName(autoOrders[0])}</b> &nbsp;•&nbsp;
                Qté auto&nbsp;: <b>{Number(autoOrders[0].reorderQty ?? 0)}</b> &nbsp;•&nbsp;
                Seuil&nbsp;: <b>{Number(autoOrders[0].reorderPoint ?? 0)}</b> &nbsp;•&nbsp;
                <b>{humanDateLong(autoOrders[0]._expectedDate)}</b>
              </>
            ) : (
              <>
                <strong>Guide de lecture&nbsp;:</strong>&nbsp;
                <b>Nom du produit</b> • <b>Qté auto</b> • <b>Seuil</b> • <b>Date prévue</b>.
              </>
            )}
          </div>

          <div className="orders-list">
            {invLoading ? (
              <div className="orders-empty">Chargement…</div>
            ) : autoOrders.length === 0 ? (
              <div className="orders-empty">Aucune auto-commande planifiée.</div>
            ) : (
              autoOrders.slice(0, 8).map((r) => (
                <article className="order-item" key={r._id}>
                  <div style={s.autoRow}>
                    {/* Col 1: Produit */}
                    <div>
                      <div style={s.autoName}>{productName(r)}</div>
                    </div>

                    {/* Col 2: Détails */}
                    <div style={s.autoMetrics}>
                      <span>Qté auto : <strong>{Number(r.reorderQty ?? 0)}</strong></span>
                      <span>•</span>
                      <span>Seuil : <strong>{Number(r.reorderPoint ?? 0)}</strong></span>
                      {Number.isFinite(r._days) && (
                        <>
                          <span>•</span>
                          <span style={s.autoChip}>{r._days <= 0 ? "Sous le seuil" : `${r._days} jour(s)`}</span>
                        </>
                      )}
                    </div>

                    {/* Col 3: Date prévue */}
                    <div style={s.autoDate} title="Jour estimé du déclenchement">
                      {humanDateLong(r._expectedDate)}
                    </div>

                    {/* Col 4: Toggle Auto */}
                    <label style={s.autoToggle} title="Activer / Désactiver l’auto-commande">
                      <input type="checkbox" checked={!!r?.autoOrder?.enabled} onChange={(e) => toggleAutoOrder(r, e.target.checked)} />
                      <span>Auto</span>
                    </label>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>

      </main>
    </div>
  );
}
