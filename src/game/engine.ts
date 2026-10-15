import type {Difficulty,Enemy,EnemyKind,Kind,Projectile,Tower} from './config';
import {enemyStats,getEnemyPosition,getTowerHitChance,getTowerPower,getTowerRange,maps,roadDistance,routes} from './config';

export type WaveOutcome='pending'|'wave-cleared'|'level-cleared'|'victory';
export const getWaveOutcome=(wave:number,mapIndex:number,enemyCount:number,spawnRemaining:number):WaveOutcome=>enemyCount>0||spawnRemaining>0?'pending':wave<10?'wave-cleared':mapIndex<maps.length-1?'level-cleared':'victory';
export const getTowerUpgradeCost=(level:number)=>level*55;
export const upgradeTower=(tower:Tower):Tower=>({...tower,level:tower.level+1});
export const getPlacementIssue=(x:number,y:number,towers:Tower[],mapIndex:number):'road'|'occupied'|null=>roadDistance(x,y,routes[mapIndex])<.11?'road':towers.some(t=>Math.hypot(x-t.x,y-t.y)<.11)?'occupied':null;
export const getWaveSpawnCount=(wave:number,difficulty:Difficulty)=>5+wave*2+(wave%5===0?1:0)+(difficulty==='hard'?wave:difficulty==='easy'?-Math.min(wave,2):0);
export const createWaveEnemy=(wave:number,remaining:number,difficulty:Difficulty,random=Math.random(),id=Date.now()+Math.random()):Enemy=>{const kind:EnemyKind=wave%5===0&&remaining===1?'boss':random<.4?'goblin':random<.64?'runner':random<.84?'knight':'brute',base=enemyStats[kind],difficultyScale=difficulty==='easy'?.82:difficulty==='hard'?1.35:1,hp=Math.ceil(base.hp*(1+(wave-1)*.18)*difficultyScale);return{id,p:0,kind,hp,hpMax:hp,speed:base.speed*(1+Math.min(.25,(wave-1)*.025))*(difficulty==='hard'?1.12:difficulty==='easy'?.92:1),armor:base.armor+Math.floor((wave-1)/4)*.5,reward:base.reward+(wave-1)*2,slow:0}};
export const moveEnemies=(enemies:Enemy[],speed:number):Enemy[]=>enemies.map(enemy=>({...enemy,p:enemy.p+.0026*speed*enemy.speed*(enemy.slow?0.48:1),slow:Math.max(0,(enemy.slow||0)-.1)}));
export const selectTarget=(tower:Tower,enemies:Enemy[],mapIndex:number)=>enemies.filter(enemy=>enemy.hp>0&&enemy.p<1&&Math.hypot(getEnemyPosition(enemy.p,mapIndex).x-tower.x,getEnemyPosition(enemy.p,mapIndex).y-tower.y)<getTowerRange(tower.kind,tower.level)).sort((a,b)=>b.p-a.p)[0];
export const createProjectile=(tower:Tower,target:Enemy,powerLevel:number):Projectile=>({id:Date.now()+Math.random(),fromX:tower.x,fromY:tower.y,targetId:target.id,progress:0,damage:getTowerPower(tower.kind,tower.level,powerLevel),kind:tower.kind});
export const stepProjectiles=(shots:Projectile[],enemies:Enemy[],mapIndex:number)=>{
 const killed=new Set<number>(),active:Projectile[]=[];
 const damage=(enemy:Enemy,raw:number)=>{enemy.hp-=Math.max(.25,raw-enemy.armor);if(enemy.hp<=0)killed.add(enemy.id)};
 shots.forEach(shot=>{
  const progress=shot.progress+.25,target=enemies.find(enemy=>enemy.id===shot.targetId&&enemy.p<1&&!killed.has(enemy.id));
  if(progress<1&&target){active.push({...shot,progress});return}
  if(!target)return;
  const point=getEnemyPosition(target.p,mapIndex),power=shot.kind==='mage'&&target.slow?shot.damage*1.6:shot.damage;
  if(shot.kind==='ice')target.slow=3.5;
  damage(target,power);
  if(shot.kind==='cannon'||shot.kind==='mage'){
   const radius=shot.kind==='cannon'?.095:.07,multiplier=shot.kind==='cannon'?.72:.58;
   enemies.forEach(enemy=>{if(enemy.id===target.id||killed.has(enemy.id))return;const pos=getEnemyPosition(enemy.p,mapIndex);if(Math.hypot(pos.x-point.x,pos.y-point.y)<radius)damage(enemy,shot.damage*multiplier)});
  }
  if(shot.kind==='lightning'){
   enemies.filter(enemy=>enemy.id!==target.id&&!killed.has(enemy.id)).sort((a,b)=>{const ap=getEnemyPosition(a.p,mapIndex),bp=getEnemyPosition(b.p,mapIndex);return Math.hypot(ap.x-point.x,ap.y-point.y)-Math.hypot(bp.x-point.x,bp.y-point.y)}).slice(0,2).forEach(enemy=>{const pos=getEnemyPosition(enemy.p,mapIndex);if(Math.hypot(pos.x-point.x,pos.y-point.y)<.19)damage(enemy,shot.damage*.7)});
  }
 });
 return {projectiles:active,enemies:enemies.filter(enemy=>enemy.p<1&&!killed.has(enemy.id)),defeated:enemies.filter(enemy=>killed.has(enemy.id)),escaped:enemies.filter(enemy=>enemy.p>=1&&!killed.has(enemy.id))};
};
export const canFire=(tower:Tower)=>Math.random()<=getTowerHitChance(tower.kind,tower.level);
export const projectileColor:Record<Kind,string>={archer:'#f5d879',cannon:'#ff9a55',mage:'#d194ff',ice:'#8cecff',lightning:'#fff177'};
