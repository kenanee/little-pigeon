import * as THREE from 'three';

function makeCrustTexture(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#bf782e';ctx.fillRect(0,0,256,256);
  for(let i=0;i<7500;i++){
    const x=Math.random()*256,y=Math.random()*256,r=Math.random()*2.2;
    const shade=Math.random()>.48?'#e6ad5b':'#82451f';
    ctx.globalAlpha=0.09+Math.random()*0.25;ctx.fillStyle=shade;
    ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
  }
  ctx.globalAlpha=1;
  const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(1,1);
  return texture;
}

function createDrumstick(){
  const group=new THREE.Group();
  const crust=makeCrustTexture();
  const meatMat=new THREE.MeshStandardMaterial({
    color:0xe0a04c,map:crust,bumpMap:crust,bumpScale:0.035,
    roughness:0.83,metalness:0
  });
  const boneMat=new THREE.MeshStandardMaterial({color:0xf1e9d8,roughness:0.85});
  const darkBoneMat=new THREE.MeshStandardMaterial({color:0xd7c8ae,roughness:0.9});
  const eyeMat=new THREE.MeshStandardMaterial({color:0x20180f,roughness:0.28});
  const eyeGlow=new THREE.MeshStandardMaterial({color:0xd64935,emissive:0x70170d,emissiveIntensity:0.5,roughness:0.3});

  // Une géométrie de type "lathe" donne à la viande une silhouette de pilon, avec une chair bombée.
  const outline=[
    new THREE.Vector2(0.015,-0.42),new THREE.Vector2(0.075,-0.29),
    new THREE.Vector2(0.13,-0.12),new THREE.Vector2(0.22,0.05),
    new THREE.Vector2(0.36,0.28),new THREE.Vector2(0.49,0.56),
    new THREE.Vector2(0.53,0.83),new THREE.Vector2(0.46,1.09),
    new THREE.Vector2(0.32,1.28),new THREE.Vector2(0.16,1.40),
    new THREE.Vector2(0.035,1.43)
  ];
  const meat=new THREE.Mesh(new THREE.LatheGeometry(outline,48),meatMat);
  meat.castShadow=true;meat.receiveShadow=true;group.add(meat);

  // Le cartilage et l'os blanc dépassent de la partie étroite du pilon.
  const bone=new THREE.Mesh(new THREE.CylinderGeometry(0.075,0.105,0.62,16),boneMat);
  bone.position.set(0,-0.56,0);bone.rotation.z=-0.10;bone.castShadow=true;group.add(bone);
  for(const side of [-1,1]){
    const knob=new THREE.Mesh(new THREE.SphereGeometry(0.105,14,12),boneMat);
    knob.position.set(side*0.11,-0.82,0);knob.scale.set(0.88,1.1,0.9);group.add(knob);
    const joint=new THREE.Mesh(new THREE.SphereGeometry(0.042,10,8),darkBoneMat);
    joint.position.set(side*0.12,-0.83,0.07);group.add(joint);
  }

  // Petites bosses croustillantes pour casser la silhouette trop lisse.
  const crumbGeo=new THREE.IcosahedronGeometry(0.048,1);
  const crumbMats=[
    new THREE.MeshStandardMaterial({color:0xf3c875,roughness:1}),
    new THREE.MeshStandardMaterial({color:0xb96b2c,roughness:1}),
    new THREE.MeshStandardMaterial({color:0xd99542,roughness:1})
  ];
  for(let i=0;i<36;i++){
    const y=randRange(0.12,1.24);
    const fraction=(y<0.8?0.38:0.48)*(1-Math.max(0,y-0.8)*0.4);
    const angle=Math.random()*Math.PI*2;
    const crumb=new THREE.Mesh(crumbGeo,crumbMats[i%crumbMats.length]);
    crumb.position.set(Math.cos(angle)*fraction,y,Math.sin(angle)*fraction);
    crumb.scale.set(randRange(.55,1.2),randRange(.55,1.45),randRange(.5,1));
    crumb.rotation.set(Math.random()*2,Math.random()*2,Math.random()*2);
    crumb.castShadow=true;group.add(crumb);
  }

  // Yeux minuscules et sourcils : le poursuivant reste expressif sans perdre sa forme de pilon.
  for(const side of [-1,1]){
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.062,14,12),eyeMat);
    eye.position.set(side*0.19,0.91,0.432);group.add(eye);
    const glow=new THREE.Mesh(new THREE.SphereGeometry(0.019,8,8),eyeGlow);
    glow.position.set(side*0.19,0.92,0.486);group.add(glow);
    const brow=new THREE.Mesh(new THREE.BoxGeometry(0.15,0.032,0.04),darkBoneMat);
    brow.position.set(side*0.19,1.015,0.43);brow.rotation.z=side*0.16;group.add(brow);
  }
  group.userData.bobPhase=Math.random()*Math.PI*2;
  group.userData.baseScale=1;
  group.scale.set(1.08,1.08,1.08);
  return group;
}
function randRange(min,max){return min+Math.random()*(max-min)}

export function createChicken(){
  const enemy=new THREE.Group();
  const drumstick=createDrumstick();
  drumstick.position.y=0.55;
  enemy.add(drumstick);
  enemy.userData.drumstick=drumstick;

  // Petit rebond animé et rotation de la viande, sans déformer le modèle.
  enemy.userData.update=(time)=>{
    drumstick.position.y=0.55+Math.sin(time*5+drumstick.userData.bobPhase)*0.09;
    drumstick.rotation.z=Math.sin(time*2.1+drumstick.userData.bobPhase)*0.12;
  };
  return enemy;
}
