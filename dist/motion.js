/* Original AURA choreography. Photographs and foreground layers are our own. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 // Normal link semantics remain intact for new tabs, downloads and anchors.
 let leaving=false;
 document.addEventListener('click',event=>{
  const link=event.target.closest('a[href]');if(!link||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey||link.target||link.hasAttribute('download'))return;
  const url=new URL(link.href,location.href);if(url.origin!==location.origin||url.pathname===location.pathname)return;
  event.preventDefault();if(leaving)return;leaving=true;
  gsap.to('#main',{opacity:0,duration:.28,onComplete:()=>location.assign(url.href)});
 });
 window.addEventListener('pageshow',event=>{if(event.persisted){leaving=false;gsap.set('#main',{opacity:1});ScrollTrigger.refresh();}});
 const hero=document.querySelector('.hero');
 if(!hero){
  document.documentElement.classList.add('motion-enabled');
  gsap.from('.page-title,.detail h1,.contact-page h1,.plain-page h1',{y:45,opacity:0,duration:1,ease:'power3.out'});
  document.querySelectorAll('.detail .photo,.contact-page .photo,.plan,.reveal').forEach(el=>{gsap.fromTo(el,{opacity:0,y:45},{opacity:1,y:0,duration:1,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 97%',once:true}});});
  document.querySelectorAll('.photo img').forEach(img=>{if(img.closest('.apartment-card'))return;gsap.fromTo(img,{scale:1.12,yPercent:-3},{scale:1.12,yPercent:3,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:.8}});});
  let catalogContext;
  const animateCatalog=()=>{catalogContext?.revert();catalogContext=gsap.context(()=>{document.querySelectorAll('.apartment-card').forEach(card=>{gsap.fromTo(card,{opacity:0,y:35},{opacity:1,y:0,duration:.8,ease:'power3.out',scrollTrigger:{trigger:card,start:'top 97%',once:true}});});});ScrollTrigger.refresh();};
  if(document.querySelector('#catalog-grid')){animateCatalog();window.addEventListener('aura:catalog-update',animateCatalog);}
  document.fonts.ready.then(()=>ScrollTrigger.refresh());
  return;
 }
 document.documentElement.classList.add('motion-enabled');
 const scene=document.createElement('div');scene.className='hero-scene';
 hero.querySelectorAll('.hero-picture').forEach(img=>scene.append(img));hero.prepend(scene);
 const pointerLayer=document.createElement('div');pointerLayer.className='hero-pointer-layer';pointerLayer.innerHTML='<img class="hero-foliage" src="/assets/bougainvillea.webp" alt="" aria-hidden="true"><img class="hero-foliage hero-foliage-left" src="/assets/bougainvillea.webp" alt="" aria-hidden="true">';hero.append(pointerLayer);
 const progress=document.createElement('div');progress.className='motion-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<b>00</b><span></span>';document.body.append(progress);
 function splitHeading(element){
  const spans=[];const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  element.setAttribute('aria-label',element.textContent.trim());
  nodes.forEach(node=>{if(!node.textContent.trim())return;const fragment=document.createDocumentFragment();for(const char of node.textContent){if(/\s/.test(char)){fragment.append(document.createTextNode(char));continue}const mask=document.createElement('span');mask.className='motion-mask';mask.setAttribute('aria-hidden','true');const letter=document.createElement('span');letter.className='motion-char';letter.textContent=char;mask.append(letter);fragment.append(mask);spans.push(letter)}node.replaceWith(fragment)});return spans;
 }
 const chars=splitHeading(hero.querySelector('h1'));
 const media=gsap.matchMedia();
 media.add({desktop:'(min-width: 1001px)',mobile:'(max-width: 1000px)',heroFits:'(min-height: 650px)',reduce:'(prefers-reduced-motion: reduce)'},context=>{
  if(context.conditions.reduce)return;
  const desktop=context.conditions.desktop;
  // Scroll into the courtyard, while type and foreground sit on separate planes.
  const timeline=gsap.timeline({scrollTrigger:{id:'aura-hero',trigger:hero,start:'top top',end:()=>'+='+innerHeight*(desktop?1.8:.65),pin:context.conditions.heroFits,scrub:.8,invalidateOnRefresh:true}});
  timeline.fromTo(scene,{scale:1,yPercent:0},{scale:1.28,yPercent:-6,ease:'none',immediateRender:false},0)
   .fromTo('.hero-content',{yPercent:0,scale:1,opacity:1},{yPercent:-28,scale:.86,opacity:0,ease:'power1.in',immediateRender:false},0)
   .fromTo('.hero-bottom',{y:0,opacity:1},{y:30,opacity:0,ease:'none',immediateRender:false},0)
   .to(pointerLayer,{scale:1.22,yPercent:18,ease:'none'},0);
 });
 // A short opening aperture, with no scroll lock or dependency on slow requests.
 const arrival=document.createElement('div');arrival.className='arrival';arrival.setAttribute('aria-hidden','true');arrival.innerHTML='<div class="arrival-content"><h2>Aura<br>Residence</h2><p class="script">A place to belong</p><p class="eyebrow">Estepona · Mediterranean living</p><div class="arrival-progress"><span></span></div></div>';document.body.append(arrival);
 const intro=gsap.timeline({defaults:{ease:'power3.out'}});
 intro.from('.arrival-content',{y:40,opacity:0,duration:.7})
  .to('.arrival-progress span',{scaleY:1,duration:1.1,ease:'power2.inOut'},.3)
  .to('.arrival-content',{y:-40,opacity:0,duration:.65},1.25)
  .to(arrival,{'--aperture':'125vw',duration:1.6,ease:'power3.inOut'},1.6)
  .fromTo(scene,{scale:1.2},{scale:1,duration:1.8},1.65)
  .fromTo(chars,{yPercent:115,rotationX:-70,opacity:0},{yPercent:0,rotationX:0,opacity:1,duration:1.1,stagger:.045},2.1)
  .from('.hero-location',{clipPath:'inset(0 100% 0 0)',y:30,duration:1.4},2.45)
  .from('.hero-caption,.hero-bottom',{opacity:0,y:25,duration:1},2.75)
  .call(()=>{arrival.remove();document.documentElement.dataset.motionReady='true';ScrollTrigger.refresh();},null,3.6);
 // Scrolling during the opening immediately reveals the experience.
 const skip=()=>{intro.progress(1);window.removeEventListener('wheel',skip);window.removeEventListener('touchmove',skip);};
 window.addEventListener('wheel',skip,{once:true,passive:true});window.addEventListener('touchmove',skip,{once:true,passive:true});
 const pointer={x:0,y:0};let lastX=0,lastY=0;
 const hover=matchMedia('(hover: hover) and (pointer: fine)');
 if(hover.matches){hero.addEventListener('pointermove',e=>{pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2});hero.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0});gsap.ticker.add(()=>{if(document.hidden||hero.getBoundingClientRect().bottom<0)return;lastX+=(pointer.x-lastX)*.055;lastY+=(pointer.y-lastY)*.055;gsap.set(pointerLayer,{x:lastX*28,y:lastY*18,rotationY:lastX*4,rotationX:-lastY*3});gsap.set(scene,{x:-lastX*14,rotationY:lastX*.6,rotationX:-lastY*.4});});}
 ScrollTrigger.create({id:'aura-progress',start:0,end:'max',onUpdate:self=>{progress.querySelector('b').textContent=String(Math.round(self.progress*100)).padStart(2,'0');gsap.set(progress.querySelector('span'),{scaleY:self.progress});}});
 const concept=document.querySelector('.concept-image');concept.setAttribute('data-light','');concept.classList.remove('reveal');concept.classList.add('concept-portal');const conceptLabel=document.createElement('span');conceptLabel.className='concept-scene-label script';conceptLabel.setAttribute('aria-hidden','true');conceptLabel.textContent='The concept';concept.append(conceptLabel);
 const architecture=document.querySelector('.architecture');architecture.classList.add('architecture-immersive');const gate=document.createElement('div');gate.className='architecture-gate';gate.append(architecture.querySelector('h2'),architecture.querySelector('.photo'));gate.querySelectorAll('.reveal').forEach(el=>el.classList.remove('reveal'));gate.insertAdjacentHTML('beforeend','<div class="gate-door gate-left" aria-hidden="true"></div><div class="gate-door gate-right" aria-hidden="true"></div>');architecture.prepend(gate);
 for(const selector of ['.location-title','.architecture-gate','.living-title']){const container=document.querySelector(selector);const foliage=document.createElement('img');foliage.src='/assets/bougainvillea.webp';foliage.alt='';foliage.setAttribute('aria-hidden','true');foliage.className='scene-foliage';foliage.loading='lazy';container.append(foliage);}
 media.add({desktop:'(min-width: 1001px)',mobile:'(max-width: 1000px)',atelierFits:'(min-height: 860px)',amenityFits:'(min-height: 700px)',reduce:'(prefers-reduced-motion: reduce)'},context=>{
  if(context.conditions.reduce)return;
  const desktop=context.conditions.desktop;
  // The garden picture becomes an architectural aperture before opening full width.
  gsap.fromTo(concept,{clipPath:desktop?'inset(14% 24% 14% 24% round 40vw 40vw 0 0)':'inset(9% 12% 9% 12% round 45vw 45vw 0 0)'},{clipPath:'inset(0% 0% 0% 0% round 0vw 0vw 0 0)',ease:'power2.inOut',scrollTrigger:{id:'aura-concept',trigger:concept,start:desktop?'top top':'top 75%',end:desktop?()=>'+='+innerHeight:'bottom 20%',pin:desktop,scrub:1,invalidateOnRefresh:true}});
  gsap.fromTo(concept.querySelector('img'),{scale:1.25},{scale:1,ease:'none',scrollTrigger:{trigger:concept,start:'top bottom',end:'bottom top',scrub:1}});
  gsap.fromTo(conceptLabel,{opacity:0,y:70},{opacity:1,y:0,ease:'none',scrollTrigger:{trigger:concept,start:'top 40%',end:'bottom 80%',scrub:.7}});
  if(desktop){
   const atelier=document.querySelector('.atelier');
   // Keep controls reachable when the architectural study is taller than the screen.
   if(context.conditions.atelierFits)ScrollTrigger.create({id:'aura-atelier',trigger:atelier,start:'top top',end:()=>'+='+innerHeight*.9,pin:true,invalidateOnRefresh:true});
   let current=-1;
   const amenity=document.querySelector('.amenities');
   gsap.fromTo('.amenity-image',{scale:1.16},{scale:1,ease:'none',scrollTrigger:{id:'aura-amenities',trigger:amenity,start:'top top',end:()=>'+='+innerHeight*1.6,pin:context.conditions.amenityFits,scrub:1,onUpdate:self=>{const index=Math.min(4,Math.floor(self.progress*5));if(index!==current){current=index;activateAmenity(index);}},invalidateOnRefresh:true}});
   const portal=gsap.timeline({scrollTrigger:{id:'aura-architecture',trigger:gate,start:'top top',end:()=>'+='+innerHeight*1.15,pin:true,scrub:1,invalidateOnRefresh:true,onUpdate:self=>{if(self.progress>.35)gate.setAttribute('data-light','');else gate.removeAttribute('data-light');updateHeader();}}});
   portal.to('.gate-left',{xPercent:-100,ease:'power2.inOut'},0).to('.gate-right',{xPercent:100,ease:'power2.inOut'},0).fromTo(gate.querySelector('.photo img'),{scale:1.3},{scale:1,ease:'power2.out'},0).to(gate.querySelector('h2'),{scale:1.25,opacity:0,ease:'power1.in'},0).fromTo(gate.querySelector('.scene-foliage'),{scale:1,xPercent:0},{scale:1.35,xPercent:35,ease:'none'},0);
  }
  document.querySelectorAll('.scene-foliage').forEach(el=>{if(el.closest('.architecture-gate')&&desktop)return;gsap.fromTo(el,{yPercent:-12,rotation:-4},{yPercent:18,rotation:4,ease:'none',scrollTrigger:{trigger:el.parentElement,start:'top bottom',end:'bottom top',scrub:1}});});
  const living=document.querySelector('.living-title');gsap.fromTo(living.querySelector('.display'),{xPercent:-4},{xPercent:4,ease:'none',scrollTrigger:{trigger:living,start:'top bottom',end:'bottom top',scrub:1}});gsap.fromTo(living.querySelector('.script'),{xPercent:20,rotation:-14},{xPercent:-15,rotation:-5,ease:'none',scrollTrigger:{trigger:living,start:'top bottom',end:'bottom top',scrub:1}});
  const coast=document.querySelector('.coast');gsap.fromTo(coast.querySelector('img'),{scale:1.2,yPercent:-5},{scale:1.04,yPercent:5,ease:'none',scrollTrigger:{trigger:coast,start:'top bottom',end:'bottom top',scrub:1}});gsap.fromTo(coast.querySelector('h2'),{xPercent:-8},{xPercent:8,ease:'none',scrollTrigger:{trigger:coast,start:'top bottom',end:'bottom top',scrub:1}});
  const footer=document.querySelector('.footer');gsap.fromTo(footer.querySelector('img'),{scale:1.2},{scale:1,ease:'none',scrollTrigger:{trigger:footer,start:'top bottom',end:'bottom bottom',scrub:1}});gsap.fromTo(footer.querySelector('.footer-title'),{y:120,scale:.8},{y:0,scale:1,ease:'power2.out',scrollTrigger:{trigger:footer,start:'top 85%',end:'top 10%',scrub:1}});
 });
 document.querySelectorAll('.reveal').forEach(el=>{gsap.fromTo(el,{opacity:0,y:55,rotationX:4},{opacity:1,y:0,rotationX:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 95%',once:true}});});
 document.querySelectorAll('.photo>img').forEach(img=>{if(img.closest('.concept-portal,.architecture-gate'))return;gsap.fromTo(img,{yPercent:-4,scale:1.14},{yPercent:4,scale:1.14,ease:'none',scrollTrigger:{trigger:img.parentElement,start:'top bottom',end:'bottom top',scrub:1}});});
 for(const selector of ['.residences-heading h2','.living-title h2']){const heading=document.querySelector(selector);const letters=splitHeading(heading);gsap.fromTo(letters,{yPercent:110,rotationX:-70},{yPercent:0,rotationX:0,stagger:.025,duration:.9,ease:'power3.out',scrollTrigger:{trigger:heading,start:'top 92%',once:true}});}
 if(hover.matches){document.querySelectorAll('.residence-card,.benefit').forEach(card=>{const rotateX=gsap.quickTo(card,'rotationX',{duration:.5,ease:'power2.out'}),rotateY=gsap.quickTo(card,'rotationY',{duration:.5,ease:'power2.out'});card.addEventListener('pointermove',event=>{const rect=card.getBoundingClientRect();rotateX((.5-(event.clientY-rect.top)/rect.height)*5);rotateY(((event.clientX-rect.left)/rect.width-.5)*7)});card.addEventListener('pointerleave',()=>{rotateX(0);rotateY(0)});});document.querySelectorAll('.round-button').forEach(button=>{const x=gsap.quickTo(button,'x',{duration:.5,ease:'power3.out'}),y=gsap.quickTo(button,'y',{duration:.5,ease:'power3.out'});button.addEventListener('pointermove',event=>{const rect=button.getBoundingClientRect();x((event.clientX-rect.left-rect.width/2)*.3);y((event.clientY-rect.top-rect.height/2)*.3)});button.addEventListener('pointerleave',()=>{x(0);y(0)})});}
 window.addEventListener('aura:amenity',()=>{gsap.fromTo('.amenity-image',{opacity:.25},{opacity:.72,duration:.8,ease:'power2.out',overwrite:'auto'});gsap.fromTo('#amenity-title,#amenity-copy',{opacity:0,y:22},{opacity:1,y:0,duration:.65,stagger:.08,ease:'power2.out',overwrite:'auto'});});
 document.fonts.ready.then(()=>ScrollTrigger.refresh());
 window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
