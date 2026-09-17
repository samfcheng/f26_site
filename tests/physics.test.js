import test from 'node:test';
import assert from 'node:assert/strict';
import RAPIER from '@dimforge/rapier3d-compat';
import {createSuspension,restoringYawTorque} from '../src/lib/badge/suspension.js';
await RAPIER.init();
const defaults={mass:.72,gravity:9.81,damping:.45,strapStiffness:90,antiTwist:2.2,twistProgression:3,swivelDamping:.15};
const yaw=q=>Math.atan2(2*(q.w*q.y+q.x*q.z),1-2*(q.x*q.x+q.y*q.y));
function run(s,p,n){for(let i=0;i<n;i++){s.update(p);s.world.step();}}
function point(body,a){
  const q=body.rotation(),p=body.translation();
  const tx=2*(q.y*a.z-q.z*a.y),ty=2*(q.z*a.x-q.x*a.z),tz=2*(q.x*a.y-q.y*a.x);
  return {x:p.x+a.x+q.w*tx+q.y*tz-q.z*ty,y:p.y+a.y+q.w*ty+q.z*tx-q.x*tz,z:p.z+a.z+q.w*tz+q.x*ty-q.y*tx};
}
function gap(j){const a=point(j.body1(),j.anchor1()),b=point(j.body2(),j.anchor2());return Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);}

test('twist resistance grows progressively and can be disabled',()=>{
  const small=Math.abs(restoringYawTorque(.2,0,2.2,3)),large=Math.abs(restoringYawTorque(.8,0,2.2,3));
  assert.ok(large>small*4);assert.equal(restoringYawTorque(2,3,0,3),0);
  assert.ok(restoringYawTorque(.8,0,2.2,3)<0);assert.ok(restoringYawTorque(-.8,0,2.2,3)>0);
});
test('clasp spins independently inside the eye bearing',()=>{
  const p={...defaults,antiTwist:0,swivelDamping:0},s=createSuspension(p);
  try{
    run(s,p,120);s.clasp.applyTorqueImpulse({x:0,y:.035,z:0},true);run(s,p,80);
    assert.ok(Math.abs(yaw(s.clasp.rotation())-yaw(s.eye.rotation()))>.1);
    assert.ok(gap(s.swivel)<.015);assert.ok(gap(s.foldJoint)<.015);
  }finally{s.world.free();}
});
test('attachment constraints survive a hard throw at both mass extremes',()=>{
  for(const mass of [.2,2]){
    const p={...defaults,mass},s=createSuspension(p);
    try{
      s.body.setLinvel({x:9,y:11,z:3},true);s.body.setAngvel({x:3,y:8,z:6},true);run(s,p,1200);
      const pos=s.body.translation();assert.ok(Object.values(pos).every(Number.isFinite));assert.ok(Math.abs(pos.x)<1.8&&pos.y>-1);
      for(const j of [s.badgeJoint,s.swivel,s.foldJoint])assert.ok(gap(j)<.02,`joint gap ${gap(j)}`);
    }finally{s.world.free();}
  }
});

test('ribbon cross-sections and seam normals remain continuous through twisting',async()=>{
  const THREE=await import('three');const {createRibbon}=await import('../src/lib/badge/ribbon.js');
  const material=new THREE.MeshStandardMaterial(),ribbon=createRibbon(material);
  const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(0,5,0),new THREE.Vector3(0,4,0),new THREE.Vector3(.05,3.8,1.1),new THREE.Vector3(.1,3,2),new THREE.Vector3(.2,2,2)]);
  try{
    for(let angle=0;angle<6;angle+=.1){
      ribbon.update(curve,new THREE.Vector3(Math.cos(angle),0,Math.sin(angle)));
      const p=ribbon.mesh.geometry.attributes.position,n=ribbon.mesh.geometry.attributes.normal;
      let previous;
      for(let i=0;i<=80;i++){
        const side=new THREE.Vector3().fromBufferAttribute(p,i*13).sub(new THREE.Vector3().fromBufferAttribute(p,i*13+6)).normalize();
        if(previous)assert.ok(side.dot(previous)>.7,'cross-section flipped');previous=side;
        const seamA=new THREE.Vector3().fromBufferAttribute(n,i*13),seamB=new THREE.Vector3().fromBufferAttribute(n,i*13+12);
        assert.ok(seamA.dot(seamB)>.999,'normal seam opened');
      }
    }
  }finally{ribbon.mesh.geometry.dispose();material.dispose();}
});

test('repeated full turns cannot wind ribbon into a corkscrew',async()=>{
  const THREE=await import('three');const {createRibbon}=await import('../src/lib/badge/ribbon.js');
  const material=new THREE.MeshStandardMaterial(),ribbon=createRibbon(material);
  const curve=new THREE.LineCurve3(new THREE.Vector3(0,5,0),new THREE.Vector3(0,0,0));
  try{
    for(let i=0;i<2000;i++){
      const a=i*.08;ribbon.update(curve,new THREE.Vector3(Math.cos(a),0,Math.sin(a)));
      assert.ok(Math.abs(ribbon.getTwist())<=Math.PI/2+1e-6);
    }
  }finally{ribbon.mesh.geometry.dispose();material.dispose();}
});
test('wall stops the badge and hardware under a backward throw',()=>{
  const s=createSuspension(defaults);
  try{
    s.body.setLinvel({x:2,y:5,z:-28},true);s.body.setAngvel({x:4,y:5,z:2},true);
    for(let i=0;i<600;i++){
      s.update(defaults);s.world.step();
      for(const x of [-1.38,1.38])for(const y of [-2.2,2.2])for(const z of [-.07,.07]){
        assert.ok(point(s.body,{x,y,z}).z>=-1.035,'badge passed through wall');
      }
      for(const b of [s.clasp,s.eye,s.yoke])assert.ok(b.translation().z>-.98,'hardware passed wall');
    }
  }finally{s.world.free();}
});
test('strap segments collide with the badge during a lifted throw',()=>{
  const s=createSuspension(defaults);let contacts=0,worst=0;
  try{
    s.body.setLinvel({x:1,y:14,z:-.3},true);
    for(let i=0;i<600;i++){
      s.update(defaults);s.world.step();
      for(const strap of s.straps)for(const segment of strap.segments){
        const contact=segment.contactCollider(s.collider,0);
        if(contact){contacts++;worst=Math.min(worst,contact.distance);}
      }
    }
    assert.ok(contacts>0,'lift did not exercise strap contact');
    // Inflated proxies provide 0.065 units of combined clearance beyond the visible surfaces.
    assert.ok(worst>-.05,`excessive strap penetration ${worst}`);
  }finally{s.world.free();}
});

test('sewn attachment faces forward and settles after being disturbed',()=>{
  const s=createSuspension(defaults);
  try{
    s.body.applyImpulseAtPoint({x:.4,y:.2,z:.1},{x:.8,y:-.6,z:.04},true);
    run(s,defaults,2400);
    assert.ok(Math.abs(yaw(s.yoke.rotation()))<.12,'tab turned edge-on');
    assert.ok(Math.hypot(...Object.values(s.yoke.angvel()))<.15,'tab is still chattering');
    assert.ok(Math.hypot(...Object.values(s.body.linvel()))<.15,'badge did not settle');
  }finally{s.world.free();}
});
