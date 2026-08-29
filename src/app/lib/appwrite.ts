import "server-only";
import { Account, Client, Query, Storage, TablesDB, Users } from "node-appwrite";
import { config } from "./config";

function baseClient(){ return new Client().setEndpoint(config.endpoint).setProject(config.projectId); }
export function serverClient(){ const key=process.env.APPWRITE_API_KEY; if(!key) throw new Error("APPWRITE_API_KEY ausente"); return baseClient().setKey(key); }
export function tables(){ return new TablesDB(serverClient()); }
export function users(){ return new Users(serverClient()); }
export function storage(){ return new Storage(serverClient()); }
export function publicAccount(){ return new Account(baseClient()); }
export function sessionAccount(secret:string){ return new Account(baseClient().setSession(secret)); }
export { Query };
