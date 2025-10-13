import React from 'react';
import ProductForm from './ProductForm';
import '../style/ProductEditModal.css';

export default function ProductEditModal({ product, onClose, onSaved }) {
    if (!product) return null;

    const handleSaved = () => {
        if (onSaved) {
            onSaved();
        }
        onClose();
    };

    return (
        <div className="product-modal-overlay">
            <div className="product-modal-content">
                <div className="product-modal-header">
                    <h3 className="product-modal-title">
                        {product ? 'Modifier le produit' : 'Ajouter un produit'}
                    </h3>
                    <button onClick={onClose} className="product-modal-close">×</button>
                </div>

                <div className="product-modal-body">
                    <ProductForm
                        product={product}
                        onSaved={handleSaved}
                    />
                </div>
            </div>
        </div>
    );
}


