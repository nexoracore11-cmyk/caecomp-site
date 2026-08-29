# CAECOMP UFG

Portal público e painel administrativo do Centro Acadêmico da Engenharia de Computação da UFG.

## Recursos

- notícias, eventos, produtos oficiais, vendinhas, documentos e galeria;
- processos seletivos de empresas e oportunidades acadêmicas;
- solicitações sem pagamento on-line, com estoque e capacidade limitados ou ilimitados;
- produtos de vendinhas vinculados ao usuário responsável, sempre enviados para aprovação e republicados somente após nova análise quando editados;
- permissão separada para aprovar vendinhas, disponível para masters ou usuários explicitamente autorizados;
- diretoria atual e contatos opcionais;
- três publicações do Instagram selecionadas pelo Marketing;
- Olhares CAECOMP com várias campanhas fotográficas, arquivo histórico, encerramento pelo Master Supremo e a Pretinha como primeira edição;
- lojas virtuais individuais para vendinhas, com logo, capa, responsável e produtos sujeitos a aprovação;
- eventos com inscrições abertas, encerradas ou esgotadas, gratuidade, lotes, avisos e mídia pós-evento;
- biblioteca pesquisável, leitor de PDF no site, download e área para o Jornal CAECOMP;
- usuários com permissões acumuláveis por diretoria e níveis `Equipe`, `Master`, `Presidência` e `Master Supremo`;
- Master Supremo protegido; Presidência administra masters comuns; masters comuns não alteram outros masters;
- somente o Master Supremo redefine a senha de outra conta;
- Appwrite isolado, uploads e trilha de auditoria preparada.

## Desenvolvimento

```bash
npm install
npm run dev
```

Copie `.env.example` para `.env.local` apenas quando houver um projeto Appwrite separado. Nunca reutilize o projeto, banco, bucket, chave ou cookie da RVG.

Antes de publicar esta versão, execute `npm run migrate` no ambiente isolado do CAECOMP. A migração cria a tabela `pretinha_photos`, adiciona `accessLevel` às contas existentes e preserva os dados já cadastrados. Configure também uma chave longa e aleatória em `CAECOMP_UPLOAD_SALT`.

## Validação

```bash
npm run lint
npx tsc --noEmit --incremental false
npm run build
```
