# EggHop Administrador — versão GitHub (arquivos na raiz)

Esta versão substitui o pacote do administrador anterior. O arquivo `netlify.toml` está validado.
**Nunca publique valores de `ADMIN_PASSWORD`, `ADMIN_SESSION_SECRET` ou `ADMIN_BRIDGE_SECRET` no GitHub.**

## Publicação na Netlify pelo GitHub
1. No repositório GitHub `EggHop-Administrador`, envie o conteúdo EXTRAÍDO deste ZIP para a RAIZ do repositório (não envie a pasta que contém os arquivos; não envie o ZIP fechado).
2. Na aba Code, os primeiros itens precisam ser diretamente: `public/`, `netlify/`, `scripts/`, `netlify.toml`, `package.json`.
3. Em Netlify > projeto `adimsiteegghop` > Project configuration > Developer settings > Build settings: **Base directory = vazio**; **Package directory = vazio**; **Build command = node scripts/check.mjs**; **Publish directory = public**; **Functions directory = netlify/functions**. Se houver um prefixo automático da interface, não o repita. Se não conseguir alterar os campos, salve Base directory vazio, já que netlify.toml na raiz configura build e publicação.
4. Vá a Deploys > Trigger deploy > Deploy project without cache. Espere aparecer Published.
5. Teste `https://adimsiteegghop.netlify.app/.netlify/functions/api?route=admin-status`. Esperado sem login: `{ "admin": false }`.

## Variáveis mantidas na Netlify (não adicione ao GitHub)
- `ADMIN_PASSWORD`: no mínimo 16 caracteres.
- `ADMIN_SESSION_SECRET`: chave aleatória de no mínimo 32 caracteres.
- `ADMIN_BRIDGE_SECRET`: chave aleatória de no mínimo 32 caracteres, igual ao valor do site dos jogadores, diferente de `ADMIN_SESSION_SECRET`.
- `PLAYER_SITE_URL`: `https://sitehopjogador.netlify.app/`.

## Importante
Uma pasta antiga `EggHop-SITE-ADMINISTRADOR/` pode continuar no GitHub, mas, com as novas configurações, ela não é utilizada. Certifique-se de não ter outro `netlify.toml` conflitante na raiz. O deploy de Git precisa instalar a dependência `@netlify/blobs` do `package.json`.
Se houver falha, abra o deploy > Deploy log e compartilhe só as linhas do erro, ocultando chaves/senhas.
