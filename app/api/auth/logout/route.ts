import {NextResponse} from "next/server"; import {authCookie} from "@/lib/auth";
export async function POST(){const r=NextResponse.json({ok:true});r.cookies.set(authCookie.name,"",{...authCookie.options,maxAge:0});return r}
