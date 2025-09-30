

import React, { createContext, useState } from 'react';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cart, setCart] = useState([]);

    // Custom notification function with better styling
    const showNotification = (message, type = 'success') => {
        // Create custom notification element
        const notification = document.createElement('div');
        notification.className = `custom-notification custom-notification-${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    ${type === 'success' ? '✅' : type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
                </div>
                <div class="notification-message">${message}</div>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;

        // Add styles if not already added
        if (!document.getElementById('custom-notification-styles')) {
            const style = document.createElement('style');
            style.id = 'custom-notification-styles';
            style.textContent = `
                .custom-notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    min-width: 300px;
                    max-width: 400px;
                    animation: slideInRight 0.3s ease-out;
                    border-left: 4px solid #10b981;
                }
                
                .custom-notification-success {
                    border-left-color: #10b981;
                }
                
                .custom-notification-error {
                    border-left-color: #ef4444;
                }
                
                .custom-notification-warning {
                    border-left-color: #f59e0b;
                }
                
                .custom-notification-info {
                    border-left-color: #3b82f6;
                }
                
                .notification-content {
                    display: flex;
                    align-items: center;
                    padding: 16px 20px;
                    gap: 12px;
                }
                
                .notification-icon {
                    font-size: 20px;
                    flex-shrink: 0;
                }
                
                .notification-message {
                    flex: 1;
                    color: #1f2937;
                    font-weight: 500;
                    font-size: 14px;
                    line-height: 1.4;
                }
                
                .notification-close {
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #6b7280;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    border-radius: 50%;
                    transition: all 0.2s ease;
                }
                
                .notification-close:hover {
                    background: #f3f4f6;
                    color: #374151;
                }
                
                @keyframes slideInRight {
                    from {
                        transform: translateX(100%);
                        opacity: 0;
                    }
                    to {
                        transform: translateX(0);
                        opacity: 1;
                    }
                }
                
                @media (max-width: 768px) {
                    .custom-notification {
                        top: 10px;
                        right: 10px;
                        left: 10px;
                        min-width: auto;
                        max-width: none;
                    }
                }
            `;
            document.head.appendChild(style);
        }

        // Add to page
        document.body.appendChild(notification);

        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.style.animation = 'slideInRight 0.3s ease-out reverse';
                setTimeout(() => {
                    if (notification.parentElement) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 4000);
    };

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
                    showNotification(`⚠️ Stock insuffisant pour "${product.name}". Vous ne pouvez pas en ajouter plus.`, 'warning');
                    return prevCart;
                }
            } else {
                if (product.stock > 0) {
                    showNotification(`✅ "${product.name}" a été ajouté au panier avec succès !`, 'success');
                    return [...prevCart, {
                        productId: product._id,
                        name: product.name,
                        price: product.price,
                        quantity: 1,
                        maxStock: product.stock
                    }];
                } else {
                    // Remplacer alert par une notification
                    showNotification(`❌ Le produit "${product.name}" est en rupture de stock.`, 'error');
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
                showNotification('⚠️ Quantité demandée supérieure au stock disponible.', 'warning');
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
