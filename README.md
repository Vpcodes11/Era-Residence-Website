# AURA Residence

An imaginary Mediterranean property brand, independently built with the user-supplied ERA Residence website as the visual reference. Original HTML, CSS and JavaScript create the home page, apartment selection, 25 individual residence pages and contact page. The visual direction closely follows the reference's typography, editorial rhythm and Mediterranean atmosphere.

Run `npm install`, then `node server.cjs` and open http://127.0.0.1:4187.

`dist/` is the complete deployable site. `src/` contains the original implementation; run `node build-original.cjs` after editing. Six original photographs were generated using the built-in imagegen tool and are saved in `dist/assets/`. No reference photographs, video, HTML, CSS or animation scripts are used in the delivered site. Matching font families load from external font providers. Apartment data is illustrative. Enquiries are demonstration-only and are not transmitted or saved.

The site supports a day/night hero, amenity tabs with keyboard navigation, a native dialog mobile menu, a native dialog enquiry form, filters and sorting, direct apartment routes, responsive layouts and reduced-motion preferences. `node qa.cjs` verifies the main journeys in Chromium.

The original animation layer in `src/motion.js` uses locally bundled GSAP and ScrollTrigger. It includes an opening aperture, masked letter entrances, pinned courtyard zoom, pointer depth, an architectural concept aperture, a horizontal coastal journey, scroll-driven amenity scenes, an opening architecture gate, image parallax, magnetic controls and depth on cards. An original transparent bougainvillea image supplies foreground layers. Desktop has five pinned scenes; mobile has one shorter hero pin. Reduced-motion preferences skip the animation layer. Run `node motion-qa.cjs` for animation and reduced-motion checks.
