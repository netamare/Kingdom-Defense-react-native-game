import React,{memo} from 'react';
import {Circle,Path,Rect,G as SvgGroup} from 'react-native-svg';

type TerrainMap={ground:string;patch:string;path:string;edge:string;road:string;tree:string};
type Props={map:TerrainMap;mapIndex:number};

export const BattlefieldTerrain=memo(function BattlefieldTerrain({map,mapIndex}:Props){
 return <>
  <Rect width={320} height={310} fill={map.ground}/>
  <Path d="M0 0h320v40H0zM0 266h320v44H0zM0 45h35v220H0zM286 42h34v224h-34z" fill={map.patch}/>
  <Path d={map.path} fill="none" stroke={map.edge} strokeWidth={40} strokeLinecap="round"/>
  <Path d={map.path} fill="none" stroke={map.road} strokeWidth={31} strokeLinecap="round" strokeDasharray="2 2"/>
  <Path d="M10 111h37L28 87z" fill="#d2704d"/><Rect x={18} y={111} width={19} height={45} fill="#934b3d"/><Rect x={285} y={64} width={34} height={39} fill="#a2734e"/><Path d="M279 65l23-25 24 25z" fill="#ded0a7"/>
  {[[68,38],[95,273],[225,48],[264,276],[153,229],[122,118]].map(([x,y],i)=><SvgGroup key={i}><Circle cx={x} cy={y} r={14} fill="#476347"/><Circle cx={x-3} cy={y-5} r={9} fill={mapIndex===1?'#acd2ca':mapIndex===2?'#c17b53':i%2?'#83995c':map.tree}/><Rect x={x-2} y={y+7} width={4} height={12} fill="#73573d"/></SvgGroup>)}
 </>;
});
