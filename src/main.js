import * as THREE from 'three';
import { createWorld } from './world.js';
import { createShark } from './shark.js';
import { createOrca } from './orca.js';
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
  {id:'common',name:'Requin bleu',rarity:'CLASSIQUE',price:0,speed:1,boost:1,accent:'#73b7c8'},
  {id:'white',name:'Requin blanc',rarity:'RARE',price:150,speed:1.03,boost:1.02,accent:'#e1f2ef'},
  {id:'tiger',name:'Requin tigre',rarity:'LÉGENDAIRE',price:300,speed:1.12,boost:1.08,accent:'#e4a66e'},
  {id:'abyss',name:'Requin des abysses',rarity:'MYTHIQUE',price:500,speed:1.28,boost:1.18,accent:'#477c9d'},
  {id:'neon',name:'Requin néon',rarity:'DIVIN',price:700,speed:1.20,boost:1.35,accent:'#65e6d5'}
];

let wallet=read('de-wallet',2000);
if(!Number.isFinite(wallet)||wallet<0)wallet=2000;
let unlocked=read('de-unlocked',['common']);
if(!Array.isArray(unlocked))unlocked=['common'];
if(!unlocked.includes('common'))unlocked.unshift('common');
let selectedSkin=read('de-skin','common');
if(!skins.some(s=>s.id===selectedSkin)||!unlocked.includes(selectedSkin))selectedSkin='common';
let sharkName=String(read('de-name','Mako')).slice(0,18)||'Mako';

const scene=new THREE.Scene();
const camera=new THREE.PerspectiveCamera(61,window.innerWidth/window.innerHeight,.1,900);
camera.position.set(0,10,-17);
const renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.4));
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.shadowMap.enabled=false;
renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.15;
$('scene').appendChild(renderer.domElement);

const world=await createWorld(scene);
$('loading-text').textContent='Mise en place des récifs et des courants…';
await world.ready;
$('loading').classList.add('done');
setTimeout(()=>$('loading').remove(),700);

const skinPalettes={
  common:{},
  white:{body:'#d9e6e7',belly:'#f8fbf6',fin:'#aabfc5',detail:'#687e84',eye:'#dba95d',glow:'#c4f5ef'},
  tiger:{body:'#a86b4f',belly:'#ead8bf',fin:'#754332',detail:'#3e2a25',eye:'#eebc63',glow:'#ffb56c'},
  abyss:{body:'#213d61',belly:'#7599a8',fin:'#101f3b',detail:'#091629',eye:'#ffb86d',glow:'#397de3'},
  neon:{body:'#28a6a2',belly:'#b8fff0',fin:'#08716f',detail:'#063b4b',eye:'#fff2a1',glow:'#59fff0'}
};
function buildShark(){
  return createShark({colors:skinPalettes[selectedSkin]||{},name:sharkName,scale:1});
}
let shark=buildShark();
scene.add(shark);
let playerPosition=shark.position;
shark.visible=true;

const orcas=[];
for(let i=0;i<2;i++){
  const enemy=createOrca();
  scene.add(enemy);
  enemy.visible=false;
  orcas.push(enemy);
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
  write('de-wallet',wallet);write('de-unlocked',unlocked);
  write('de-skin',selectedSkin);write('de-name',sharkName);
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
  $('hud-shark-name').textContent=sharkName;
  updateWallet();updateHearts();
}
function updateSkinShop(){
  const root=$('skin-list');root.innerHTML='';
  for(const skin of skins){
    const owned=unlocked.includes(skin.id);
    const card=document.createElement('button');
    card.type='button';card.className='skin-card'+(selectedSkin===skin.id?' selected':'');
    card.style.setProperty('--accent',skin.accent);
    card.innerHTML='<span class="skin-price">'+(owned?(selectedSkin===skin.id?'ÉQUIPÉ':'POSSÉDÉ'):fmt(skin.price)+' 🪙')+'</span><div class="skin-row"><span class="skin-avatar">🦈</span><span><b>'+skin.name+'</b><small>'+skin.rarity+'</small></span></div>';
    card.addEventListener('click',()=>{
      if(!unlocked.includes(skin.id)){
        if(wallet<skin.price){toast('Il te manque des perles pour ce skin.');return;}
        wallet-=skin.price;unlocked.push(skin.id);toast(skin.name+' débloqué !');
      }
      selectedSkin=skin.id;replaceShark();persist();updateSkinShop();updateWallet();
    });
    root.appendChild(card);
  }
}
function replaceShark(){
  const oldPosition=shark.position.clone();
  const oldRotation=shark.rotation.clone();
  if(shark)scene.remove(shark);
  shark=buildShark();
  scene.add(shark);
  shark.position.copy(oldPosition);
  shark.rotation.copy(oldRotation);
  playerPosition=shark.position;
  shark.visible=true;
}
function setSharkName(value){
  sharkName=String(value).trim().slice(0,18)||'Mako';
  $('shark-name').value=sharkName;
  shark.userData.updateName?.(sharkName);
  persist();$('hud-shark-name').textContent=sharkName;
}
$('shark-name').value=sharkName;
$('shark-name').addEventListener('change',()=>setSharkName($('shark-name').value));
$('shark-name').addEventListener('keydown',event=>{if(event.key==='Enter')$('shark-name').blur();});
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
    const y=rand(-6,25);
    coin.baseY=y;
    coin.mesh.position.set((Math.random()-.5)*440,y,(Math.random()-.5)*440);
    coin.mesh.visible=true;coin.respawn=0;
  }
}
function startGame(){
  setSharkName($('shark-name').value);
  score=0;elapsed=0;health=3;boost=100;invulnerable=0;
  mouseSteer={x:0,y:0};
  playerPosition.set(0,0,0);shark.rotation.set(0,0,0);
  Object.assign(shark.userData.state,{air:true,y:0,vy:0,sp:0,h:0,pitch:0,roll:0,phase:0,t:0});
  shark.visible=true;
  orcas.forEach((enemy,i)=>{
    enemy.position.set(i===0?-13:13,i===0?3:-4,i===0?-27:-42);
    enemy.rotation.set(0,0,0);enemy.visible=true;
  });
  resetCoins();updateHUD();setMode('playing');
  lastFrame=performance.now();
}
function pauseGame(){if(gameState==='playing')setMode('paused');}
function resumeGame(){if(gameState==='paused'){setMode('playing');lastFrame=performance.now();}}
function backToMenu(){orcas.forEach(e=>e.visible=false);setMode('menu');}
function finishGame(){
  setMode('gameover');
  $('gameover-message').textContent='Score : '+fmt(score)+' points · Temps : '+timeText(elapsed)+'. Les orques ont gagné cette manche, mais tu peux replonger !';
}
function hitPlayer(){
  if(invulnerable>0||gameState!=='playing')return;
  health--;invulnerable=1.45;
  $('damage-flash').classList.add('hit');
  setTimeout(()=>$('damage-flash').classList.remove('hit'),190);
  audio.hit();updateHearts();
  toast('Attention ! Une vie en moins.');
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
  toast(active?'Ambiance aquatique activée':'Ambiance coupée');
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

document.querySelectorAll('.dpad button, .lift-pad button').forEach(button=>{
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
  // Mouse X steers the shark; mouse Y changes depth. ZQSD remains available.
  const left=keys.KeyQ||keys.KeyA||keys.ArrowLeft;
  const right=keys.KeyD||keys.ArrowRight;
  const forward=keys.KeyZ||keys.KeyW||keys.ArrowUp;
  const backward=keys.KeyS||keys.ArrowDown;
  const keyTurn=(right?1:0)-(left?1:0);
  const lift=clamp(-deadzone(mouseSteer.y)+(keys.KeyE?1:0)-(keys.KeyC||keys.ShiftLeft||keys.ShiftRight?1:0),-1,1);
  const skin=skins.find(s=>s.id===selectedSkin)||skins[0];
  const boosting=keys.Space&&boost>1;
  shark.userData.control({
    fwd:(forward?1:0)-(backward?1:0),
    turn:clamp(keyTurn+deadzone(mouseSteer.x)*.95,-1,1),
    lift,up:keys.KeyE,down:keys.KeyC||keys.ShiftLeft||keys.ShiftRight,
    boost:boosting,speedMultiplier:skin.speed,boostMultiplier:skin.boost
  },dt);
  if(boosting)boost=Math.max(0,boost-36*dt/skin.boost);
  else boost=Math.min(100,boost+17*dt);
  if(invulnerable>0){
    invulnerable-=dt;shark.visible=Math.floor(elapsed*14)%2===0;
    if(invulnerable<=0)shark.visible=true;
  }
}
function updateCamera(dt){
  const swim=shark.userData.state;
  const forward=new THREE.Vector3(Math.sin(swim.h),0,Math.cos(swim.h));
  const focus=playerPosition.clone().add(new THREE.Vector3(0,.45,0));
  const desired=focus.clone().addScaledVector(forward,-15.5).add(new THREE.Vector3(0,4.2,0));
  camera.position.lerp(desired,1-Math.exp(-3.2*dt));
  const look=focus.clone().addScaledVector(forward,6.5).add(new THREE.Vector3(0,-swim.pitch*1.8,0));
  camera.lookAt(look);
}
function updateEnemies(dt){
  orcas.forEach((enemy,index)=>{
    if(!enemy.visible)return;
    const dx=playerPosition.x-enemy.position.x;
    const dy=playerPosition.y-enemy.position.y;
    const dz=playerPosition.z-enemy.position.z;
    const horizontal=Math.hypot(dx,dz)||.001;
    const dist=Math.hypot(horizontal,dy)||.001;
    const speed=5.7+Math.min(elapsed*.014,2.1);
    enemy.position.x+=dx/dist*speed*dt;
    enemy.position.y+=dy/dist*speed*dt;
    enemy.position.z+=dz/dist*speed*dt;
    enemy.rotation.y=Math.atan2(dx,dz);
    enemy.rotation.x=-Math.atan2(dy,horizontal);
    enemy.userData.update(elapsed);
    if(dist<3.35){
      hitPlayer();
      enemy.position.set(
        clamp(playerPosition.x+(index===0?-24:24),-220,220),
        clamp(playerPosition.y+(index===0?5:-5),-7,25),
        clamp(playerPosition.z+(index===0?27:-27),-220,220)
      );
    }
  });
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
      audio.pickup();toast('+50 points  ·  +5 perles');
    }
  }
}
function updateOceanLight(dt){
  dayClock+=dt;
  const day=.12+.88*(.5+.5*Math.cos(dayClock*Math.PI*2/220));
  return world.updateLighting(day);
}
function rand(a,b){return a+Math.random()*(b-a);}

function animate(now){
  requestAnimationFrame(animate);
  const dt=Math.min((now-lastFrame)/1000,.045);lastFrame=now;
  const label=updateOceanLight(gameState==='playing'?dt:dt*.22);
  world.update(dt,elapsed);
  audio.update();
  if(gameState==='playing'){
    elapsed+=dt;score+=dt*2;
    updatePlayer(dt);updateEnemies(dt);collectCoins();updateCamera(dt);
    hudClock+=dt;
    if(hudClock>.12){updateHUD();hudClock=0;}
  }else if(gameState==='menu'){
    shark.position.y=0;
    shark.rotation.y=Math.sin(now*.00015)*.08;
    shark.userData.setSwimPose(Math.sin(now*.0018)*.10);
    camera.position.lerp(new THREE.Vector3(Math.sin(now*.0001)*7,5.8,-11),.014);
    camera.lookAt(0,0,0);
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
