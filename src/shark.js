import * as THREE from 'three';

const DEFAULT_COLORS={
  body:'#527f91',belly:'#d7e5e7',fin:'#315d70',detail:'#263f4c',
  eye:'#f5c86b',pupil:'#07121a',glow:'#75d8e5'
};

function makeFin(points,material){
  const geometry=new THREE.BufferGeometry();
  const vertices=[];
  for(const p of points)vertices.push(p[0],p[1],p[2]);
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
  geometry.setIndex([0,1,2]);geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,material);
}

export function createShark(opts={}){
  const colors=Object.assign({},DEFAULT_COLORS,opts.colors||{});
  const root=new THREE.Group(),bodyRig=new THREE.Group();
  root.add(bodyRig);
  const bodyMat=new THREE.MeshStandardMaterial({color:colors.body,roughness:.46,metalness:.08});
  const bellyMat=new THREE.MeshStandardMaterial({color:colors.belly,roughness:.68});
  const finMat=new THREE.MeshStandardMaterial({color:colors.fin,roughness:.52,side:THREE.DoubleSide});
  const detailMat=new THREE.MeshStandardMaterial({color:colors.detail,roughness:.72});
  const eyeMat=new THREE.MeshStandardMaterial({color:colors.eye,roughness:.25,emissive:colors.glow,emissiveIntensity:.18});
  const pupilMat=new THREE.MeshStandardMaterial({color:colors.pupil,roughness:.18});
  const whiteMat=new THREE.MeshStandardMaterial({color:0xf3f8f3,roughness:.42});
  const sphere=new THREE.SphereGeometry(1,24,16);
  const ell=(parent,material,scale,position)=>{
    const mesh=new THREE.Mesh(sphere,material);mesh.scale.set(...scale);mesh.position.set(...position);
    mesh.castShadow=false;mesh.receiveShadow=false;parent.add(mesh);return mesh;
  };

  // Tapered, streamlined body, oriented toward the positive Z direction.
  const profile=[
    new THREE.Vector2(.025,-2.55),new THREE.Vector2(.10,-2.38),
    new THREE.Vector2(.19,-2.08),new THREE.Vector2(.31,-1.7),
    new THREE.Vector2(.43,-1.15),new THREE.Vector2(.52,-.48),
    new THREE.Vector2(.56,.12),new THREE.Vector2(.49,.75),
    new THREE.Vector2(.35,1.38),new THREE.Vector2(.22,1.88),
    new THREE.Vector2(.09,2.26),new THREE.Vector2(.012,2.42)
  ];
  const body=new THREE.Mesh(new THREE.LatheGeometry(profile,28),bodyMat);
  body.rotation.x=Math.PI/2;body.castShadow=false;bodyRig.add(body);
  ell(bodyRig,bellyMat,[.405,.205,1.36],[0,-.27,.1]);

  // Dorsal fin and two pectoral fins.
  const dorsal=makeFin([[0,.37,-.82],[0,1.48,-.28],[0,.43,.28]],finMat);
  dorsal.position.y=.12;bodyRig.add(dorsal);
  const pectorals=[];
  for(const side of [-1,1]){
    const fin=makeFin([
      [side*.30,-.10,.38],
      [side*1.38,-.52,-.62],
      [side*.42,-.31,-.48]
    ],finMat);
    bodyRig.add(fin);pectorals.push(fin);
    ell(bodyRig,eyeMat,[.082,.082,.082],[side*.43,.16,1.54]);
    ell(bodyRig,pupilMat,[.037,.043,.043],[side*.49,.16,1.57]);
    ell(bodyRig,whiteMat,[.012,.016,.016],[side*.514,.18,1.59]);
    // Five fine gill grooves on each side.
    for(let i=0;i<5;i++){
      const z=.55+i*.16;
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(side*.48,.18,z),
        new THREE.Vector3(side*.53,-.02,z+.035),
        new THREE.Vector3(side*.49,-.23,z+.07)
      ]);
      const groove=new THREE.Mesh(new THREE.TubeGeometry(curve,8,.012,4,false),detailMat);
      bodyRig.add(groove);
    }
  }

  // Tail fin sweeps from side to side to propel the shark.
  const tailPivot=new THREE.Group();tailPivot.position.set(0,0,-2.28);bodyRig.add(tailPivot);
  ell(tailPivot,bodyMat,[.14,.15,.43],[0,0,-.28]);
  tailPivot.add(makeFin([[0,0,0],[0,1.05,-.67],[0,.05,-.82]],finMat));
  tailPivot.add(makeFin([[0,0,0],[0,-.73,-.55],[0,-.03,-.8]],finMat));

  // A subtle curved mouth line makes the snout readable from the chase camera.
  const mouthCurve=new THREE.CatmullRomCurve3([
    new THREE.Vector3(-.36,-.23,1.96),new THREE.Vector3(0,-.29,2.13),
    new THREE.Vector3(.36,-.23,1.96)
  ]);
  bodyRig.add(new THREE.Mesh(new THREE.TubeGeometry(mouthCurve,18,.018,5,false),detailMat));

  // A small nameplate follows the shark.
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;
  const ctx=labelCanvas.getContext('2d');
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
  function drawName(name){
    ctx.clearRect(0,0,512,128);ctx.fillStyle='rgba(3,22,34,.68)';
    ctx.beginPath();ctx.roundRect(8,12,496,104,30);ctx.fill();
    ctx.strokeStyle='rgba(180,239,250,.42)';ctx.lineWidth=4;ctx.stroke();
    ctx.fillStyle='#f4fcff';ctx.font='bold 45px system-ui';ctx.textAlign='center';ctx.textBaseline='middle';
    ctx.fillText(name||'Mako',256,64,455);labelTexture.needsUpdate=true;
  }
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture,transparent:true,depthWrite:false}));
  label.scale.set(2.5,.62,1);label.position.set(0,2.05,.05);root.add(label);
  drawName(opts.name||'Mako');

  const state={air:true,y:0,vy:0,sp:0,h:0,pitch:0,roll:0,phase:0,t:0};
  const setSwimPose=(amount=0)=>{tailPivot.rotation.y=amount;};
  root.scale.setScalar(opts.scale||1);
  root.userData={
    state,updateName:drawName,setSwimPose,
    control(input,dt){
      dt=Math.min(dt,.05);
      const smooth=a=>1-Math.exp(-a*dt);
      const lift=THREE.MathUtils.clamp(Number.isFinite(input.lift)?input.lift:((input.up?1:0)-(input.down?1:0)),-1,1);
      const forward=THREE.MathUtils.clamp(input.fwd||0,-1,1);
      const turn=THREE.MathUtils.clamp(input.turn||0,-1,1);
      const multiplier=(input.speedMultiplier||1)*(input.boost?1.55*(input.boostMultiplier||1):1);

      state.t+=dt;state.phase+=dt*(input.boost?15:9);
      const cruise=(6.0+Math.max(0,forward)*3.1-Math.max(0,-forward)*2.1)*multiplier;
      state.sp+=(cruise-state.sp)*smooth(1.8);
      state.vy+=(lift*5.6-state.vy)*smooth(2.5);
      state.y=THREE.MathUtils.clamp(state.y+state.vy*dt,-10,28);
      state.h+=turn*1.45*dt;
      root.position.x=THREE.MathUtils.clamp(root.position.x+Math.sin(state.h)*state.sp*dt,-235,235);
      root.position.z=THREE.MathUtils.clamp(root.position.z+Math.cos(state.h)*state.sp*dt,-235,235);
      root.position.y=state.y;
      state.pitch+=( -lift*.26-state.pitch)*smooth(3.6);
      state.roll+=(-turn*.28-state.roll)*smooth(3.2);
      root.rotation.order='YXZ';root.rotation.set(state.pitch,state.h,state.roll);

      tailPivot.rotation.y=Math.sin(state.phase)*.48;
      bodyRig.rotation.z=Math.sin(state.phase-.5)*.035;
      bodyRig.position.y=Math.sin(state.phase*1.7)*.035;
      pectorals[0].rotation.z=-.04+Math.sin(state.phase*.7)*.035;
      pectorals[1].rotation.z=.04-Math.sin(state.phase*.7)*.035;
      dorsal.rotation.x=Math.sin(state.phase)*.025;
    }
  };
  return root;
}
