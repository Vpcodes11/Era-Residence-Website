const fs=require('fs'),path=require('path');
const output='dist';fs.mkdirSync(output,{recursive:true});
for(const name of ['index.html','styles.css','app.js'])fs.copyFileSync('src/'+name,output+'/'+name);
const icon='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="32" fill="#f2f1e9"/><path d="M17 49V29a15 15 0 0 1 30 0v20M25 49V30a7 7 0 0 1 14 0v19" fill="none" stroke="#172439" stroke-width="3"/></svg>';
fs.writeFileSync(output+'/favicon.svg',icon);
const routes=['apartments','contact',...['011','012','031','032','033','034','111','112','113','114','121','122','123','124','131','132','133','134','211','212','213','221','222','223','224'].map(n=>'apartments/'+n)];for(const route of routes){fs.mkdirSync(output+'/'+route,{recursive:true});fs.copyFileSync('src/index.html',output+'/'+route+'/index.html')}
fs.copyFileSync('src/index.html',output+'/privacy.html');
fs.writeFileSync(output+'/_headers','/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: strict-origin-when-cross-origin\n');
console.log('Built original AURA code: '+routes.length+' routes.');
