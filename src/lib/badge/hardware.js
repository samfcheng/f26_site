import * as THREE from 'three';
import { createRibbon } from './ribbon.js';
const V=(x=0,y=0,z=0)=>new THREE.Vector3(x,y,z);

export function createHardware(metal,fabric) {
  const clasp=new THREE.Group(),eye=new THREE.Group(),yoke=new THREE.Group();
  // The hook threads through the slot across the sleeve thickness.
  const casting=new THREE.Group();casting.rotation.y=Math.PI/2;clasp.add(casting);
  function mesh(geometry,material,parent,position=V()) {const m=new THREE.Mesh(geometry,material);m.position.copy(position);m.castShadow=true;parent.add(m);return m;}
  function rod(a,b,r,parent=casting){
    const delta=b.clone().sub(a),m=mesh(new THREE.CylinderGeometry(r,r,delta.length(),20),metal,parent,a.clone().add(b).multiplyScalar(.5));
    m.quaternion.setFromUnitVectors(V(0,1,0),delta.normalize());return m;
  }
  function tube(points,r,parent=casting){return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points),64,r,12,false),metal,parent);}
  // Die-cast lobster clasp, with a broad tapered housing rather than a wire
  // carabiner. The moving gate and thumb lever share a visible pivot axle.
  const housing=new THREE.Shape();housing.moveTo(-.052,.245);housing.lineTo(.052,.245);
  housing.bezierCurveTo(.062,.17,.075,.06,.105,-.09);
  housing.quadraticCurveTo(.075,-.08,.04,-.035);
  housing.quadraticCurveTo(-.025,.045,-.11,.018);
  housing.quadraticCurveTo(-.07,.11,-.052,.245);
  const castingGeo=new THREE.ExtrudeGeometry(housing,{depth:.047,bevelEnabled:true,bevelSegments:4,bevelSize:.012,bevelThickness:.012,curveSegments:20});castingGeo.translate(0,0,-.0235);
  mesh(castingGeo,metal,casting);
  // Continuous hook bowl; its open nose follows the same tangent as the
  // closed gate, avoiding the kink produced by joining two unrelated curves.
  const hook=new THREE.CurvePath();
  hook.add(new THREE.CubicBezierCurve3(V(.075,.015),V(.14,-.10),V(.13,-.30),V(0,-.32)));
  hook.add(new THREE.CubicBezierCurve3(V(0,-.32),V(-.15,-.34),V(-.19,-.20),V(-.15,-.10)));
  mesh(new THREE.TubeGeometry(hook,80,.025,16,false),metal,casting);
  const gate=new THREE.Group();casting.add(gate);
  // The tang starts inside the housing at the rivet. Only the short,
  // gently sloping lower section emerges to meet the hook's nose.
  const gateCurve=new THREE.CubicBezierCurve3(V(-.03,.069),V(-.09,.075),V(-.13,-.05),V(-.15,-.10));
  const latch=mesh(new THREE.TubeGeometry(gateCurve,40,.024,16,false),metal,gate);
  latch.scale.z=.75;
  // Thumb tab at the side of the housing, joined to the same spring gate.
  tube([V(.073,.07,-.01),V(.178,.015,-.01),V(.182,-.027,-.01),V(.13,-.047,-.01)],.011);
  const pivot=mesh(new THREE.CylinderGeometry(.028,.028,.075,24),metal,casting,V(-.03,.069,0));pivot.rotation.x=Math.PI/2;
  for(const sign of [-1,1]){
    mesh(new THREE.TorusGeometry(.022,.0038,8,24),metal,casting,V(-.03,.069,sign*.04));
    mesh(new THREE.SphereGeometry(.012,16,10),metal,casting,V(-.03,.069,sign*.04)).scale.z=.25;
  }
  // The spindle is part of the clasp. The socket and retaining washer belong
  // to the independent eye, with overlap along the physical revolute axis.
  rod(V(0,.225,0),V(0,.285,0),.042,clasp);
  mesh(new THREE.CylinderGeometry(.069,.058,.085,32),metal,eye,V(0,-.146,0));
  mesh(new THREE.CylinderGeometry(.084,.084,.019,32),metal,eye,V(0,-.115,0));
  const eyeCurve=new THREE.CatmullRomCurve3([V(-.115,.13),V(-.125,.04),V(-.115,-.07),V(0,-.10),V(.115,-.07),V(.125,.04),V(.115,.13)],false);
  mesh(new THREE.TubeGeometry(eyeCurve,80,.027,12,false),metal,eye);
  rod(V(-.115,.13),V(.115,.13),.027,eye);
  // A single strap-width fold wraps the bar. Its front and back layers
  // continue into opposite neck branches at their respective depths.
  const thread=new THREE.MeshStandardMaterial({color:'#777d68',roughness:1});
  const path=new THREE.CatmullRomCurve3([V(0,.04,.061),V(0,-.06,.061),V(0,-.16,.061),V(0,-.22,0),V(0,-.16,-.061),V(0,-.06,-.061),V(0,.04,-.061)]);
  const fold=createRibbon(fabric,64,.085);fold.update(path,V(1,0,0),1);yoke.add(fold.mesh);
  for(const sign of [-1,1])for(const y of [-.04,0])for(let j=0;j<6;j++)mesh(new THREE.BoxGeometry(.010,.003,.002),thread,yoke,V(-.06+j*.024,y,sign*.073));
  return {clasp,eye,yoke};
}
