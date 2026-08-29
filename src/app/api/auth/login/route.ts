import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { publicAccount, Query, tables, users } from "@/app/lib/appwrite";
import { sessionCookie } from "@/app/lib/auth";
import { loginSchema } from "@/app/lib/schemas";
import { clientFingerprint, rejectCrossOrigin } from "@/app/lib/security";
import { consumeRateLimit } from "@/app/lib/rate-limit";

export async function POST(request:Request){
  const crossOrigin=rejectCrossOrigin(request);if(crossOrigin)return crossOrigin;
  const rate=consumeRateLimit(`login:${clientFingerprint(request)}`,8,15*60*1000);
  if(!rate.allowed)return NextResponse.json({error:"Muitas tentativas. Aguarde alguns minutos e tente novamente."},{status:429,headers:{"retry-after":String(rate.retryAfter)}});
  const parsed=loginSchema.safeParse(await request.json().catch(()=>null)); if(!parsed.success)return NextResponse.json({error:"E-mail ou senha inválidos."},{status:400});
  try { const {email,password,keepConnected}=parsed.data; const passwordSession=await publicAccount().createEmailPasswordSession({email,password}); const admins=await tables().listRows({databaseId:config.databaseId,tableId:"administrators",queries:[Query.equal("userId",[passwordSession.userId]),Query.equal("active",[true]),Query.limit(1)],total:false}); if(!admins.rows[0]){await users().deleteSession({userId:passwordSession.userId,sessionId:passwordSession.$id}).catch(()=>undefined);return NextResponse.json({error:"Esta conta não possui acesso ao painel."},{status:403});} const session=await users().createSession({userId:passwordSession.userId}); await users().deleteSession({userId:passwordSession.userId,sessionId:passwordSession.$id}).catch(()=>undefined); const maxAge=60*60*24*30;(await cookies()).set({name:sessionCookie,value:session.secret,httpOnly:true,secure:process.env.NODE_ENV==="production",sameSite:"lax",path:"/",priority:"high",...(keepConnected?{maxAge,expires:new Date(Date.now()+maxAge*1000)}:{})});return NextResponse.json({ok:true}); }
  catch{return NextResponse.json({error:"Não foi possível autenticar. Verifique os dados."},{status:401});}
}
