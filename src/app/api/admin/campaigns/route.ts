import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { config } from "@/app/lib/config";
import { currentAdmin, isMaster } from "@/app/lib/auth";
import { tables } from "@/app/lib/appwrite";
import { photoCampaignSchema } from "@/app/lib/schemas";
import { rejectCrossOrigin } from "@/app/lib/security";
import { saoPauloLocalToIso } from "@/app/lib/date-time";

const slugify=(value:string)=>value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"").slice(0,180);

export async function POST(request:Request){
  const cross=rejectCrossOrigin(request);if(cross)return cross;
  const admin=await currentAdmin();if(!admin||!isMaster(admin))return NextResponse.json({error:"Somente masters podem criar iniciativas."},{status:403});
  const parsed=photoCampaignSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({error:"Revise os dados da iniciativa."},{status:400});
  const body=parsed.data;
  const row=await tables().createRow({databaseId:config.databaseId,tableId:"photo_campaigns",rowId:ID.unique(),data:{title:body.title,slug:slugify(body.slug||body.title)+"-"+Date.now().toString(36),summary:body.summary,description:body.description||null,status:body.status,coverUrl:body.coverUrl||null,selectionLimit:body.selectionLimit,startsAt:body.startsAt?saoPauloLocalToIso(body.startsAt):null,endsAt:body.endsAt?saoPauloLocalToIso(body.endsAt):null,createdBy:admin.userId}});
  return NextResponse.json({campaign:row},{status:201});
}
