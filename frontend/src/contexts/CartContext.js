

import React, { createContext, useState, useContext } from 'react';
import { NotificationContext } from './NotificationContext'; // Importer le contexte de notification

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);
    const { showNotification } = useContext(NotificationContext); // Utiliser le contexte

    const addToCart = (product) => {
        setCart((prevCart) => {
            const existingItem = prevCart.find(item => item.productId === product._id);
            if (existingItem) {
                if (existingItem.quantity < product.stock) {
                    return prevCart.map(item =>
                        item.productId === product._id
                            ? { ...item, quantity: item.quantity + 1 }
                            : item
                    );
                } else {
                    // Remplacer alert par une notification
                    showNotification(`Stock insuffisant pour ${product.name}. Vous ne pouvez pas en ajouter plus.`, 'warning');
                    return prevCart;
                }
            } else {
                if (product.stock > 0) {
                    showNotification(`${product.name} a été ajouté au panier.`, 'success');
                    return [...prevCart, {
                        productId: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        maxStock: product.stock
                    }];
                } else {
                    // Remplacer alert par une notification
                    showNotification(`Produit ${product.name} est en rupture de stock.`, 'error');
                    return prevCart;
                }
            }
        });
    };

    const updateCartQuantity = (productId, newQuantity) => {
        setCart((prevCart) => {
            if (newQuantity <= 0) {
                return prevCart.filter(item => item.productId !== productId);
            }
            const cartItem = prevCart.find(item => item.productId === productId);
            if (newQuantity <= cartItem.maxStock) {
                return prevCart.map(item =>
                    item.productId === productId
                        ? { ...item, quantity: newQuantity }
                        : item
                );
            } else {
                // Remplacer alert par une notification
                showNotification('Quantité demandée supérieure au stock disponible.', 'warning');
                return prevCart;
            }
        });
    };

    const removeFromCart = (productId) => {
        setCart((prevCart) => prevCart.filter(item => item.productId !== productId));
    };

    const clearCart = () => {
        setCart([]);
    };

    return (
        <CartContext.Provider value={{ cart, addToCart, updateCartQuantity, removeFromCart, clearCart }}>
            {children}
        </CartContext.Provider>
    );
};
