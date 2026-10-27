import { getStore } from "@netlify/blobs";
import type { Config, Context } from "@netlify/functions";
import { timingSafeEqual } from "node:crypto";

const ORIGINS = new Set(["https://family.nagaita.jp","https://nagaita-family.github.io","https://miori-word-garden.netlify.app"]);
const PEOPLE = ["naoya", "shoko", "miori", "kosuke"] as const;
type Person = typeof PEOPLE[number];
type Status = "safe" | "help";
interface Update {
  person: Person; state: Status; eventId: string; observedAt: number;
  location?: {lat:number; lon:number; accuracy:number; at:number};
}
function json(data: unknown,status=200,origin:string|null=null) {
  const h=new Headers({"Content-Type":"application/json; charset=utf-8","Cache-Control":"no-store, max-age=0","Vary":"Origin","X-Content-Type-Options":"nosniff"});
  if(origin && ORIGINS.has(origin))h.set("Access-Control-Allow-Origin",origin);
  return new Response(JSON.stringify(data),{status,headers:h});
}
function hasKey(value:string|null) {
  const secret=Netlify.env.get("FAMILY_SAFETY_KEY");
  return !!(secret && value && value.length===secret.length && timingSafeEqual(Buffer.from(secret),Buffer.from(value)));
}
function validLocation(v:any) {
 return v && typeof v==="object" && Number.isFinite(v.lat) && v.lat>=-90 && v.lat<=90 &&
 Number.isFinite(v.lon) && v.lon>=-180 && v.lon<=180 && Number.isFinite(v.accuracy) &&
 v.accuracy>=0 && v.accuracy<=100000 && Number.isSafeInteger(v.at) &&
 v.at>1500000000000 && v.at<=Date.now()+300000;
}
function validUpdate(v:any):v is Update {
 return v && PEOPLE.includes(v.person) && (v.state==="safe"||v.state==="help") &&
 typeof v.eventId==="string" && /^[A-Za-z0-9_-]{1,75}$/.test(v.eventId) &&
 Number.isSafeInteger(v.observedAt) && v.observedAt>1500000000000 &&
 v.observedAt<=Date.now()+300000 && (v.location===undefined||validLocation(v.location));
}
export default async(req:Request,_ctx:Context)=>{
 const origin=req.headers.get("origin");
 if(req.method==="OPTIONS"){
   const h=new Headers({"Access-Control-Allow-Methods":"GET, POST, OPTIONS","Access-Control-Allow-Headers":"Content-Type, X-Family-Key","Access-Control-Max-Age":"600","Vary":"Origin"});
   if(origin && ORIGINS.has(origin))h.set("Access-Control-Allow-Origin",origin);
   return new Response(null,{status:204,headers:h});
 }
 if(origin&&!ORIGINS.has(origin))return json({error:"Origin not allowed"},403,origin);
 if(!hasKey(req.headers.get("X-Family-Key")))return json({error:"合言葉が違います"},401,origin);
 if(!["GET","POST"].includes(req.method))return json({error:"Method not allowed"},405,origin);
 try {
   const store=getStore("nagaita-family-safety-v1",{consistency:"strong"});
   if(req.method==="GET"){
     const data=await Promise.all(PEOPLE.map(p=>store.get(`person-${p}`,{type:"json"})));
     return json({people:Object.fromEntries(PEOPLE.map((p,i)=>[p,data[i]||null])),serverAt:Date.now()},200,origin);
   }
   const raw=await req.text();
   if(raw.length>2000)return json({error:"Too large"},413,origin);
   let input:any;try{input=JSON.parse(raw)}catch{return json({error:"Invalid JSON"},400,origin)}
   const reporter:Person=input?.reporter,updates:Update[]=input?.updates;
   if(!(["naoya","shoko"] as string[]).includes(reporter)||
      !Array.isArray(updates)||updates.length<1||updates.length>3||
      !updates.every(validUpdate)||new Set(updates.map(u=>u.person)).size!==updates.length||
      updates.some(u=>u.person!==reporter&&u.person!=="miori"&&u.person!=="kosuke"))
      return json({error:"報告内容が正しくありません"},400,origin);
   const now=Date.now(), accepted:string[]=[],outdated:string[]=[];
   for(const u of updates){
     const key=`person-${u.person}`;
     const previous=await store.get(key,{type:"json"}) as any;
     if(previous && previous.observedAt>u.observedAt){outdated.push(u.person);continue}
     if(previous && previous.eventId===u.eventId){
       if(u.location&&(!previous.location||u.location.at>previous.location.at))
         await store.setJSON(key,{...previous,location:u.location});
       accepted.push(u.person);continue;
     }
     const record:any={person:u.person,state:u.state,reporter,observedAt:u.observedAt,
                       receivedAt:now,eventId:u.eventId,location:previous?.location??null};
     if(u.location)record.location=u.location;
     await store.setJSON(key,record);accepted.push(u.person);
   }
   return json({ok:true,accepted,outdated,serverAt:now},200,origin);
 } catch(e){
   console.error("family-safety storage error",e instanceof Error?e.name:"unknown");
   return json({error:"保存先に接続できません"},503,origin);
 }
};
export const config:Config={path:"/api/family-safety"};