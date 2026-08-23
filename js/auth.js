// ============================================================================
// Authentication Module
// ============================================================================
// Handles Supabase email/password authentication:
// - Sign Up, Login, Logout
// - Session persistence and restoration
// - Auth state change listening
//
// Requires: SupabaseClient to be initialized first.
// ============================================================================

(function () {
    'use strict';

    /**
     * Signs up a new user with email and password.
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async function signUp(email, password) {
        try {
            const client = SupabaseClient.get();
            const { data, error } = await client.auth.signUp({
                email,
                password
            });

            if (error) {
                return { success: false, error: error.message };
            }

            // Check if email confirmation is required
            // Supabase may require email verification depending on project settings
            if (data.user && data.user.identities && data.user.identities.length === 0) {
                return {
                    success: false,
                    error: 'An account with this email already exists.'
                };
            }

            // If the user was created and a session exists, they are auto-logged in
            if (data.session) {
                return { success: true, data, autoLoggedIn: true };
            }

            // If no session, email confirmation may be required
            return {
                success: true,
                data,
                autoLoggedIn: false,
                message: 'Account created successfully! Please check your email to confirm your account, then log in.'
            };
        } catch (err) {
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
    }

    /**
     * Logs in a user with email and password.
     * @param {string} email - User email
     * @param {string} password - User password
     * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
     */
    async function login(email, password) {
        try {
            const client = SupabaseClient.get();
            const { data, error } = await client.auth.signInWithPassword({
                email,
                password
            });

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (err) {
            return { success: false, error: 'An unexpected error occurred. Please try again.' };
        }
    }

    /**
     * Logs out the current user.
     * @returns {Promise<{success: boolean, error?: string}>}
     */
    async function logout() {
        try {
            const client = SupabaseClient.get();
            const { error } = await client.auth.signOut();

            if (error) {
                return { success: false, error: error.message };
            }

            return { success: true };
        } catch (err) {
            return { success: false, error: 'An unexpected error occurred during logout.' };
        }
    }

    /**
     * Gets the currently authenticated user.
     * @returns {Promise<Object|null>} User object or null
     */
    async function getCurrentUser() {
        try {
            const client = SupabaseClient.get();
            const { data: { user } } = await client.auth.getUser();
            return user;
        } catch (err) {
            return null;
        }
    }

    /**
     * Gets the current session.
     * @returns {Promise<Object|null>} Session object or null
     */
    async function getSession() {
        try {
            const client = SupabaseClient.get();
            const { data: { session } } = await client.auth.getSession();
            return session;
        } catch (err) {
            return null;
        }
    }

    /**
     * Subscribes to authentication state changes.
     * @param {Function} callback - Called with (event, session)
     * @returns {Object} Subscription object with unsubscribe method
     */
    function onAuthStateChange(callback) {
        const client = SupabaseClient.get();
        const { data } = client.auth.onAuthStateChange(callback);
        return data.subscription;
    }

    // ========================================================================
    // Public API
    // ========================================================================

    window.Auth = {
        signUp,
        login,
        logout,
        getCurrentUser,
        getSession,
        onAuthStateChange
    };
})();
