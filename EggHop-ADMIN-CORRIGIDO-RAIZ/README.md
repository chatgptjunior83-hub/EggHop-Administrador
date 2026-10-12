# 02 — SITE DO ADMINISTRADOR (EggHop Admin)

Este é o site EXCLUSIVO do dono. Ele mostra quem pediu acesso no site dos jogadores. Compare o **nick + código** com a mensagem que recebeu no TikTok antes de liberar. Você também pode bloquear e desvincular um nick para um novo aparelho.

## Publicação

1. Publique primeiro o **01-SITE-JOGADORES**. Guarde o endereço dele.
2. Crie um segundo repositório GitHub público, por exemplo `EggHop-Admin`, e envie **o conteúdo desta pasta**.
3. Na Netlify, crie **outro** projeto com **Import from Git** apontando para esse repositório.
4. Em **Project configuration → Environment variables**, configure quatro variáveis:
   - `ADMIN_PASSWORD`: senha forte que só você sabe, com no mínimo 16 caracteres. **Não me envie a senha**.
   - `ADMIN_SESSION_SECRET`: chave aleatória com 32 ou mais caracteres (diferente das outras).
   - `ADMIN_BRIDGE_SECRET`: **a mesma** chave que você colocou no site dos jogadores.
   - `PLAYER_SITE_URL`: o endereço completo HTTPS do site dos jogadores, como `https://egghop-jogadores.netlify.app/`.
5. Publique novamente (**Trigger deploy → Deploy site**) depois de salvar as variáveis.
6. Abra a URL desse SEGUNDO site, digite sua senha e veja as solicitações. No celular também funciona.

## Proteção

Seu site admin mantém a senha apenas na Netlify e autentica por cookie HTTP-only. A conexão entre os dois sites usa um segredo guardado nas funções da Netlify; não é exibido no HTML. Tentativas de senha errada são limitadas. Acesso de outros navegadores só funciona com sua senha.

Não compartilhe o link do site admin como link principal de vendas e **nunca compartilhe sua senha de admin**. Abrir o HTML baixado no Edge serve apenas para ver o visual, não para administrar pedidos; a lógica precisa da Netlify.
