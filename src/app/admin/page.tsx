import type { Metadata } from "next"; import { requireAdmin } from "@/app/lib/auth"; import { Dashboard } from "./dashboard"; import "./admin.css";
export const metadata:Metadata={title:"Painel administrativo",robots:{index:false,follow:false}};
export default async function Page(){await requireAdmin();return <Dashboard/>}
