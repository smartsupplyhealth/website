import { useEffect } from 'react';

const Favicon = () => {
    useEffect(() => {
        // Set favicon dynamically
        const setFavicon = (href) => {
            let link = document.querySelector("link[rel*='icon']") || document.createElement('link');
            link.type = 'image/jpeg';
            link.rel = 'icon';
            link.href = href;
            document.getElementsByTagName('head')[0].appendChild(link);
        };

        // Set the SmartSupply Health favicon using the actual logo
        setFavicon('/logo.jpg');
    }, []);

    return null;
};

export default Favicon;
