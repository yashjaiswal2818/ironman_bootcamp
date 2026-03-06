/**
 * Access Control System for Stark Industries Bootcamp
 * 
 * Public pages (accessible without registration):
 * - index.html
 * - register.html
 * 
 * Protected pages (require registration):
 * - stageone.html
 * - editor.html
 * - Any other stage pages
 * 
 * TO ENABLE/DISABLE: Set ENABLE_ACCESS_CONTROL to true/false
 */

(function() {
    'use strict';

    // ============================================
    // STAGE LOCK CONFIG - controls which stages are accessible
    // ============================================
    const MAX_STAGE_UNLOCKED = 0; // All stages require login; only stage 5 unlocked when logged in
    const STAGE_MAP = {
        'stageone.html': 1,
        'editor.html': 1,
        'stagetwo.html': 2,
        'website.html': 2,
        'stagethree.html': 3,
        'stagethree_hub.html': 3,
        'stagefour.html': 4,
        'stagefour_logic_hub.html': 4,
        'stagefive.html': 5,
        'stagefive_presentation.html': 5
    };
    // ============================================

    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Stage 5 only - enabled for logged-in users (stages 1-4 disabled)
    const LOGIN_UNLOCKED_PAGES = ['stagefive.html', 'stagefive_presentation.html'];

    (function enforceStageLock() {
        const stage = STAGE_MAP[currentPage];
        if (typeof stage !== 'number') return;
        if (stage <= MAX_STAGE_UNLOCKED) return; // Stages 1-2 always allowed

        // Stage 3+ pages: allowed when logged in
        const teamName = (function() {
            try { return sessionStorage.getItem('teamName') || ''; } catch (e) { return ''; }
        })();
        const isLoggedIn = teamName && teamName.trim() !== '';
        const isUnlockedPage = LOGIN_UNLOCKED_PAGES.includes(currentPage);

        if (isLoggedIn && isUnlockedPage) {
            return; // Logged in + on allowed stage 3 page - allow
        }
        // Block: stagethree_hub, stagefour, stagefive, or stagethree when not logged in
        window.location.replace('../index.html#login');
    })();

    // ============================================
    // TESTING FLAG - Set to false to disable registration-based access control
    // ============================================
    const ENABLE_ACCESS_CONTROL = false; // Set to true to enable registration access control
    // ============================================

    // Logout: clear session and redirect to home (available in all modes)
    function logout() {
        try {
            sessionStorage.clear();
        } catch (e) {
            console.warn('sessionStorage clear failed:', e);
        }
        var base = (window.location.pathname.indexOf('/html/') !== -1) ? '..' : '.';
        window.location.replace(base + '/index.html');
    }

    // If access control is disabled, export no-op helpers but keep stage lock active
    if (!ENABLE_ACCESS_CONTROL) {
        console.log('Access control disabled for testing');
        window.auth = {
            isRegistered: function() { return true; },
            checkAccess: function() { return true; },
            redirectToRegister: function() {},
            logout: logout
        };
        return;
    }

    // Define public pages that don't require registration
    
    const publicPages = ['index.html', 'register.html'];
    
    // Check if current page is public
    const isPublicPage = publicPages.includes(currentPage);
    
    // Check if user is registered (has teamName in sessionStorage)
    function isRegistered() {
        try {
            const teamName = sessionStorage.getItem('teamName');
            return teamName && teamName.trim() !== '';
        } catch (e) {
            console.warn('sessionStorage unavailable:', e);
            return false;
        }
    }

    // Redirect to register page
    function redirectToRegister() {
        // Only redirect if not already on register page
        if (currentPage !== 'register.html') {
            window.location.href = 'register.html';
        }
    }
    
    // Main access control check
    function checkAccess() {
        // If it's a public page, allow access
        if (isPublicPage) {
            return true;
        }
        
        // If user is registered, allow access
        if (isRegistered()) {
            return true;
        }
        
        // User is not registered and trying to access protected page
        // Redirect to register page
        redirectToRegister();
        return false;
    }
    
    // Run access check immediately when script loads
    // This prevents any content from loading if access is denied
    if (!checkAccess()) {
        // Stop execution if access denied
        document.body.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #050505; color: #fff; font-family: 'Orbitron', sans-serif; flex-direction: column; gap: 1rem;">
                <div style="font-size: 1.5rem; color: #ff0000; text-shadow: 0 0 15px #ff0000;">ACCESS DENIED</div>
                <div style="font-size: 0.9rem; color: #00ffff;">Redirecting to registration...</div>
            </div>
        `;
    }
    
    // Export functions for use in other scripts if needed
    window.auth = {
        isRegistered: isRegistered,
        checkAccess: checkAccess,
        redirectToRegister: redirectToRegister,
        logout: logout
    };
})();
