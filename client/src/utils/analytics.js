// Configuração básica de analytics
export const trackEvent = (category, action, label = null) => {
    if (window.gtag) {
        window.gtag('event', action, {
            event_category: category,
            event_label: label
        });
    }
    
    // Log para desenvolvimento
    console.log(`[Analytics] ${category} - ${action}`, label ? `- ${label}` : '');
};

export const trackPageView = (pageTitle, pagePath) => {
    if (window.gtag) {
        window.gtag('config', 'GA_MEASUREMENT_ID', {
            page_title: pageTitle,
            page_path: pagePath
        });
    }
    
    console.log(`[Page View] ${pageTitle} - ${pagePath}`);
};

// Métricas de negócio específicas
export const trackBooking = (serviceId, providerId, price) => {
    trackEvent('booking', 'service_booked', serviceId);
    
    // Enviar para seu backend também
    fetch('/api/analytics/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ serviceId, providerId, price })
    });
};