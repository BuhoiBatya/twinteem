import {NextResponse} from "next/server";
import {readHistory} from "@/lib/db";
export const runtime="nodejs";
const valid=(value:string|null)=>/^\d{4}-\d{2}-\d{2}$/.test(value||"");
export async function GET(req:Request){const url=new URL(req.url),now=new Date(),fallbackTo=now.toISOString().slice(0,10),fallbackFrom=new Date(now.getTime()-400*86400000).toISOString().slice(0,10),from=valid(url.searchParams.get("from"))?url.searchParams.get("from")!:fallbackFrom,to=valid(url.searchParams.get("to"))?url.searchParams.get("to")!:fallbackTo;try{return NextResponse.json(await readHistory(from,to),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error(error);return NextResponse.json({configured:true,snapshots:[],error:"Не удалось загрузить историю"},{status:500})}}
