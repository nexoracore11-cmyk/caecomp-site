import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import { storeProfileSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";

const slugify=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,180);
export async function POST(request:Request){
 const cross=rejectCrossOrigin(request);if(cross)return cross;const admin=await currentAdmin();if(!admin||!isMaster(admin))return NextResponse.json({error:"Somente masters cadastram vendinhas e seus responsáveis."},{status:403});
 const parsed=storeProfileSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Revise os dados da vendinha e selecione um responsável."},{status:400});const body=parsed.data;
 const row=await tables().createRow({databaseId:config.databaseId,tableId:"store_profiles",rowId:ID.unique(),data:{...body,slug:slugify(body.slug||body.name)+"-"+Date.now().toString(36),description:body.description||null,whatsapp:body.whatsapp||null,instagram:body.instagram||null,logoUrl:body.logoUrl||null,coverUrl:body.coverUrl||null}});
 return NextResponse.json({store:row},{status:201});
}
