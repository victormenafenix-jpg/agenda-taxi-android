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

// 3b) Canal de notificaciones "servicios" con sonido propio (res/raw/servicio.wav)
const ma = path.join(app, 'src', 'main', 'java', 'com', 'taxicel', 'agenda', 'MainActivity.java');
fs.writeFileSync(ma, `package com.taxicel.agenda;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.media.AudioAttributes;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel canal = new NotificationChannel("servicios", "Servicios nuevos", NotificationManager.IMPORTANCE_HIGH);
            canal.setDescription("Aviso cuando llega un servicio");
            canal.enableVibration(true);
            canal.setVibrationPattern(new long[]{0, 500, 250, 500});
            Uri sonido = Uri.parse("android.resource://" + getPackageName() + "/raw/servicio");
            AudioAttributes aa = new AudioAttributes.Builder()
                .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION).build();
            canal.setSound(sonido, aa);
            getSystemService(NotificationManager.class).createNotificationChannel(canal);
        }
    }
}
`);
console.log('✓ Canal de notificaciones "servicios" con sonido');

// 4) Versión: cada compilación sube el número para que se pueda instalar encima
const n = parseInt(process.env.GITHUB_RUN_NUMBER || '1', 10);
const bg = path.join(app, 'build.gradle');
let g = fs.readFileSync(bg, 'utf8');
g = g.replace(/versionCode\s+\d+/, 'versionCode ' + n).replace(/versionName\s+"[^"]*"/, 'versionName "1.0.' + n + '"');
fs.writeFileSync(bg, g);
console.log('✓ Versión 1.0.' + n);

// 5) Google Play pide apuntar a Android 16 (API 36) para apps nuevas
const vg = path.join(raiz, 'android', 'variables.gradle');
if (fs.existsSync(vg)) {
  let v = fs.readFileSync(vg, 'utf8');
  v = v.replace(/compileSdkVersion\s*=\s*\d+/, 'compileSdkVersion = 36').replace(/targetSdkVersion\s*=\s*\d+/, 'targetSdkVersion = 36')
       .replace(/minSdkVersion\s*=\s*\d+/, 'minSdkVersion = 24');
  fs.writeFileSync(vg, v);
  const gp = path.join(raiz, 'android', 'gradle.properties');
  let p = fs.readFileSync(gp, 'utf8');
  if (!p.includes('suppressUnsupportedCompileSdk')) fs.appendFileSync(gp, '\nandroid.suppressUnsupportedCompileSdk=36\n');
  console.log('✓ Android 16 (API 36)');
}

// 6) Versión para Play Store: quitar permisos que Google restringe
//    (pantalla completa y alarmas exactas). Solo cuando se arma el .aab.
if (process.env.PARA_PLAY === '1') {
  let mm = fs.readFileSync(mf, 'utf8');
  if (!mm.includes('xmlns:tools')) mm = mm.replace('<manifest ', '<manifest xmlns:tools="http://schemas.android.com/tools" ');
  for (const p of ['android.permission.USE_FULL_SCREEN_INTENT', 'android.permission.SCHEDULE_EXACT_ALARM', 'android.permission.USE_EXACT_ALARM']) {
    mm = mm.split('\n').filter((l) => !l.includes('"' + p + '"')).join('\n');
    mm = mm.replace('</manifest>', '    <uses-permission android:name="' + p + '" tools:node="remove" />\n</manifest>');
  }
  fs.writeFileSync(mf, mm);
  console.log('✓ Permisos restringidos quitados (versión Play Store)');
}
