import RAPIER from '@dimforge/rapier3d-compat';
import {Vector3,Quaternion} from 'three';

export const WALL_Z=-1;
const BADGE_GROUP=0x00010006, STRAP_GROUP=0x00020005, HARDWARE_GROUP=0x00080004, WALL_GROUP=0x0004000b;

const v=(x=0,y=0,z=0)=>({x,y,z});
const REST_Y=.15;
export function restoringYawTorque(yaw, velocity, strength, progression) {
  if(strength===0)return 0;
  const spring=-strength*yaw*(1+progression*(Math.abs(yaw)/Math.PI)**2);
  return Math.max(-18,Math.min(18,spring-.65*Math.sqrt(strength)*velocity));
}

// The three hardware bodies have their own inertia and actual mechanical joints.
export function createSuspension(settings) {
  const world=new RAPIER.World(v(0,-9.81,0));world.timestep=1/120;world.numSolverIterations=32;
  const resets=[];
  const wall=world.createCollider(RAPIER.ColliderDesc.cuboid(50,50,.2).setTranslation(0,0,WALL_Z-.2).setCollisionGroups(WALL_GROUP).setFriction(.4));
  function dynamic(position,halfExtents,mass,damping=.5,groups=HARDWARE_GROUP){
    const body=world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(position.x,position.y,position.z).setLinearDamping(damping).setAngularDamping(.6).setCcdEnabled(true).setCanSleep(false));
    const collider=world.createCollider(RAPIER.ColliderDesc.cuboid(...halfExtents).setMass(mass).setCollisionGroups(groups).setFriction(.45).setRestitution(0),body);
    resets.push({body,position});return {body,collider};
  }
  const {body,collider}=dynamic(v(0,REST_Y,0),[1.40,2.22,.105],settings.mass,.5,BADGE_GROUP);
  const clasp=dynamic(v(0,REST_Y+2.20,.03),[.21,.33,.13],.09).body;
  const eye=dynamic(v(0,REST_Y+2.64,.03),[.22,.21,.09],.055).body;
  const yoke=dynamic(v(0,REST_Y+2.93,.03),[.10,.22,.08],.045,.5,STRAP_GROUP).body;
  // The hook captures the plastic bridge ABOVE the slot. Pivot about the
  // material inside the loop, not its bottom tip (which passes through the
  // slot). Both anchors coincide in the initial threaded configuration.
  const badgeJoint=world.createImpulseJoint(RAPIER.JointData.spherical(v(0,2.025,.03),v(0,-.175,0)),body,clasp,true);
  // A vertical bearing allows the clasp to rotate within its stationary socket.
  const swivel=world.createImpulseJoint(RAPIER.JointData.revolute(v(0,.26,0),v(0,-.18,0),v(0,1,0)),clasp,eye,true);
  // The folded fabric can rock around the transverse upper bar of the eye.
  const foldJoint=world.createImpulseJoint(RAPIER.JointData.revolute(v(0,.13,0),v(0,-.16,0),v(1,0,0)),eye,yoke,true);
  foldJoint.setLimits(-1.15,1.15);
  const straps=[];
  for(const sign of [-1,1]){
    const anchorPosition=v(sign*2.6,9.5,-.25),attachment=v(0,.04,sign*.061);
    // The sewn layers transfer tension through their shared seam. Keeping
    // the load points in that seam avoids an artificial front/back torque.
    const loadPoint=v(sign*.015,.04,0);
    const end=v(loadPoint.x,REST_Y+2.93+loadPoint.y,.03);
    const dx=end.x-anchorPosition.x,dy=end.y-anchorPosition.y,dz=end.z-anchorPosition.z;
    const count=12,segment=Math.hypot(dx,dy,dz)/count;
    const anchor=world.createRigidBody(RAPIER.RigidBodyDesc.fixed().setTranslation(anchorPosition.x,anchorPosition.y,anchorPosition.z));
    const links=[],segments=[];
    for(let i=1;i<=count;i++){
      const p=v(anchorPosition.x+dx*i/count,anchorPosition.y+dy*i/count,anchorPosition.z+dz*i/count);
      const part=dynamic(p,[.025,.025,.018],.0125,1.6,STRAP_GROUP),link=part.body;
      link.setEnabledRotations(false,false,false,true);
      part.collider.setShape(new RAPIER.Capsule(segment/2,.11));
      segments.push(part.collider);
      world.createImpulseJoint(RAPIER.JointData.rope(segment,v(),v()),links.at(-1)||anchor,link,true);links.push(link);
    }
    world.createImpulseJoint(RAPIER.JointData.spherical(v(),loadPoint),links.at(-1),yoke,true);
    straps.push({anchor,anchorPosition,links,attachment,segment,segments});
  }
  const delta=new Vector3(),rotation=new Quaternion(),up=new Vector3(0,1,0);
  function updateSegments(){
    for(const strap of straps)strap.links.forEach((link,i)=>{
      const current=link.translation(),previous=(i?strap.links[i-1]:strap.anchor).translation();
      delta.set(previous.x-current.x,previous.y-current.y,previous.z-current.z);
      strap.segments[i].setTranslationWrtParent(v(delta.x/2,delta.y/2,delta.z/2));
      if(delta.lengthSq()>1e-10){rotation.setFromUnitVectors(up,delta.normalize());strap.segments[i].setRotationWrtParent(rotation);}
    });
  }
  updateSegments();
  let stiffness=-1,mass=settings.mass;
  const bends=[];
  function update(settings,reduced=false){
    updateSegments();
    world.gravity.y=-settings.gravity;
    body.setLinearDamping(settings.damping+(reduced?2:0));body.setAngularDamping(settings.damping+.2+(reduced?2:0));
    if(mass!==settings.mass){mass=settings.mass;collider.setMass(mass);body.recomputeMassPropertiesFromColliders();}
    if(stiffness!==settings.strapStiffness){
      stiffness=settings.strapStiffness;bends.forEach(j=>world.removeImpulseJoint(j,true));bends.length=0;
      for(const strap of straps){
        const chain=[strap.anchor,...strap.links];
        for(const span of [1,2,3])for(let i=span;i<chain.length;i++){
          const k=stiffness*(span===1?.6:span===2?1:.45);
          bends.push(world.createImpulseJoint(RAPIER.JointData.spring(strap.segment*span,k,1.4*Math.sqrt(k*.0125),v(),v()),chain[i-span],chain[i],true));
        }
      }
    }
    // Motor velocity 0 can lock a Rapier hinge even with factor 0. Apply
    // equal/opposite bearing friction impulses so zero really means free.
    function friction(first,second,axis,damping,inertia){
      const q=second.rotation(),tx=2*(q.y*axis.z-q.z*axis.y),ty=2*(q.z*axis.x-q.x*axis.z),tz=2*(q.x*axis.y-q.y*axis.x);
      const n=v(axis.x+q.w*tx+q.y*tz-q.z*ty,axis.y+q.w*ty+q.z*tx-q.x*tz,axis.z+q.w*tz+q.x*ty-q.y*tx);
      const a=first.angvel(),b=second.angvel(),speed=(a.x-b.x)*n.x+(a.y-b.y)*n.y+(a.z-b.z)*n.z;
      const impulse=-speed*inertia*(1-Math.exp(-damping*10*world.timestep));
      first.applyTorqueImpulse(v(n.x*impulse,n.y*impulse,n.z*impulse),true);
      second.applyTorqueImpulse(v(-n.x*impulse,-n.y*impulse,-n.z*impulse),true);
    }
    friction(clasp,eye,v(0,1,0),settings.swivelDamping,.000369);
    friction(eye,yoke,v(1,0,0),.08+settings.swivelDamping*.4,.000199);
    // Webbing resists twisting about its length. Integrate this small body's
    // restoring spring implicitly so the stiff orientation constraint cannot
    // inject energy at the fixed timestep. The clasp bearing remains free.
    const tabQ=yoke.rotation();
    const tabYaw=Math.atan2(2*(tabQ.x*tabQ.z+tabQ.w*tabQ.y),1-2*(tabQ.x*tabQ.x+tabQ.y*tabQ.y));
    const inertia=.001,k=2,c=.12,dt=world.timestep;
    const tabImpulse=-(k*tabYaw+c*yoke.angvel().y)*dt/(1+c*dt/inertia+k*dt*dt/inertia);
    yoke.applyTorqueImpulse(v(0,tabImpulse,0),true);
    const q=body.rotation(),normalX=2*(q.x*q.z+q.w*q.y),normalZ=1-2*(q.x*q.x+q.y*q.y);
    const yaw=Math.atan2(normalX,normalZ);
    body.applyTorqueImpulse(v(0,restoringYawTorque(yaw,body.angvel().y,settings.antiTwist,settings.twistProgression)*world.timestep,0),true);
  }
  function reset(){
    for(const {body,position} of resets){body.setTranslation(position,true);body.setRotation({x:0,y:0,z:0,w:1},true);body.setLinvel(v(),true);body.setAngvel(v(),true);body.resetForces(true);body.resetTorques(true);}
    updateSegments();
  }
  update(settings);
  return {world,body,collider,wall,clasp,eye,yoke,straps,restY:REST_Y,update,reset,badgeJoint,swivel,foldJoint};
}
