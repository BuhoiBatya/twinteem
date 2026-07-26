import {cookies} from "next/headers";

const COOKIE="twinteem_session";
const enc=new TextEncoder();
const hex=(bytes:ArrayBuffer)=>Array.from(new Uint8Array(bytes)).map(x=>x.toString(16).padStart(2,"0")).join("");
const secret=()=>process.env.AUTH_SECRET||"";

async function sign(value:string){
  const key=await crypto.subtle.importKey("raw",enc.encode(secret()),{name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",key,enc.encode(value)));
}
export async function makeSession(){const payload=`admin.${Date.now()+1000*60*60*24*14}`;return `${payload}.${await sign(payload)}`}
export async function verifySession(token?:string){
  if(!token||!secret())return false; const [role,expires,sig]=token.split("."); if(role!=="admin"||!expires||!sig||Number(expires)<Date.now())return false;
  return sig===await sign(`${role}.${expires}`);
}
export async function isAdmin(){return verifySession((await cookies()).get(COOKIE)?.value)}
export const authCookie={name:COOKIE,options:{httpOnly:true,sameSite:"lax" as const,secure:process.env.NODE_ENV==="production",path:"/",maxAge:60*60*24*14}};
