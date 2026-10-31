import * as THREE from 'three';
import { createWorld } from './world.js';
import { createPigeon } from './pigeon.js';
import { createChicken } from './chicken.js';
import { GameAudio } from './audio.js';

const $=id=>document.getElementById(id);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Math.floor(n).toLocaleString('fr-FR');
const timeText=s=>String(Math.floor(s/60)).padStart(2,'0')+':'+String(Math.floor(s%60)).padStart(2,'0');
const read=(key,fallback)=>{
  try{const v=localStorage.getItem(key);return v===null?fallback:JSON.parse(v);}catch{return fallback;}
};
const write=(key,value)=>{try{localStorage.setItem(key,JSON.stringify(value));}catch{}};

const skins=[
  {id:'common',name:'Pigeon commun',rarity:'CLASSIQUE',price:0,speed:1,boost:1,accent:'#aab5bf'},
  {id:'white',name:'Pigeon neige',rarity:'RARE',price:150,speed:1.03,boost:1.02,accent:'#d9f0ff'},
  {id:'red',name:'Rouge-pigeon',rarity:'LÉGENDAIRE',price:300,speed:1.12,boost:1.08,accent:'#ff6877'},
  {id:'dragon',name:'Ailes de dragon',rarity:'MYTHIQUE',price:500,speed:1.28,boost:1.18,accent:'#55e0d0'},
  {id:'divine',name:'Multicolore',rarity:'DIVIN',price:700,speed:1.20,boost:1.35,accent:'#e7a4ff'}
];

let wallet=read('lp-wallet',2000);
if(!Number.isFinite(wallet)||wallet<0)wallet=2000;
let unlocked=read('lp-unlocked',['common']);
if(!Array.isArray(unlocked))unlocked=['common'];
if(!unlocked.includes('common'))unlocked.unshift('common');
let selectedSkin=read('lp-skin','common');
if(!skins.some(s=>s.id===selectedSkin)||!unlocked.includes(selectedSkin))selectedSkin='common';
let pigeonName=String(read('lp-name','Pico')).slice(0,18)||'Pico';

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(61,window.innerWidth/window.innerHeight,.1,900);
camera.position.set(0,10,-17);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.55));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=true;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
$('scene').appendChild(renderer.domElement);

const world=await createWorld(scene);
$('loading-text').textContent='Finalisation de la ville et du trafic…';
await world.ready;
$('loading').classList.add('done');
setTimeout(()=>$('loading').remove(),700);

const skinPalettes={
  common:{},
  white:{head:'#e9edf0',body:'#f0f2f5',breast:'#ffffff',neckA:'#a8d5d7',neckB:'#e5f0f1',wing:'#f4f6f7',primary:'#c7d0d8',bar:'#e8edf1',band:'#d8e0e7',rump:'#ffffff',tail:'#e0e7eb',beak:'#49443e',cere:'#f7f2eb',ring:'#bf8065',eye:'#d69a4b',pupil:'#08090a',feet:'#d17c89'},
  red:{head:'#8e3444',body:'#b94955',breast:'#d17b80',neckA:'#b75d78',neckB:'#633d65',wing:'#d47c85',primary:'#79313f',bar:'#3d1d2a',band:'#3d1d2a',rump:'#f0d9d8',tail:'#8b3d4e',eye:'#f2b15e'},
  dragon:{head:'#2e496e',body:'#3b6680',breast:'#b9d1d8',neckA:'#36b9a4',neckB:'#4365b1',wing:'#46bcae',primary:'#20384c',bar:'#142332',band:'#172a3b',rump:'#6a9ba8',tail:'#287b8c',eye:'#ffcf72'},
  divine:{head:'#e9dff1',body:'#c8b6e8',breast:'#fff1f8',neckA:'#70d8c3',neckB:'#e78ac5',wing:'#f39dce',primary:'#6fd3d0',bar:'#9d81d3',band:'#f4cb71',rump:'#ffffff',tail:'#b7a2e8',eye:'#ffce6b'}
};
function buildPigeon(){
  return createPigeon({colors:skinPalettes[selectedSkin]||{},name:pigeonName,scale:1});
}
let pigeon=buildPigeon();
scene.add(pigeon);
let playerPosition=pigeon.position;
pigeon.visible=true;

const enemies=[];
for(let i=0;i<2;i++){
  const enemy=createChicken();
  scene.add(enemy);
  enemy.visible=false;
  enemies.push(enemy);
}

const audio=new GameAudio();
const keys=Object.create(null);
let gameState='menu';
let score=0;
let elapsed=0;
let health=3;
let boost=100;
let invulnerable=0;
let dayClock=0;
let toastClock=0;
let hudClock=0;
let lastFrame=performance.now();

let mouseSteer={x:0,y:0};

function persist(){
  write('lp-wallet',wallet);write('lp-unlocked',unlocked);
  write('lp-skin',selectedSkin);write('lp-name',pigeonName);
}
function updateWallet(){
  $('wallet-menu').textContent=fmt(wallet);
  $('wallet-hud').textContent=fmt(wallet);
}
function toast(message){
  $('toast').textContent=message;$('toast').classList.add('show');toastClock=2.2;
}
function updateHearts(){
  $('health-hearts').innerHTML=[0,1,2].map(i=>'<span class="heart '+(i>=health?'empty':'')+'">'+(i<health?'♥':'♡')+'</span>').join('');
  $('health-label').textContent=health+' / 3';
}
function updateHUD(){
  $('score').textContent=fmt(score).padStart(5,'0');
  $('timer').textContent=timeText(elapsed);
  $('boost-fill').style.width=boost+'%';
  $('boost-label').textContent=Math.round(boost)+'%';
  $('hud-pigeon-name').textContent=pigeonName;
  updateWallet();updateHearts();
}
function updateSkinShop(){
  const root=$('skin-list');root.innerHTML='';
  for(const skin of skins){
    const owned=unlocked.includes(skin.id);
    const card=document.createElement('button');
    card.type='button';card.className='skin-card'+(selectedSkin===skin.id?' selected':'');
    card.style.setProperty('--accent',skin.accent);
    card.innerHTML='<span class="skin-price">'+(owned?(selectedSkin===skin.id?'ÉQUIPÉ':'POSSÉDÉ'):fmt(skin.price)+' 🪙')+'</span><div class="skin-row"><span class="skin-avatar">🐦</span><span><b>'+skin.name+'</b><small>'+skin.rarity+'</small></span></div>';
    card.addEventListener('click',()=>{
      if(!unlocked.includes(skin.id)){
        if(wallet<skin.price){toast('Il te manque des pièces pour ce skin.');return;}
        wallet-=skin.price;unlocked.push(skin.id);toast(skin.name+' débloqué !');
      }
      selectedSkin=skin.id;replacePigeon();persist();updateSkinShop();updateWallet();
    });
    root.appendChild(card);
  }
}
function replacePigeon(){
  const oldPosition=pigeon.position.clone();
  const oldRotation=pigeon.rotation.clone();
  if(pigeon)scene.remove(pigeon);
  pigeon=buildPigeon();
  scene.add(pigeon);
  pigeon.position.copy(oldPosition);
  pigeon.rotation.copy(oldRotation);
  playerPosition=pigeon.position;
  pigeon.visible=true;
}
function setPigeonName(value){
  pigeonName=String(value).trim().slice(0,18)||'Pico';
  $('pigeon-name').value=pigeonName;
  pigeon.userData.updateName?.(pigeonName);
  persist();$('hud-pigeon-name').textContent=pigeonName;
}
$('pigeon-name').value=pigeonName;
$('pigeon-name').addEventListener('change',()=>setPigeonName($('pigeon-name').value));
$('pigeon-name').addEventListener('keydown',event=>{if(event.key==='Enter')$('pigeon-name').blur();});
updateSkinShop();updateWallet();

function setMode(next){
  gameState=next;
  if(next!=='playing')mouseSteer={x:0,y:0};
  $('main-menu').hidden=next!=='menu';
  $('pause-screen').hidden=next!=='paused';
  $('gameover-screen').hidden=next!=='gameover';
  $('hud').hidden=next!=='playing';
  $('mobile-controls').hidden=next!=='playing';
  if(next!=='playing')Object.keys(keys).forEach(k=>keys[k]=false);
}
function resetCoins(){
  for(const coin of world.coins){
    const n=Math.round(Math.random()*8)-4;
    if(Math.random()<.5)coin.mesh.position.set((Math.random()-.5)*430,2.2,n*50+(Math.random()-.5)*8);
    else coin.mesh.position.set(n*50+(Math.random()-.5)*8,2.2,(Math.random()-.5)*430);
    coin.mesh.visible=true;coin.respawn=0;
  }
}
function startGame(){
  setPigeonName($('pigeon-name').value);
  score=0;elapsed=0;health=3;boost=100;invulnerable=0;
  mouseSteer={x:0,y:0};
  playerPosition.set(0,0,0);pigeon.rotation.set(0,0,0);
  Object.assign(pigeon.userData.state,{air:false,y:0,vy:0,sp:0,h:0,b:0,o:0,ph:0,gp:0,t:0,tk:0,pitch:0,roll:0});
  pigeon.visible=true;
  enemies.forEach((enemy,i)=>{
    enemy.position.set(i===0?-9:9,0,i===0?-25:-39);
    enemy.rotation.set(0,0,0);enemy.visible=true;
  });
  resetCoins();updateHUD();setMode('playing');
  lastFrame=performance.now();
}
function pauseGame(){if(gameState==='playing')setMode('paused');}
function resumeGame(){if(gameState==='paused'){setMode('playing');lastFrame=performance.now();}}
function backToMenu(){enemies.forEach(e=>e.visible=false);setMode('menu');}
function finishGame(){
  setMode('gameover');
  $('gameover-message').textContent='Score : '+fmt(score)+' points · Temps : '+timeText(elapsed)+'. Les cuisses ont gagné cette manche, mais tu peux reprendre ton envol !';
}
function hitPlayer(){
  if(invulnerable>0||gameState!=='playing')return;
  health--;invulnerable=1.45;
  $('damage-flash').classList.add('hit');
  setTimeout(()=>$('damage-flash').classList.remove('hit'),190);
  audio.hit();updateHearts();
  toast('Aïe ! Une vie en moins.');
  if(health<=0)finishGame();
}
$('start-button').addEventListener('click',startGame);
$('pause-button').addEventListener('click',pauseGame);
$('resume-button').addEventListener('click',resumeGame);
$('menu-button').addEventListener('click',backToMenu);
$('retry-button').addEventListener('click',startGame);
$('gameover-menu-button').addEventListener('click',backToMenu);
$('music-button').addEventListener('click',async()=>{
  const active=await audio.toggle();
  $('music-button').innerHTML=active?'♫ <span>SON ON</span>':'♫ <span>SON OFF</span>';
  toast(active?'Ambiance musicale activée':'Ambiance musicale coupée');
});

function handleKeyDown(event){
  const code=event.code;
  if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Space'].includes(code))event.preventDefault();
  keys[code]=true;
  if(code==='Escape'){
    if(gameState==='playing')pauseGame();
    else if(gameState==='paused')resumeGame();
  }
}
function handleKeyUp(event){keys[event.code]=false;}
window.addEventListener('keydown',handleKeyDown);
window.addEventListener('keyup',handleKeyUp);
window.addEventListener('pointermove',event=>{
  if(gameState!=='playing'||event.pointerType==='touch')return;
  mouseSteer.x=clamp((event.clientX/window.innerWidth)*2-1,-1,1);
  mouseSteer.y=clamp((event.clientY/window.innerHeight)*2-1,-1,1);
});
window.addEventListener('blur',()=>{mouseSteer={x:0,y:0};if(gameState==='playing')pauseGame();});

document.querySelectorAll('.dpad button').forEach(button=>{
  const key=button.dataset.key;
  const down=e=>{e.preventDefault();keys[key]=true;};
  const up=e=>{e.preventDefault();keys[key]=false;};
  button.addEventListener('pointerdown',down);
  button.addEventListener('pointerup',up);
  button.addEventListener('pointercancel',up);
  button.addEventListener('pointerleave',up);
});
const mobileBoost=$('mobile-boost');
mobileBoost.addEventListener('pointerdown',e=>{e.preventDefault();keys.Space=true;});
['pointerup','pointercancel','pointerleave'].forEach(evt=>mobileBoost.addEventListener(evt,e=>{e.preventDefault();keys.Space=false;}));

function deadzone(value,zone=.08){
  const a=Math.abs(value);
  return a<zone?0:Math.sign(value)*(a-zone)/(1-zone);
}
function updatePlayer(dt){
  // Mouse X steers yaw; mouse Y climbs or dives. ZQSD remains available.
  const left=keys.KeyQ||keys.KeyA||keys.ArrowLeft;
  const right=keys.KeyD||keys.ArrowRight;
  const forward=keys.KeyZ||keys.KeyW||keys.ArrowUp;
  const backward=keys.KeyS||keys.ArrowDown;
  const keyTurn=(right?1:0)-(left?1:0);
  const lift=clamp(-deadzone(mouseSteer.y)+(keys.KeyE?1:0)-(keys.KeyC||keys.ShiftLeft||keys.ShiftRight?1:0),-1,1);
  const skin=skins.find(s=>s.id===selectedSkin)||skins[0];
  const boosting=keys.Space&&boost>1;
  pigeon.userData.control({
    fwd:(forward?1:0)-(backward?1:0),
    turn:clamp(keyTurn+deadzone(mouseSteer.x)*.95,-1,1),
    lift,up:keys.KeyE,down:keys.KeyC||keys.ShiftLeft||keys.ShiftRight,
    boost:boosting,speedMultiplier:skin.speed,boostMultiplier:skin.boost
  },dt);
  if(boosting)boost=Math.max(0,boost-36*dt/skin.boost);
  else boost=Math.min(100,boost+17*dt);
  if(invulnerable>0){
    invulnerable-=dt;pigeon.visible=Math.floor(elapsed*14)%2===0;
    if(invulnerable<=0)pigeon.visible=true;
  }
}
function updateCamera(dt){
  const flight=pigeon.userData.state;
  const forward=new THREE.Vector3(Math.sin(flight.h),0,Math.cos(flight.h));
  const focus=playerPosition.clone().add(new THREE.Vector3(0,1.65,0));
  const desired=focus.clone().addScaledVector(forward,-13.5).add(new THREE.Vector3(0,5.5+Math.min(flight.y*.09,2.8),0));
  camera.position.lerp(desired,1-Math.exp(-3.5*dt));
  const look=focus.clone().addScaledVector(forward,5.5).add(new THREE.Vector3(0,-flight.pitch*2.2,0));
  camera.lookAt(look);
}
function updateEnemies(dt){
  enemies.forEach((enemy,index)=>{
    if(!enemy.visible)return;
    const dx=playerPosition.x-enemy.position.x,dz=playerPosition.z-enemy.position.z;
    const dist=Math.hypot(dx,dz)||.001;
    const speed=7.1+Math.min(elapsed*.012,2);
    enemy.position.x+=dx/dist*speed*dt;
    enemy.position.z+=dz/dist*speed*dt;
    enemy.position.y=.04+Math.sin(elapsed*3.5+index)*.04;
    enemy.rotation.y=Math.atan2(dx,dz);
    enemy.userData.update(elapsed);
    if(dist<2.45&&Math.abs(playerPosition.y-enemy.position.y)<2.7){
      hitPlayer();
      const push= index===0?-1:1;
      enemy.position.x=clamp(playerPosition.x+push*22,-220,220);
      enemy.position.z=clamp(playerPosition.z+(index===0?26:-26),-220,220);
    }
  });
}
function updateTrafficCollisions(){
  if(playerPosition.y>1.35||invulnerable>0)return;
  for(const car of world.cars){
    const dx=car.x-playerPosition.x,dz=car.z-playerPosition.z;
    if(dx*dx+dz*dz<4.3){
      hitPlayer();
      const distance=Math.hypot(dx,dz)||1;
      playerPosition.x+=dx/distance*2.7;playerPosition.z+=dz/distance*2.7;
      const state=pigeon.userData.state;
      state.air=true;state.y=1.2;state.vy=2.8;
      playerPosition.y=1.2;
      break;
    }
  }
}
function collectCoins(){
  for(const coin of world.coins){
    if(!coin.mesh.visible)continue;
    const dx=coin.mesh.position.x-playerPosition.x;
    const dz=coin.mesh.position.z-playerPosition.z;
    const dy=coin.mesh.position.y-playerPosition.y;
    if(dx*dx+dz*dz<4.5&&Math.abs(dy)<2.8){
      coin.mesh.visible=false;coin.respawn=rand(5,9);
      score+=50;wallet+=5;persist();updateWallet();
      audio.pickup();toast('+50 points  ·  +5 pièces');
    }
  }
}
function updateDayNight(dt){
  dayClock+=dt;
  const day=.12+.88*(.5+.5*Math.cos(dayClock*Math.PI*2/220));
  return world.updateLighting(day);
}
function rand(a,b){return a+Math.random()*(b-a);}

function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastFrame)/1000,.045);lastFrame=now;
  const label=updateDayNight(gameState==='playing'?dt:dt*.22);
  world.update(dt,elapsed);
  audio.update();
  if(gameState==='playing'){
    elapsed+=dt;score+=dt*2;
    updatePlayer(dt);updateEnemies(dt);updateTrafficCollisions();collectCoins();updateCamera(dt);
    hudClock+=dt;
    if(hudClock>.12){updateHUD();hudClock=0;}
  }else if(gameState==='menu'){
    pigeon.position.y=0;
    pigeon.rotation.y=Math.sin(now*.00015)*.08;
    pigeon.userData.setWings(0,Math.sin(now*.0018)*.10,0);
    camera.position.lerp(new THREE.Vector3(Math.sin(now*.0001)*7,5.8,-11),.014);
    camera.lookAt(0,1.6,0);
  }
  $('day-label').textContent=label;
  if(toastClock>0){toastClock-=dt;if(toastClock<=0)$('toast').classList.remove('show');}
  renderer.render(scene,camera);
}
requestAnimationFrame(animate);

window.addEventListener('resize',()=>{
  camera.aspect=window.innerWidth/window.innerHeight;camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth,window.innerHeight);
});
