# Agenda Taxi · app de Android

Esta es la app de Android de Agenda Taxi. Por dentro abre https://agenda-taxi.pages.dev,
así que todo lo que se sube al index.html también le llega a la app.

## Cómo se arma
Cada vez que se sube un cambio a este repositorio, GitHub arma la app solo (pestaña **Actions**).
Al terminar (unos 10 minutos), entra a la compilación y baja **AgendaTaxi-N** (es un .zip con el APK adentro).

## Archivos
- `capacitor.config.json`: nombre de la app, identificador (com.taxicel.agenda) y la página que abre.
- `assets/icon.png`: ícono. `scripts/res/`: íconos ya recortados para Android.
- `firma/debug.keystore`: la firma de la app. NO BORRAR: sin ella no se puede instalar encima la versión nueva.
- `google-services.json` (cuando se suba): conexión con Firebase para las notificaciones.
