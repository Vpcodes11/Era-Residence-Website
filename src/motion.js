/* Original AURA choreography. Photographs and foreground layers are our own. */
(() => {
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 if(reduced.matches||!window.gsap||!window.ScrollTrigger)return;
 gsap.registerPlugin(ScrollTrigger);
 const hero=document.querySelector('.hero');
 if(!hero)return;
 document.documentElement.classList.add('motion-enabled');
 const scene=document.createElement('div');scene.className='hero-scene';
 hero.querySelectorAll('.hero-picture').forEach(img=>scene.append(img));hero.prepend(scene);
 const pointerLayer=document.createElement('div');pointerLayer.className='hero-pointer-layer';hero.append(pointerLayer);
 const progress=document.createElement('div');progress.className='motion-progress';progress.setAttribute('aria-hidden','true');progress.innerHTML='<b>00</b><span></span>';document.body.append(progress);
 function splitHeading(element){
  const spans=[];const walker=document.createTreeWalker(element,NodeFilter.SHOW_TEXT);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  element.setAttribute('aria-label',element.textContent.trim());
  nodes.forEach(node=>{if(!node.textContent.trim())return;const fragment=document.createDocumentFragment();for(const char of node.textContent){if(/\s/.test(char)){fragment.append(document.createTextNode(char));continue}const mask=document.createElement('span');mask.className='motion-mask';mask.setAttribute('aria-hidden','true');const letter=document.createElement('span');letter.className='motion-char';letter.textContent=char;mask.append(letter);fragment.append(mask);spans.push(letter)}node.replaceWith(fragment)});return spans;
 }
 const chars=splitHeading(hero.querySelector('h1'));
 const media=gsap.matchMedia();
 media.add({desktop:'(min-width: 1001px)',mobile:'(max-width: 1000px)',reduce:'(prefers-reduced-motion: reduce)'},context=>{
  if(context.conditions.reduce)return;
  const desktop=context.conditions.desktop;
  // Scroll into the courtyard, while type and foreground sit on separate planes.
  const timeline=gsap.timeline({scrollTrigger:{id:'aura-hero',trigger:hero,start:'top top',end:()=>'+='+innerHeight*(desktop?.85:.45),pin:true,scrub:.8,invalidateOnRefresh:true}});
  timeline.to(scene,{scale:1.28,yPercent:-6,ease:'none'},0)
   .to('.hero-content',{yPercent:-28,scale:.86,opacity:0,ease:'power1.in'},0)
   .to('.hero-bottom',{y:30,opacity:0,ease:'none'},0)
   .to(pointerLayer,{scale:1.22,yPercent:18,ease:'none'},0);
  return()=>{};
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
 if(hover.matches){hero.addEventListener('pointermove',e=>{pointer.x=(e.clientX/innerWidth-.5)*2;pointer.y=(e.clientY/innerHeight-.5)*2});hero.addEventListener('pointerleave',()=>{pointer.x=0;pointer.y=0});gsap.ticker.add(()=>{lastX+=(pointer.x-lastX)*.055;lastY+=(pointer.y-lastY)*.055;gsap.set(pointerLayer,{x:lastX*28,y:lastY*18,rotationY:lastX*4,rotationX:-lastY*3});});}
 ScrollTrigger.create({id:'aura-progress',start:0,end:'max',onUpdate:self=>{progress.querySelector('b').textContent=String(Math.round(self.progress*100)).padStart(2,'0');gsap.set(progress.querySelector('span'),{scaleY:self.progress});}});
 document.querySelectorAll('.reveal').forEach(el=>{gsap.fromTo(el,{opacity:0,y:55,rotationX:4},{opacity:1,y:0,rotationX:0,duration:1.2,ease:'power3.out',scrollTrigger:{trigger:el,start:'top 92%',once:true}});});
 document.fonts.ready.then(()=>ScrollTrigger.refresh());
 window.addEventListener('load',()=>ScrollTrigger.refresh(),{once:true});
})();
