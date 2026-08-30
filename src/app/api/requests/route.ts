import { ID } from "node-appwrite";
import { NextResponse } from "next/server";
import { Query, tables } from "@/app/lib/appwrite";
import { config } from "@/app/lib/config";
import { requestSchema } from "@/app/lib/schemas";
import { clientFingerprint, consumeRateLimit, rejectCrossOrigin } from "@/app/lib/security";

type RequestedItem = { module: string; status: string; stockMode?: string; stockQty?: number; capacityMode?: string; capacityQty?: number };
const compatibleModules: Record<string, string[]> = { product: ["ca_products"], store: ["stores"], opportunity: ["company_opportunities", "academic_opportunities"] };

export async function POST(request: Request) {
  const crossOrigin = rejectCrossOrigin(request); if (crossOrigin) return crossOrigin;
  const burst = consumeRateLimit(`request:${clientFingerprint(request)}`, 12, 10 * 60 * 1000);
  if (!burst.allowed)
    return NextResponse.json({ error: "Muitas tentativas em pouco tempo. Aguarde alguns minutos." }, { status: 429, headers: { "Retry-After": String(burst.retryAfter) } });
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Confira os dados informados." }, { status: 400 });
  try {
    const item = await tables().getRow({ databaseId: config.databaseId, tableId: "content_items", rowId: parsed.data.itemId }) as unknown as RequestedItem;
    if (item.status !== "published" || !compatibleModules[parsed.data.kind]?.includes(item.module))
      return NextResponse.json({ error: "Este item não está disponível para solicitações." }, { status: 409 });
    if ((parsed.data.kind === "product" || parsed.data.kind === "store") && item.stockMode === "limited" && parsed.data.quantity > Number(item.stockQty ?? 0))
      return NextResponse.json({ error: "A quantidade solicitada supera o estoque disponível." }, { status: 409 });
    const submissionKey = clientFingerprint(request);
    const recent = await tables().listRows({ databaseId: config.databaseId, tableId: "requests", queries: [Query.equal("submissionKey", [submissionKey]), Query.orderDesc("submittedAt"), Query.limit(10)], total: false });
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    if (recent.rows.filter((row) => new Date(String(row.submittedAt)).getTime() > oneHourAgo).length >= 10)
      return NextResponse.json({ error: "Limite de solicitações por hora atingido. Tente novamente mais tarde." }, { status: 429 });
    await tables().createRow({ databaseId: config.databaseId, tableId: "requests", rowId: ID.unique(), data: { ...parsed.data, email: parsed.data.email || null, details: parsed.data.details || null, status: "new", submissionKey, submittedAt: new Date().toISOString() } });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    const code = typeof error === "object" && error && "code" in error ? Number(error.code) : 0;
    if (code === 404) return NextResponse.json({ error: "Item não encontrado." }, { status: 404 });
    return NextResponse.json({ error: "Serviço temporariamente indisponível." }, { status: 503 });
  }
}
