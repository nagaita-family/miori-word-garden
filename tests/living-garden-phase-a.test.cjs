'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('living-garden.js','utf8');
const context={window:{},document:{querySelector:()=>null},setInterval(){}};vm.createContext(context);vm.runInContext(source,context);
const garden=context.window.LivingGarden;
test('migrates only garden state once, keeping learning and test data byte-for-byte',()=>{
 const state={version:3,xp:630,week:{ids:['butterfly']},myWords:{friend:{source:'Journal'}},pastWeeks:[{ids:['ladybug']}],lib:{butterfly:{learn:{weak:[2],stageMist:{3:1},lastWrong:'buterfly'},meaningEn:'school definition',pronunciationUrl:'audio'}},weekTestResult:{items:[{id:'butterfly'}]},settings:{voice:'A'},garden:{growth:52,pos:{bunny:{x:1}},stored:['arch'],bunnySeated:true}};
 const protectedBefore=JSON.stringify({...state,garden:undefined});garden.migrate(state);
 assert.equal(JSON.stringify({...state,garden:undefined}),protectedBefore);
 assert.equal(state.garden.livingGardenVersion,2);assert.equal(state.garden.growth,0);assert.deepEqual(JSON.parse(JSON.stringify(state.garden.locations)),{bunny:'garden',cat:'garden',bird:'garden'});
 assert(!state.garden.stored.includes('arch'));state.garden.growth=4;garden.migrate(state);assert.equal(state.garden.growth,4);
});
test('local device time has four dayparts without a missed-time counter',()=>{
 const date=h=>new Date(2026,8,24,h,0);for(const [h,name] of [[0,'night'],[5,'night'],[6,'morning'],[10,'morning'],[11,'day'],[16,'day'],[17,'evening'],[19,'evening'],[20,'night']])assert.equal(garden.daypart(date(h)),name);
 assert(!('streak' in garden.fresh()));
});
test('environment is naturally bounded, lightweight and honors reduced motion',()=>{
 const css=fs.readFileSync('living-garden.css','utf8'),page=fs.readFileSync('index.html','utf8');
 assert(!source.includes('white-fence'));assert(css.includes('.living-shrub')&&css.includes('.living-oak'));
 assert(css.includes('prefers-reduced-motion:reduce')&&css.includes('.living-scene.night'));
 assert(page.includes('living-garden.js?v=20260924-d1'));
 assert(page.indexOf('living-garden.js?v=20260924-d1')<page.indexOf('app.js?v=20260924-living-c6'));
});
