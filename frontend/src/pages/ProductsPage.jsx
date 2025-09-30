import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import ProductForm from '../components/ProductForm';
import SupplierNavbar from '../components/dashboard/SupplierNavbar';
import NotificationButton from '../components/NotificationButton';
import NotificationPanel from '../components/NotificationPanel';
import { FaPlus } from 'react-icons/fa';
import '../style/ProductsPage.css'; // Importer le nouveau CSS

export default function ProductsPage() {
  const [editingProduct, setEditingProduct] = useState(null);
  const [reload, setReload] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const openAddForm = () => {
    setEditingProduct(null);
    setShowForm(true);
  };

  const openEditForm = (product) => {
    setEditingProduct(product);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  const onSaved = () => {
    setReload(r => r + 1);
    closeForm();
  };

  return (
    <div className="orders-container">
      <SupplierNavbar />
      <NotificationButton />
      <NotificationPanel />
      <div className="orders-header">
        <h1>Catalogue & Stock — Fournisseur</h1>
        <p>Gérez votre inventaire et vos produits</p>
      </div>
      <div className="main-content">
        <ProductList onEdit={openEditForm} reload={reload} onAdd={openAddForm} />
      </div>

      {showForm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
          onClick={closeForm} // fermer si clic hors modal
        >
          <div
            onClick={e => e.stopPropagation()} // empêcher la fermeture au clic dans la modal
            style={{
              background: '#fff',
              borderRadius: 16,
              padding: 0,
              width: '90%',
              maxWidth: '1000px',
              height: '85vh',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
              position: 'relative',
            }}
          >
            <button
              onClick={closeForm}
              style={{
                position: 'absolute',
                top: 15,
                right: 15,
                border: 'none',
                background: 'rgba(0,0,0,0.1)',
                borderRadius: '50%',
                width: '40px',
                height: '40px',
                fontSize: '20px',
                cursor: 'pointer',
                zIndex: 1001,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#666',
              }}
              aria-label="Fermer"
            >
              ×
            </button>

            <ProductForm product={editingProduct} onSaved={onSaved} />
          </div>
        </div>
      )}
    </div>
  );
}
