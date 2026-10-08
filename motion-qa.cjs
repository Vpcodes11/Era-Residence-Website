const {chromium}=require('playwright');
const fs=require('fs');
async function seek(page,id,progress){await page.evaluate(({id,progress})=>{const trigger=ScrollTrigger.getById(id);if(!trigger)throw Error('Missing scene '+id);scrollTo(0,trigger.start+(trigger.end-trigger.start)*progress);ScrollTrigger.update();},{id,progress});await page.waitForTimeout(1400);}
(async()=>{
 fs.mkdirSync('screenshots',{recursive:true});
 const browser=await chromium.launch();
 const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.goto('http://127.0.0.1:4187',{waitUntil:'load'});
 await page.screenshot({path:'screenshots/immersive-arrival.png'});
 await page.waitForFunction(()=>document.documentElement.dataset.motionReady==='true');await page.waitForTimeout(700);
 await page.locator('[data-cookie="declined"]').click();
 const letterDisplay=await page.locator('.hero h1 .motion-mask').first().evaluate(el=>getComputedStyle(el).display);if(letterDisplay!=='inline-block')throw Error('Animated type layout broke');
 await page.screenshot({path:'screenshots/immersive-hero.png'});
 const initial=await page.locator('.hero-scene').evaluate(el=>getComputedStyle(el).transform);await seek(page,'aura-hero',.7);const moved=await page.locator('.hero-scene').evaluate(el=>getComputedStyle(el).transform);if(initial===moved)throw Error('Hero camera did not move');await page.screenshot({path:'screenshots/immersive-hero-depth.png'});
 await seek(page,'aura-concept',.55);await page.screenshot({path:'screenshots/immersive-concept.png'});
 await seek(page,'aura-location',.5);const sideways=await page.locator('.journey-track').evaluate(el=>getComputedStyle(el).transform);if(sideways==='none')throw Error('Horizontal journey did not move');await page.screenshot({path:'screenshots/immersive-location.png'});
 await seek(page,'aura-amenities',.72);if(await page.locator('#amenity-title').textContent()!=='Spa & gym')throw Error('Scroll-driven amenities did not advance');await page.screenshot({path:'screenshots/immersive-amenities.png'});
 await seek(page,'aura-architecture',.6);const doors=await page.locator('.gate-left').evaluate(el=>getComputedStyle(el).transform);if(doors==='none')throw Error('Architecture gate did not open');await page.screenshot({path:'screenshots/immersive-architecture.png'});
 const desktopPins=await page.evaluate(()=>ScrollTrigger.getAll().filter(t=>t.pin).length);
 await page.setViewportSize({width:390,height:844});await page.reload({waitUntil:'load'});await page.waitForFunction(()=>document.documentElement.dataset.motionReady==='true');await page.waitForTimeout(500);await page.screenshot({path:'screenshots/immersive-mobile.png'});
 const mobile=await page.evaluate(()=>({pins:ScrollTrigger.getAll().filter(t=>t.pin).length,overflow:document.documentElement.scrollWidth-innerWidth}));if(mobile.overflow>1||mobile.pins>1)throw Error('Mobile choreography is not adaptive');
 await page.emulateMedia({reducedMotion:'reduce'});await page.reload({waitUntil:'load'});
 const reduced=await page.evaluate(()=>({enabled:document.documentElement.classList.contains('motion-enabled'),overlay:!!document.querySelector('.arrival'),pins:ScrollTrigger.getAll().filter(t=>t.pin).length}));if(reduced.enabled||reduced.overlay||reduced.pins)throw Error('Reduced motion preference ignored');
 console.log(JSON.stringify({errors,desktopPins,mobile,reduced,heroCameraChanged:initial!==moved,horizontalJourney:sideways,architectureDoors:doors,checks:'Opening, text layout, pinned depth, concept aperture, horizontal journey, scroll-driven amenities, architectural gate, mobile adaptation, reduced motion'}));
 await browser.close();if(errors.length)process.exitCode=1;
})().catch(error=>{console.error(error);process.exit(1)});
