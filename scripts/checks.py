#!/usr/bin/env python3
"""Basic release artifact static checks (NOT integration/security certification)."""
from pathlib import Path
from html.parser import HTMLParser
import json, subprocess, re
root=Path(__file__).resolve().parents[1]
for name in ['firebase.json','firestore.rules','firestore.indexes.json','storage.rules','functions/index.js','public/index.html','public/app.js','public/config.js','public/styles.css','public/manifest.webmanifest','public/sw.js']:
    assert (root/name).exists(), f'Falta {name}'
for f in ['firebase.json','firestore.indexes.json','public/manifest.webmanifest','functions/package.json']:
    json.loads((root/f).read_text())
for f in ['functions/index.js','functions/set-admin.js','public/app.js','public/config.js','public/sw.js']:
    subprocess.run(['node','--check',str(root/f)],check=True)
html=(root/'public/index.html').read_text()
js=(root/'public/app.js').read_text()
backend=(root/'functions/index.js').read_text()
for v in ['id="view"','id="overlay"','id="goSearch"','id="goBag"','data-tab="inicio"','data-tab="videos"','data-tab="live"','data-tab="tiendas"','data-tab="perfil"']:
    assert v in html, f'Falta UI {v}'
for v in ['exports.createOrder=','exports.reviewPayment=','exports.sellerReady=','exports.completeDelivery=','exports.getAgoraToken=','exports.adminSetDeliveryRate=']:
    assert v in backend, f'Falta backend {v}'
assert 'AGORA_TEMP_TOKEN' not in backend+js, 'Token temporal expuesto'
assert not re.search(r'addDoc\(collection\(db,\s*[\'\"]orders',js), 'Pedido se escribe desde navegador'
assert 'Math.random()' not in backend, 'Token/código inseguro'
assert 'allow write: if false' in (root/'firestore.rules').read_text(), 'Reglas incompletas'
assert 'revolucionar' not in html.lower()
print('OK: estructura de archivos, JSON, sintaxis JS e invariantes básicos.')
print('AVISO: NO se ha validado Firebase real, reglas desplegadas, Agora, pagos ni APK.')
