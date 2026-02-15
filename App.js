import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
    SafeAreaView,
    StatusBar,
    BackHandler,
    Platform,
    StyleSheet,
    View,
    ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as Notifications from 'expo-notifications';

// ─── CONFIG ────────────────────────────────────────────
const WEB_APP_URL = 'https://focus-club-movil.expo.app/login.html';
// Dev local: 'http://TU_IP_LOCAL:5173/login.html'

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

// ─── APP ───────────────────────────────────────────────
export default function App() {
    const webViewRef = useRef(null);
    const [canGoBack, setCanGoBack] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    // Android Back Button → navega en la web, no cierra la app
    useEffect(() => {
        if (Platform.OS !== 'android') return;
        const onBackPress = () => {
            if (canGoBack && webViewRef.current) {
                webViewRef.current.goBack();
                return true;
            }
            return false;
        };
        const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
        return () => sub.remove();
    }, [canGoBack]);

    // Puente: web envía mensajes → app reacciona
    const handleMessage = useCallback(async (event) => {
        try {
            const data = JSON.parse(event.nativeEvent.data);
            if (data.type === 'LOGIN_SUCCESS') {
                await registerForPushNotifications();
            }
        } catch (e) { }
    }, []);

    return (
        <View style={styles.container}>
            <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
            <SafeAreaView style={styles.safeArea}>
                <WebView
                    ref={webViewRef}
                    source={{ uri: WEB_APP_URL }}
                    style={styles.webview}
                    onNavigationStateChange={(nav) => setCanGoBack(nav.canGoBack)}
                    onMessage={handleMessage}
                    onLoadStart={() => setIsLoading(true)}
                    onLoadEnd={() => setIsLoading(false)}
                    javaScriptEnabled
                    domStorageEnabled
                    allowsBackForwardNavigationGestures
                    startInLoadingState={false}
                    scalesPageToFit={Platform.OS === 'android'}
                    applicationNameForUserAgent="FocusClubApp/1.0"
                />
            </SafeAreaView>
            {isLoading && (
                <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#4CAF50" />
                </View>
            )}
        </View>
    );
}

// ─── PUSH NOTIFICATIONS ────────────────────────────────
async function registerForPushNotifications() {
    try {
        const { status: existing } = await Notifications.getPermissionsAsync();
        let finalStatus = existing;
        if (existing !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }
        if (finalStatus !== 'granted') return;

        const tokenData = await Notifications.getExpoPushTokenAsync();
        console.log('[Push] Token:', tokenData.data);

        // TODO: enviar token a tu backend
        // fetch('https://tu-api.com/register-token', { ... })

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'Default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#4CAF50',
            });
        }
    } catch (error) {
        console.error('[Push] Error:', error);
    }
}

// ─── STYLES ────────────────────────────────────────────
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    safeArea: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    webview: {
        flex: 1,
        backgroundColor: '#0a0a0a',
    },
    loadingOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#0a0a0a',
        justifyContent: 'center',
        alignItems: 'center',
    },
});
