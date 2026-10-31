import * as THREE from 'three';

/* Feathered pigeon model based on the reference model supplied for Little Pigeon. */
export const DEFAULT_COLORS={head:'#6f7b87',body:'#9ba5af',breast:'#8b96a2',neckA:'#2e9a72',neckB:'#9055a8',wing:'#a9b3bc',primary:'#6c7782',bar:'#23282e',band:'#1e2226',rump:'#eef0f2',tail:'#7f8a95',beak:'#3a3532',cere:'#f1f1ee',ring:'#c9857a',eye:'#e8801c',pupil:'#0a0a0a',feet:'#c4566a'};

export function createPigeon(opts={}){
  const V3=THREE.Vector3,MU=THREE.MathUtils,PI2=Math.PI/2;
  const C=Object.assign({},DEFAULT_COLORS,opts.colors||{}),M={},F={},root=new THREE.Group(),B=new THREE.Group(),U=new THREE.Group();
  B.position.y=.95;U.position.y=-1.25;root.add(B);B.add(U);

  // Reusable feather texture: silhouette, fine barbs and a central shaft.
  const cv=document.createElement('canvas');cv.width=128;cv.height=256;const g=cv.getContext('2d');
  g.beginPath();g.ellipse(64,140,60,122,0,0,7);g.fillStyle='#fff';g.fill();g.save();g.clip();
  g.strokeStyle='rgba(0,0,0,.16)';g.lineWidth=1;
  for(let y=-40;y<300;y+=3){g.beginPath();g.moveTo(64,y);g.lineTo(2,y-34);g.moveTo(64,y);g.lineTo(126,y-34);g.stroke();}
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=2;g.beginPath();g.moveTo(64,0);g.lineTo(64,256);g.stroke();g.restore();
  const FT=new THREE.CanvasTexture(cv);
  const featherGeo=(v0=0,v1=1)=>{
    const q=new THREE.PlaneGeometry(1,v1-v0,2,4),p=q.attributes.position,u=q.attributes.uv;
    for(let i=0;i<p.count;i++){
      const y=p.getY(i)+(v1-v0)/2+v0,x=p.getX(i);
      p.setY(i,y);p.setZ(i,-.28*y*y-.2*x*x);u.setY(i,v0+u.getY(i)*(v1-v0));
    }
    q.computeVertexNormals();return q;
  };
  const FG=featherGeo(),CG=featherGeo(.72,1);
  const mat=(k,ro=.75,me=0)=>M[k]||(M[k]=new THREE.MeshStandardMaterial({color:C[k],roughness:ro,metalness:me}));
  const fmat=k=>F[k]||(F[k]=new THREE.MeshStandardMaterial({color:C[k],map:FT,alphaTest:.45,side:THREE.DoubleSide,roughness:.85}));
  const cmat=k=>F['c'+k]||(F['c'+k]=new THREE.MeshStandardMaterial({color:C[k],map:FT,alphaTest:.45,side:THREE.DoubleSide,roughness:.85,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
  const SG=new THREE.SphereGeometry(1,28,18);
  const ell=(par,k,s,p,r=[0,0,0],ro,me,geo=SG)=>{
    const m=new THREE.Mesh(geo,mat(k,ro,me));m.scale.set(...s);m.position.set(...p);m.rotation.set(...r);m.castShadow=true;par.add(m);return m;
  };
  const inst=[],dynamicMaterials=[];
  const IM=new THREE.MeshStandardMaterial({map:FT,alphaTest:.45,side:THREE.DoubleSide,roughness:.85});
  function cover(par,c,r,rot,d,n,w,len,kA,kB,tf){
    const im=new THREE.InstancedMesh(FG,IM,n),q=new THREE.Euler(...rot),m=new THREE.Matrix4(),pa=[],dir=new V3(...d).normalize();
    for(let i=0;i<n;i++){
      const y=1-2*(i+.5)/n,rr=Math.sqrt(1-y*y),th=i*2.39996,u=new V3(rr*Math.cos(th),y,rr*Math.sin(th));
      const nn=new V3(u.x/r[0],u.y/r[1],u.z/r[2]).normalize().applyEuler(q);
      const p=new V3(u.x*r[0],u.y*r[1],u.z*r[2]).applyEuler(q).add(new V3(...c));
      const t=dir.clone().addScaledVector(nn,-dir.dot(nn)).add(new V3(Math.random()-.5,Math.random()-.5,Math.random()-.5).multiplyScalar(.25)).normalize();
      const Y=t.addScaledVector(nn,.28).normalize(),X=new V3().crossVectors(Y,nn).normalize(),Z=new V3().crossVectors(X,Y),sc=.85+Math.random()*.3;
      m.makeBasis(X,Y,Z).scale(new V3(w*sc,len*sc,len*sc)).setPosition(p);im.setMatrixAt(i,m);
      pa.push({kA,kB,t:tf?tf(p):0,v:.9+Math.random()*.2});
    }
    im.castShadow=true;par.add(im);inst.push({im,pa});
  }
  const recolor=()=>inst.forEach(({im,pa})=>{
    const a=new THREE.Color(),b=new THREE.Color();
    pa.forEach((e,i)=>{a.set(C[e.kA]);b.set(C[e.kB]);im.setColorAt(i,a.clone().lerp(b,e.t).multiplyScalar(e.v));});
    im.instanceColor.needsUpdate=true;
  });

  // Sculpted ellipsoid anatomy, neck and head.
  ell(U,'body',[.6,.58,.93],[0,1.25,0],[-.18,0,0]);
  ell(U,'breast',[.54,.54,.56],[0,1.3,.62]);
  ell(U,'rump',[.4,.22,.38],[0,1.62,-.7],[-.15,0,0]);
  ell(U,'neckA',[.31,.5,.31],[0,1.95,.98],[.35,0,0],.35,.1);
  ell(U,'neckB',[.38,.26,.38],[0,1.72,1.02],[.3,0,0],.35,.1);
  const H=new THREE.Group();H.position.set(0,2.48,1.2);U.add(H);
  ell(H,'head',[.29,.3,.36],[0,0,0],[.1,0,0]);

  // Hundreds of tiny overlapping contour feathers on breast, back, rump and neck.
  cover(U,[0,1.25,0],[.62,.6,.95],[-.18,0,0],[0,-.5,-1],650,.14,.3,'body','body');
  cover(U,[0,1.3,.62],[.56,.56,.58],[0,0,0],[0,-.7,-.5],330,.13,.28,'breast','breast');
  cover(U,[0,1.62,-.7],[.4,.22,.38],[-.15,0,0],[0,0,-1],80,.12,.22,'rump','rump');
  cover(U,[0,1.95,.98],[.33,.52,.33],[.35,0,0],[0,-1,-.3],330,.1,.2,'neckA','neckB',p=>MU.clamp((1.95-p.y)/.5+.3,0,1));
  cover(H,[0,0,0],[.3,.31,.37],[.1,0,0],[0,-.3,-1],120,.07,.12,'head','head');

  // Cere, hooked beak and eyes with iris, pupil and orbital ring.
  const CO=new THREE.ConeGeometry(.085,.42,10);
  ell(H,'beak',[1,1,.75],[0,-.02,.5],[PI2,0,0],.5,0,CO);
  ell(H,'beak',[.9,.8,.6],[0,-.075,.47],[PI2,0,0],.5,0,CO);
  ell(H,'cere',[.1,.075,.12],[0,.06,.37],[0,0,0],.6);
  [-1,1].forEach(s=>{
    ell(H,'eye',[.07,.07,.07],[s*.255,.07,.15],[0,0,0],.3);
    ell(H,'pupil',[.038,.038,.038],[s*.315,.07,.16],[0,0,0],.2);
    ell(H,'ring',[.014,.09,.09],[s*.245,.07,.15],[0,0,0],.7);
  });

  // Layered scapular feather meshes along both flanks.
  for(const side of [-1,1]){
    for(let row=0;row<3;row++)for(let i=0;i<7;i++){
      const key=(i+row)%3===0?'wing':'body';
      const feather=new THREE.Mesh(FG,fmat(key));
      feather.scale.set(.12,.43,.43);
      feather.position.set(side*(.37+row*.02),1.15-row*.12,-.58+i*.17);
      feather.rotation.set(-.35,side*.16,0);feather.castShadow=true;U.add(feather);
    }
  }

  // Articulated wings: shoulder > roll > arm > hand, mirrored left and right.
  const PL=[.75,.82,.9,.96,1,1,.96,.9,.8];
  const wings=[-1,1].map(s=>{
    const Wg=new THREE.Group(),R=new THREE.Group(),A=new THREE.Group(),Hd=new THREE.Group(),fl=[];
    Wg.position.set(s*.5,1.55,.3);Wg.scale.x=s;Wg.rotation.order='ZYX';U.add(Wg);Wg.add(R);R.add(A);A.add(Hd);Hd.position.x=.5;
    ell(A,'wing',[.28,.05,.1],[.25,0,0]);
    const add=(par,x,len,w,k,cap,fa,oa,h)=>{
      const p=new THREE.Group();p.position.x=x;par.add(p);
      const fg=new THREE.Group();fg.rotation.x=-PI2;fg.position.y=h;p.add(fg);
      const m=new THREE.Mesh(FG,fmat(k));m.scale.set(w,len,len);m.castShadow=true;fg.add(m);
      if(cap){const c=new THREE.Mesh(CG,cmat('bar'));c.scale.set(w,len,len);fg.add(c);}
      fl.push({p,fa,oa});
    };
    for(let i=0;i<7;i++){
      const x=.04+i*.075;
      add(A,x,.62,.17,'wing',1,-1.5+i*.012,0,.01+i*.002);
      add(A,x,.4,.15,'wing',1,-1.5+i*.012,0,.04);
      add(A,x,.24,.14,'wing',0,-1.5+i*.012,0,.06);
    }
    for(let j=0;j<9;j++)add(Hd,.02+j*.045,PL[j],.13,'primary',0,-1.5+j*.012,-.3-j*.1,.01+j*.002);
    for(let j=0;j<5;j++){
      add(Hd,.02+j*.08,.34,.12,'wing',1,-1.5,-.3-j*.18,.04);
      add(Hd,.02+j*.08,.2,.11,'wing',0,-1.5,-.3-j*.18,.06);
    }
    return{Wg,R,Hd,fl};
  });
  const pose=(o,flap,wr)=>wings.forEach(w=>{
    w.Wg.rotation.set(0,(1-o)*1.5,flap);w.R.rotation.x=(1-o)*1.25;w.Hd.rotation.z=wr;
    w.fl.forEach(f=>f.p.rotation.y=MU.lerp(f.fa,f.oa,o));
  });

  // Twelve separate tail feathers with dark tips.
  const T=new THREE.Group();T.position.set(0,1.18,-.85);U.add(T);
  for(let i=0;i<12;i++){
    const p=new THREE.Group();T.add(p);const fg=new THREE.Group();fg.rotation.x=-PI2;fg.position.y=(i%2)*.012;p.add(fg);
    const m=new THREE.Mesh(FG,fmat('tail'));m.scale.set(.2,1,.5);m.castShadow=true;fg.add(m);
    const c=new THREE.Mesh(CG,cmat('band'));c.scale.set(.2,1,.5);fg.add(c);
  }

  // Legs, tarsus, toes and claws.
  const TG=new THREE.CylinderGeometry(.045,.04,.55,8);
  const legs=[-1,1].map(s=>{
    const L=new THREE.Group();L.position.set(s*.3,-.37,.1);B.add(L);
    ell(L,'body',[.22,.3,.3],[0,.13,-.02]);
    ell(L,'feet',[1,1,1],[0,-.27,0],[0,0,0],.6,0,TG);
    const toe=(a,len)=>{
      const P=new THREE.Group();P.position.set(0,-.55,.02);P.rotation.y=a;L.add(P);
      ell(P,'feet',[1,1,1],[0,0,len/2],[PI2,0,0],.6,0,new THREE.CylinderGeometry(.03,.024,len,6));
      ell(P,'beak',[1,1,1],[0,0,len+.02],[PI2,0,0],.5,0,new THREE.ConeGeometry(.026,.07,6));
    };
    [-.55,0,.55].forEach(a=>toe(a,.34));toe(Math.PI,.2);return L;
  });

  // Optional name tag used by the game menu.
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;
  const labelCtx=labelCanvas.getContext('2d');
  function drawName(name){
    labelCtx.clearRect(0,0,512,128);labelCtx.fillStyle='rgba(7,15,24,.68)';
    labelCtx.beginPath();labelCtx.roundRect(8,12,496,104,30);labelCtx.fill();
    labelCtx.strokeStyle='rgba(255,255,255,.36)';labelCtx.lineWidth=4;labelCtx.stroke();
    labelCtx.fillStyle='#fff';labelCtx.font='bold 45px system-ui';labelCtx.textAlign='center';labelCtx.textBaseline='middle';
    labelCtx.fillText(name||'Pico',256,64,455);labelTexture.needsUpdate=true;
  }
  const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;
  const label=new THREE.Sprite(new THREE.SpriteMaterial({map:labelTexture,transparent:true,depthWrite:false}));
  label.scale.set(2.5,.62,1);label.position.set(0,3.45,.1);root.add(label);
  drawName(opts.name||'Pico');

  root.scale.setScalar(opts.scale||1);recolor();pose(0,0,0);
  const ST={air:false,y:0,vy:0,sp:0,h:0,b:0,o:0,ph:0,gp:0,t:0,tk:0,pitch:0,roll:0};

  root.userData={
    materials:M,state:ST,wings:[wings[0].Wg,wings[1].Wg],setWings:pose,
    updateName:drawName,
    setColors(c){
      Object.assign(C,c);
      for(const k in c){if(M[k])M[k].color.set(c[k]);if(F[k])F[k].color.set(c[k]);if(F['c'+k])F['c'+k].color.set(c[k]);}
      recolor();
    },
    control(i,dt){
      dt=Math.min(dt,.05);
      const s=ST,k=a=>1-Math.exp(-a*dt);
      s.t+=dt;
      const lift=MU.clamp(Number.isFinite(i.lift)?i.lift:((i.up?1:0)-(i.down?1:0)),-1,1);
      const fwd=MU.clamp(i.fwd||0,-1,1);
      const turn=MU.clamp(i.turn||0,-1,1);

      if(!s.air&&(i.up||lift>.22)){s.air=true;s.vy=2.7;s.sp=Math.max(s.sp,3.2);}
      if(s.air){
        const cruise=6.0+Math.max(0,fwd)*3.4-Math.max(0,-fwd)*1.8;
        s.sp+=(cruise-s.sp)*k(1.7);
        s.vy+=(lift*4.6-s.vy)*k(2.65);
        s.y+=s.vy*dt;
        if(s.y>35){s.y=35;s.vy=Math.min(0,s.vy);}
        if(s.y<=0&&s.vy<0){s.y=0;s.air=false;s.vy=0;s.sp*=.42;}
      }else{
        s.sp+=(fwd*3.2-s.sp)*k(4.8);
      }

      // Positive turn is right: mouse right and AZERTY D steer to the right.
      s.h+=turn*(s.air?1.48:2.1)*dt;
      root.position.x=MU.clamp(root.position.x+Math.sin(s.h)*s.sp*dt,-235,235);
      root.position.z=MU.clamp(root.position.z+Math.cos(s.h)*s.sp*dt,-235,235);
      root.position.y=s.y;

      s.pitch+=((s.air?-lift*.34:0)-s.pitch)*k(4.0);
      s.roll+=((s.air?-turn*.45:0)-s.roll)*k(3.5);
      root.rotation.order='YXZ';root.rotation.set(s.pitch,s.h,s.roll);
      s.b+=(s.roll-s.b)*k(4);B.rotation.z=s.b;
      B.rotation.x+=((s.air?-s.vy*.055:0)-B.rotation.x)*k(3.6);
      s.o+=((s.air?1:0)-s.o)*k(4.8);

      const flapRate=s.air?(i.boost?17:11):6.5;
      s.ph+=dt*flapRate;
      const amp=s.air?(i.boost?.86:.56):0;
      pose(s.o,amp*Math.sin(s.ph),-amp*.6*Math.sin(s.ph-1.1));

      s.tk+=((s.air?1.25:0)-s.tk)*k(5);
      s.gp+=dt*s.sp*3.2;
      const walking=!s.air&&Math.abs(s.sp)>.3;
      const w=walking?Math.sin(s.gp)*Math.min(.55,Math.abs(s.sp)*.25):0;
      legs[0].rotation.x=s.tk+w;legs[1].rotation.x=s.tk-w;
      H.position.z=1.2+(walking?Math.max(0,Math.sin(s.gp+1.2))*.14:0);
      H.rotation.y=walking||s.air?0:Math.sin(s.t*.8)*.4;
      T.children.forEach((p,j)=>p.rotation.y=(j-5.5)*(s.air?.12:.045));
      T.rotation.x=s.air?-.1:-.2;
      U.position.y=-1.25+(walking?Math.abs(Math.sin(s.gp))*.03:0);
    }
  };
  return root;
}
