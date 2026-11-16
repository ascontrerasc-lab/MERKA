// Execute ONLY from a trusted operator machine with IAM credentials.
// Example: GOOGLE_APPLICATION_CREDENTIALS=/safe/path/operator-credential.json node set-admin.js FIREBASE_UID
// NEVER put service account JSON inside the MERKA ZIP, Hosting or the mobile app.
const admin=require('firebase-admin');
admin.initializeApp({credential:admin.credential.applicationDefault()});
(async()=>{
 const uid=process.argv[2];if(!uid||uid.length<12)throw Error('Indica un UID válido de Firebase Auth.');
 const user=await admin.auth().getUser(uid);
 process.stdout.write(`Cuenta: ${user.email} / ${uid}. ¿Asignar admin? Escribe CONFIRMAR: `);
 process.stdin.setEncoding('utf8');process.stdin.once('data',async answer=>{
  if(answer.trim()!=='CONFIRMAR'){console.log('Cancelado.');process.exit(1)}
  try{await admin.auth().setCustomUserClaims(uid,{...(user.customClaims||{}),admin:true});console.log('Claim admin asignado. Cierra sesión y vuelve a iniciar sesión.');process.exit(0)}catch(e){console.error(e);process.exit(1)}
 });
})().catch(e=>{console.error(e);process.exit(1)});
