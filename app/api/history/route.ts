import {NextResponse} from "next/server";
import {readHistory,writeSnapshot} from "@/lib/db";
import {isAdmin} from "@/lib/auth";
export const runtime="nodejs";
const valid=(value:string|null)=>/^\d{4}-\d{2}-\d{2}$/.test(value||"");
export async function GET(req:Request){const url=new URL(req.url),now=new Date(),fallbackTo=now.toISOString().slice(0,10),fallbackFrom=new Date(now.getTime()-400*86400000).toISOString().slice(0,10),from=valid(url.searchParams.get("from"))?url.searchParams.get("from")!:fallbackFrom,to=valid(url.searchParams.get("to"))?url.searchParams.get("to")!:fallbackTo;try{return NextResponse.json(await readHistory(from,to),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error(error);return NextResponse.json({configured:true,snapshots:[],error:"Не удалось загрузить историю"},{status:500})}}
export async function POST(req:Request){if(!await isAdmin())return NextResponse.json({error:"Требуется вход администратора"},{status:401});try{const snapshot=await req.json();if(!valid(snapshot.date)||!Array.isArray(snapshot.people))throw new Error("invalid snapshot");const updatedAt=await writeSnapshot({date:snapshot.date,people:snapshot.people});return NextResponse.json({ok:true,updatedAt})}catch(error){console.error(error);return NextResponse.json({error:"Не удалось сохранить запись календаря"},{status:500})}}
