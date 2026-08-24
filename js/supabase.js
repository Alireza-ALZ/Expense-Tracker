// ============================================================================
// Supabase Client Module (Class-based)
// ============================================================================
// Encapsulates Supabase client initialization, configuration validation,
// and client instance retrieval.
//
// Requires: config.js (SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
//           Supabase JS library loaded via CDN in index.html.
// ============================================================================

(function () {
    'use strict';

    class SupabaseClientService {
        #client = null;

        /**
         * Initializes the Supabase client.
         * Must be called after config.js and the Supabase CDN script are loaded.
         * @returns {Object} Supabase client instance
         */
        init() {
            if (this.#client) {
                return this.#client;
            }

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

            this.#client = supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
            return this.#client;
        }

        /**
         * Returns the current Supabase client instance.
         * Throws if not initialized.
         * @returns {Object} Supabase client instance
         */
        get() {
            if (!this.#client) {
                throw new Error('Supabase client not initialized. Call SupabaseClient.init() first.');
            }
            return this.#client;
        }
    }

    // Export class and singleton instance for convenient access
    window.SupabaseClientService = SupabaseClientService;
    window.SupabaseClient = new SupabaseClientService();
})();
