/* ============================================
   CAPACITOR INITIALIZATION
   Import this module from login.html & dashboard.html
   ============================================ */

import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * Initializes Capacitor native plugins.
 * Call once on DOMContentLoaded in each page.
 */
export async function initCapacitor() {
    if (!Capacitor.isNativePlatform()) {
        console.log('[Capacitor] Running on web — skipping native init.');
        return;
    }

    try {
        // Transparent status bar that overlays the WebView
        await StatusBar.setStyle({ style: Style.Dark });
        await StatusBar.setOverlaysWebView({ overlay: true });
        await StatusBar.setBackgroundColor({ color: '#00000000' });
        console.log('[Capacitor] StatusBar configured.');
    } catch (e) {
        console.warn('[Capacitor] StatusBar error:', e);
    }

    try {
        // Hide splash screen once the app is ready
        await SplashScreen.hide();
        console.log('[Capacitor] SplashScreen hidden.');
    } catch (e) {
        console.warn('[Capacitor] SplashScreen error:', e);
    }
}
