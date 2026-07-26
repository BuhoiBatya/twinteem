import {NextResponse} from "next/server"; import {authCookie,makeSession} from "@/lib/auth";
export async function POST(req:Request){
  const {login,password}=await req.json(); const expectedLogin=process.env.ADMIN_LOGIN; const expectedPassword=process.env.ADMIN_PASSWORD;
  if(!expectedLogin||!expectedPassword||!process.env.AUTH_SECRET)return NextResponse.json({error:"Авторизация не настроена"},{status:503});
  if(login!==expectedLogin||password!==expectedPassword)return NextResponse.json({error:"Неверный логин или пароль"},{status:401});
  const res=NextResponse.json({ok:true});res.cookies.set(authCookie.name,await makeSession(),authCookie.options);return res;
}
