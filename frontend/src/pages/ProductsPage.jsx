import React, { useState } from 'react';
import ProductList from '../components/ProductList';
import ProductEditModal from '../components/ProductEditModal';
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
        <ProductEditModal
          product={editingProduct}
          onClose={closeForm}
          onSaved={onSaved}
        />
      )}
    </div>
  );
}
