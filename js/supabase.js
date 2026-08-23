// ============================================================================
// Supabase Client Module
// ============================================================================
// Initializes and exports the Supabase client.
// Requires config.js to be loaded first with SUPABASE_URL and
// SUPABASE_PUBLISHABLE_KEY defined.
//
// Uses the Supabase JS library loaded via CDN in index.html.
// ============================================================================

(function () {
    'use strict';

    let client = null;

    /**
     * Initializes the Supabase client.
     * Must be called after config.js and the Supabase CDN script are loaded.
     * @returns {Object} Supabase client instance
     */
    function initClient() {
        if (client) return client;

        // Validate that configuration is available
        if (
            typeof SUPABASE_URL === 'undefined' ||
            typeof SUPABASE_PUBLISHABLE_KEY === 'undefined'
        ) {
            throw new Error(
                'Supabase configuration not found. ' +
                'Please copy config.example.js to config.js and add your credentials.'
            );
        }

        // Validate that credentials are not placeholder values
        if (
            SUPABASE_URL === 'https://your-project-id.supabase.co' ||
            SUPABASE_PUBLISHABLE_KEY === 'your-anon-public-key-here'
        ) {
            throw new Error(
                'Supabase credentials are still placeholder values. ' +
                'Please update config.js with your actual Supabase Project URL and Publishable Key.'
            );
        }

        // Validate that the Supabase library is loaded
        if (typeof supabase === 'undefined' || !supabase.createClient) {
            throw new Error(
                'Supabase JS library not loaded. ' +
                'Please check your internet connection and try again.'
            );
        }

        client = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
        return client;
    }

    /**
     * Returns the current Supabase client instance.
     * Throws if not initialized.
     * @returns {Object} Supabase client instance
     */
    function getClient() {
        if (!client) {
            throw new Error('Supabase client not initialized. Call SupabaseClient.init() first.');
        }
        return client;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    window.SupabaseClient = {
        init: initClient,
        get: getClient
    };
})();
