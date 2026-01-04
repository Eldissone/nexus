export const isAuthenticated = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (!token || !user) {
        return false;
    }

    try {
        // Verificar se token está expirado (simplificado)
        const payload = JSON.parse(atob(token.split('.')[1]));
        return Date.now() < payload.exp * 1000;
    } catch {
        return false;
    }
};

export const getUser = () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login.html';
};

export const requireAuth = (role = null) => {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }

    if (role) {
        const user = getUser();
        if (user.role !== role) {
            window.location.href = '/unauthorized.html';
            return false;
        }
    }

    return true;
};