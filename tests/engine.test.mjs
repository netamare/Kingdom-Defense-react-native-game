import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,readFile,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';

const scratch=await mkdtemp(join(tmpdir(),'kingdom-engine-'));
const configSource=await readFile(new URL('../src/game/config.ts',import.meta.url),'utf8');
const engineSource=(await readFile(new URL('../src/game/engine.ts',import.meta.url),'utf8')).replaceAll("'./config'", "'./config.mts'");
await writeFile(join(scratch,'config.mts'),configSource);
await writeFile(join(scratch,'engine.mts'),engineSource);
const config=await import(pathToFileURL(join(scratch,'config.mts')));
const engine=await import(pathToFileURL(join(scratch,'engine.mts')));
const enemy=(id,p,kind='goblin',overrides={})=>({id,p,kind,hp:kind==='goblin'?2:4,hpMax:kind==='goblin'?2:4,speed:1,armor:0,reward:8,slow:0,...overrides});
const tower=(kind,x,y,level=1)=>({id:1,x,y,kind,level});
const impactAfterTravel=(shot,enemies,mapIndex=0)=>{let state={projectiles:[shot],enemies,defeated:[],escaped:[]};for(let i=0;i<4;i++)state=engine.stepProjectiles(state.projectiles,state.enemies,mapIndex);return state};

test('enemies advance and ice slow reduces movement',()=>{
 const fast=enemy(1,.5),frozen=enemy(2,.5,'goblin',{slow:1});
 const moved=engine.moveEnemies([fast,frozen],1);
 assert.ok(moved[0].p>fast.p);
 assert.ok(moved[1].p>frozen.p&&moved[1].p<moved[0].p);
 assert.equal(moved[1].slow,.9);
});

test('tower targeting selects the furthest enemy in range',()=>{
 const point=config.getEnemyPosition(.5,0),archer=tower('archer',point.x,point.y);
 const target=engine.selectTarget(archer,[enemy(1,.48),enemy(2,.52)],0);
 assert.equal(target?.id,2);
 assert.equal(engine.selectTarget(tower('archer',0,0),[enemy(3,.5)],0),undefined);
});

test('projectile impacts apply damage after travel and honor armor',()=>{
 const p=config.getEnemyPosition(.5,0),cannon=tower('cannon',p.x,p.y),knight=enemy(1,.5,'knight',{hp:4,hpMax:4,armor:1});
 const shot=engine.createProjectile(cannon,knight,0);
 assert.equal(engine.stepProjectiles([shot],[knight],0).enemies[0].hp,4);
 const hit=impactAfterTravel(shot,[knight]);
 assert.equal(hit.enemies[0].hp,2);
});

test('cannon collision damages nearby enemies and reports defeated rewards',()=>{
 const p=config.getEnemyPosition(.5,0),cannon=tower('cannon',p.x,p.y),primary=enemy(1,.5,'goblin',{hp:2,hpMax:2}),near=enemy(2,.51,'goblin',{hp:2,hpMax:2});
 const result=impactAfterTravel(engine.createProjectile(cannon,primary,0),[primary,near]);
 assert.deepEqual(result.defeated.map(e=>e.id).sort(),[1,2]);
 assert.equal(result.defeated.reduce((sum,e)=>sum+e.reward,0),16);
});

test('ice applies a timed slow and magic gains damage against chilled targets',()=>{
 const p=config.getEnemyPosition(.5,0),iceTarget=enemy(1,.5),ice=tower('ice',p.x,p.y);
 const chilled=impactAfterTravel(engine.createProjectile(ice,iceTarget,0),[iceTarget]);
 assert.equal(chilled.enemies[0].slow,3.5);
 const mage=tower('mage',p.x,p.y),cold=enemy(2,.5,'goblin',{hp:4,hpMax:4,slow:2});
 const combo=impactAfterTravel(engine.createProjectile(mage,cold,0),[cold]);
 assert.ok(combo.enemies[0].hp<4-config.getTowerPower('mage',1,0));
});

test('lightning chains to nearby enemies and escaped enemies cost a life',()=>{
 const p=config.getEnemyPosition(.5,0),lightning=tower('lightning',p.x,p.y),primary=enemy(1,.5,'knight'),near=enemy(2,.501,'knight');
 const chain=impactAfterTravel(engine.createProjectile(lightning,primary,0),[primary,near]);
 assert.ok(chain.enemies.find(e=>e.id===2).hp<4);
 const runner=enemy(3,1),escaped=engine.stepProjectiles([engine.createProjectile(lightning,runner,0)],[runner],0);
 assert.equal(escaped.escaped.length,1);
 assert.equal(escaped.projectiles.length,0);
});

test('wave sizes scale with difficulty and boss waves end with a boss',()=>{
 assert.equal(engine.getWaveSpawnCount(1,'easy'),6);
 assert.equal(engine.getWaveSpawnCount(1,'normal'),7);
 assert.equal(engine.getWaveSpawnCount(1,'hard'),8);
 assert.equal(engine.createWaveEnemy(5,2,'normal',.9,10).kind,'brute');
 assert.equal(engine.createWaveEnemy(5,1,'normal',.1,11).kind,'boss');
 assert.ok(engine.createWaveEnemy(5,1,'hard',0,12).hp>engine.createWaveEnemy(5,1,'easy',0,13).hp);
});


test('tower placement rejects roads and occupied spots but allows clear ground',()=>{
 const {getPlacementIssue}=engine;
 assert.equal(getPlacementIssue(.1,.52,[],0),'road');
 assert.equal(getPlacementIssue(.35,.85,[],0),null);
 assert.equal(getPlacementIssue(.35,.85,[tower('archer',.36,.84)],0),'occupied');
});

test('tower upgrades charge by level and increase the selected tower level',()=>{
 assert.equal(engine.getTowerUpgradeCost(1),55);
 assert.equal(engine.getTowerUpgradeCost(2),110);
 assert.equal(engine.upgradeTower(tower('archer',.3,.8,2)).level,3);
});

test('wave completion distinguishes pending, next wave, map clear, and final victory',()=>{
 assert.equal(engine.getWaveOutcome(4,0,1,0),'pending');
 assert.equal(engine.getWaveOutcome(4,0,0,2),'pending');
 assert.equal(engine.getWaveOutcome(4,0,0,0),'wave-cleared');
 assert.equal(engine.getWaveOutcome(10,0,0,0),'level-cleared');
 assert.equal(engine.getWaveOutcome(10,2,0,0),'victory');
});

test.after(async()=>{await rm(scratch,{recursive:true,force:true})});


