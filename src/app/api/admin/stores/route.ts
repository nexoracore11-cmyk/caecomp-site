import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { Query, tables } from "@/app/lib/appwrite";
import { storeProfileSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";
import { sectionEnabled } from "@/app/lib/module-visibility";
import { getCurrentSections } from "@/app/lib/site-settings";

const slugify=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,180);
export async function POST(request:Request){
 const cross=rejectCrossOrigin(request);if(cross)return cross;const admin=await currentAdmin();if(!admin||(!isMaster(admin)&&!admin.permissions.includes("stores_manage")))return NextResponse.json({error:"Somente masters ou responsáveis autorizados cadastram vendinhas."},{status:403});
 if(!sectionEnabled(await getCurrentSections(),"stores"))return NextResponse.json({error:"Vendinhas estão desativadas nas configurações do site."},{status:409});
 const parsed=storeProfileSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Revise os dados da vendinha e selecione um responsável."},{status:400});const body=parsed.data;
 const owners=await tables().listRows({databaseId:config.databaseId,tableId:"administrators",queries:[Query.equal("userId",[body.ownerUserId]),Query.equal("active",[true]),Query.limit(1)],total:false});const owner=owners.rows[0];if(!owner||!Array.isArray(owner.permissions)||!owner.permissions.includes("stores"))return NextResponse.json({error:"O responsável precisa ter a permissão de gerenciar a própria vendinha."},{status:400});
 const row=await tables().createRow({databaseId:config.databaseId,tableId:"store_profiles",rowId:ID.unique(),data:{...body,slug:slugify(body.slug||body.name)+"-"+Date.now().toString(36),description:body.description||null,whatsapp:body.whatsapp||null,phone:body.phone||null,email:body.email||null,instagram:body.instagram||null,logoUrl:body.logoUrl||null,coverUrl:body.coverUrl||null,approved:true}});
 return NextResponse.json({store:row},{status:201});
}
