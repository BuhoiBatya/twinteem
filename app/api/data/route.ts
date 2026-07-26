import {NextResponse} from "next/server";import {isAdmin} from "@/lib/auth";import {readState,writeState} from "@/lib/db";
export const runtime="nodejs";
export async function GET(){try{return NextResponse.json(await readState(),{headers:{"Cache-Control":"no-store"}})}catch(error){console.error(error);return NextResponse.json({configured:true,error:"Не удалось загрузить серверные данные"},{status:500})}}
export async function POST(req:Request){
  if(!await isAdmin())return NextResponse.json({error:"Требуется вход администратора"},{status:401});
  const raw=await req.text();if(raw.length>4_000_000)return NextResponse.json({error:"Данные слишком большие"},{status:413});
  try{const body=JSON.parse(raw);if(!Array.isArray(body.people))throw new Error("invalid data");const updatedAt=await writeState({version:1,people:body.people});return NextResponse.json({ok:true,updatedAt})}catch(error){console.error(error);return NextResponse.json({error:"Не удалось сохранить данные"},{status:500})}
}
