import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const CAR_MODEL_URL='https://cdn.3dassets.dev/assets/32487/v1/model.glb';
const GRID=50, ROAD_WIDTH=20, LIMIT=238;

function canvasTexture(kind){
  const canvas=document.createElement('canvas');canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext('2d');
  if(kind==='asphalt'){
    ctx.fillStyle='#33383c';ctx.fillRect(0,0,512,512);
    for(let i=0;i<24000;i++){
      const x=Math.random()*512,y=Math.random()*512;
      const n=80+Math.floor(Math.random()*70);
      ctx.fillStyle='rgba('+n+','+n+','+n+',0.18)';
      ctx.fillRect(x,y,Math.random()*2.6+.3,Math.random()*2.6+.3);
    }
    for(let i=0;i<180;i++){
      ctx.fillStyle='rgba(15,17,20,.12)';ctx.beginPath();
      ctx.ellipse(Math.random()*512,Math.random()*512,Math.random()*18+4,Math.random()*5+1,Math.random(),0,Math.PI*2);ctx.fill();
    }
  }else if(kind==='brick'){
    ctx.fillStyle='#765044';ctx.fillRect(0,0,512,512);
    const rowH=26,brickW=64;
    for(let y=0,row=0;y<512;y+=rowH,row++){
      ctx.fillStyle='rgba(38,24,20,.45)';ctx.fillRect(0,y,512,2);
      const offset=row%2?0:brickW/2;
      for(let x=-brickW;x<512;x+=brickW){
        const xx=x+offset;
        const hue=Math.random()>.5?'rgba(210,151,119,.10)':'rgba(25,19,17,.12)';
        ctx.fillStyle=hue;ctx.fillRect(xx+2,y+3,brickW-4,rowH-5);
      }
    }
    for(let y=34;y<512;y+=76){
      for(let x=28;x<512;x+=92){
        const xx=x+(Math.floor(y/76)%2)*14;
        ctx.fillStyle='#292e35';ctx.fillRect(xx-4,y-5,47,55);
        ctx.fillStyle='#667b85';ctx.fillRect(xx,y,39,44);
        ctx.fillStyle='rgba(225,236,241,.48)';ctx.fillRect(xx+4,y+4,3,36);
        ctx.fillStyle='#3e4245';ctx.fillRect(xx-6,y+44,51,4);
        ctx.fillStyle='rgba(242,193,116,.28)';if(Math.random()>.58)ctx.fillRect(xx+20,y+3,18,37);
      }
    }
  }else if(kind==='glass'){
    const grad=ctx.createLinearGradient(0,0,512,512);grad.addColorStop(0,'#172d3c');grad.addColorStop(.5,'#345465');grad.addColorStop(1,'#111e2c');
    ctx.fillStyle=grad;ctx.fillRect(0,0,512,512);
    for(let y=0;y<512;y+=52){
      for(let x=0;x<512;x+=46){
        ctx.fillStyle=Math.random()>.78?'#d0ad76':'#223d4d';ctx.fillRect(x+3,y+3,39,43);
        ctx.fillStyle='rgba(210,235,245,.28)';ctx.fillRect(x+6,y+5,3,38);
        ctx.fillStyle='rgba(8,15,22,.68)';ctx.fillRect(x+1,y+46,44,5);
      }
    }
    ctx.strokeStyle='rgba(210,230,241,.23)';ctx.lineWidth=4;
    for(let x=0;x<512;x+=46){ctx.beginPath();ctx.moveTo(x,0);ctx.lineTo(x,512);ctx.stroke();}
  }else{
    ctx.fillStyle='#9a9184';ctx.fillRect(0,0,512,512);
    for(let i=0;i<9000;i++){const v=Math.random()>.5?255:0;ctx.fillStyle='rgba('+v+','+v+','+v+',.035)';ctx.fillRect(Math.random()*512,Math.random()*512,2,2);}
    for(let y=32;y<512;y+=72){
      for(let x=30;x<512;x+=83){
        ctx.fillStyle='#3d4952';ctx.fillRect(x,y,42,45);
        ctx.fillStyle='#8398a0';ctx.fillRect(x+4,y+4,34,37);
        ctx.fillStyle='rgba(238,204,139,.35)';if(Math.random()>.7)ctx.fillRect(x+5,y+5,30,33);
        ctx.fillStyle='#c0b8a7';ctx.fillRect(x-4,y+44,50,5);
      }
    }
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.anisotropy=4;
  return texture;
}

function makePlane(scene,w,d,x,z,material,y=0.01){
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(w,d),material);
  mesh.rotation.x=-Math.PI/2;mesh.position.set(x,y,z);mesh.receiveShadow=true;scene.add(mesh);return mesh;
}
function addBox(scene,w,h,d,x,y,z,material,shadow=true){
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  mesh.position.set(x,y,z);if(shadow){mesh.castShadow=true;mesh.receiveShadow=true;}scene.add(mesh);return mesh;
}
function createFacade(kind){
  const texture=canvasTexture(kind);
  return new THREE.MeshStandardMaterial({map:texture,roughness:kind==='glass'?.36:.88,metalness:kind==='glass'?.25:.02});
}

function addFireEscape(scene,x,y,z,width,depth,height,material){
  const levels=Math.floor(height/7);
  const platformDepth=1.6;
  for(let i=1;i<=Math.min(levels,7);i++){
    const yy=i*6.2;
    addBox(scene,width,0.14,platformDepth,x,yy,z,material,false);
    for(const side of [-1,1])addBox(scene,0.08,0.85,platformDepth,x+side*(width/2-.05),yy+.46,z,material,false);
    addBox(scene,width,0.08,0.08,x,yy+.88,z+platformDepth/2-.05,material,false);
    for(let j=0;j<7;j++)addBox(scene,.035,.7,.035,x-width/2+j*width/6,yy+.45,z+platformDepth/2-.05,material,false);
    if(i>1){
      const ladderX=x+width/2+.55;
      addBox(scene,.07,6.2,.07,ladderX,yy-3.1,z+platformDepth/2,material,false);
      addBox(scene,.07,6.2,.07,ladderX+.42,yy-3.1,z+platformDepth/2,material,false);
      for(let r=0;r<8;r++)addBox(scene,.48,.045,.055,ladderX+.21,yy-5.8+r*.72,z+platformDepth/2,material,false);
    }
  }
}

function createBuilding(scene,x,z,w,d,h,kind,materials){
  const side=materials[kind];
  const roofMat=materials.roof;
  const geo=new THREE.BoxGeometry(w,h,d);
  const mesh=new THREE.Mesh(geo,[side,side,roofMat,roofMat,side,side]);
  mesh.position.set(x,h/2,z);mesh.castShadow=true;mesh.receiveShadow=true;scene.add(mesh);
  addBox(scene,w+.45,.38,d+.45,x,h+.18,z,roofMat,false);
  const parapetMat=new THREE.MeshStandardMaterial({color:kind==='glass'?0x45535d:0x4d4945,roughness:.9});
  addBox(scene,w,.22,.22,x,h+.48,z-d/2,parapetMat,false);
  addBox(scene,w,.22,.22,x,h+.48,z+d/2,parapetMat,false);
  addBox(scene,.22,.22,d,x-w/2,h+.48,z,parapetMat,false);
  addBox(scene,.22,.22,d,x+w/2,h+.48,z,parapetMat,false);
  if(kind==='brick'&&h>25){
    addFireEscape(scene,x-w/2+.8,h,z+d/2+.06,3.4,d*.05,h,materials.metal);
  }
  if(h>48){
    const tank=new THREE.Mesh(new THREE.CylinderGeometry(1.25,1.35,2.3,12),new THREE.MeshStandardMaterial({color:0x69767d,metalness:.45,roughness:.48}));
    tank.position.set(x+w*.22,h+1.5,z-d*.15);tank.castShadow=true;scene.add(tank);
    const antenna=addBox(scene,.12,5,.12,x-w*.23,h+2.8,z,materials.metal,false);
  }
}

function addTree(scene,x,z,scale=1){
  const bark=new THREE.MeshStandardMaterial({color:0x594638,roughness:1});
  const leaves=[
    new THREE.MeshStandardMaterial({color:0x526d4b,roughness:1}),
    new THREE.MeshStandardMaterial({color:0x688458,roughness:1}),
    new THREE.MeshStandardMaterial({color:0x405d43,roughness:1})
  ];
  const trunk=new THREE.Mesh(new THREE.CylinderGeometry(.16*scale,.25*scale,3.6*scale,8),bark);
  trunk.position.set(x,1.8*scale,z);trunk.castShadow=true;scene.add(trunk);
  for(let i=0;i<6;i++){
    const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(1.45*scale,1),leaves[i%3]);
    leaf.position.set(x+(Math.random()-.5)*1.65*scale,3.2*scale+Math.random()*2.1*scale,z+(Math.random()-.5)*1.65*scale);
    leaf.scale.set(.85+Math.random()*.3,1.15+Math.random()*.5,.85+Math.random()*.3);
    leaf.castShadow=true;scene.add(leaf);
  }
}
function addStreetLamp(scene,x,z){
  const metal=new THREE.MeshStandardMaterial({color:0x343c43,metalness:.65,roughness:.42});
  const bulbMat=new THREE.MeshStandardMaterial({color:0xffe2a5,emissive:0xffc56a,emissiveIntensity:.1});
  const pole=new THREE.Mesh(new THREE.CylinderGeometry(.075,.12,7.4,10),metal);pole.position.set(x,3.7,z);pole.castShadow=true;scene.add(pole);
  const arm=addBox(scene,1.3,.09,.09,x+.58,7.15,z,metal,false);
  const lamp=new THREE.Mesh(new THREE.SphereGeometry(.22,12,10),bulbMat);lamp.position.set(x+1.17,6.98,z);scene.add(lamp);
}
function addTrafficLight(scene,x,z,turn){
  const metal=new THREE.MeshStandardMaterial({color:0x252c31,metalness:.3,roughness:.7});
  const housing=new THREE.MeshStandardMaterial({color:0x20272b,roughness:.8});
  const red=new THREE.MeshStandardMaterial({color:0xf34d49,emissive:0x72100d,emissiveIntensity:.35});
  const amber=new THREE.MeshStandardMaterial({color:0xffcb5c,emissive:0x6d4c0c,emissiveIntensity:.12});
  const green=new THREE.MeshStandardMaterial({color:0x65c987,emissive:0x123e21,emissiveIntensity:.12});
  const post=new THREE.Mesh(new THREE.CylinderGeometry(.08,.1,5.2,8),metal);post.position.set(x,2.6,z);scene.add(post);
  const box=new THREE.Mesh(new THREE.BoxGeometry(.55,1.35,.42),housing);box.position.set(x,5.65,z);scene.add(box);
  [red,amber,green].forEach((mat,i)=>{const bulb=new THREE.Mesh(new THREE.SphereGeometry(.14,10,8),mat);bulb.position.set(x,6.06-i*.41,z+.22);scene.add(bulb);});
}

function fallbackCar(scene,axis,lane,position,direction,color){
  const root=new THREE.Group();const paint=new THREE.MeshStandardMaterial({color,metalness:.48,roughness:.35});
  const glass=new THREE.MeshStandardMaterial({color:0x223b4c,metalness:.3,roughness:.2});
  const rubber=new THREE.MeshStandardMaterial({color:0x17191c,roughness:.9});
  addBox(root,2,0.72,4.2,0,.68,0,paint);
  addBox(root,1.58,.78,2.15,0,1.32,-.10,glass);
  addBox(root,1.52,.1,1.85,0,1.75,-.10,paint);
  for(const x of [-1,1])for(const z of [-1.3,1.3]){
    const wheel=new THREE.Mesh(new THREE.CylinderGeometry(.36,.36,.22,14),rubber);
    wheel.rotation.z=Math.PI/2;wheel.position.set(x,.43,z);root.add(wheel);
  }
  root.position.set(axis==='x'?position:lane,0,axis==='z'?position:lane);
  root.rotation.y=axis==='x'?(direction>0?Math.PI/2:-Math.PI/2):(direction>0?0:Math.PI);
  scene.add(root);
  return root;
}

export async function createWorld(scene){
  const city=new THREE.Group();scene.add(city);
  const asphalt=canvasTexture('asphalt');
  const roadMat=new THREE.MeshStandardMaterial({map:asphalt,roughness:.9,metalness:.02});
  const sidewalkMat=new THREE.MeshStandardMaterial({color:0x8d8d89,roughness:.95});
  const concreteMat=new THREE.MeshStandardMaterial({color:0x747b7f,roughness:.93});
  const lineMat=new THREE.MeshStandardMaterial({color:0xd7c89e,roughness:.82});
  const materials={
    brick:createFacade('brick'),glass:createFacade('glass'),stone:createFacade('stone'),
    roof:new THREE.MeshStandardMaterial({color:0x454c51,roughness:.9}),
    metal:new THREE.MeshStandardMaterial({color:0x3d454a,metalness:.62,roughness:.42})
  };
  makePlane(city,520,520,0,0,new THREE.MeshStandardMaterial({color:0x5f665d,roughness:1}),-.2);
  const roads=[];
  for(let i=-4;i<=4;i++){
    const n=i*GRID;
    makePlane(city,520,ROAD_WIDTH,0,n,roadMat,.005);
    makePlane(city,ROAD_WIDTH,520,n,0,roadMat,.006);
    makePlane(city,520,2.1,0,n+10.9,sidewalkMat,.018);
    makePlane(city,520,2.1,0,n-10.9,sidewalkMat,.018);
    makePlane(city,2.1,520,n+10.9,0,sidewalkMat,.019);
    makePlane(city,2.1,520,n-10.9,0,sidewalkMat,.019);
    for(let p=-250;p<260;p+=18){
      addBox(city,7,.018,.13,p,.028,n,lineMat,false);
      addBox(city,.13,.018,7,n,.029,p,lineMat,false);
    }
    roads.push(n);
  }

  // Crosswalks, drains and junction details.
  const whiteLine=new THREE.MeshStandardMaterial({color:0xd7d9d7,roughness:.8});
  const drainMat=new THREE.MeshStandardMaterial({color:0x292f32,metalness:.28,roughness:.8});
  for(const x of roads)for(const z of roads){
    for(let k=0;k<7;k++){
      addBox(city,.7,.025,4.4,x-7.3+k*2.25,.035,z,whiteLine,false);
      addBox(city,4.4,.025,.7,x,.036,z-7.3+k*2.25,whiteLine,false);
    }
    addBox(city,1.25,.035,.75,x+12,.04,z+12,drainMat,false);
  }

  // Manhattan blocks: brick walk-ups, older stone offices and modern glass towers.
  const colors=['brick','glass','stone'];
  for(let bx=-4;bx<4;bx++){
    for(let bz=-4;bz<4;bz++){
      const cx=bx*GRID+GRID/2,cz=bz*GRID+GRID/2;
      const kind1=colors[Math.floor(Math.random()*3)];
      const kind2=Math.random()>.55?'brick':(Math.random()>.5?'stone':'glass');
      const h1=kind1==='glass'?rand(52,112):rand(22,66);
      const h2=kind2==='glass'?rand(48,100):rand(18,54);
      createBuilding(city,cx-7.2,cz-2,13.8,30,h1,kind1,materials);
      createBuilding(city,cx+7.2,cz+3,13.8,29,h2,kind2,materials);
      if(Math.random()>.45){
        addTree(city,cx-14.8,cz-12,rand(.75,1.08));
        addTree(city,cx+14.8,cz+11,rand(.75,1.05));
      }
    }
  }

  // Fire hydrants, lamps and traffic signals establish the street scale.
  const hydrantMat=new THREE.MeshStandardMaterial({color:0xb63833,metalness:.25,roughness:.5});
  for(let i=-4;i<=4;i++){
    const n=i*GRID;
    for(const p=-210;p<=210;p+=70){
      if(Math.random()>.35){
        addStreetLamp(city,n+13,p);
        addStreetLamp(city,p,n-13);
      }
      if(Math.random()>.55){
        const hydrant=new THREE.Mesh(new THREE.CylinderGeometry(.21,.24,.66,10),hydrantMat);
        hydrant.position.set(n+12.3,.36,p+3);city.add(hydrant);
        const cap=new THREE.Mesh(new THREE.SphereGeometry(.21,10,8),hydrantMat);cap.position.set(n+12.3,.72,p+3);city.add(cap);
      }
    }
    addTrafficLight(city,n+12,12);
  }

  // Sun, sky and soft city haze.
  const skyDay=new THREE.Color(0x94bfd5),skyNight=new THREE.Color(0x101827);
  scene.background=skyDay.clone();
  scene.fog=new THREE.Fog(skyDay.clone(),115,360);
  const hemi=new THREE.HemisphereLight(0xd7e9f5,0x65574a,1.1);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0xffe7c4,2.25);
  sun.position.set(-90,125,80);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);
  sun.shadow.camera.left=-145;sun.shadow.camera.right=145;sun.shadow.camera.top=145;sun.shadow.camera.bottom=-145;
  sun.shadow.camera.near=1;sun.shadow.camera.far=340;sun.shadow.bias=-0.00018;scene.add(sun);
  const fill=new THREE.DirectionalLight(0x93bfe2,.35);fill.position.set(65,42,-90);scene.add(fill);

  const starPos=[];
  for(let i=0;i<700;i++){const a=Math.random()*Math.PI*2,r=rand(150,290),y=rand(40,160);starPos.push(Math.cos(a)*r,y,Math.sin(a)*r);}
  const starGeo=new THREE.BufferGeometry();starGeo.setAttribute('position',new THREE.Float32BufferAttribute(starPos,3));
  const stars=new THREE.Points(starGeo,new THREE.PointsMaterial({color:0xffffff,size:1.15,transparent:true,opacity:0,sizeAttenuation:true}));
  scene.add(stars);

  // Floating collectible coins are spread along the aerial routes.
  const coinMat=new THREE.MeshStandardMaterial({color:0xffd36e,metalness:.78,roughness:.24,emissive:0x74500d,emissiveIntensity:.22});
  const coinGeo=new THREE.TorusGeometry(.43,.12,10,24);
  const coins=[];
  function streetPoint(){
    if(Math.random()<.5)return{x:rand(-220,220),z:Math.round(rand(-4,4))*GRID+rand(-6,6)};
    return{x:Math.round(rand(-4,4))*GRID+rand(-6,6),z:rand(-220,220)};
  }
  for(let i=0;i<52;i++){
    const p=streetPoint();const mesh=new THREE.Mesh(coinGeo,coinMat);
    mesh.rotation.x=Math.PI/2;mesh.position.set(p.x,5.6,p.z);mesh.castShadow=true;scene.add(mesh);
    coins.push({mesh,phase:Math.random()*Math.PI*2,respawn:0});
  }

  // Load the real CC0 city-car GLB; a procedural fallback keeps the game playable offline.
  const cars=[];
  const palette=[0xd9dce0,0x253c50,0xb73c32,0xd3a64d,0x7b898c,0xe4e2d9,0x343a40,0x47745b];
  function addTraffic(template,index,animations=[]){
    const axis=index%2===0?'x':'z';
    const direction=index%3===0?-1:1;
    const roadIndex=(index%7)-3;
    const lane=roadIndex*GRID+(index%4<2?-4.3:4.3);
    const position=rand(-215,215);
    let root=new THREE.Group();
    if(template){
      const model=template.clone(true);
      model.traverse(node=>{
        if(node.isMesh){node.castShadow=true;node.receiveShadow=true;}
        if(node.name&&/wheel/i.test(node.name))node.userData.rollingWheel=true;
      });
      // Preserve glass and lamps while giving each body a distinct city-car paint colour.
      let paintApplied=false;
      model.traverse(node=>{
        if(!node.isMesh||!node.material)return;
        const mats=Array.isArray(node.material)?node.material:[node.material];
        const cloned=mats.map(m=>m.clone());
        cloned.forEach(m=>{
          const n=(m.name||'').toLowerCase();
          if((n.includes('paint')||n.includes('body')||n.includes('car'))&&!paintApplied){m.color.setHex(palette[index%palette.length]);paintApplied=true;}
        });
        node.material=Array.isArray(node.material)?cloned:cloned[0];
      });
      root.add(model);
      const wheelClip=animations.find(clip=>/wheel-roll/i.test(clip.name));
      if(wheelClip){
        const mixer=new THREE.AnimationMixer(model);
        mixer.clipAction(wheelClip).play();
        mixers.push(mixer);
      }
    }else{
      root=fallbackCar(city,axis,lane,position,direction,palette[index%palette.length]);
    }
    if(template){
      root.position.set(axis==='x'?position:lane,0,axis==='z'?position:lane);
      root.rotation.y=axis==='x'?(direction>0?Math.PI/2:-Math.PI/2):(direction>0?0:Math.PI);
      scene.add(root);
    }
    const wheels=[];
    root.traverse(node=>{if(node.name&&/wheel/i.test(node.name))wheels.push(node);});
    cars.push({root,axis,lane,direction,speed:rand(7.5,12.5),wheels,animated:!!template});
  }
  function addFallbackTraffic(){
    for(let i=0;i<12;i++){
      const axis=i%2===0?'x':'z',direction=i%3===0?-1:1;
      const lane=((i%7)-3)*GRID+(i%4<2?-4.3:4.3),position=rand(-215,215);
      const root=fallbackCar(scene,axis,lane,position,direction,palette[i%palette.length]);
      cars.push({root,axis,lane,direction,speed:rand(7.5,12.5),wheels:[]});
    }
  }
  const loader=new GLTFLoader();
  const carAssetPromise=loader.loadAsync(CAR_MODEL_URL).then(gltf=>{
    const template=gltf.scene;
    for(let i=0;i<12;i++)addTraffic(template,i,gltf.animations||[]);
    return {loaded:true,count:12};
  }).catch(error=>{
    console.warn('Le modèle de voiture CC0 ne peut pas être chargé, utilisation du modèle de secours.',error);
    addFallbackTraffic();
    return {loaded:false,count:12};
  });

  const mixers=[];
  function update(dt,time){
    for(const car of cars){
      const p=car.root.position;
      if(car.axis==='x'){
        p.x+=car.direction*car.speed*dt;
        if(p.x>LIMIT)p.x=-LIMIT;if(p.x<-LIMIT)p.x=LIMIT;
      }else{
        p.z+=car.direction*car.speed*dt;
        if(p.z>LIMIT)p.z=-LIMIT;if(p.z<-LIMIT)p.z=LIMIT;
      }
      if(!car.animated)for(const wheel of car.wheels)wheel.rotation.x+=car.direction*car.speed*dt/.34;
    }
    for(const mixer of mixers)mixer.update(dt);
    for(const coin of coins){
      coin.phase+=dt*2.1;
      coin.mesh.rotation.z+=dt*1.7;
      coin.mesh.position.y=5.5+Math.sin(coin.phase)*.2;
      if(coin.respawn>0){coin.respawn-=dt;if(coin.respawn<=0){const p=streetPoint();coin.mesh.position.set(p.x,5.6,p.z);coin.mesh.visible=true;}}
    }
  }
  function updateLighting(daylight){
    const sky=new THREE.Color().lerpColors(skyNight,skyDay,daylight);
    scene.background.copy(sky);scene.fog.color.copy(sky);
    scene.fog.near=daylight<.35?85:115;scene.fog.far=daylight<.35?270:360;
    sun.intensity=.12+daylight*2.05;hemi.intensity=.3+daylight*.9;fill.intensity=.1+daylight*.3;
    stars.material.opacity=Math.pow(1-daylight,1.6)*.88;
    return daylight>.68?'JOUR':daylight>.34?'SOIR':'NUIT';
  }

  return {coins,cars,hemi,sun,fill,stars,skyDay,skyNight,ready:carAssetPromise,update,updateLighting};
}

function rand(min,max){return min+Math.random()*(max-min);}
