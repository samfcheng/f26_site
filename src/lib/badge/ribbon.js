import * as THREE from 'three';
const V=()=>new THREE.Vector3();

// Parallel transport keeps adjacent cross-sections continuous even when the
// curve points toward the camera. No per-vertex sign flips or camera-facing frame.
export function createRibbon(material,segments=80,halfWidth=.085) {
  const sides=12,stride=sides+1,positions=new Float32Array((segments+1)*stride*3),normals=positions.slice(),uv=new Float32Array((segments+1)*stride*2),indices=[];
  for(let i=0;i<=segments;i++)for(let j=0;j<=sides;j++){
    const n=i*stride+j;uv[n*2]=j/sides;uv[n*2+1]=i/segments;
    if(i<segments&&j<sides)indices.push(n,n+1,n+stride,n+1,n+stride+1,n+stride);
  }
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.BufferAttribute(normals,3));geometry.setAttribute('uv',new THREE.BufferAttribute(uv,2));geometry.setIndex(indices);
  const mesh=new THREE.Mesh(geometry,material);mesh.castShadow=true;mesh.frustumCulled=false;
  const tangents=Array.from({length:segments+1},V),frames=Array.from({length:segments+1},V),points=Array.from({length:segments+1},V);
  const rotation=new THREE.Quaternion(),cross=V(),normal=V(),side=V(),p=V();let previousTwist=0;
  function update(curve,endAxis,dt=1/60,constrainPoint){
    for(let i=0;i<=segments;i++){curve.getPoint(i/segments,points[i]);curve.getTangent(i/segments,tangents[i]).normalize();}
    if(constrainPoint){
      let adjusted=false;
      for(const point of points)adjusted=constrainPoint(point)||adjusted;
      if(adjusted)for(let i=0;i<=segments;i++)tangents[i].copy(points[Math.min(segments,i+1)]).sub(points[Math.max(0,i-1)]).normalize();
    }
    frames[0].set(1,0,0).addScaledVector(tangents[0],-tangents[0].x).normalize();
    for(let i=1;i<=segments;i++){
      rotation.setFromUnitVectors(tangents[i-1],tangents[i]);frames[i].copy(frames[i-1]).applyQuaternion(rotation);
      frames[i].addScaledVector(tangents[i],-frames[i].dot(tangents[i])).normalize();
    }
    const end=side.copy(endAxis).addScaledVector(tangents[segments],-endAxis.dot(tangents[segments])).normalize();
    let twist=Math.atan2(cross.crossVectors(frames[segments],end).dot(tangents[segments]),frames[segments].dot(end));
    // Both faces of this unmarked webbing are equivalent. Select the
    // least-twisted cross-section instead of accumulating whole revolutions.
    const target=.5*Math.atan2(Math.sin(2*twist),Math.cos(2*twist));
    previousTwist+=(target-previousTwist)*(1-Math.exp(-14*dt));
    twist=previousTwist;
    for(let i=0;i<=segments;i++){
      side.copy(frames[i]).applyAxisAngle(tangents[i],twist*THREE.MathUtils.smoothstep(i/segments,0,1));normal.crossVectors(side,tangents[i]).normalize();
      const width=halfWidth,depth=.012;
      for(let j=0;j<=sides;j++){
        const a=j/sides*Math.PI*2,cos=Math.cos(a),sin=Math.sin(a),index=(i*stride+j)*3;
        p.copy(points[i]).addScaledVector(side,cos*width).addScaledVector(normal,sin*depth);p.toArray(positions,index);
        p.copy(side).multiplyScalar(cos/width).addScaledVector(normal,sin/depth).normalize().toArray(normals,index);
      }
    }
    geometry.attributes.position.needsUpdate=true;geometry.attributes.normal.needsUpdate=true;
  }
  return {mesh,update,getTwist(){return previousTwist;},reset(){previousTwist=0;}};
}
