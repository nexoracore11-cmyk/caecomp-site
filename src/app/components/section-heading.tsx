import Link from "next/link";
import { ArrowUpRight } from "./icons";
export function SectionHeading({ kicker, title, text, href, link = "Ver tudo" }: { kicker: string; title: string; text?: string; href?: string; link?: string }) { return <div className="section-heading"><div><span className="kicker">{kicker}</span><h2>{title}</h2>{text && <p>{text}</p>}</div>{href && <Link href={href}>{link}<ArrowUpRight size={18}/></Link>}</div>; }
