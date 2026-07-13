# Gestão de Banca — Guia completo

Este guia parte do zero. Assume que você **nunca** publicou um site, nunca usou banco de dados, nunca mexeu com GitHub.

Não pule passos. Não faça fora de ordem. Se travar, vá até o final do guia, na seção **Quando der errado**.

**Tempo:** de 40 minutos a 1 hora.
**Custo:** R$ 0,00. Tudo que vamos usar tem plano gratuito.

---

## Sumário

- [O que você vai ter no final](#o-que-você-vai-ter-no-final)
- [Antes de começar](#antes-de-começar)
- [PARTE 1 — Banco de dados (Supabase)](#parte-1--banco-de-dados-supabase)
- [PARTE 2 — Chave do Google (leitura do bilhete)](#parte-2--chave-do-google-leitura-do-bilhete)
- [PARTE 3 — Subir o código (GitHub)](#parte-3--subir-o-código-github)
- [PARTE 4 — Publicar o site (Vercel)](#parte-4--publicar-o-site-vercel)
- [PARTE 5 — Primeiro uso](#parte-5--primeiro-uso)
- [PARTE 6 — Colocar o ícone no celular](#parte-6--colocar-o-ícone-no-celular)
- [Como usar o app no dia a dia](#como-usar-o-app-no-dia-a-dia)
- [Como alterar o app depois](#como-alterar-o-app-depois)
- [Domínio próprio](#domínio-próprio-opcional)
- [Quando der errado](#quando-der-errado)
- [Sobre segurança](#sobre-segurança)

---

## Já tem o app rodando? Leia isto

Se você **já publicou** e está só atualizando, faça duas coisas:

**1. Rode o `schema.sql` de novo.** Ele adiciona o bilhete às apostas, a tabela de apostas fixadas (cada um fixa as suas) e as travas de segurança. Nada é apagado.

**2. Suba os arquivos novos no GitHub.** A Vercel republica sozinha.

O SQL pode rodar quantas vezes você quiser. Nada se perde.

---

## O que você vai ter no final

- Um site no ar, endereço tipo `banca-app.vercel.app`, que abre no celular e no computador
- Um banco de dados de verdade guardando tudo, que não some
- Você e a outra pessoa com login próprio, e-mail e senha
- Aposta registrada por um aparece na tela do outro na hora, sem atualizar a página
- Colar o print do bilhete preenche evento, odd e valor sozinho

---

## Antes de começar

Abra o **Bloco de Notas** (ou qualquer editor de texto) e deixe aberto numa janela do lado. Ao longo do guia você vai copiar 3 informações importantes. Cole todas nele.

Crie 3 linhas assim, para preencher depois:

```
URL DO SUPABASE:
CHAVE ANON DO SUPABASE:
CHAVE DO GOOGLE:
```

Você também vai precisar de:

- Uma conta no **GitHub** (você disse que já tem)
- Uma conta **Google** (o Gmail serve)
- A pasta `banca-app` descompactada no seu computador

**Descompacte o arquivo `banca-app.zip` agora.** Clique com o botão direito → Extrair tudo. Deixe a pasta num lugar fácil de achar, tipo a Área de Trabalho.

---

# PARTE 1 — Banco de dados (Supabase)

O Supabase é onde suas apostas vão ficar guardadas. É grátis.

## 1.1 — Criar a conta

**1.** Abra `https://supabase.com`

**2.** No canto superior direito, clique no botão verde **Start your project**

**3.** Vai abrir uma tela de login. Clique em **Continue with GitHub**

**4.** O GitHub vai pedir permissão. Clique em **Authorize supabase**

**5.** Se pedir para criar uma organização:
- **Name:** digite `pessoal`
- **Type:** escolha `Personal`
- **Plan:** escolha **Free**
- Clique em **Create organization**

## 1.2 — Criar o projeto

**1.** Clique no botão **New project**

**2.** Preencha:

| Campo | O que colocar |
|---|---|
| **Name** | `banca` |
| **Database Password** | clique em **Generate a password** |
| **Region** | escolha `South America (São Paulo)` |

**3.** A senha do banco vai aparecer. **Copie e cole no Bloco de Notas.**

> Você provavelmente nunca vai usar essa senha. Mas se perder, não tem como recuperar. Guarde.

**4.** Clique em **Create new project**

**5.** Espere de 1 a 3 minutos. A tela vai dizer *"Setting up project"*. Não feche.

## 1.3 — Montar as tabelas

Agora vamos criar as tabelas onde as apostas ficam guardadas.

**1.** No menu da **esquerda**, procure o ícone do **SQL Editor**. Parece uma folha de papel com `>_` dentro. Clique.

**2.** Clique em **New query** (ou no botão `+`)

**3.** Vai aparecer uma caixa branca grande, vazia.

**4.** Agora abra a pasta `banca-app` no seu computador.

**5.** Entre na pasta `supabase`.

**6.** Abra o arquivo **`schema.sql`**.
- Se o Windows perguntar com o que abrir, escolha **Bloco de Notas**.

**7.** Dentro do arquivo, aperte **`Ctrl + A`** (seleciona tudo) e depois **`Ctrl + C`** (copia).

**8.** Volte para a aba do Supabase. Clique dentro da caixa branca e aperte **`Ctrl + V`**.

**9.** Confira: o texto tem que começar com `-- ═══` e terminar com `$$;`

Se não terminar assim, você copiou pela metade. Apague tudo e refaça do passo 7.

**10.** Clique no botão verde **Run** no canto inferior direito. (Ou aperte `Ctrl + Enter`)

**11.** Espere uns 5 segundos.

✅ **Deu certo se aparecer:** `Success. No rows returned`

❌ **Deu errado se aparecer texto vermelho.** Volte ao passo 7 e copie o arquivo inteiro.

> Rodar esse SQL duas vezes não causa problema nenhum. Se ficou na dúvida, rode de novo.

## 1.3.1 — Confirmar que as tabelas nasceram

**1.** No menu da esquerda, clique em **Table Editor** (ícone de tabela)

**2.** Você tem que ver **quatro** tabelas:
- `apostas`
- `casas`
- `config`
- `profiles`

**3.** Clique em **config**. Tem que ter **uma linha**, com `banca` valendo `4800`

Se está tudo lá, o banco está pronto. Siga em frente.

## 1.4 — Desligar a confirmação de e-mail

Por padrão, o Supabase manda um e-mail e exige que você clique num link antes de entrar. Para duas pessoas, isso só atrapalha.

**1.** No menu da **esquerda**, clique em **Authentication**

**2.** No submenu que abrir, clique em **Sign In / Providers**
- Em versões mais novas o nome pode ser só **Providers**

**3.** Na lista, ache **Email** e clique nele para abrir

**4.** Procure a chave (o botãozinho de liga/desliga) chamada **Confirm email**

**5.** **Desligue ela.** Ela tem que ficar cinza, não verde.

**6.** Role a página até o fim e clique em **Save**

## 1.5 — Copiar as duas chaves

**1.** No menu da esquerda, lá **embaixo de tudo**, clique em **Project Settings** (ícone de engrenagem ⚙️)

**2.** No submenu, clique em **API Keys**
- Em versões mais antigas o nome é só **API**

**3.** Você vai ver duas informações. Copie as duas para o Bloco de Notas:

### Primeira: Project URL

Fica no topo. Parece com isso:

```
https://abcdefghijklmnop.supabase.co
```

Copie e cole na linha `URL DO SUPABASE:` do seu Bloco de Notas.

### Segunda: chave anon public

Um texto **gigante**, começa com `eyJ`. Pode ter 200 caracteres ou mais.

Ela pode estar rotulada como:
- `anon` `public`
- ou **Publishable key**

Clique no ícone de copiar ao lado dela.

Cole na linha `CHAVE ANON DO SUPABASE:` do seu Bloco de Notas.

> ⚠️ **Existe uma terceira chave** chamada `service_role` ou **Secret key**. **NUNCA use ela.** Ignore. Ela dá acesso total ao banco sem senha.

---

# PARTE 2 — Chave do Google (leitura do bilhete)

Essa parte faz o app **ler o print do bilhete** e preencher os campos sozinho.

## Isso é obrigatório?

**Não.** O app já vem com um leitor embutido que roda no seu próprio celular, sem chave nenhuma. Ele é grátis e funciona offline.

Mas ele erra mais. O Google lê muito melhor, e também é grátis.

| Opção | Custo | Precisa de chave? | Qualidade |
|---|---|---|---|
| **Google Gemini** | grátis | sim, sem cartão | ótima |
| **Tesseract** (já vem) | grátis | não | razoável |

**Recomendo fazer.** São 8 cliques. Mas se quiser pular, vá direto para a [Parte 3](#parte-3--subir-o-código-github).

## 2.1 — Pegar a chave

**1.** Abra `https://aistudio.google.com/apikey`

**2.** Entre com sua conta Google

**3.** Se aparecer uma tela de termos, marque a caixinha e clique em **I accept**

**4.** Clique no botão azul **Create API key**
- Em português: **Criar chave de API**

**5.** Vai abrir uma janelinha pedindo um projeto:
- Se aparecer uma lista, escolha qualquer projeto
- Se não aparecer nada, clique em **Create API key in new project**

**6.** Espere uns 5 segundos.

**7.** Sua chave aparece. Começa com `AIza`, tipo:

```
AIzaSyC8xK2mP4nQ7wR9tY1uV3bN5jH6gF0dS2a
```

**8.** Clique no ícone de **copiar** ao lado dela

**9.** Cole na linha `CHAVE DO GOOGLE:` do seu Bloco de Notas

> Se você perder a chave, é só voltar nessa mesma página e copiar de novo.

⚠️ **Essa chave é como uma senha.** Não mande pra ninguém. Não poste em lugar nenhum.

## 2.2 — O que você precisa saber

**Não pede cartão de crédito.** É grátis mesmo.

**Tem limite por minuto.** Se você fizer muitas leituras seguidas, ele bloqueia por um minuto. Quando isso acontece, o app cai sozinho no leitor do aparelho. Nada trava.

**O Google pode usar seus prints para treinar os modelos deles.** São prints de bilhete de aposta, então isso provavelmente não te incomoda. Mas você merece saber antes de aceitar.

---

# PARTE 3 — Subir o código (GitHub)

Você não vai precisar instalar nada nem digitar comando nenhum. Vamos fazer arrastando arquivos.

## 3.1 — Limpar a pasta

**1.** Abra a pasta `banca-app` que você descompactou

**2.** Olhe se existe uma pasta chamada **`node_modules`** dentro dela

**3.** Se existir, **apague**. Ela tem milhares de arquivos e não precisa ir para o GitHub.

**4.** Olhe se existe uma pasta chamada **`.next`**. Se existir, apague também.

> Se não existirem, ótimo. Siga em frente.

## 3.2 — Criar o repositório

**1.** Abra `https://github.com/new`

**2.** Preencha:

| Campo | O que colocar |
|---|---|
| **Repository name** | `banca-app` |
| **Description** | deixe vazio |
| **Visibilidade** | marque **Private** |

⚠️ **Marque Private.** Se marcar Public, qualquer pessoa na internet vê seu código.

**3.** Na seção **Initialize this repository**, **não marque nada**. Nem README, nem .gitignore, nem licença.

**4.** Clique no botão verde **Create repository**

## 3.3 — Enviar os arquivos

Você vai cair numa página com instruções de terminal. **Ignore tudo isso.**

**1.** Procure um texto no meio da página que diz algo como:

> *...or push an existing repository from the command line*

Um pouco **acima** disso, tem uma frase com um link azul: **uploading an existing file**

**2.** Clique nesse link **uploading an existing file**

**3.** Vai abrir uma tela de arrastar arquivos.

**4.** Agora abra a pasta `banca-app` no seu computador, lado a lado com o navegador.

**5.** **Entre dentro** da pasta `banca-app`. Você tem que estar vendo os arquivos soltos:
- `src` (pasta)
- `supabase` (pasta)
- `package.json`
- `README.md`
- `next.config.mjs`
- e outros

**6.** Aperte **`Ctrl + A`** para selecionar tudo

**7.** **Arraste tudo** para dentro da área de upload do GitHub

⚠️ **Arraste o conteúdo, não a pasta.** Se você arrastar a pasta `banca-app` inteira, os arquivos vão ficar dentro de uma subpasta e **a Vercel não vai achar nada**.

Depois de soltar, o GitHub tem que listar `src/...`, `supabase/schema.sql`, `package.json`.

Se listar `banca-app/src/...`, você errou. Recarregue a página e refaça.

**8.** Espere o upload terminar. Pode demorar 1 minuto.

**9.** Role a página até o fim. No campo de mensagem, escreva:

```
primeira versão
```

**10.** Clique no botão verde **Commit changes**

✅ Pronto. Seu código está no GitHub.

---

# PARTE 4 — Publicar o site (Vercel)

## 4.1 — Criar a conta

**1.** Abra `https://vercel.com`

**2.** Clique em **Sign Up**

**3.** Clique em **Continue with GitHub**

**4.** Autorize quando o GitHub pedir

**5.** Se perguntar o plano, escolha **Hobby** (é o grátis)

**6.** Se pedir seu nome, preencha qualquer coisa e continue

## 4.2 — Importar o projeto

**1.** Você vai cair no **Dashboard**

**2.** Clique no botão **Add New** (canto superior direito) → escolha **Project**

**3.** Vai aparecer a lista dos seus repositórios do GitHub

**4.** Ache `banca-app` e clique em **Import**

### Se `banca-app` não aparecer na lista:

- Clique em **Adjust GitHub App Permissions**
- Escolha **Only select repositories**
- Marque `banca-app`
- Clique em **Save** ou **Install**
- Volte e recarregue a página

## 4.3 — Colocar as chaves

🛑 **NÃO clique em Deploy ainda.** Se clicar, o site sobe quebrado.

**1.** Na tela de configuração, procure a seção **Environment Variables**

**2.** Clique nela para expandir. Vão aparecer dois campos: **Key** (ou Name) e **Value**

**3.** Agora você vai adicionar **3 variáveis**, uma de cada vez.

### Variável 1

- **Key:** `NEXT_PUBLIC_SUPABASE_URL`
- **Value:** a URL do Supabase que está no seu Bloco de Notas

Clique em **Add**

### Variável 2

- **Key:** `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value:** a chave `eyJ...` do Supabase

Clique em **Add**

### Variável 3 (pule se não fez a Parte 2)

- **Key:** `GOOGLE_API_KEY`
- **Value:** a chave `AIza...` do Google

Clique em **Add**

### ⚠️ Confira antes de seguir

Os nomes têm que estar **exatos**:

- Tudo **MAIÚSCULO**
- Underline `_` entre as palavras, não é espaço nem hífen
- **Sem espaço** antes ou depois

| ✅ Certo | ❌ Errado |
|---|---|
| `GOOGLE_API_KEY` | `GOOGLE API KEY` |
| `GOOGLE_API_KEY` | `google_api_key` |
| `GOOGLE_API_KEY` | `GOOGLE-API-KEY` |
| `GOOGLE_API_KEY` | `GOOGLE_APIKEY` |

E cuidado ao colar os valores. Se vier um **espaço** ou uma **quebra de linha** no fim, não funciona. Depois de colar, clique no fim do texto e aperte `Delete` algumas vezes.

**Um erro aqui é o motivo número 1 do app não abrir.**

## 4.4 — Publicar

**1.** Clique no botão preto **Deploy**

**2.** Espere de 1 a 3 minutos. Você vai ver logs correndo. É normal.

**3.** Quando terminar, aparece uma tela de parabéns com confete

**4.** Vai ter um endereço tipo `banca-app-xyz123.vercel.app`

**5.** Clique nele

✅ **Seu app está no ar.**

Copie esse endereço e cole no Bloco de Notas. É o link que você vai usar sempre.

---

# PARTE 5 — Primeiro uso

## 5.1 — Criar sua conta

**1.** Abra o link do seu app

**2.** Vai aparecer a tela de login

**3.** Clique embaixo em **Não tem conta? Criar agora**

**4.** Preencha:
- **Nome:** como você quer ser chamado (aparece em cada aposta)
- **E-mail:** qualquer e-mail seu
- **Senha:** mínimo 6 caracteres

**5.** Clique em **Criar conta**

**6.** Você entra direto. Sem e-mail de confirmação, porque você desligou isso no passo 1.4.

## 5.2 — Conferir a banca

**1.** No menu, clique em **Ajustes**

**2.** Confira:
- **Banca inicial:** R$ 4.800,00
- **Meta de lucro:** 2% → mostra `+R$ 96,00`
- **Stop loss:** 3% → mostra `−R$ 144,00`

**3.** Confira os stakes:
- Alta 1,75% → R$ 84,00
- Média 0,50% → R$ 24,00
- Baixa 0,25% → R$ 12,00

**4.** Se mudar alguma coisa, clique em **Salvar alterações**

## 5.3 — Cadastrar as casas

**1.** No menu, clique em **Casas**

**2.** Clique em **Nova**

**3.** Preencha nome, link do site, login e senha

**4.** Clique em **Salvar**

**5.** Repita para cada casa que você usa

## 5.4 — Adicionar a outra pessoa

**1.** Mande o link do app para ela

**2.** Ela abre, clica em **Criar conta**, preenche nome, e-mail e senha

**3.** Pronto

Vocês dois veem a mesma banca, as mesmas apostas, as mesmas casas. Mas cada aposta fica registrada no nome de quem cadastrou, e o relatório separa por pessoa.

---

# PARTE 6 — Colocar o ícone no celular

O app vira um ícone na tela inicial, igual a um aplicativo de verdade.

## Android (Chrome)

1. Abra o link no Chrome
2. Toque nos **três pontinhos** no canto superior direito
3. Toque em **Adicionar à tela inicial**
4. Confirme

## iPhone (Safari)

1. Abra o link no **Safari** (tem que ser o Safari)
2. Toque no botão de **compartilhar** (quadrado com seta pra cima, embaixo)
3. Role para baixo e toque em **Adicionar à Tela de Início**
4. Confirme

---

# Como usar o app no dia a dia

## Registrar uma aposta

**1.** Clique no botão verde **Nova aposta**

**2.** No topo aparece a caixa **Preencher automático**

### Jeito rápido: o print

**1.** **Escolha a stake** nos botões: Cheia, Média ou Baixa

**2.** Tire o print do bilhete na casa de aposta

**3.** Copie a imagem
- **Computador:** `Win + Shift + S` recorta a tela e já copia
- **Celular:** print normal, depois toque na caixa do app e escolha da galeria

**4.** Dentro do app, aperte **`Ctrl + V`**

**5.** Espere 3 a 5 segundos

**6.** **Evento** e **odd** aparecem preenchidos

**7.** **Confira** e clique em **Registrar aposta**

### 🛑 O print nunca mexe na sua stake

Mesmo que o bilhete mostre que você apostou R$ 150, o app mantém o valor que você escolheu nos botões.

A stake é decisão sua. Ela vem sempre do percentual da banca, nunca do print.

Do bilhete saem só três coisas: **o evento**, **a odd** e **o nome da casa**.

### Como saber se leu bem

Olhe a mensagem verde que aparece embaixo da caixa:

| Mensagem | Significa |
|---|---|
| **"Lido pela IA (Gemini)"** | Confiável. Dê uma olhada rápida e salve. |
| **"Lido no seu aparelho"** | O leitor local entrou. **Confira número por número.** |

### Se o print não funcionar

Nada trava. Os campos ficam livres para você preencher na mão.

Clicando num card de stake no Painel, o valor já vem preenchido. Aí é só digitar a odd e o evento.

### O link

Você pode colar o link de compartilhar do bilhete e clicar em **Ler**.

⚠️ **Isso falha na maioria das casas.** Bet365, Betano e Superbet montam a página por JavaScript e bloqueiam robôs. Quando falha, o app te avisa e você usa o print. **Não é defeito do app.**

## O código de cada aposta

Toda aposta ganha um código curto e único, tipo **K3F9**. Quatro caracteres, sem as letras `I` e `O` nem os números `0` e `1`, que se confundem na leitura.

Ele aparece do lado do nome. **Clique nele para copiar.**

Serve para você falar da aposta com a outra pessoa sem descrever o jogo inteiro: *"a K3F9 deu green"*. E serve para achar na busca.

## O nome da aposta

**Não existe campo de nome.** Ele sai sozinho do evento.

Se o evento for **"Flamengo x Palmeiras — Mais de 1.5 gols"**, a aposta aparece na lista como **Flamengo x Palmeiras**.

Se o evento ficar vazio, ela nasce como **Aposta K3F9**, usando o código dela.

### O código nunca muda

Você pode corrigir o evento depois. O nome acompanha.

Mas o **código** é dela para sempre. E o **dono** também.

Isso não é só uma trava de tela. O banco de dados **recusa** qualquer tentativa de alterar esses dois campos, mesmo vindo de fora do app.

## Resolver sem abrir a aposta

Nas apostas **abertas**, botões aparecem direto na linha:

| Botão | O que faz |
|---|---|
| **✓** verde | marca como Green |
| **✕** vermelho | marca como Red |
| **⋯** cinza | abre Anulada e Cashout |

Clicar neles **não abre** o detalhe. A confirmação com o valor em reais aparece igual.

Para ver tudo da aposta, clique em qualquer outro ponto da linha.

## Resolver uma aposta

**1.** Vá no **Painel** ou em **Apostas**

**2.** Clique na linha da aposta. Ela abre.

**3.** Clique num dos botões:

| Botão | Quando usar |
|---|---|
| **Ganhou** | bateu, lucro = valor × (odd − 1) |
| **Perdeu** | perdeu a stake inteira |
| **Anulada** | jogo adiado, aposta devolvida, resultado zero |
| **Cashout** | você encerrou antes. Ele pergunta quanto você recebeu. |

**4.** Aparece uma confirmação mostrando **quanto aquilo muda no dia**, em reais, antes de você confirmar.

No cashout, você digita o valor recebido e vê o resultado calculado na hora, antes de salvar.

Enquanto a aposta está **Aberta**, ela **não entra em nenhum cálculo**.

## Apostas em formato de bilhete

Uma aposta pode ser simples (uma seleção) ou múltipla (várias no mesmo bilhete).

Ao cadastrar, cada seleção é uma "perna", com confronto, mercado, escolha, odd e a data do jogo. O botão "Adicionar seleção" transforma a aposta numa múltipla. Com mais de uma perna, o app mostra a odd combinada calculada, mas quem manda é a odd que você informa.

**A odd do bilhete.** O número que vale é o que a casa mostra no print. Quando você lê um bilhete pela IA, ela pega essa odd total exatamente como está lá. O cálculo das pernas multiplicadas aparece só como referência, porque as casas costumam arredondar. Você pode editar a odd a qualquer momento.

**Lendo o print.** No cadastro, cole ou arraste o print do bilhete. A IA lê e preenche as seleções, a casa e a odd. Cada casa escreve de um jeito, então confira antes de salvar: a leitura é um rascunho que você aprova.

**Resolvendo.** Você marca o bilhete inteiro de uma vez: green, red, cashout ou anulada. Numa múltipla, se qualquer perna falhou, o bilhete é red. O app não precisa saber qual perna caiu, o resultado é seu.

**Vendo o bilhete.** Fechado, a aposta mostra o básico: nome, odd, valor, casa, código. Uma múltipla ganha um selo com o número de seleções. Ao abrir, aparece o bilhete completo, com cada perna, a odd total e o ganho potencial.

## Banca, Caixa e Patrimônio: três coisas diferentes

Isto é o coração do app. Vale ler devagar.

**A banca** é uma régua. R$ 4.800 que existem só para calcular quanto apostar: stake cheia é 1,75% disso. Ela é fixa. Só muda quando você mexe em Ajustes. Depósito e saque não a tocam. Assim suas stakes e metas ficam estáveis.

**O resultado do dia** é quanto você ganhou ou perdeu apostando. Só isso. Depósito e saque nunca entram aqui.

**O patrimônio** é quanto dinheiro você tem, somando tudo: o que está parado na conta do banco mais o que está em cada casa.

### A ideia que resolve tudo

Quando você tira R$ 50 da conta e deposita numa casa, seu patrimônio **não muda**. O dinheiro só trocou de bolso. Continua seu, só que agora está na casa.

Ele só se move quando você **ganha** (sobe) ou **perde** (cai) uma aposta.

Por isso as três coisas são separadas. Se a banca subisse a cada depósito, suas stakes dançariam o dia todo. Se o depósito contasse como lucro, sua meta viraria mentira.

### Como usar

Em **Ajustes**, informe quanto tem parado na conta do banco. Ao depositar numa casa, baixe esse número. Ao sacar, aumente. O patrimônio total fica igual, porque o dinheiro só andou.

O **Painel** mostra um resumo do patrimônio. A aba **Patrimônio** mostra o detalhe: quanto em cada casa, quanto na conta, e o total.

## A aba Caixa

Aqui você registra o dinheiro que entra e sai das casas.

### Registrar

**1.** Clique em **Depósito** ou **Saque**

**2.** Escolha a casa. Só aparecem as que você cadastrou em **Casas**.

**3.** Digite o valor, escolha o método (PIX, Cartão, Boleto...)

**4.** Salve

O movimento fica automaticamente **no nome de quem está logado**. Igual às apostas.

### Caixa por casa

Uma estimativa de quanto dinheiro está dentro de cada casa agora:

```
depósitos − saques + lucro das apostas resolvidas naquela casa
```

Apostas abertas não contam. Elas ainda não mexeram no seu dinheiro.

### 🛑 Depósito e saque não são lucro

Isso é importante. Se você depositar R$ 1.000 hoje, o **resultado do dia continua R$ 0,00**.

Depositar não é ganhar. Sacar não é perder. É o seu dinheiro trocando de lugar.

Por isso a meta de 2% e o stop loss de 3% **ignoram** completamente esses movimentos. Eles medem só o que você ganhou ou perdeu apostando.

O **Painel** mostra o total depositado e sacado num card separado, longe do medidor do dia.

### Filtros

- **Busca** — casa, pessoa, método ou observação
- **Atalhos** — Tudo · Hoje · 7 dias · 30 dias · Depósitos · Saques
- **Mais filtros** — usuário, casa, método, intervalo de datas, faixa de valor

## Buscar e filtrar

Na aba **Apostas**:

- **Barra de busca** — procura por código, nome, evento, observação ou nome da casa
- **Atalhos** — Tudo · Hoje · 7 dias · 30 dias
- **Mais filtros** — usuário, status, casa, intervalo de datas, faixa de odd, faixa de valor

O número verde no botão **Mais filtros** mostra quantos estão ativos. **Limpar** apaga todos de uma vez.

Os totais embaixo (investido, resultado, ROI) sempre refletem **o que está filtrado**, não a banca inteira.

## O ícone da casa

Ao cadastrar uma casa com link, o app puxa o ícone do site sozinho.

Ele aparece na lista de casas, na linha de cada aposta e no formulário. Se o site não tiver ícone, mostra a inicial do nome.

Quer usar outra imagem? No modal da casa, clique em **Trocar** e cole o endereço da imagem.

## Ler o Painel

O **medidor de faixa** é a peça central.

- À **esquerda**, a linha vermelha do stop loss: `−R$ 144,00`
- No **meio**, o zero
- À **direita**, a linha verde da meta: `+R$ 96,00`
- O **marcador escuro** mostra onde o dia está agora

As **setinhas fantasma** aparecem quando você tem apostas abertas. Elas mostram onde o dia termina se todas ganharem, e se todas perderem.

Quando você bate a meta ou o stop, aparece uma faixa colorida no topo mandando parar.

---

# Como alterar o app depois

Digamos que você queira mudar uma cor, um texto, qualquer coisa.

**1.** Abra o GitHub, entre no repositório `banca-app`

**2.** Navegue até o arquivo que quer mudar

**3.** Clique no ícone de **lápis** (Edit)

**4.** Faça a alteração

**5.** Role até o fim, escreva uma mensagem tipo `mudei a cor` e clique em **Commit changes**

**6.** A Vercel republica sozinha em 2 minutos

Não precisa fazer mais nada. Toda vez que o código muda no GitHub, a Vercel atualiza o site.

---

# Domínio próprio (opcional)

Se quiser `suabanca.com.br` em vez de `banca-app-xyz.vercel.app`:

**1.** Compre o domínio em `https://registro.br` (cerca de R$ 40 por ano)

**2.** Na Vercel: abra o projeto → **Settings** → **Domains** → **Add**

**3.** Digite o domínio e confirme

**4.** A Vercel vai mostrar dois endereços de DNS

**5.** Entre no painel do Registro.br, procure **Alterar servidores DNS**, e cole os dois

**6.** Espere. Pode levar de 1 a 24 horas.

---

# Quando der errado

## A tela fica branca, ou aparece "Faltam as variáveis"

As chaves na Vercel estão erradas ou faltando.

**1.** Vercel → seu projeto → **Settings** → **Environment Variables**

**2.** Confira se as duas do Supabase estão lá, com nome exato e valor completo

**3.** Corrija o que estiver errado

**4.** Faça o **Redeploy** (veja abaixo como)

## Como fazer Redeploy

🛑 **Salvar uma variável não atualiza o site.** Você precisa republicar. Todo mundo esquece disso.

**1.** No menu do topo do projeto, clique em **Deployments**

**2.** A **primeira linha da lista** é a mais recente. Tem bolinha verde e a palavra **Ready**.

**3.** No canto **direito dessa linha**, clique nos três pontinhos `⋯`

**4.** Clique em **Redeploy**

**5.** Vai abrir uma janela de confirmação

**6.** Se tiver uma caixinha escrita **Use existing Build Cache**, **DESMARQUE**

**7.** Clique em **Redeploy**

**8.** Espere de 1 a 3 minutos, até a bolinha ficar verde de novo

**9.** Abra o site e atualize com `Ctrl + Shift + R`

## "E-mail ou senha incorretos" na primeira vez

Você clicou em **Entrar**, mas ainda não tem conta.

Clique em **Não tem conta? Criar agora**.

## "Confirme o e-mail antes de entrar"

Você pulou o passo **1.4**. Volte lá e desligue **Confirm email**.

Depois disso, tente entrar de novo. Não precisa refazer nada.

## Erro no SQL: "already member of publication"

A mensagem completa é assim:

```
ERROR: 42710: relation "apostas" is already member of publication "supabase_realtime"
```

**Não é problema.** Você rodou o SQL duas vezes. Na primeira vez deu certo, e na segunda o banco reclamou que a tabela já estava registrada.

**Tudo que vem antes dessa linha já rodou.** As tabelas existem.

**O que fazer:** confira no **Table Editor** se as quatro tabelas estão lá (`apostas`, `casas`, `config`, `profiles`). Se estiverem, ignore o erro e siga para o passo 1.4.

> A versão nova do `schema.sql` já corrige isso. Pode rodar quantas vezes quiser.

## Outros erros vermelhos no SQL

Se aparecer qualquer coisa **diferente** de `already exists` ou `already member of`, você provavelmente copiou o arquivo pela metade.

Apague tudo da caixa, abra o `schema.sql` de novo, `Ctrl + A`, `Ctrl + C`, cole e rode de novo.

## A aposta não salva

O SQL não rodou inteiro.

**1.** Volte no Supabase → **SQL Editor** → **New query**

**2.** Cole o `schema.sql` **completo** de novo

**3.** Clique em **Run**

Rodar duas vezes não causa problema.

## A leitura do print sempre diz "Lido no seu aparelho"

A chave do Google não chegou na Vercel. Confira nesta ordem:

**1. Você fez o Redeploy depois de salvar a variável?**
Salvar não basta. Faça o Redeploy.

**2. O nome está exato?**
Tem que ser `GOOGLE_API_KEY`. Nem `GOOGLE_APIKEY`, nem minúsculo, nem com hífen.

Para corrigir: clique nos três pontinhos ao lado da variável → **Edit** → arrume → **Save** → **Redeploy**.

**3. As três caixinhas estão marcadas?**
Ao editar a variável, tem que estar marcado **Production**, **Preview** e **Development**. Se Production não estiver marcada, o site publicado não enxerga a chave.

**4. Colou espaço junto com a chave?**
Edite a variável, apague o valor inteiro, cole de novo com atenção, salve, Redeploy.

## "Limite gratuito do Gemini atingido"

Você fez muitas leituras seguidas. Espere um minuto.

Enquanto isso, o app já usa o leitor do aparelho sozinho. Nada trava.

## "Modelo não existe" ou erro 404 na leitura

O Google mudou o nome do modelo. Adicione **mais uma** variável na Vercel:

- **Key:** `GEMINI_MODELO`
- **Value:** o nome atual, que você vê em `https://ai.google.dev/gemini-api/docs/models`

Salve e faça **Redeploy**.

## O leitor do aparelho demora muito na primeira vez

Normal. Ele baixa o dicionário de português, uns 15 MB, na primeira leitura.

Depois disso fica rápido, e funciona até sem internet.

## O leitor do aparelho errou a odd ou o valor

Recorte o print deixando **só o bilhete**, sem o resto da tela do celular.

E confira sempre. A mensagem **"Lido no seu aparelho"** existe justamente para te lembrar que aquele caminho erra mais.

## A Vercel diz "No Next.js version detected"

Você arrastou a pasta `banca-app` inteira para o GitHub, em vez do conteúdo dela.

**1.** Apague o repositório no GitHub: **Settings** → role até o fim → **Delete this repository**

**2.** Refaça a [Parte 3](#parte-3--subir-o-código-github), arrastando o **conteúdo** da pasta

## Os três erros mais comuns

Se travou e não sabe onde, confira esses três primeiro:

1. **Esqueceu o Redeploy.** Salvar variável não publica.
2. **Nome de variável errado.** Tem que ser idêntico, maiúsculo, com underline.
3. **Espaço colado junto com a chave.**

---

# Rodar no seu computador (opcional)

Isso é só se você quiser testar antes de publicar. **Não é necessário.** Precisa do Node.js instalado.

```bash
npm install
cp .env.local.example .env.local
```

Abra o arquivo `.env.local` e cole suas chaves. Depois:

```bash
npm run dev
```

Abra `http://localhost:3000`.

---

# Sobre segurança

## As senhas das casas

Ficam guardadas **em texto simples** no banco, como você pediu.

Quem tiver conta no app consegue ver. Quem tiver acesso ao painel do Supabase também.

Isso funciona para duas pessoas que confiam uma na outra. **Não use para nada além disso.**

## O acesso aos dados

Só quem está logado enxerga qualquer coisa. Isso é garantido pelo banco de dados, não pelo app.

Mesmo que alguém descubra a chave `anon` no código do site, sem login não vê absolutamente nada.

## A chave do Google

Ela fica **no servidor**, nunca no navegador. Ninguém consegue roubar ela olhando o código do site.

## Quem pode criar conta

**Qualquer pessoa com o link.** Não existe convite nem aprovação.

Se você mandar o link no grupo errado do WhatsApp, a pessoa cria conta e vê tudo, inclusive as senhas das casas.

**Guarde o link.**
