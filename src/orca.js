import * as THREE from 'three';

function triangle(points,material){
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points.flat(),3));
  geometry.setIndex([0,1,2]);geometry.computeVertexNormals();
  return new THREE.Mesh(geometry,material);
}

export function createOrca(){
  const root=new THREE.Group(),rig=new THREE.Group();root.add(rig);
  const black=new THREE.MeshStandardMaterial({color:0x101d28,roughness:.42,metalness:.05});
  const white=new THREE.MeshStandardMaterial({color:0xf2f5ee,roughness:.58});
  const finMat=new THREE.MeshStandardMaterial({color:0x0b1722,roughness:.48,side:THREE.DoubleSide});
  const eyeMat=new THREE.MeshStandardMaterial({color:0x05090d,roughness:.2});
  const sphere=new THREE.SphereGeometry(1,22,14);
  const ell=(material,scale,position)=>{
    const mesh=new THREE.Mesh(sphere,material);mesh.scale.set(...scale);mesh.position.set(...position);
    rig.add(mesh);return mesh;
  };

  // Broad black body with the characteristic white underside and eye patches.
  ell(black,[.78,.72,1.92],[0,0,0]);
  ell(white,[.62,.31,1.42],[0,-.43,.16]);
  for(const side of [-1,1]){
    ell(white,[.12,.29,.42],[side*.64,.25,.92]);
    ell(eyeMat,[.045,.052,.06],[side*.745,.27,1.12]);
  }
  const dorsal=triangle([[0,.54,-.55],[0,1.45,-.25],[0,.57,.17]],finMat);
  rig.add(dorsal);
  const pectorals=[];
  for(const side of [-1,1]){
    const fin=triangle([
      [side*.48,-.12,.28],
      [side*1.28,-.36,-.72],
      [side*.55,-.42,-.60]
    ],finMat);
    rig.add(fin);pectorals.push(fin);
  }

  const tail=new THREE.Group();tail.position.set(0,0,-1.72);rig.add(tail);
  const stock=new THREE.Mesh(new THREE.CylinderGeometry(.16,.22,.78,12),black);
  stock.rotation.x=Math.PI/2;stock.position.z=-.28;tail.add(stock);
  // Orca flukes are horizontal, unlike the shark's vertical tail.
  tail.add(triangle([[0,0,-.48],[.92,0,-1.02],[.18,0,-.22]],finMat));
  tail.add(triangle([[0,0,-.48],[-.92,0,-1.02],[-.18,0,-.22]],finMat));

  root.userData.update=(time)=>{
    const phase=time*3.1;
    tail.rotation.y=Math.sin(phase)*.42;
    rig.rotation.z=Math.sin(phase*.72)*.025;
    rig.position.y=Math.sin(phase*1.35)*.09;
    pectorals[0].rotation.z=-.03+Math.sin(phase*.6)*.025;
    pectorals[1].rotation.z=.03-Math.sin(phase*.6)*.025;
    dorsal.rotation.x=Math.sin(phase)*.018;
  };
  return root;
}
