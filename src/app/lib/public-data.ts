import "server-only";
import { cache } from "react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { config, hasAppwrite } from "./config";
import { Query, tables } from "./appwrite";
import { sampleData } from "./sample-data";
import type { ContentItem, Director, PublicData, SiteSettings } from "./types";

export const getPublicData=cache(async ():Promise<PublicData>=>{
  await connection();
  if(!hasAppwrite)return sampleData;
  try{const [content,directors,settings]=await Promise.all([tables().listRows({databaseId:config.databaseId,tableId:"content_items",queries:[Query.equal("status",["published"]),Query.orderAsc("sortOrder"),Query.limit(250)],total:false}),tables().listRows({databaseId:config.databaseId,tableId:"directors",queries:[Query.equal("active",[true]),Query.orderAsc("sortOrder"),Query.limit(100)],total:false}),tables().listRows({databaseId:config.databaseId,tableId:"site_settings",queries:[Query.equal("key",["public"]),Query.limit(1)],total:false})]);return {settings:(settings.rows[0]?JSON.parse(String(settings.rows[0].value)):sampleData.settings) as SiteSettings,content:content.rows.map(r=>({...r,id:r.$id})) as unknown as ContentItem[],directors:directors.rows.map(r=>({...r,id:r.$id})) as unknown as Director[]};}catch(error){
    console.error("Falha ao carregar dados públicos do Appwrite", error);
    return process.env.NODE_ENV === "production" ? { settings: sampleData.settings, content: [], directors: [] } : sampleData;
  }
});
export function requirePublicSection(data:PublicData,key:string){if(data.settings.sections[key]===false)notFound();}
