# Splash Screen & Icono de App — Guía de Generación

## Requisitos de Imágenes Fuente

| Recurso | Tamaño mínimo | Formato | Notas |
|---------|---------------|---------|-------|
| **Icono** | 1024 × 1024 px | PNG (sin transparencia) | Fondo sólido, sin esquinas redondeadas |
| **Splash Screen** | 2732 × 2732 px | PNG | Centrado, con margen para recorte |

> Tu logo actual está en `./img/logo.jpg`. Puedes usarlo como base para generar ambos.

---

## Generación Automática con `@capacitor/assets`

### 1. Instala la herramienta

```bash
npm install -D @capacitor/assets
```

### 2. Prepara las imágenes fuente

Coloca las imágenes en la raíz del proyecto:

```
assets/
├── icon-only.png          (1024x1024 — icono sin fondo)
├── icon-foreground.png    (1024x1024 — capa foreground Android adaptive icon)
├── icon-background.png    (1024x1024 — capa background Android adaptive icon)
├── splash.png             (2732x2732 — splash screen)
└── splash-dark.png        (2732x2732 — splash para dark mode, opcional)
```

### 3. Ejecuta la generación

```bash
npx capacitor-assets generate
```

Esto generará automáticamente:
- **iOS**: Todos los tamaños de AppIcon + LaunchImage en los `.xcassets`
- **Android**: `mipmap-*` (icono) + splash en todas las densidades

### 4. Sincroniza con los proyectos nativos

```bash
npx cap sync
```

---

## Generación Manual (Alternativa)

Si prefieres generar los iconos manualmente:

### iOS
Coloca los iconos en `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
Tamaños necesarios: 20, 29, 40, 60, 76, 83.5, 1024 (en @1x, @2x, @3x)

### Android
Coloca los iconos en las carpetas `android/app/src/main/res/`:
- `mipmap-mdpi/` (48×48)
- `mipmap-hdpi/` (72×72)
- `mipmap-xhdpi/` (96×96)
- `mipmap-xxhdpi/` (144×144)
- `mipmap-xxxhdpi/` (192×192)

---

## Configuración del Splash Screen en Capacitor

El splash screen ya está configurado en `capacitor-init.js`. Para personalizar su comportamiento, edita `capacitor.config.json`:

```json
{
  "plugins": {
    "SplashScreen": {
      "launchShowDuration": 2000,
      "launchAutoHide": false,
      "backgroundColor": "#0a0a0a",
      "showSpinner": false,
      "androidScaleType": "CENTER_CROP",
      "splashFullScreen": true,
      "splashImmersive": true
    }
  }
}
```

> `launchAutoHide: false` porque lo ocultamos manualmente en `capacitor-init.js` cuando la app está lista.
