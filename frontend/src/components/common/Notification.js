import React, { useState, useEffect } from 'react';
import '../../style/Notification.css';

const Notification = ({ message, type, onClose }) => {
    const [show, setShow] = useState(false);

    useEffect(() => {
        if (message) {
            setShow(true);
            const timer = setTimeout(() => {
                setShow(false);
                if (onClose) {
                    setTimeout(onClose, 300); // Wait for fade out animation
                }
            }, 3000); // Hide after 3 seconds

            return () => clearTimeout(timer);
        }
    }, [message, onClose]);

    if (!message) return null;

    return (
        <div className={`notification ${type} ${show ? 'show' : ''}`}>
            {message}
        </div>
    );
};

export default Notification;
