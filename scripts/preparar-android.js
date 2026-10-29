// Ajusta el proyecto de Android que crea Capacitor:
//  - pone los íconos de Agenda Taxi
//  - agrega los permisos (ubicación, notificaciones, vibrar, mantener pantalla, cámara)
//  - si existe google-services.json (Firebase), lo copia para las notificaciones
//  - numera la versión con el número de compilación de GitHub
const fs = require('fs');
const path = require('path');

const raiz = path.join(__dirname, '..');
const app = path.join(raiz, 'android', 'app');
const res = path.join(app, 'src', 'main', 'res');
if (!fs.existsSync(app)) { console.error('No existe android/app. Corre primero: npx cap add android'); process.exit(1); }

// 1) Íconos
function copiar(de, a) {
  for (const n of fs.readdirSync(de)) {
    const o = path.join(de, n), d = path.join(a, n);
    if (fs.statSync(o).isDirectory()) { fs.mkdirSync(d, { recursive: true }); copiar(o, d); }
    else fs.copyFileSync(o, d);
  }
}
copiar(path.join(__dirname, 'res'), res);
console.log('✓ Íconos');

// 2) Permisos
const mf = path.join(app, 'src', 'main', 'AndroidManifest.xml');
let m = fs.readFileSync(mf, 'utf8');
const permisos = [
  'android.permission.ACCESS_FINE_LOCATION',
  'android.permission.ACCESS_COARSE_LOCATION',
  'android.permission.POST_NOTIFICATIONS',
  'android.permission.VIBRATE',
  'android.permission.WAKE_LOCK',
  'android.permission.CAMERA',
  'android.permission.USE_FULL_SCREEN_INTENT',
  'android.permission.SCHEDULE_EXACT_ALARM',
];
const faltan = permisos.filter((p) => !m.includes('"' + p + '"'));
if (faltan.length) {
  m = m.replace('</manifest>', faltan.map((p) => '    <uses-permission android:name="' + p + '" />').join('\n') + '\n</manifest>');
  fs.writeFileSync(mf, m);
}
console.log('✓ Permisos (' + faltan.length + ' agregados)');

// 3) Firebase (notificaciones): solo si ya subiste google-services.json a la raíz del repositorio
const gs = path.join(raiz, 'google-services.json');
if (fs.existsSync(gs)) { fs.copyFileSync(gs, path.join(app, 'google-services.json')); console.log('✓ Firebase (google-services.json)'); }
else console.log('· Sin google-services.json todavía (las notificaciones nativas se activan después)');

// 4) Versión: cada compilación sube el número para que se pueda instalar encima
const n = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
const bg = path.join(app, 'build.gradle');
let g = fs.readFileSync(bg, 'utf8');
g = g.replace(/versionCode\s+\d+/, 'versionCode ' + n).replace(/versionName\s+"[^"]*"/, 'versionName "1.0.' + n + '"');
fs.writeFileSync(bg, g);
console.log('✓ Versión 1.0.' + n);
