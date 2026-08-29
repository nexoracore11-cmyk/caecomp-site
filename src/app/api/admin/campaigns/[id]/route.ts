import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import { photoCampaignUpdateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){
  const cross=rejectCrossOrigin(request);if(cross)return cross;
  const admin=await currentAdmin();if(!admin||!isMaster(admin))return NextResponse.json({error:"Acesso negado."},{status:403});
  const parsed=photoCampaignUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Revise os dados da iniciativa."},{status:400});
  const current=await tables().getRow({databaseId:config.databaseId,tableId:"photo_campaigns",rowId:(await params).id});
  const nextStatus=parsed.data.status;
  if(nextStatus&&["closed","archived"].includes(nextStatus)&&admin.accessLevel!=="supreme")return NextResponse.json({error:"Somente o Master Supremo pode encerrar ou arquivar envios."},{status:403});
  if(String(current.status)==="closed"&&nextStatus==="open"&&admin.accessLevel!=="supreme")return NextResponse.json({error:"Somente o Master Supremo pode reabrir envios encerrados."},{status:403});
  const data=Object.fromEntries(Object.entries(parsed.data).map(([key,value])=>[key,(key==="startsAt"||key==="endsAt")&&value?new Date(String(value)).toISOString():value===""?null:value]));
  const row=await tables().updateRow({databaseId:config.databaseId,tableId:"photo_campaigns",rowId:(await params).id,data});
  return NextResponse.json({campaign:row});
}
