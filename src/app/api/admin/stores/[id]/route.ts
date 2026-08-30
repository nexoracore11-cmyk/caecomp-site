import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import { storeProfileUpdateSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";
import { sectionEnabled } from "@/app/lib/module-visibility";
import { getCurrentSections } from "@/app/lib/site-settings";

export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){const cross=rejectCrossOrigin(request);if(cross)return cross;const admin=await currentAdmin();if(!admin)return NextResponse.json({error:"Acesso negado."},{status:403});if(!sectionEnabled(await getCurrentSections(),"stores"))return NextResponse.json({error:"Vendinhas estão desativadas nas configurações do site."},{status:409});const id=(await params).id;const current=await tables().getRow({databaseId:config.databaseId,tableId:"store_profiles",rowId:id});const master=isMaster(admin);if(!master&&(!admin.permissions.includes("stores")||current.ownerUserId!==admin.userId))return NextResponse.json({error:"Você só pode editar sua própria vendinha."},{status:403});const parsed=storeProfileUpdateSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Revise os dados da vendinha."},{status:400});const editable=master?Object.keys(parsed.data):["name","description","whatsapp","phone","email","instagram","logoUrl","coverUrl"];const data=Object.fromEntries(Object.entries(parsed.data).filter(([key])=>editable.includes(key)).map(([key,value])=>[key,value===""?null:value]));const row=await tables().updateRow({databaseId:config.databaseId,tableId:"store_profiles",rowId:id,data});return NextResponse.json({store:row,message:"Vendinha atualizada."});}
