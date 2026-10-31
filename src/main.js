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
$('loading-text').textContent='Chargement des voitures 3D…';
await Promise.race([world.ready,new Promise(resolve=>setTimeout(resolve,9000))]);
$('loading').classList.add('done');
setTimeout(()=>$('loading').remove(),700);

const pigeonRoot=new THREE.Group();
scene.add(pigeonRoot);
let pigeon=createPigeon(selectedSkin,pigeonName);
pigeonRoot.add(pigeon);
pigeonRoot.position.set(0,5.7,0);
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
const playerPosition=pigeonRoot.position;

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
  if(pigeon)pigeonRoot.remove(pigeon);
  pigeon=createPigeon(selectedSkin,pigeonName);
  pigeonRoot.add(pigeon);
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
    if(Math.random()<.5)coin.mesh.position.set((Math.random()-.5)*430,5.6,n*50+(Math.random()-.5)*8);
    else coin.mesh.position.set(n*50+(Math.random()-.5)*8,5.6,(Math.random()-.5)*430);
    coin.mesh.visible=true;coin.respawn=0;
  }
}
function startGame(){
  setPigeonName($('pigeon-name').value);
  score=0;elapsed=0;health=3;boost=100;invulnerable=0;
  pigeonRoot.position.set(0,5.7,0);pigeonRoot.rotation.set(0,0,0);
  pigeon.visible=true;
  enemies.forEach((enemy,i)=>{
    enemy.position.set(i===0?-9:9,5.1,i===0?-25:-39);
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
window.addEventListener('blur',()=>{if(gameState==='playing')pauseGame();});

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

function isStreet(x,z){
  const dx=Math.abs(x-Math.round(x/50)*50);
  const dz=Math.abs(z-Math.round(z/50)*50);
  return Math.min(dx,dz)<9.7;
}
function moveOnRoad(position,dx,dz){
  const nx=clamp(position.x+dx,-230,230);
  const nz=clamp(position.z+dz,-230,230);
  if(isStreet(nx,nz)){position.x=nx;position.z=nz;return;}
  if(isStreet(nx,position.z))position.x=nx;
  if(isStreet(position.x,nz))position.z=nz;
}
function updatePlayer(dt){
  // Mapping explicite AZERTY : Q = gauche, D = droite, Z = avancer, S = reculer.
  const left=keys.KeyQ||keys.KeyA||keys.ArrowLeft;
  const right=keys.KeyD||keys.ArrowRight;
  const forward=keys.KeyZ||keys.KeyW||keys.ArrowUp;
  const backward=keys.KeyS||keys.ArrowDown;
  const x=(right?1:0)-(left?1:0);
  const z=(forward?1:0)-(backward?1:0);
  const amount=Math.hypot(x,z);
  const moving=amount>.01;
  const boosting=(keys.Space||keys.ShiftLeft||keys.ShiftRight)&&boost>1&&moving;
  const skin=skins.find(s=>s.id===selectedSkin)||skins[0];
  let speed=9.0*skin.speed;
  if(boosting){speed*=1.68*skin.boost;boost=Math.max(0,boost-38*dt/skin.boost);}
  else boost=Math.min(100,boost+18*dt);
  if(moving){
    const dx=x/amount*speed*dt,dz=z/amount*speed*dt;
    moveOnRoad(playerPosition,dx,dz);
    pigeonRoot.rotation.y=Math.atan2(dx,dz);
  }
  pigeonRoot.position.y=5.65+Math.sin(elapsed*5.2)*(moving?.13:.055)+(boosting?.2:0);
  const flap=Math.sin(elapsed*(boosting?19:moving?13:7))*(moving?.62:.22);
  pigeon.userData.wings[0].rotation.z=-flap;
  pigeon.userData.wings[1].rotation.z=flap;
  if(invulnerable>0){
    invulnerable-=dt;pigeon.visible=Math.floor(elapsed*14)%2===0;
    if(invulnerable<=0)pigeon.visible=true;
  }
  if(boosting&&Math.random()<.025)audio.boost();
}
function updateCamera(dt){
  // Caméra stable derrière le pigeon : D reste visuellement à droite et Q à gauche.
  const target=new THREE.Vector3(playerPosition.x,playerPosition.y+6.6,playerPosition.z-15.5);
  camera.position.lerp(target,1-Math.exp(-4.2*dt));
  camera.lookAt(playerPosition.x,playerPosition.y+0.5,playerPosition.z+4.2);
}
function updateEnemies(dt){
  enemies.forEach((enemy,index)=>{
    if(!enemy.visible)return;
    const dx=playerPosition.x-enemy.position.x,dz=playerPosition.z-enemy.position.z;
    const dist=Math.hypot(dx,dz)||.001;
    const speed=7.1+Math.min(elapsed*.012,2);
    enemy.position.x+=dx/dist*speed*dt;
    enemy.position.z+=dz/dist*speed*dt;
    enemy.position.y=5.1+Math.sin(elapsed*3.5+index)*.17;
    enemy.rotation.y=Math.atan2(dx,dz);
    enemy.userData.update(elapsed);
    if(dist<2.45){
      hitPlayer();
      const push= index===0?-1:1;
      enemy.position.x=clamp(playerPosition.x+push*22,-220,220);
      enemy.position.z=clamp(playerPosition.z+(index===0?26:-26),-220,220);
    }
  });
}
function collectCoins(){
  for(const coin of world.coins){
    if(!coin.mesh.visible)continue;
    const dx=coin.mesh.position.x-playerPosition.x;
    const dz=coin.mesh.position.z-playerPosition.z;
    const dy=coin.mesh.position.y-playerPosition.y;
    if(dx*dx+dz*dz<4.5&&Math.abs(dy)<2.7){
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
    updatePlayer(dt);updateEnemies(dt);collectCoins();updateCamera(dt);
    hudClock+=dt;
    if(hudClock>.12){updateHUD();hudClock=0;}
  }else if(gameState==='menu'){
    pigeonRoot.position.y=5.7+Math.sin(now*.0008)*.12;
    pigeon.rotation.y=Math.sin(now*.00015)*.08;
    pigeon.userData.wings[0].rotation.z=Math.sin(now*.003)*.12;
    pigeon.userData.wings[1].rotation.z=-Math.sin(now*.003)*.12;
    camera.position.lerp(new THREE.Vector3(Math.sin(now*.0001)*7,12,-22),.014);
    camera.lookAt(0,7,12);
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
