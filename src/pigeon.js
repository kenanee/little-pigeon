import * as THREE from 'three';

const SKINS = {
  common: { body:0x737e88, flight:0x252f3a, cover:0x929ba4, belly:0xb8c1c9, neck:0x287d71, iris:0xe4a257, accent:0x5a8d91 },
  white:  { body:0xe6ebef, flight:0x8997a4, cover:0xfafafa, belly:0xffffff, neck:0x9ecbd5, iris:0xdca45d, accent:0xcceaf0 },
  red:    { body:0x9e3343, flight:0x3f1d2c, cover:0xd66a73, belly:0xf0c2bd, neck:0x704b70, iris:0xf0b15e, accent:0xff788b },
  dragon: { body:0x344e73, flight:0x182b42, cover:0x2d9f9b, belly:0xc1d5db, neck:0x1fae9d, iris:0xffd276, accent:0x5be7d5 },
  divine: { body:0xf1eaf4, flight:0x7c62a6, cover:0xff9bce, belly:0xffffff, neck:0x72cbbd, iris:0xffd26c, accent:0xffc1ea }
};

function makeLoftedBody() {
  // Profil longitudinal du corps : poitrine large, dos arrondi, croupe effilée.
  const profile = [
    [-1.06,0.035,0.06],[-0.92,0.18,0.23],[-0.68,0.34,0.38],
    [-0.38,0.49,0.52],[-0.05,0.60,0.62],[0.28,0.61,0.66],
    [0.55,0.51,0.55],[0.76,0.34,0.39],[0.91,0.17,0.22],[1.00,0.045,0.08]
  ];
  const rings=48, sides=48, positions=[], indices=[], uvs=[];
  for(let r=0;r<=rings;r++){
    const t=r/rings;
    const z=-1.06+t*2.06;
    let k=0;
    while(k<profile.length-2 && z>profile[k+1][0]) k++;
    const a=profile[k], b=profile[k+1];
    const f=THREE.MathUtils.clamp((z-a[0])/(b[0]-a[0]),0,1);
    const rx=THREE.MathUtils.lerp(a[1],b[1],f);
    const ry=THREE.MathUtils.lerp(a[2],b[2],f);
    for(let s=0;s<=sides;s++){
      const theta=s/sides*Math.PI*2;
      const feathering=1+0.012*Math.sin(theta*8+z*9);
      positions.push(Math.cos(theta)*rx*feathering,0.91+Math.sin(theta)*ry*feathering,z);
      uvs.push(s/sides,t);
      if(r<rings && s<sides){
        const p=r*(sides+1)+s, q=p+sides+1;
        indices.push(p,q,p+1,p+1,q,q+1);
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function makeFeatherGeometry(length,width,curve=0.05){
  const along=14, across=6, positions=[],uvs=[],indices=[];
  for(let i=0;i<=along;i++){
    const u=i/along;
    const envelope=Math.pow(Math.sin(Math.PI*u),0.72);
    const half=width*0.5*envelope;
    for(let j=0;j<=across;j++){
      const v=j/across*2-1;
      const x=length*u;
      const y=v*half-curve*u;
      const z=curve*0.22*Math.sin(Math.PI*u)*(1-v*v)+0.018*Math.cos(v*Math.PI*2)*envelope;
      positions.push(x,y,z);uvs.push(u,j/across);
      if(i<along&&j<across){
        const p=i*(across+1)+j,q=p+across+1;
        indices.push(p,p+1,q,p+1,q+1,q);
      }
    }
  }
  const g=new THREE.BufferGeometry();
  g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
  g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
  g.setIndex(indices);g.computeVertexNormals();
  return g;
}

function addFeather(parent,geometry,material,position,rotationZ=0,rotationY=0,scale=1){
  const mesh=new THREE.Mesh(geometry,material);
  mesh.position.copy(position);
  mesh.rotation.set(0,rotationY,rotationZ);
  mesh.scale.setScalar(scale);
  mesh.castShadow=true;mesh.receiveShadow=true;
  parent.add(mesh);
  return mesh;
}

function addTube(parent,points,radius,material,segments=18){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
  const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,8,false),material);
  mesh.castShadow=true;parent.add(mesh);return mesh;
}

function addWing(side,palette){
  const wing=new THREE.Group();
  wing.scale.x=side;
  const baseMat=new THREE.MeshPhysicalMaterial({color:palette.body,roughness:0.78,clearcoat:0.16});
  const baseShape=new THREE.Shape();
  baseShape.moveTo(0,0.13);
  baseShape.bezierCurveTo(0.42,0.50,1.25,0.33,1.88,-0.10);
  baseShape.bezierCurveTo(1.64,-0.40,1.14,-0.58,0.55,-0.43);
  baseShape.bezierCurveTo(0.20,-0.32,0.04,-0.12,0,0.13);
  const base=new THREE.Mesh(new THREE.ExtrudeGeometry(baseShape,{depth:0.11,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:0.035,bevelThickness:0.035}),baseMat);
  base.position.z=-0.025;base.castShadow=true;wing.add(base);

  const primaries=[];
  const primaryGeometry=makeFeatherGeometry(1.02,0.24,0.19);
  const secondaryGeometry=makeFeatherGeometry(0.75,0.21,0.11);
  const covertGeometry=makeFeatherGeometry(0.52,0.19,0.055);
  const shaftMat=new THREE.MeshStandardMaterial({color:palette.flight,roughness:0.8});
  for(let i=0;i<11;i++){
    const f=i/10;
    const featherMat=new THREE.MeshStandardMaterial({color:i<3?palette.flight:palette.cover,roughness:0.79,side:THREE.DoubleSide});
    const feather=addFeather(wing,primaryGeometry,featherMat,new THREE.Vector3(0.20+i*0.075,-0.05-i*0.066,0.025),-0.28-f*0.24,0,0.9+f*0.13);
    primaries.push(feather);
  }
  for(let i=0;i<9;i++){
    const mat=new THREE.MeshStandardMaterial({color:palette.cover,roughness:0.83,side:THREE.DoubleSide});
    addFeather(wing,secondaryGeometry,mat,new THREE.Vector3(0.10+i*0.12,0.13-i*0.018,0.075),-0.12-i*0.015,0,0.92);
  }
  for(let row=0;row<3;row++){
    for(let col=0;col<8;col++){
      const colors=[palette.cover,palette.body,palette.cover];
      const mat=new THREE.MeshStandardMaterial({color:colors[(col+row)%colors.length],roughness:0.85,side:THREE.DoubleSide});
      addFeather(wing,covertGeometry,mat,new THREE.Vector3(0.05+col*0.15,0.25-row*0.14,0.13+row*0.018),-0.06-col*0.012,0,0.78+Math.random()*0.13);
    }
  }
  wing.userData.primaries=primaries;
  return wing;
}

export function createPigeon(skinId='common',displayName='Pico'){
  const palette=SKINS[skinId]||SKINS.common;
  const bird=new THREE.Group();
  bird.name='LittlePigeon_'+skinId;

  const bodyMat=new THREE.MeshPhysicalMaterial({color:palette.body,roughness:0.72,clearcoat:0.22,clearcoatRoughness:0.55});
  const bellyMat=new THREE.MeshPhysicalMaterial({color:palette.belly,roughness:0.86,clearcoat:0.08});
  const neckMat=new THREE.MeshPhysicalMaterial({
    color:palette.neck,roughness:0.28,metalness:0.18,clearcoat:0.85,
    clearcoatRoughness:0.18,iridescence:0.9,iridescenceIOR:1.32,iridescenceThicknessRange:[240,510]
  });
  const flightMat=new THREE.MeshStandardMaterial({color:palette.flight,roughness:0.86,side:THREE.DoubleSide});
  const covertMat=new THREE.MeshStandardMaterial({color:palette.cover,roughness:0.82,side:THREE.DoubleSide});
  const beakMat=new THREE.MeshStandardMaterial({color:0x494e52,roughness:0.5});
  const cereMat=new THREE.MeshStandardMaterial({color:0xe6e0d4,roughness:0.5});
  const footMat=new THREE.MeshStandardMaterial({color:0xbd796d,roughness:0.83});
  const clawMat=new THREE.MeshStandardMaterial({color:0x38363b,roughness:0.8});

  // Body and breast are a single sculpted loft mesh, not a stack of spheres.
  const torso=new THREE.Mesh(makeLoftedBody(),bodyMat);
  torso.castShadow=true;torso.receiveShadow=true;bird.add(torso);
  const breast=new THREE.Mesh(new THREE.SphereGeometry(0.49,32,24),bellyMat);
  breast.scale.set(0.92,0.82,0.72);breast.position.set(0,0.72,0.36);breast.castShadow=true;bird.add(breast);

  // Neck silhouette and the iridescent collar.
  addTube(bird,[[0,1.12,0.48],[0,1.38,0.57],[0,1.64,0.72],[0,1.82,0.89]],0.225,bodyMat,28);
  const collar=new THREE.Mesh(new THREE.TorusGeometry(0.215,0.105,16,36),neckMat);
  collar.rotation.x=Math.PI/2;collar.position.set(0,1.48,0.65);collar.scale.set(1,1,1.15);bird.add(collar);
  const throat=new THREE.Mesh(new THREE.SphereGeometry(0.29,24,20),neckMat);
  throat.scale.set(0.83,1.22,0.76);throat.position.set(0,1.67,0.77);bird.add(throat);

  // Head, cere, hooked beak and vivid pigeon eyes.
  const head=new THREE.Mesh(new THREE.SphereGeometry(0.285,32,24),bodyMat);
  head.scale.set(0.97,1.02,1.12);head.position.set(0,1.99,0.93);head.castShadow=true;bird.add(head);
  const beak=new THREE.Mesh(new THREE.ConeGeometry(0.105,0.36,12),beakMat);
  beak.rotation.x=Math.PI/2;beak.position.set(0,1.91,1.28);beak.scale.set(1,0.85,1);bird.add(beak);
  const cere=new THREE.Mesh(new THREE.SphereGeometry(0.105,18,14),cereMat);
  cere.scale.set(1.25,0.45,0.64);cere.position.set(0,1.99,1.23);bird.add(cere);

  const eyeWhite=new THREE.MeshStandardMaterial({color:0xf0e9dc,roughness:0.38});
  const irisMat=new THREE.MeshStandardMaterial({color:palette.iris,roughness:0.31,metalness:0.08});
  const pupilMat=new THREE.MeshStandardMaterial({color:0x15171b,roughness:0.16});
  const glintMat=new THREE.MeshBasicMaterial({color:0xffffff});
  for(const side of [-1,1]){
    const socket=new THREE.Mesh(new THREE.SphereGeometry(0.104,20,16),new THREE.MeshStandardMaterial({color:0x59616a,roughness:0.78}));
    socket.position.set(side*0.245,2.04,1.07);socket.scale.set(1,1.07,0.62);bird.add(socket);
    const eye=new THREE.Mesh(new THREE.SphereGeometry(0.078,20,16),eyeWhite);
    eye.position.set(side*0.253,2.04,1.112);bird.add(eye);
    const iris=new THREE.Mesh(new THREE.SphereGeometry(0.053,18,14),irisMat);
    iris.position.set(side*0.253,2.04,1.165);bird.add(iris);
    const pupil=new THREE.Mesh(new THREE.SphereGeometry(0.030,16,12),pupilMat);
    pupil.position.set(side*0.253,2.04,1.207);bird.add(pupil);
    const glint=new THREE.Mesh(new THREE.SphereGeometry(0.012,8,8),glintMat);
    glint.position.set(side*0.267,2.063,1.228);bird.add(glint);
  }

  // Scapular feathers over the body sides.
  const bodyFeatherGeometry=makeFeatherGeometry(0.42,0.12,0.02);
  for(const side of [-1,1]){
    for(let row=0;row<3;row++){
      for(let i=0;i<7;i++){
        const material=new THREE.MeshStandardMaterial({color:(i+row)%3===0?palette.cover:palette.body,roughness:0.9,side:THREE.DoubleSide});
        const feather=addFeather(bird,bodyFeatherGeometry,material,new THREE.Vector3(side*(0.37+row*0.02),1.15-row*0.12,-0.58+i*0.17),-0.35,side*0.15,0.78);
        feather.rotation.y=side*0.16;
      }
    }
  }

  // Individual wing layers: primary flight feathers, secondary feathers and small coverts.
  const leftWing=addWing(-1,palette);
  const rightWing=addWing(1,palette);
  leftWing.position.set(-0.40,1.38,-0.08);
  rightWing.position.set(0.40,1.38,-0.08);
  bird.add(leftWing,rightWing);

  // Seven long tail feathers spread like a real pigeon's tail fan.
  const tailGroup=new THREE.Group();tailGroup.position.set(0,0.84,-0.86);bird.add(tailGroup);
  const tailGeometry=makeFeatherGeometry(0.98,0.19,0.07);
  for(let i=0;i<7;i++){
    const f=i-3;
    const color=i===0||i===6?palette.flight:palette.cover;
    const feather=new THREE.Mesh(tailGeometry,new THREE.MeshStandardMaterial({color,roughness:0.86,side:THREE.DoubleSide}));
    feather.rotation.y=Math.PI/2;
    feather.rotation.x=f*0.055;
    feather.rotation.z=f*0.07;
    feather.position.set(f*0.09,0,-f*f*0.012);
    feather.castShadow=true;tailGroup.add(feather);
  }

  // Red scaled legs, toes and dark curved claws.
  for(const side of [-1,1]){
    const x=side*0.19;
    addTube(bird,[[x,0.65,0.13],[x,0.35,0.18],[x,0.12,0.22]],0.035,footMat,12);
    addTube(bird,[[x,0.12,0.22],[x,0.04,0.33],[x,0.015,0.49]],0.027,footMat,10);
    addTube(bird,[[x,0.10,0.22],[x+side*0.14,0.03,0.32],[x+side*0.23,0.01,0.42]],0.023,footMat,10);
    addTube(bird,[[x,0.10,0.22],[x-side*0.12,0.025,0.34],[x-side*0.18,0.01,0.43]],0.022,footMat,10);
    for(const [dx,dz] of [[0,0.49],[side*0.23,0.42],[-side*0.18,0.43]]){
      addTube(bird,[[x+dx,0.02,0.40+(dz-0.40)*0.4],[x+dx,0.012,dz],[x+dx,0.025,dz+0.10]],0.012,clawMat,7);
    }
  }

  if(skinId==='dragon'){
    const crestMat=new THREE.MeshStandardMaterial({color:palette.accent,metalness:0.22,roughness:0.35});
    for(let i=-1;i<=1;i++){
      const crest=new THREE.Mesh(new THREE.ConeGeometry(0.085,0.24,6),crestMat);
      crest.position.set(i*0.12,2.28,0.86);crest.rotation.x=-0.3;bird.add(crest);
    }
    const scaleMat=new THREE.MeshStandardMaterial({color:0x50bdb3,metalness:0.25,roughness:0.42});
    for(let i=0;i<5;i++){
      const scale=new THREE.Mesh(new THREE.SphereGeometry(0.09,10,8),scaleMat);
      scale.scale.set(1.2,0.36,1);scale.position.set(0,1.23-i*0.12,-0.27-i*0.1);bird.add(scale);
    }
  }
  if(skinId==='divine'){
    const halo=new THREE.Mesh(new THREE.TorusGeometry(0.43,0.025,8,48),new THREE.MeshStandardMaterial({color:0xffd16f,metalness:0.78,roughness:0.25,emissive:0x93651c,emissiveIntensity:0.26}));
    halo.position.set(0,2.43,0.82);halo.rotation.x=Math.PI/2;bird.add(halo);
  }

  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;
  const ctx=labelCanvas.getContext('2d');
  ctx.fillStyle='rgba(7,15,24,.72)';ctx.beginPath();ctx.roundRect(8,12,496,104,30);ctx.fill();
  ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=4;ctx.stroke();
  ctx.fillStyle='#fff';ctx.font='bold 45px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(displayName,256,64,455);
  const texture=new THREE.CanvasTexture(labelCanvas);texture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,transparent:true,depthWrite:false}));
  label.scale.set(3.15,0.78,1);label.position.set(0,2.78,0.08);bird.add(label);

  bird.userData.wings=[leftWing,rightWing];
  bird.userData.labelContext=ctx;bird.userData.labelTexture=texture;
  bird.userData.featherCount=leftWing.children.length+rightWing.children.length+tailGroup.children.length;
  bird.userData.updateName=(name)=>{
    ctx.clearRect(0,0,512,128);ctx.fillStyle='rgba(7,15,24,.72)';
    ctx.beginPath();ctx.roundRect(8,12,496,104,30);ctx.fill();
    ctx.strokeStyle='rgba(255,255,255,.38)';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#fff';ctx.font='bold 45px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(name,256,64,455);texture.needsUpdate=true;
  };
  bird.scale.setScalar(1.2);
  return bird;
}
