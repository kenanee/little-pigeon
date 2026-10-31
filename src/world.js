import * as THREE from 'three';

const LIMIT=238;
const rand=(min,max)=>min+Math.random()*(max-min);

function sandTexture(){
  const canvas=document.createElement('canvas');canvas.width=256;canvas.height=256;
  const ctx=canvas.getContext('2d');ctx.fillStyle='#8b987f';ctx.fillRect(0,0,256,256);
  for(let i=0;i<9000;i++){
    const v=Math.floor(rand(105,205));
    ctx.fillStyle='rgba('+v+','+Math.floor(v*.94)+','+Math.floor(v*.78)+','+rand(.04,.22)+')';
    ctx.beginPath();ctx.arc(Math.random()*256,Math.random()*256,rand(.3,1.8),0,Math.PI*2);ctx.fill();
  }
  const texture=new THREE.CanvasTexture(canvas);
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;texture.repeat.set(18,18);
  texture.colorSpace=THREE.SRGBColorSpace;return texture;
}

export async function createWorld(scene){
  scene.background=new THREE.Color(0x062b43);
  scene.fog=new THREE.Fog(0x073b55,58,255);

  const hemi=new THREE.HemisphereLight(0x9ce7ff,0x102d35,1.35);scene.add(hemi);
  const sun=new THREE.DirectionalLight(0x9fe9ff,1.45);
  sun.position.set(-65,90,45);scene.add(sun);
  const fill=new THREE.DirectionalLight(0x267da1,.48);fill.position.set(65,22,-80);scene.add(fill);
  const deepFill=new THREE.PointLight(0x087b9b,.65,170,1.8);deepFill.position.set(0,-2,0);scene.add(deepFill);

  // The seabed is one broad textured plane; the translucent surface gives a sense of depth.
  const floor=new THREE.Mesh(
    new THREE.PlaneGeometry(520,520),
    new THREE.MeshStandardMaterial({map:sandTexture(),color:0xbac5aa,roughness:1})
  );
  floor.rotation.x=-Math.PI/2;floor.position.y=-16;floor.receiveShadow=false;scene.add(floor);

  const surface=new THREE.Mesh(
    new THREE.PlaneGeometry(520,520),
    new THREE.MeshBasicMaterial({color:0x1785a7,transparent:true,opacity:.18,side:THREE.DoubleSide,depthWrite:false})
  );
  surface.rotation.x=-Math.PI/2;surface.position.y=34;scene.add(surface);

  // Rocks: hundreds of low-poly forms in one instanced batch.
  const rockGeo=new THREE.DodecahedronGeometry(1,0);
  const rockMat=new THREE.MeshStandardMaterial({color:0x6e8580,roughness:1});
  const rocks=new THREE.InstancedMesh(rockGeo,rockMat,360);
  rocks.instanceMatrix.setUsage(THREE.StaticDrawUsage);
  const dummy=new THREE.Object3D();
  const rockColors=[0x526d70,0x71877e,0x405c66,0x89968a,0x596b75].map(c=>new THREE.Color(c));
  for(let i=0;i<360;i++){
    const x=rand(-250,250),z=rand(-250,250),sx=rand(1.1,5.2),sy=rand(.5,2.7),sz=rand(1.2,5.5);
    dummy.position.set(x,-15.8+sy*.28,z);dummy.rotation.set(rand(-.35,.35),rand(0,Math.PI*2),rand(-.35,.35));
    dummy.scale.set(sx,sy,sz);dummy.updateMatrix();rocks.setMatrixAt(i,dummy.matrix);
    rocks.setColorAt(i,rockColors[i%rockColors.length]);
  }
  scene.add(rocks);

  // Kelp and sea plants use instancing to keep draw calls low.
  const kelpMat=new THREE.MeshStandardMaterial({color:0x347d65,roughness:.95});
  const kelp=new THREE.InstancedMesh(new THREE.CylinderGeometry(.055,.13,1,5),kelpMat,520);
  for(let i=0;i<520;i++){
    const h=rand(1.4,5.2);
    dummy.position.set(rand(-248,248),-15.7+h/2,rand(-248,248));
    dummy.rotation.set(rand(-.16,.16),rand(0,Math.PI*2),rand(-.34,.34));
    dummy.scale.set(rand(.8,1.35),h,rand(.8,1.35));dummy.updateMatrix();kelp.setMatrixAt(i,dummy.matrix);
    kelp.setColorAt(i,new THREE.Color().setHSL(rand(.28,.43),rand(.3,.62),rand(.22,.38)));
  }
  scene.add(kelp);

  const coralMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.75});
  const coral=new THREE.InstancedMesh(new THREE.ConeGeometry(.22,1.45,5),coralMat,270);
  const coralPalette=[0xe47d66,0xd66da6,0xe6b86a,0x59b7ac,0x8a87ce].map(c=>new THREE.Color(c));
  for(let i=0;i<270;i++){
    const h=rand(.65,2.3);
    dummy.position.set(rand(-248,248),-15.8+h/2,rand(-248,248));
    dummy.rotation.set(rand(-.13,.13),rand(0,Math.PI*2),rand(-.28,.28));
    dummy.scale.set(rand(.75,1.4),h,rand(.75,1.4));dummy.updateMatrix();coral.setMatrixAt(i,dummy.matrix);
    coral.setColorAt(i,coralPalette[i%coralPalette.length]);
  }
  scene.add(coral);

  // Small fish silhouettes form a few distant schools.
  const fishMat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.55,metalness:.12});
  const fish=new THREE.InstancedMesh(new THREE.ConeGeometry(.13,.62,5),fishMat,150);
  for(let i=0;i<150;i++){
    dummy.position.set(rand(-220,220),rand(-7,27),rand(-220,220));
    dummy.rotation.set(Math.PI/2,rand(0,Math.PI*2),rand(-.12,.12));
    const s=rand(.65,1.3);dummy.scale.set(s,s,s);dummy.updateMatrix();fish.setMatrixAt(i,dummy.matrix);
    fish.setColorAt(i,new THREE.Color().setHSL(rand(.48,.62),rand(.3,.65),rand(.4,.7)));
  }
  scene.add(fish);

  // A few faint shafts of surface light add atmosphere without expensive post-processing.
  const rayMat=new THREE.MeshBasicMaterial({color:0x5cc9e8,transparent:true,opacity:.045,depthWrite:false,side:THREE.DoubleSide});
  const rays=new THREE.Group();
  for(let i=0;i<9;i++){
    const ray=new THREE.Mesh(new THREE.CylinderGeometry(rand(.7,1.8),rand(2,4),36,7,1,true),rayMat);
    ray.position.set(rand(-210,210),15,rand(-210,210));ray.rotation.z=rand(-.12,.12);rays.add(ray);
  }
  scene.add(rays);

  // Drifting bubbles are a single Points object, updated in place.
  const bubbleCount=260;
  const bubblePositions=new Float32Array(bubbleCount*3);
  const bubbleSpeeds=new Float32Array(bubbleCount);
  for(let i=0;i<bubbleCount;i++){
    bubblePositions[i*3]=rand(-245,245);
    bubblePositions[i*3+1]=rand(-15,31);
    bubblePositions[i*3+2]=rand(-245,245);
    bubbleSpeeds[i]=rand(1.1,3.8);
  }
  const bubbleGeo=new THREE.BufferGeometry();
  bubbleGeo.setAttribute('position',new THREE.BufferAttribute(bubblePositions,3));
  const bubbles=new THREE.Points(bubbleGeo,new THREE.PointsMaterial({color:0xbbeeff,size:.22,transparent:true,opacity:.42,sizeAttenuation:true,depthWrite:false}));
  scene.add(bubbles);

  // Collectible pearls are lightweight spheres scattered throughout the water column.
  const pearlMat=new THREE.MeshStandardMaterial({color:0xf3f6ed,metalness:.32,roughness:.2,emissive:0x28516a,emissiveIntensity:.28});
  const pearlGeo=new THREE.SphereGeometry(.31,12,10);
  const coins=[];
  function oceanPoint(){
    return {x:rand(-222,222),y:rand(-7,25),z:rand(-222,222)};
  }
  for(let i=0;i<58;i++){
    const p=oceanPoint(),mesh=new THREE.Mesh(pearlGeo,pearlMat);
    mesh.position.set(p.x,p.y,p.z);mesh.castShadow=false;scene.add(mesh);
    coins.push({mesh,phase:rand(0,Math.PI*2),respawn:0});
  }

  function update(dt){
    for(const coin of coins){
      coin.phase+=dt*2.1;
      coin.mesh.rotation.y+=dt*1.2;
      coin.mesh.position.y+=Math.sin(coin.phase)*dt*.22;
      if(coin.respawn>0){
        coin.respawn-=dt;
        if(coin.respawn<=0){
          const p=oceanPoint();coin.mesh.position.set(p.x,p.y,p.z);coin.mesh.visible=true;
        }
      }
    }
    for(let i=0;i<bubbleCount;i++){
      const j=i*3;
      bubblePositions[j+1]+=bubbleSpeeds[i]*dt;
      bubblePositions[j]+=Math.sin((bubblePositions[j+2]+i)*.025+performance.now()*.00035)*dt*.18;
      if(bubblePositions[j+1]>33){
        bubblePositions[j]=rand(-245,245);bubblePositions[j+1]=-15; bubblePositions[j+2]=rand(-245,245);
      }
    }
    bubbleGeo.attributes.position.needsUpdate=true;
  }

  function updateLighting(daylight){
    const deep=new THREE.Color(0x031a2e),bright=new THREE.Color(0x0b4d68);
    const water=new THREE.Color().lerpColors(deep,bright,daylight);
    scene.background.copy(water);scene.fog.color.copy(water);
    scene.fog.near=daylight<.35?48:62;scene.fog.far=daylight<.35?215:270;
    hemi.intensity=.62+daylight*.82;
    sun.intensity=.25+daylight*1.2;
    fill.intensity=.16+daylight*.42;
    deepFill.intensity=.28+daylight*.35;
    return daylight>.68?'CLAIRE':daylight>.34?'TOMBE':'ABYSSE';
  }

  return {
    coins,cars:[],hemi,sun,fill,ready:Promise.resolve({loaded:true}),
    update,updateLighting
  };
}
