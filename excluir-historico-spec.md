# Spec — Exclusão de histórico (meses/anos anteriores)

> Documento de especificação. **Nenhuma alteração de código foi feita ainda.**
> Origem: pedido "fazer a funcionalidade de excluir o(s) mes(es)/ano(s) anterior",
> refinado por entrevista (5 rodadas, 19 perguntas).
>
> **Nota:** a paginação da aba Histórico (`fila-pedidos-paginacao-spec.md`) foi
> **adiada** para depois. Esta funcionalidade **não pode depender** dela; ver §11.

---

## 1. Objetivo

Permitir que o usuário **apague em definitivo** todo o histórico de pedidos
anteriores a um **mês limite** escolhido, a partir da aba **Histórico** da tela
Fila de Pedidos (`/admin/fila`).

Exemplo: escolhendo `julho de 2026`, apagam-se todos os pedidos com
`createdAt` anterior a `2026-07-01` (todos os status: Pendente, Entregue,
Cancelado), preservando o mês atual e os meses protegidos (ver §5).

O objetivo final é **conter o crescimento sem limite da coleção `pedidos`**.

---

## 2. Contexto atual (levantado no código)

### Arquivos relevantes

| Arquivo | Papel / situação |
|---|---|
| `src/app/admin/fila/page.tsx` | Aba Histórico agrupa `pedidosHistorico` por `"<mês> de <ano>"`. Busca via `fetchHistorico()` → `GET /api/pedidos?history=true`. |
| `src/app/api/pedidos/route.ts` | `POST` (criar) e `GET` (listar hoje/histórico). **Não checa sessão.** |
| `src/app/api/pedidos/[id]/route.ts` | Somente `PUT` (status). **Não checa sessão.** |
| `src/app/api/produtos/[id]/route.ts` | Tem `DELETE` **com checagem de sessão** (`auth()` → 401). **É o padrão a seguir.** |
| `src/app/admin/page.tsx` | Padrão de exclusão no front: `fetch(method: "DELETE")` + `AlertDialog` + `posthog.capture`. |
| `src/lib/mongodb.ts` | `connectToDatabase()` → banco `cardapio_tia_nalva`, cache de cliente. |

### Achados importantes

1. **Não existe `DELETE` para pedidos** — hoje só há criar, listar e mudar status.
2. **`GET`/`POST /api/pedidos` não exigem sessão.** Como a nova operação é
   **destrutiva em lote**, o novo endpoint **deve** exigir sessão.
3. **Corte de "hoje" por fuso horário**, na própria `route.ts`, calculado como
   `new Date("YYYY-MM-DDT03:00:00Z")` com `Intl.DateTimeFormat` de
   `America/Sao_Paulo` (UTC-3). A lógica está **duplicada** nos dois ramos do
   `GET`. Qualquer limite de exclusão precisa usar **exatamente** o mesmo fuso,
   senão pode apagar parte do dia atual.
4. A aba Histórico traz **todo** o histórico de uma vez (sem paginação), então a
   lista em memória é fonte útil para o seletor de meses.
5. O campo `filterMesa` filtra o histórico **no cliente** — hoje isso é inócuo
   para exclusão, mas vira armadilha (ver D13).

---

## 3. Escopo

### Dentro do escopo

- Novo endpoint `DELETE` e novo endpoint de **contagem** (`GET ...&count=true`).
- UI na aba Histórico: botão que abre um **painel** com seletor de mês limite.
- **Prévia** da contagem antes de excluir.
- **Confirmação** com palavra digitada (`EXCLUIR`).
- Exclusão **física** (`deleteMany`) com **checagem de sessão**.
- Recarga do histórico após a exclusão.

### Fora do escopo

- Paginação da aba Histórico (adiada — ver spec próprio).
- Exclusão seletiva (mes a mês, seleção múltipla, um ano inteiro à parte).
- Soft delete / desfazer.
- Registro em PostHog (**decidido: não registrar**).
- Novo conceito de papel/permissão (ex.: lista `ADMIN_EMAILS`) — só sessão.
- Excluir o mês atual ou o dia de hoje.

---

## 4. Decisões tomadas (da entrevista)

| # | Questão | Decisão |
|---|---|---|
| D1 | Granularidade | **Tudo anterior a um mês limite escolhido** |
| D2 | Onde fica a UI | **No topo da aba Histórico**, como **botão que abre um painel/accordion** |
| D3 | Quais status são apagados | **Todos** (Pendente, Entregue, Cancelado) |
| D4 | Tipo de exclusão | **Física** (`deleteMany` no Mongo) |
| D5 | Confirmação | **Modal com contagem + digitar palavra** |
| D6 | Prévia de impacto | **Sim**, buscar a contagem antes (endpoint dedicado) |
| D7 | Autenticação | **Sim**, exigir sessão (mesmo `auth()` usado pelos produtos) |
| D8 | Auditoria | **Não registrar** em PostHog |
| D9 | Seletor | **Só oferece meses anteriores ao atual** |
| D10 | Trava mínima | **Proteger os últimos 3 meses** |
| D11 | Palavra de confirmação | **`EXCLUIR`** (fixa) |
| D12 | Durante a exclusão | **Botão desabilitado + spinner** (requisição única) |
| D13 | Filtro de mesa ativo | **Desabilitar a exclusão** enquanto houver filtro |
| D14 | Endpoint de exclusão | **`DELETE /api/pedidos/historico?before=2026-07`** |
| D15 | Contagem | **Endpoint dedicado** de contagem |
| D16 | Opções do seletor | **Derivar dos meses que existem no histórico** |
| D17 | Histórico vazio | **Mostrar o controle desabilitado com texto explicativo** |
| D18 | Pós-exclusão | **Recarregar do servidor** |
| D19 | Verificação | **tsc + lint + build** + **checklist manual** |

---

## 5. Regras do limite de exclusão (o coração da segurança)

### 5.1 Semântica de `before`

`before=2026-07` significa: **apagar tudo estritamente antes de
`2026-07-01T00:00:00` em America/Sao_Paulo** — ou seja, até o último dia de
junho/2026 inclusive. **Não** inclui o próprio mês escolhido.

### 5.2 Conversão de fuso

O mês inicial em UTC (com a convenção já usada no projeto, UTC-3):

```
cutoff = new Date(`${ano}-${mes}-01T03:00:00Z`)
```

> **Recomendação de implementação:** extrair a lógica de fuso (que hoje está
> duplicada nos dois ramos do `GET`) para um helper compartilhado, ex.
> `src/lib/date-br.ts`, com `startOfToday()` e `startOfMonth(ano, mes)`. Isso
> evita que o limite da exclusão **discrepe** do corte de "hoje" e acabe apagando
> parte do dia corrente.

### 5.3 Três barreiras de proteção (defesa em profundidade)

| Camada | Regra |
|---|---|
| **UI** | O seletor só oferece meses elegíveis (D9 + D10). |
| **API** | Rejeita `before` que inclua o mês atual ou futuros (`400`). |
| **API** | Rejeita `before` dentro da janela protegida de 3 meses (`400`). |
| **Mongo** | A query **sempre** inclui `createdAt < startOfToday()`, mesmo que o `before` venha válido — nunca apaga o dia de hoje. |

**Janela protegida — definição operacional:**

Se o mês atual é `M`, os meses elegíveis são os de índice `≤ M - 3`.
Exemplo: hoje = `julho/2026` → elegíveis até `abril/2026` → escolhendo
`abril/2026`, apagam-se os pedidos **até março/2026**, preservando abril, maio e
junho (os 3 meses mais recentes).

> Premissa a confirmar: "proteger os últimos 3 meses" interpretado como **3
> meses de calendário completos antes do atual**. Se a intenção era "90 dias
> corridos", a regra muda (ver §13).

---

## 6. Design — API

### 6.1 `DELETE /api/pedidos/historico?before=YYYY-MM`

```
auth() → sem sessão: 401 { error: "Unauthorized" }
before ausente ou com formato inválido: 400 { error: "before inválido. Use YYYY-MM." }
before >= mês atual (America/Sao_Paulo): 400
before dentro da janela protegida (últimos 3 meses): 400
```

Execução:

```ts
const cutoff = startOfMonth(ano, mes);              // §5.2
const query  = { createdAt: { $lt: cutoff } };      // e $lt: startOfToday() na prática
const result = await db.collection("pedidos").deleteMany(query);
```

Resposta: `{ success: true, deletedCount: result.deletedCount }`

Erros de infra: `500 { error }` (padrão do projeto).

### 6.2 `GET /api/pedidos/historico?before=YYYY-MM&count=true`

Mesma validação e mesma proteção de sessão do `DELETE`.

Resposta:

```ts
{
  total: number,                     // quantos seriam apagados
  months: Array<{ month: string; count: number }>  // "2026-06", ordenado desc
}
```

Implementação sugerida: agregação com
`$dateToString: { format: "%Y-%m", date: "$createdAt", timezone: "America/Sao_Paulo" }`,
`$group` por mês e `$sort` decrescente.

> `months` é retornado porque a contagem vem do mesmo endpoint e **pode** alimentar
> o modal (faixa de meses afetados), mesmo que o usuário tenha pedido só a
> contagem. Mostrar a faixa "de jun/2024 a jun/2026" resolve ~90% dos casos sem
> lista longa.

### 6.3 Por que uma rota nova em vez de reutilizar `/api/pedidos`

- `/api/pedidos` já tem `POST` e `GET` com significados bem definidos; um
  `DELETE` ali ficaria ambíguo (apagar um pedido? um intervalo? o histórico todo?).
- A rota nova isola a operação destrutiva e facilita aplicar a checagem de
  sessão **só** a ela, sem tocar no caminho de listagem que alimenta a tela.

---

## 7. Design — Front-end (`src/app/admin/fila/page.tsx`)

### 7.1 Estado novo

```ts
const [painelExclusaoAberto, setPainelExclusaoAberto] = useState(false);
const [mesLimite, setMesLimite] = useState<string>("");        // "2026-07"
const [previa, setPrevia] = useState<{ total: number; months: {month:string;count:number}[] } | null>(null);
const [carregandoPrevia, setCarregandoPrevia] = useState(false);
const [excluindo, setExcluindo] = useState(false);
const [palavraConfirmacao, setPalavraConfirmacao] = useState("");
```

### 7.2 Origem das opções do seletor (D16)

Derivar dos meses que **existem** em `pedidosHistorico` (já agrupados na tela):

- Converter cada `createdAt` para `YYYY-MM` em `America/Sao_Paulo`.
- Manter apenas os meses **elegíveis** (anteriores ao atual **e** fora da janela
  protegida de 3 meses — §5.3).
- Ordenação decrescente (mais recente primeiro), coerente com a lista.

### 7.3 Botão e painel (D2, D17)

- Botão rotulado, ex.: **"Excluir histórico"**, no topo da aba Histórico, acima
  da lista e do filtro.
- Ao clicar → abre um painel (accordion) com:
  - Select do mês limite (opções elegíveis).
  - Texto do impacto exibido ao mudar a seleção: ex. `431 pedidos de jun/2024 a
    jun/2026 serão apagados` (vindo do endpoint de contagem).
  - Campo para digitar `EXCLUIR`.
  - Botão **Excluir** (perigo) — `variant="destructive"` do `Button`.
- Ao fechar o painel → limpar `mesLimite`, `previa` e `palavraConfirmacao`.

**Estados desabilitados do botão Excluir** (mostrar o porquê em texto):

| Condição | Motivo |
|---|---|
| `filterMesa` não vazio | D13 — a exclusão não deve interagir com o filtro |
| `pedidosHistorico` vazio | D17 |
| Nenhum mês elegível (histórico só tem meses protegidos) | D10 |
| `mesLimite` vazio | nada selecionado |
| `palavraConfirmacao !== "EXCLUIR"` | D11 |
| `excluindo === true` | D12 (evita duplo envio) |

> **D13 — detalhe:** a exclusão **ignora** o filtro de mesa (apaga o período
> inteiro, não só a mesa filtrada). Por isso, em vez de avisar ou respeitar o
> filtro, decidiu-se **bloquear** a operação até o campo estar vazio — evitando
> que o usuário ache que estava apagando só daquela mesa.

### 7.4 Fluxo de exclusão

1. Usuário abre o painel, escolhe o mês → `GET ...&count=true` → exibe prévia.
2. Digita `EXCLUIR` → habilita o botão.
3. Clica → `AlertDialog` de confirmação mostrando a contagem e a faixa de meses.
   (O modal é a última confirmação; o `EXCLUIR` já travou o botão.)
4. Confirma → `setExcluindo(true)`, botão desabilitado + spinner (D12).
5. `DELETE /api/pedidos/historico?before=...` → `2xx`.
6. `toast.success` com `deletedCount` → **recarregar o histórico do servidor**
   (D18) → fechar painel e limpar campos.
7. `4xx/5xx` → `toast.error` com a mensagem da API; manter o painel aberto.

### 7.5 Intocado

- `fetchPedidos`, polling de 10s, som/notificação de novo pedido.
- Cartões, abas, agrupamento por mês, filtro de mesa.

---

## 8. Casos extremos

| Caso | Comportamento esperado |
|---|---|
| `before` ausente / `abc` / `2026-13` | `400` com mensagem clara. |
| `before` = mês atual ou futuro | `400`. |
| `before` dentro dos últimos 3 meses | `400` (janela protegida). |
| Sem sessão | `401`. |
| Histórico vazio | Controle visível, **desabilitado**, com texto explicativo (D17). |
| Histórico só tem meses protegidos | Nenhum mês no seletor; controle desabilitado explicando a janela de 3 meses. |
| Usuário com filtro de mesa | Controle **desabilitado** (D13). |
| Período selecionado sem pedidos | `total: 0`; botão segue desabilitado ou avisa que não há nada a apagar. |
| Dois cliques rápidos em Excluir | Segundo envio bloqueado por `excluindo`. |
| Falha de rede / timeout | `toast.error`; painel permanece aberto; nada é apagado. |
| Exclusão gigante (>10s) | Pode estourar o tempo da Server Function — motivo de usar requisição **única e simples** (D12) e registrar a limitação (§12). |
| Usuário força a chamada pela URL | Bloqueado pelas 3 barreiras de §5.3. |
| Virada do dia com o painel aberto | A recarga do histórico (D18) reflete o estado real; se `before` deixou de ser elegível, o seletor revalida. |

---

## 9. Critérios de aceitação

1. Na aba **Histórico** há um botão que abre o painel de exclusão; as outras abas
   e o cardápio público não mudam.
2. O seletor oferece **apenas** meses existentes no histórico, anteriores ao
   atual e **fora** da janela protegida de 3 meses.
3. Ao escolher o mês, a tela mostra **quantos pedidos** e **de quais meses** serão
   apagados (vindo do servidor).
4. O botão Excluir só habilita quando o usuário digitar **exatamente** `EXCLUIR`.
5. Com o filtro de mesa preenchido, o controle fica **desabilitado**.
6. Sem histórico (ou sem meses elegíveis), o controle aparece **desabilitado com
   texto explicativo**.
7. O `DELETE` exige sessão e devolve **401** sem ela.
8. O `DELETE` **nunca** apaga pedidos do dia de hoje, mesmo que `before` inclua o
   mês atual (barreira de segurança).
9. Após sucesso, a lista do Histórico é **recarregada do servidor** e reflete a
   exclusão.
10. Erros (`400`/`401`/`500`) aparecem como `toast.error` e não deixam a tela
    inconsistente.
11. Nenhum evento é enviado ao **PostHog** por esta funcionalidade (D8).
12. `pnpm tsc --noEmit`, `pnpm lint` e `pnpm build` terminam com **exit 0**.

---

## 10. Verificação (D19)

Sem infraestrutura de testes no projeto (0 arquivos de teste), a validação será:

1. `pnpm tsc --noEmit` → exit 0
2. `pnpm lint` → exit 0
3. `pnpm build` → exit 0, todas as rotas compiladas
4. **Checklist manual** entregue para testar logado:
   - Abrir `/admin/fila` → aba Histórico → botão de exclusão.
   - Conferir que meses recentes **não** aparecem no seletor.
   - Escolher um mês elegível → conferir contagem e faixa de meses.
   - Tentar sem digitar `EXCLUIR` → botão deve ficar desabilitado.
   - Preencher o filtro de mesa → conferir que o controle desabilita.
   - Executar uma exclusão real → conferir toast e que a lista recarregou.
   - Tentar chamar `DELETE /api/pedidos/historico?before=<mês atual>` direto pela
     URL → esperar `400`.
   - Chamar `DELETE` sem sessão → esperar `401`.
   - Conferir que Pendentes/Entregues/Cancelados e o alerta sonoru continuam
     iguais.

> **Atenção:** a exclusão é **irreversível**. Recomendo testar em banco de
> desenvolvimento ou com backup antes de executar em produção.

---

## 11. Interação com a paginação (adiada)

- Esta funcionalidade **não pode** depender da paginação.
- O painel fica no **topo** da aba, acima da lista, então paginação futura não
  altera sua posição.
- Quando a paginação for implementada, a recarga pós-exclusão deve buscar a
  **página 1** (e corrigir a URL se a página atual deixar de existir).

---

## 12. Riscos e limitações conhecidas

- **Irreversível** (D4): sem desfazer, sem soft delete, sem auditoria no PostHog
  (D8). Não haverá como reconstruir o que foi apagado.
- **Exclusão gigante**: `deleteMany` único pode estourar o tempo de resposta da
  Server Function. O limite superior de 10 s vale para Server Functions do
  Vercel; acima disso, seria preciso trabalho em segundo plano ou lotes — fora do
  escopo desta versão (D12).
- **Sem índice em `createdAt`**, a contagem/agregação e a exclusão podem ficar
  lentas em coleções grandes.
- **Trava de 3 meses** é regra de negócio decidida na entrevista; se o histórico
  for usado para relatórios mais antigos, será preciso revisá-la.
- **`GET`/`POST /api/pedidos` continuam sem sessão** — apenas o novo `DELETE`
  foi protegido. Fechar isso em tudo é outro trabalho.

---

## 13. Premissas e itens abertos

Premissas assumidas (ajustáveis):

- **"Proteger os últimos 3 meses"** = 3 **meses de calendário completos** antes
  do atual (ex.: hoje jul/2026 → elegíveis até abr/2026). Se a intenção era
  **90 dias corridos**, a regra precisa ser ajustada.
- A **proteção de 3 meses** também é aplicada **no servidor** (não só na UI),
  coerente com o padrão de defesa em profundidade.
- Formato do parâmetro: `before=YYYY-MM`.
- Resposta da contagem: `{ total, months: [{ month, count }] }`.
- Textos de UI em **português**, reutilizando `Button`, `AlertDialog` e `toast`
  do projeto (padrão já usado para excluir produtos).
- Nome do evento **não** existe (D8) — deliberadamente.

A confirmar com o usuário se discordar de algum ponto acima.
