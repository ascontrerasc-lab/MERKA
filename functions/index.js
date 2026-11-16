'use strict';
/* MERKA server: identity, merchants, catalogue, checkout, payments, delivery and live.
   All privileged writes are performed here with Admin SDK, never from the browser. */
const { onCall, HttpsError } = require('firebase-functions/v2/https');
const { defineSecret } = require('firebase-functions/params');
const admin = require('firebase-admin');
const crypto = require('node:crypto');
const {RtcTokenBuilder, RtcRole} = require('agora-token');
admin.initializeApp();
const db = admin.firestore();
const F = admin.firestore.FieldValue;
const AGORA_APP_ID = defineSecret('AGORA_APP_ID');
const AGORA_CERTIFICATE = defineSecret('AGORA_CERTIFICATE');
const opts = {region:'us-central1', maxInstances:25, enforceAppCheck:false};
const fn = handler => onCall(opts, async req => {
  if (!req.auth) throw new HttpsError('unauthenticated','Debes iniciar sesión.');
  try {return await handler(req.data || {}, req.auth);} catch(e) {
    if(e instanceof HttpsError) throw e;
    console.error('MERKA function error', e);
    throw new HttpsError('internal','No se pudo completar la operación.');
  }
});
function fail(msg,code='invalid-argument'){throw new HttpsError(code,msg)}
function str(v,n=120){return typeof v==='string'?v.trim().slice(0,n):''}
function money(v){return Math.round(Number(v)*100)/100}
function positive(v){return Number.isFinite(Number(v))&&Number(v)>0}
function requireAdmin(auth){if(auth.token.admin!==true)fail('No autorizado.','permission-denied')}
async function profile(uid){const snap=await db.doc(`users/${uid}`).get();return snap.exists?snap.data():{}}
async function verified(uid,key){const p=await profile(uid);if(p[`${key}Status`]!=='approved') fail('Cuenta pendiente de verificación.','permission-denied');return p}
async function audit(actor,type,entity,detail={}){await db.collection('auditLogs').add({actor,type,entity,detail,at:F.serverTimestamp()})}
function safeNumber(v,max=999999){const n=Number(v);if(!Number.isFinite(n)||n<0||n>max)fail('Cantidad o precio inválido.');return n}

exports.ensureProfile=fn(async(d,a)=>{
  const ref=db.doc(`users/${a.uid}`), snap=await ref.get();
  if(!snap.exists){await ref.create({name:str(d.name,100)||str(a.token.name,100),email:a.token.email||'',buyer:true,sellerStatus:'none',driverStatus:'none',b2bStatus:'none',createdAt:F.serverTimestamp()});}
  return {ok:true};
});
exports.updateProfile=fn(async(d,a)=>{
  await db.doc(`users/${a.uid}`).set({name:str(d.name,100),phone:str(d.phone,32),city:str(d.city,100),updatedAt:F.serverTimestamp()},{merge:true});return{ok:true};
});
exports.requestSeller=fn(async(d,a)=>{
  const name=str(d.name,90),location=str(d.location,150),phone=str(d.phone,32);
  if(name.length<3||location.length<3||phone.length<7)fail('Completa tienda, ubicación y teléfono.');
  const ref=db.doc(`stores/${a.uid}`);const existing=await ref.get();
  if(existing.exists&&existing.data().status==='approved') fail('Tu tienda ya está aprobada.');
  await ref.set({sellerId:a.uid,name,location,phone,description:str(d.description,500),status:'pending',active:false,updatedAt:F.serverTimestamp()},{merge:true});
  await db.doc(`users/${a.uid}`).set({sellerStatus:'pending'},{merge:true});
  return {ok:true,status:'pending'};
});
exports.requestB2B=fn(async(d,a)=>{
  if(str(d.businessName,100).length<3)fail('Indica el nombre comercial.');
  await db.doc(`users/${a.uid}`).set({b2bStatus:'pending',b2bBusinessName:str(d.businessName,100),b2bType:str(d.type,60),b2bPhone:str(d.phone,32),b2bCity:str(d.city,100),updatedAt:F.serverTimestamp()},{merge:true});
  return {ok:true,status:'pending'};
});
exports.requestDriver=fn(async(d,a)=>{
  if(str(d.name).length<3||str(d.phone).length<7||str(d.vehicle).length<2)fail('Completa nombre, celular y vehículo.');
  await db.doc(`users/${a.uid}`).set({name:str(d.name),phone:str(d.phone),vehicle:str(d.vehicle,60),driverStatus:'pending',availability:false},{merge:true});
  return {ok:true,status:'pending'};
});
exports.reviewAccount=fn(async(d,a)=>{
  requireAdmin(a);
  const uid=str(d.uid,128),role=str(d.role,12),approved=d.approved===true;
  if(!uid||!['seller','driver','b2b'].includes(role))fail('Solicitud inválida.');
  await db.runTransaction(async tx=>{
    const ref=db.doc(`users/${uid}`),snap=await tx.get(ref);
    if(!snap.exists||snap.data()[`${role}Status`]!=='pending')fail('Solicitud no encontrada.','not-found');
    tx.update(ref,{[`${role}Status`]:approved?'approved':'rejected'});
    if(role==='seller')tx.set(db.doc(`stores/${uid}`),{status:approved?'approved':'rejected',active:approved,reviewedAt:F.serverTimestamp()},{merge:true});
  });
  await audit(a.uid,'review_account',uid,{role,approved});return {ok:true};
});
exports.publishProduct=fn(async(d,a)=>{
  await verified(a.uid,'seller');const store=await db.doc(`stores/${a.uid}`).get();
  if(!store.exists||store.data().status!=='approved')fail('Tienda no habilitada.','permission-denied');
  const name=str(d.name,100),price=money(d.price),stock=Math.floor(safeNumber(d.stock,100000));
  if(name.length<3||!positive(price)||price>100000)fail('Nombre o precio inválidos.');
  let image=str(d.image,1500);if(image&&!image.startsWith(`https://firebasestorage.googleapis.com/`))fail('Usa imágenes subidas a MERKA.');
  const product={sellerId:a.uid,storeId:a.uid,storeName:store.data().name,name,description:str(d.description,750),category:str(d.category,60),price,stock,
    image,active:true,updatedAt:F.serverTimestamp()};
  const wholesalePrice=d.wholesalePrice?money(safeNumber(d.wholesalePrice)):0,wholesaleMin=d.wholesaleMin?Math.floor(safeNumber(d.wholesaleMin,10000)):0;
  let ref;if(d.id){ref=db.doc(`products/${str(d.id,150)}`);const snap=await ref.get();if(!snap.exists||snap.data().sellerId!==a.uid)fail('Producto no autorizado.','permission-denied');await ref.update(product)}
  else{ref=await db.collection('products').add({...product,createdAt:F.serverTimestamp()})}
  if(wholesalePrice>0&&wholesaleMin>0)await db.doc(`wholesaleOffers/${ref.id}`).set({productId:ref.id,sellerId:a.uid,wholesalePrice,wholesaleMin},{merge:true});
  else await db.doc(`wholesaleOffers/${ref.id}`).delete();return{id:ref.id};
});
exports.publishPost=fn(async(d,a)=>{
  await verified(a.uid,'seller');
  const mediaUrl=str(d.mediaUrl,1800),type=str(d.type,10),productId=str(d.productId,150);
  if(!['image','video'].includes(type)||!mediaUrl.startsWith('https://firebasestorage.googleapis.com/'))fail('Debes subir una foto o video válido.');
  let p=null;if(productId){const snap=await db.doc(`products/${productId}`).get();if(!snap.exists||snap.data().sellerId!==a.uid)fail('Producto inválido.');p=snap.data()}
  const store=await db.doc(`stores/${a.uid}`).get();const ref=await db.collection('posts').add({sellerId:a.uid,storeId:a.uid,storeName:store.data()?.name||'Tienda MERKA',title:str(d.title,140),text:str(d.text,600),mediaUrl,mediaType:type,productId:p?productId:null,active:true,createdAt:F.serverTimestamp()});return{id:ref.id};
});
exports.createOrder=fn(async(d,a)=>{
  const list=Array.isArray(d.items)?d.items:[];
  if(!list.length||list.length>30)fail('El carrito no tiene productos válidos.');
  const shipping={name:str(d.shipping?.name,100),phone:str(d.shipping?.phone,32),district:str(d.shipping?.district,100),address:str(d.shipping?.address,220),reference:str(d.shipping?.reference,180)};
  if(shipping.name.length<3||shipping.phone.length<7||shipping.district.length<2||shipping.address.length<5)fail('Completa los datos de envío.');
  const qtyById=new Map();for(const item of list){const id=str(item.id,150),qty=Number(item.qty);if(!id||!Number.isInteger(qty)||qty<1||qty>100)fail('Cantidad inválida.');qtyById.set(id,(qtyById.get(id)||0)+qty)}
  const rateId=shipping.district.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  const rateSnap=await db.doc(`deliveryRates/${rateId}`).get();
  if(!rateSnap.exists||rateSnap.data().active!==true)fail('Todavía no tenemos cobertura confirmada para ese distrito o ciudad.');
  const shippingFee=safeNumber(rateSnap.data().fee,10000);
  const refs=[...qtyById.keys()].map(id=>db.doc(`products/${id}`));
  // Pricing is recomputed on the server. Client price and seller IDs are ignored.
  const products=await db.getAll(...refs);const puser=await profile(a.uid);
  const offers=puser.b2bStatus==='approved'?await db.getAll(...products.map(x=>db.doc(`wholesaleOffers/${x.id}`))):[];
  let total=0,items=[];
  for(const [index,snap] of products.entries()){const p=snap.data();const qty=qtyById.get(snap.id);
    if(!p||!p.active||Number(p.stock)<qty)fail(`Producto agotado o no disponible: ${snap.id}`);
    const offer=offers[index]?.data()||{};const canB2B=puser.b2bStatus==='approved'&&offer.wholesalePrice>0&&offer.wholesaleMin>0&&qty>=offer.wholesaleMin;
    const price=canB2B?offer.wholesalePrice:p.price;
    total+=Number(price)*qty;items.push({productId:snap.id,name:p.name,sellerId:p.sellerId,storeId:p.storeId,storeName:p.storeName,price,qty,image:p.image||''});
  }
  total=money(total+shippingFee);if(!positive(total))fail('Total de pedido inválido.');
  const code=String(crypto.randomInt(100000,1000000));const id=db.collection('orders').doc().id;
  const batch=db.batch();batch.set(db.doc(`orders/${id}`),{buyerId:a.uid,buyerEmail:a.token.email||'',sellerIds:[...new Set(items.map(i=>i.sellerId))],items,total,shippingFee,status:'pending_payment',deliveryStatus:'waiting_payment',readySellerIds:[],shipping,createdAt:F.serverTimestamp(),paymentProofPath:null,driverId:null});
  batch.set(db.doc(`buyerCodes/${id}`),{buyerId:a.uid,code,createdAt:F.serverTimestamp()});
  await batch.commit();await audit(a.uid,'create_order',id,{total});return{id,total,shippingFee,code};
});
exports.submitPaymentProof=fn(async(d,a)=>{
  const id=str(d.orderId,150),path=str(d.path,450);const ref=db.doc(`orders/${id}`),snap=await ref.get();
  if(!snap.exists||snap.data().buyerId!==a.uid||snap.data().status!=='pending_payment')fail('Pedido no autorizado.','permission-denied');
  if(!path.startsWith(`payment-proofs/${a.uid}/${id}/`))fail('Comprobante no válido.');
  // Verify the referenced object actually exists and was uploaded by the buyer.
  const [exists]=await admin.storage().bucket().file(path).exists();if(!exists)fail('Archivo no encontrado.');
  await ref.update({paymentProofPath:path,proofSubmittedAt:F.serverTimestamp()});return{ok:true};
});
exports.reviewPayment=fn(async(d,a)=>{
  requireAdmin(a);const id=str(d.orderId,150),approved=d.approved===true;
  // Approval is MANUAL: administrator MUST independently verify payment against bank/Yape records.
  if(approved&&str(d.confirmationReference,100).length<5)fail('Ingresa la referencia bancaria verificada.');
  const ref=db.doc(`orders/${id}`);
  await db.runTransaction(async tx=>{
    const snap=await tx.get(ref);if(!snap.exists||snap.data().status!=='pending_payment')fail('El pedido no está pendiente.');
    const o=snap.data();if(approved&&!o.paymentProofPath)fail('Falta adjuntar comprobante.');
    const uniqueIds=[...new Set(o.items.map(i=>i.productId))];const productRefs=uniqueIds.map(i=>db.doc(`products/${i}`));
    const productSnaps=approved?await Promise.all(productRefs.map(r=>tx.get(r))):[];
    if(approved){for(let j=0;j<productRefs.length;j++){const id=productRefs[j].id,p=productSnaps[j].data(),qty=o.items.filter(i=>i.productId===id).reduce((s,i)=>s+i.qty,0);if(!p||p.stock<qty)fail('Stock insuficiente; rechaza el pago y gestiona el reembolso.');}
      for(let j=0;j<productRefs.length;j++){const id=productRefs[j].id,qty=o.items.filter(i=>i.productId===id).reduce((s,i)=>s+i.qty,0);tx.update(productRefs[j],{stock:F.increment(-qty)})}
    }
    tx.update(ref,{status:approved?'preparing':'payment_rejected',deliveryStatus:approved?'waiting_sellers':'cancelled',reviewedAt:F.serverTimestamp(),reviewedBy:a.uid,confirmationReference:approved?str(d.confirmationReference):''});
  });await audit(a.uid,'review_payment',id,{approved,confirmationReference:approved?str(d.confirmationReference,100):''});return{ok:true};
});
exports.sellerReady=fn(async(d,a)=>{
  await verified(a.uid,'seller');const ref=db.doc(`orders/${str(d.orderId,150)}`);
  await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists())fail('Pedido no encontrado.');const o=snap.data();if(!o.sellerIds.includes(a.uid)||o.status!=='preparing')fail('No autorizado.','permission-denied');const ready=new Set(o.readySellerIds||[]);ready.add(a.uid);const all=o.sellerIds.every(x=>ready.has(x));tx.update(ref,{readySellerIds:[...ready],status:all?'ready_for_delivery':'preparing',deliveryStatus:all?'searching_driver':'waiting_sellers'});});return{ok:true};
});
exports.myOrders=fn(async(d,a)=>{
  const role=str(d.role,12);let q;
  if(role==='buyer')q=db.collection('orders').where('buyerId','==',a.uid).limit(50);
  else if(role==='seller'){await verified(a.uid,'seller');q=db.collection('orders').where('sellerIds','array-contains',a.uid).limit(50)}
  else if(role==='admin'){requireAdmin(a);q=db.collection('orders').orderBy('createdAt','desc').limit(100)}
  else fail('Modo inválido.');
  const snap=await q.get();return{orders:snap.docs.map(x=>({id:x.id,...x.data(),createdAt:x.data().createdAt?.toDate?.()?.toISOString()||''}))};
});
exports.driverJobs=fn(async(d,a)=>{
  await verified(a.uid,'driver');const [open,mine]=await Promise.all([
    db.collection('orders').where('deliveryStatus','==','searching_driver').limit(30).get(),
    db.collection('orders').where('driverId','==',a.uid).limit(40).get()]);
  const ids=[...new Set(mine.docs.flatMap(x=>x.data().sellerIds||[]))];const storeRefs=ids.map(id=>db.doc(`stores/${id}`));const storeDocs=storeRefs.length?await db.getAll(...storeRefs):[];
  const pickupStores=Object.fromEntries(storeDocs.map(x=>[x.id,{name:x.data()?.name||'Tienda',location:x.data()?.location||'Ubicación sin registrar',phone:x.data()?.phone||''}]));
  function clean(doc,assigned){const o=doc.data();return{id:doc.id,status:o.deliveryStatus,district:o.shipping?.district||'',address:assigned?o.shipping?.address:'',reference:assigned?o.shipping?.reference:'',name:assigned?o.shipping?.name:'',phone:assigned?o.shipping?.phone:'',storeIds:o.sellerIds||[],pickups:assigned?(o.sellerIds||[]).map(id=>pickupStores[id]).filter(Boolean):[],items:assigned?o.items.map(p=>({name:p.name,qty:p.qty,storeName:p.storeName})):[]}}
  return{available:open.docs.map(x=>clean(x,false)),mine:mine.docs.map(x=>clean(x,true))};
});
exports.claimDelivery=fn(async(d,a)=>{
  await verified(a.uid,'driver');const ref=db.doc(`orders/${str(d.orderId,150)}`);
  await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists()||snap.data().deliveryStatus!=='searching_driver')fail('Entrega no disponible.');tx.update(ref,{driverId:a.uid,deliveryStatus:'driver_assigned',assignedAt:F.serverTimestamp()});});return{ok:true};
});
exports.updateDelivery=fn(async(d,a)=>{
  await verified(a.uid,'driver');const ref=db.doc(`orders/${str(d.orderId,150)}`),next=str(d.status,24);
  if(!['picked_up','in_transit','arrived_destination'].includes(next))fail('Estado inválido.');
  const prev={picked_up:'driver_assigned',in_transit:'picked_up',arrived_destination:'in_transit'}[next];
  await db.runTransaction(async tx=>{const snap=await tx.get(ref);if(!snap.exists()||snap.data().driverId!==a.uid||snap.data().deliveryStatus!==prev)fail('Transición no autorizada.');tx.update(ref,{deliveryStatus:next,updatedAt:F.serverTimestamp()})});return{ok:true};
});
exports.completeDelivery=fn(async(d,a)=>{
  await verified(a.uid,'driver');const ref=db.doc(`orders/${str(d.orderId,150)}`),code=str(d.code,8);
  if(!/^\d{6}$/.test(code))fail('Código de seis dígitos inválido.');
  const completed=await db.runTransaction(async tx=>{
    const o=await tx.get(ref),c=await tx.get(db.doc(`buyerCodes/${ref.id}`));
    if(!o.exists()||!c.exists()||o.data().driverId!==a.uid||o.data().deliveryStatus!=='arrived_destination')fail('No autorizado.','permission-denied');
    const prior=Number(c.data().attempts||0);if(prior>=5)fail('Máximo de intentos alcanzado. Contacta a soporte.','resource-exhausted');
    if(!crypto.timingSafeEqual(Buffer.from(code),Buffer.from(c.data().code))){tx.update(db.doc(`buyerCodes/${ref.id}`),{attempts:prior+1});return;} 
    tx.update(ref,{deliveryStatus:'delivered',status:'delivered',deliveredAt:F.serverTimestamp()});
    tx.update(db.doc(`buyerCodes/${ref.id}`),{usedAt:F.serverTimestamp()});return true;
  });if(!completed)fail('Código incorrecto.','permission-denied');await audit(a.uid,'delivered',ref.id);return{ok:true};
});
exports.startLive=fn(async(d,a)=>{
  await verified(a.uid,'seller');const store=await db.doc(`stores/${a.uid}`).get();
  const existing=await db.collection('lives').where('sellerId','==',a.uid).where('status','==','live').limit(1).get();if(!existing.empty)fail('Ya tienes un Live activo.');
  const channel=`merka_${crypto.randomBytes(12).toString('hex')}`;const ref=await db.collection('lives').add({sellerId:a.uid,storeName:store.data()?.name||'MERKA',status:'live',channel,productId:str(d.productId,150)||null,startedAt:F.serverTimestamp()});return{id:ref.id};
});
exports.getAgoraToken=onCall({...opts,secrets:[AGORA_APP_ID,AGORA_CERTIFICATE]},async req=>{
  if(!req.auth)throw new HttpsError('unauthenticated','Inicia sesión.');
  const snap=await db.doc(`lives/${str(req.data?.liveId,150)}`).get();
  if(!snap.exists||snap.data().status!=='live')throw new HttpsError('not-found','Transmisión no disponible.');
  const host=snap.data().sellerId===req.auth.uid;
  const id=AGORA_APP_ID.value(),cert=AGORA_CERTIFICATE.value();
  if(!id||!cert)throw new HttpsError('failed-precondition','Configura las credenciales de Agora.');
  // Agora AccessToken2: 3600 seconds for both token and privileges.
  const token=RtcTokenBuilder.buildTokenWithUid(id,cert,snap.data().channel,0,host?RtcRole.PUBLISHER:RtcRole.SUBSCRIBER,3600,3600);
  return{appId:id,token,channel:snap.data().channel,uid:0,host};
});
exports.endLive=fn(async(d,a)=>{
  const ref=db.doc(`lives/${str(d.liveId,150)}`),snap=await ref.get();if(!snap.exists||snap.data().sellerId!==a.uid)fail('No autorizado.','permission-denied');
  await ref.update({status:'ended',endedAt:F.serverTimestamp()});return{ok:true};
});

exports.adminSetDeliveryRate=fn(async(d,a)=>{
  requireAdmin(a);const district=str(d.district,100);if(district.length<2)fail('Distrito inválido.');
  const fee=money(safeNumber(d.fee,10000));const id=district.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
  await db.doc(`deliveryRates/${id}`).set({district,fee,active:true,updatedBy:a.uid,updatedAt:F.serverTimestamp()},{merge:true});
  await audit(a.uid,'delivery_rate',id,{fee});return{ok:true};
});
