import { Vector2 } from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';

export function createSceneFilters(renderer, scene, camera) {
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  // Work in display color after the normal scene tone mapping.
  const output=new OutputPass();
  // Tone mapping and sRGB transfer are nonlinear: operate on straight RGB,
  // then restore premultiplication for compositing over HTML.
  output.material.fragmentShader=output.material.fragmentShader
    .replace('// tone mapping','gl_FragColor.rgb /= max(gl_FragColor.a, 0.0001);\n // tone mapping');
  const end=output.material.fragmentShader.lastIndexOf('}');
  output.material.fragmentShader=output.material.fragmentShader.slice(0,end)
    +'gl_FragColor.rgb *= gl_FragColor.a;\n'+output.material.fragmentShader.slice(end);
  composer.addPass(output);
  const pass = new ShaderPass({
    uniforms: {
      tDiffuse: { value: null }, resolution: { value: new Vector2() },
      pixelSize: { value: 1 }, ditherSize: { value: 2 }, dither: { value: 0 },
      levels: { value: 4 }, grain: { value: 0 }, monochrome: { value: 0 },
      sepia: { value: 0 }, vignette: { value: 0 },
      marker: { value: 0 }, strokeWidth: { value: 3 }, edgeSoftness: { value: .35 }, lineBlend: { value: .5 },
      direction: { value: 0 }, colorSteps: { value: 6 }, inkVariation: { value: .35 }
    },
    vertexShader: `varying vec2 vUv;
      void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}`,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform vec2 resolution;
      uniform float pixelSize,ditherSize,dither,levels,grain,monochrome,sepia,vignette;
      uniform float marker,strokeWidth,edgeSoftness,lineBlend,direction,colorSteps,inkVariation;
      varying vec2 vUv;
      float bayer2(vec2 p){p=mod(p,2.);return 2.*p.x+3.*p.y-4.*p.x*p.y;}
      vec3 grade(vec3 color){
        float gray=dot(color,vec3(.2126,.7152,.0722));
        color=mix(color,vec3(gray),monochrome);
        vec3 warm=vec3(dot(color,vec3(.393,.769,.189)),dot(color,vec3(.349,.686,.168)),dot(color,vec3(.272,.534,.131)));
        return mix(color,clamp(warm,0.,1.),sepia);
      }
      vec4 sampleScene(vec2 uv){
        return texture2D(tDiffuse,clamp(uv,.5/resolution,1.-.5/resolution));
      }
      vec3 straightColor(vec4 sampleColor){
        return clamp(sampleColor.rgb/max(sampleColor.a,.0001),0.,1.);
      }
      float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
      vec4 markerPaint(vec2 pixel){
        float cs=cos(direction),sn=sin(direction);
        mat2 rotation=mat2(cs,-sn,sn,cs);
        mat2 inverseRotation=mat2(cs,sn,-sn,cs);
        vec2 paper=rotation*pixel;
        float spacing=strokeWidth*.9;
        float row=floor(paper.y/spacing);
        vec3 density=vec3(0.);
        float weightSum=0.,coverageSum=0.,inkWeight=0.;
        // Continuous scan lines: x is never snapped to a tile or capped by a
        // stroke length. A color run ends only where the source color changes.
        for(int y=-1;y<=1;y++){
          float id=row+float(y);
          float seed=hash(vec2(id,17.));
          float drift=sin(paper.x/83.+seed*12.)*strokeWidth*.025*inkVariation;
          float center=(id+.5)*spacing+drift;
          float across=paper.y-center;
          float radius=strokeWidth*(.54+.07*lineBlend)*(1.+(seed-.5)*.12*inkVariation);
          float feather=max(.55,radius*(.08+.22*lineBlend));
          float weight=1.-smoothstep(radius-feather,radius,abs(across));
          // Sweep a circular pen footprint across the continuous color run.
          // Its horizontal reach shrinks toward each row's top/bottom, making
          // actual rounded caps at color boundaries instead of square steps.
          vec2 uv=(inverseRotation*vec2(paper.x,center))/resolution;
          vec4 sampled=sampleScene(uv);
          float reach=sqrt(max(radius*radius-across*across,0.))*.65;
          float darkest=dot(straightColor(sampled),vec3(.2126,.7152,.0722));
          darkest=mix(1.,darkest,sampled.a);
          for(int tap=-2;tap<=2;tap++){
            vec2 delta=(inverseRotation*vec2(float(tap)*reach*.5,0.))/resolution;
            vec4 candidate=sampleScene(uv+delta);
            float value=mix(1.,dot(straightColor(candidate),vec3(.2126,.7152,.0722)),candidate.a);
            if(value<darkest-.015){sampled=candidate;darkest=value;}
          }
          // A small nib-edge bleed softens the color transition, without
          // averaging whole strokes into rectangular scan-line bands.
          vec2 bleed=(inverseRotation*vec2(edgeSoftness*.45,0.))/resolution;
          sampled=mix(sampled,(sampleScene(uv-bleed)+sampleScene(uv+bleed))*.5,edgeSoftness*.12);
          vec3 ink=grade(straightColor(sampled));
          float luminance=max(dot(ink,vec3(.2126,.7152,.0722)),.0001);
          float band=floor(luminance*(colorSteps-1.)+.5)/(colorSteps-1.);
          // Posterize lightness without independent RGB jumps that introduce
          // colored speckles into otherwise neutral lettering.
          ink=clamp(ink*(mix(luminance,band,.72)/luminance),.002,1.);
          float fibers=sin(across*5.3+seed*12.)*.5+.5;
          float pressure=1.+inkVariation*((seed-.5)*.32+(fibers-.5)*.10
            +.025*sin(paper.x/37.+seed*8.));
          float w=weight*sampled.a;
          density+=-log(ink)*pressure*w;
          inkWeight+=w;
          coverageSum+=w;
          weightSum+=weight;
        }
        // Blend pigment density across passes, rather than placing opaque
        // capsules over each other. This keeps overlaps soft and continuous.
        float alpha=coverageSum/max(weightSum,.0001);
        // Slightly denser overlapping passes leave a visible ink seam.
        float overlap=1.+lineBlend*.10*max(weightSum-1.,0.);
        vec3 pigment=exp(-density/max(inkWeight,.0001)*overlap);
        vec4 paint=vec4(pigment*alpha,alpha);
        return paint;
      }
      void main(){
        vec2 pixel=vUv*resolution;
        vec2 uv=(floor(pixel/pixelSize)+.5)*pixelSize/resolution;
        vec4 source=sampleScene(uv);
        vec3 color=grade(straightColor(source));
        float alpha=source.a;
        // Quantize scene samples on the same grid as the dither matrix.
        // Otherwise large threshold blocks sit over unfiltered fine detail.
        float cellSize=max(pixelSize,ditherSize);
        vec2 p=floor(pixel/cellSize);
        vec2 center=(p+.5)*cellSize/resolution;
        vec2 offset=vec2(cellSize*.25)/resolution;
        vec4 cellSample=(sampleScene(center+offset)+sampleScene(center-offset)
          +sampleScene(center+vec2(offset.x,-offset.y))
          +sampleScene(center+vec2(-offset.x,offset.y)))*.25;
        vec3 cell=grade(straightColor(cellSample));
        float threshold=(4.*bayer2(p)+bayer2(floor(p/2.))+.5)/16.-.5;
        vec3 quantized=floor(clamp(cell+threshold/(levels-1.),0.,1.)*(levels-1.)+.5)/(levels-1.);
        color=mix(color,quantized,dither);
        // Dither coverage too: soft shadows and clear vinyl become sparse
        // marks, while empty pixels remain fully transparent.
        float coverage=floor(clamp(cellSample.a+threshold/(levels-1.),0.,1.)*(levels-1.)+.5)/(levels-1.);
        alpha=mix(alpha,coverage,dither);
        if(marker>0.){
          vec4 paint=markerPaint(pixel);
          color=mix(color,straightColor(paint),marker);
          alpha=mix(alpha,paint.a,marker);
        }
        // Static screen-space grain stays still when the physics is paused.
        float noise=fract(sin(dot(floor(pixel),vec2(12.9898,78.233)))*43758.5453)-.5;
        color+=noise*grain*.24;
        vec2 edge=(vUv-.5)*2.;
        color*=1.-vignette*smoothstep(.3,1.35,length(edge));
        gl_FragColor=vec4(clamp(color,0.,1.)*alpha,alpha);
      }`
  });
  pass.material.toneMapped = false;
  composer.addPass(pass);
  return {
    resize(width,height){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(width,height);renderer.getDrawingBufferSize(pass.uniforms.resolution.value);},
    render(settings,plotter){
      if (!settings.enabled&&!plotter.enabled) { renderer.render(scene,camera); return; }
      for (const key of ['dither','levels','grain','monochrome','sepia','vignette']) pass.uniforms[key].value=settings.enabled?settings[key]:(key==='levels'?4:0);
      pass.uniforms.pixelSize.value=settings.pixelSize*renderer.getPixelRatio();
      pass.uniforms.ditherSize.value=settings.ditherSize*renderer.getPixelRatio();
      pass.uniforms.marker.value=plotter.enabled?plotter.strength:0;
      pass.uniforms.strokeWidth.value=plotter.strokeWidth*renderer.getPixelRatio();
      pass.uniforms.edgeSoftness.value=plotter.edgeSoftness;
      pass.uniforms.lineBlend.value=plotter.lineBlend;
      pass.uniforms.direction.value=plotter.direction*Math.PI/180;
      pass.uniforms.colorSteps.value=plotter.colorSteps;
      pass.uniforms.inkVariation.value=plotter.inkVariation;
      composer.render();
    },
    dispose(){pass.dispose();composer.passes[1].dispose();composer.dispose();}
  };
}
