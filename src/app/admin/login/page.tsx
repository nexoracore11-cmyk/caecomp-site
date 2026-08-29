import type { Metadata } from "next"; import { redirect } from "next/navigation"; import { currentAdmin } from "@/app/lib/auth"; import { LoginForm } from "./login-form"; import "../admin.css";
export const metadata:Metadata={title:"Entrar no painel"};
export default async function Page(){if(await currentAdmin())redirect("/admin");return <section className="login-page"><LoginForm/></section>}
