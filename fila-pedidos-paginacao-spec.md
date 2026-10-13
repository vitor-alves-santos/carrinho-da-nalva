# Spec — Paginação na Fila de Pedidos (aba Histórico)

> Documento de especificação. **Nenhuma alteração de código foi feita ainda.**
> Origem: pedido "adicione paginação na Fila de Pedidos", refinado por entrevista.

---

## 1. Objetivo

Adicionar paginação **apenas à aba "Histórico"** da tela Fila de Pedidos
(`/admin/fila`), com **paginação no servidor**, 20 itens por página, estado da
página na URL, contagem total e filtro de mesa aplicado no servidor.

As abas do dia (**Pendentes**, **Entregues**, **Cancelados**) permanecem
**exatamente como estão**.

### Por que só o Histórico

O Histórico é a única lista que **cresce sem limite** (tudo o que é anterior a
hoje, para sempre). As abas do dia são recortadas por "hoje" e têm tamanho
naturalmente limitado. Além disso, o caminho de dados de "hoje" alimenta a
detecção de **novo pedido** (som + notificação), que é o código mais sensível da
tela — paginá-lo exigiria redesenhá-lo.

---

## 2. Contexto atual (levantado no código)

### Arquivos relevantes

| Arquivo | Papel |
|---|---|
| `src/app/admin/fila/page.tsx` | Tela (client component). Contém abas, busca, polling e cartões. |
| `src/app/api/pedidos/route.ts` | `POST` cria pedido; `GET` lista pedidos (hoje ou histórico). |
| `src/app/api/pedidos/[id]/route.ts` | `PUT` atualiza status. |
| `src/types/pedido.ts` | `Pedido`, `OrderStatus = "Pendente" \| "Entregue" \| "Cancelado"`. |
| `src/components/AdminNav.tsx` | Barra de atalhos (não afetada por este spec). |

### Como funciona hoje

- **Abas**: `pendentes`, `entregues`, `cancelados`, `historico`.
- **Dados do dia**: `fetchPedidos()` → `GET /api/pedidos` (polling a cada 10s).
  Retorna um **array puro** `Pedido[]`, já filtrado no servidor para "hoje"
  (fuso America/Sao_Paulo), ordenado por `createdAt: -1`.
- **Histórico**: `fetchHistorico()` → `GET /api/pedidos?history=true`. Retorna um
  **array puro** `Pedido[]` de tudo o que é anterior a hoje, `createdAt: -1`.
  Só é buscado quando o usuário clica na aba Histórico (`onClick`).
- **Detecção de novo pedido** (som + notificação de navegador): compara a lista
  completa anterior com a atual via `JSON.stringify` em `prevDataStr`. **Só se
  aplica ao caminho de hoje.**
- **Filtro de mesa** (`filterMesa`): filtro **no cliente** por
  `pedido.mesa.toLowerCase().includes(...)`, aplicado a `pedidos` e a
  `pedidosHistorico`.
- **Agrupamento**: o Histórico é agrupado no cliente por `"<mês> de <ano>"`
  (`toLocaleString("pt-BR", { month: "long" })`), em ordem decrescente.
- **Renderização**: cada aba vive dentro de um `<ScrollArea>`; os cartões usam
  `framer-motion` (`layout`, `AnimatePresence`).
- **Não há paginação em lugar nenhum** e a API não aceita `page`/`limit`.

### Consumidores de `GET /api/pedidos`

Confirmado por busca no código: **apenas** `src/app/admin/fila/page.tsx`
(linhas 63 e 102). `POST /api/pedidos` é usado por `src/app/pedido/page.tsx`.
Portanto alterar o ramo `history=true` tem baixo risco de regressão externa.

---

## 3. Escopo

### Dentro do escopo

- Paginação no **servidor** para o ramo `history=true` de `GET /api/pedidos`.
- Controles de paginação **inline** na página da Fila (sem componente novo).
- Estado da página na **URL** (`?page=N`).
- **Contagem total** vinda do servidor.
- Filtro de mesa do Histórico movido para o **servidor**, com **debounce** e
  reset para a página 1.
- Ajuste automático para a **última página válida**.
- Manutenção do **agrupamento por mês/ano** com repetição de cabeçalho.
- Verificação de existência de **índice** em `createdAt` (somente relatar).

### Fora do escopo

- Paginar Pendentes / Entregues / Cancelados.
- Qualquer alteração em `fetchPedidos` (caminho de hoje), no polling de 10s, ou
  na lógica de som/notificação de novo pedido.
- Criar índice no MongoDB (decidido: apenas verificar e reportar).
- Adicionar infraestrutura de testes automatizados.
- "Carregar mais" / scroll infinito.
- Números de página clicáveis.

---

## 4. Decisões tomadas (da entrevista)

| # | Decisão | Escolha |
|---|---|---|
| D1 | Escopo das abas | **Apenas Histórico** |
| D2 | Onde paginar | **Servidor** (só no ramo `history=true`) |
| D3 | Itens por página | **20** |
| D4 | Filtro de mesa | **Servidor, só no Histórico** (abas do dia seguem no cliente) |
| D5 | Atualização | Buscar **ao clicar na aba** e **ao trocar de página**; sem auto-refresh e sem botão dedicado |
| D6 | Agrupamento mês/ano | **Manter**, **repetindo o cabeçalho** do mês quando ele continua na página seguinte |
| D7 | Controles | **Anterior / Próxima + "Página X de Y"** (aprovado por recomendação) |
| D8 | Estado da página | **Na URL** (`?page=2`) |
| D9 | Contagem total | **Sim**, contagem no servidor |
| D10 | Rolagem ao paginar | **Manter a posição** (não volta ao topo) |
| D11 | Filtro + página | **Resetar para a página 1** e **aguardar** o usuário parar de digitar (debounce) |
| D12 | Página inválida | **Ajustar para a última página válida** |
| D13 | Índice Mongo | Apenas **verificar e reportar** |
| D14 | Contrato da API | **Envelope só quando `history=true`** (aprovado por recomendação) |
| D15 | Componente | **Inline** na página da Fila |
| D16 | Verificação | **tsc + lint + build** + **checklist manual** para o usuário testar |
| D17 | Mobile | Controles **compactos em uma linha** |

### Justificativas registradas

- **D2 (servidor)**: paginar no cliente continuaria baixando o histórico inteiro,
  justamente na aba que mais cresce — ganho quase nulo.
- **D4 (filtro no servidor só no Histórico)**: com paginação, filtrar no cliente
  mostraria "nenhum resultado" mesmo existindo pedidos daquela mesa em outras
  páginas — **resultado incorreto**, não apenas UX. Manter as abas do dia no
  cliente evita tocar em `fetchPedidos` (usado pela detecção de novo pedido).
- **D5 (sem auto-refresh)**: histórico é dado de arquivo; muda apenas quando o dia
  vira. Poll seria requisição desperdiçada e poderia causar salto de conteúdo.
- **D7 (Anterior/Próxima)**: combinado com o total (D9) e a URL (D8), já dá
  orientação completa. "Carregar mais" quebraria o modelo "Página X de Y",
  tornaria a posição desconhecida e faria o DOM crescer sem limite.
- **D14 (envelope só no histórico)**: preserva intacto o caminho de hoje, que
  alimenta som/notificação. O custo (dois formatos) é previsível porque é
  determinado por um parâmetro explícito.

### Consequências aceitas conscientemente

- **D10 (manter rolagem)**: ao trocar de página, o conteúdo muda mas a posição
  vertical permanece — o usuário pode cair no **meio** da nova página em vez de
  vê-la desde o início.
- **D14**: `GET /api/pedidos` passa a ter dois formatos de resposta (array puro no
  "hoje"; envelope no histórico).
- **D3 + D6**: um mês pode ser dividido entre páginas; o cabeçalho se repete,
  então o mês aparece mais de uma vez na navegação entre páginas.
- **Skip/limit**: exigido por D7+D8+D9 (posição e total). Páginas muito
  profundas ficam progressivamente mais lentas sem índice (ver D13/§8).

---

## 5. Design — API

### `GET /api/pedidos`

Parâmetros de query:

| Param | Aplica-se a | Padrão | Regras |
|---|---|---|---|
| `history` | ambos | ausente | `"true"` → histórico (anterior a hoje) |
| `page` | só `history=true` | `1` | inteiro ≥ 1; inválido → `1` |
| `limit` | só `history=true` | `20` | inteiro 1..100; inválido → `20` |
| `mesa` | só `history=true` | ausente | busca **parcial** e **case-insensitive** |

Comportamento:

- **Caminho de hoje (`history` ausente/diferente de `true`)**: **inalterado**.
  Ignora `page`/`limit`/`mesa`. Resposta: **array puro** `Pedido[]`.
- **Caminho do histórico (`history=true`)**:
  - `query` = `{ createdAt: { $lt: startOfToday }, ...(mesa ? { mesa: <regex> } : {}) }`
  - `total = countDocuments(query)`
  - `totalPages = Math.ceil(total / limit)` (quando `total === 0`, `totalPages = 0`)
  - `page` pedido é **clampado**: `pageEfetiva = totalPages === 0 ? 1 : Math.min(page, totalPages)`
  - `skip = (pageEfetiva - 1) * limit`
  - Busca: `.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray()`
  - Resposta (envelope):
    ```ts
    {
      items: Pedido[],
      total: number,
      page: number,        // página efetiva (já clampada)
      pageSize: number,    // limit usado
      totalPages: number,
    }
    ```
  - Devolver a `page` efetiva permite o front corrigir a URL quando o pedido era
    inválido (D12).

- **Regex de mesa**: montar com escape dos caracteres especiais do input do
  usuário (evitar injeção de regex), com flag `i`. Corresponde ao comportamento
  atual do cliente (`includes` case-insensitive).
- **Erros**: manter o padrão atual (`500` com `{ error }`).

### Tipos novos (sugestão)

Em `src/types/pedido.ts` (ou junto da rota):

```ts
export interface HistoricoPaginado {
  items: Pedido[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
```

---

## 6. Design — Front-end (`src/app/admin/fila/page.tsx`)

### Estado novo

- `historicoPage: number` — derivado da URL.
- `historicoTotal: number`
- `historicoTotalPages: number`
- `loadingHistory: boolean` — já existe, reaproveitado.
- Debounce do `filterMesa` (sugestão: **300 ms**).

### Sincronização com a URL

- Usar `useSearchParams()` + `useRouter()` de `next/navigation`.
- `?page=N` reflete a página do Histórico. **Omitir `page=1`** para manter a URL
  limpa.
- Regras:
  - Clicar na aba Histórico → busca a página indicada na URL (ou 1).
  - Trocar de página → `router.replace("?page=N")` (sem empilhar histórico do
    navegador) e buscar.
  - **Voltar/avançar do navegador** deve refletir na lista (fonte da verdade é a URL).
  - Ao mudar o filtro de mesa → resetar para `page=1` (remover o param).
  - Ao sair da aba Histórico, manter ou limpar o param é indiferente; sugestão:
    **limpar** para não poluir as outras abas.

### `fetchHistorico`

Nova assinatura (sugestão):

```ts
const fetchHistorico = useCallback(async (page: number, mesa: string) => {
  // GET /api/pedidos?history=true&page=..&limit=20&mesa=..
  // seta items, total, totalPages e ajusta a URL se `page` vier diferente do pedido
}, []);
```

- **Guardar contra resposta obsoleta** (race): descartar resposta se os
  parâmetros mudaram (ex.: comparar um `requestId`/`ativo` ou a chave
  `page+mesa`) — importante por causa do debounce e de cliques rápidos.
- Se `page` retornada ≠ `page` pedida → atualizar a URL.

### Render do Histórico

- **Agrupamento mantido** (D6): agrupar `items` da página por `"<mês> de <ano>"`,
  em ordem decrescente, com o divisor visual atual
  (`h-px bg-gray-200` + `uppercase tracking-wider`). Como a paginação pode
  cortar um mês, o cabeçalho **repete** na página seguinte quando o mês continuar.
- **Controles** (D7, D17) — inline, no fim da lista, uma linha compacta:
  ```
  [ Anterior ]   Página X de Y   [ Próxima ]
  ```
  - `Anterior` desabilitado em `page === 1` ou enquanto carrega.
  - `Próxima` desabilitado em `page === totalPages` (ou `totalPages === 0`) ou
    enquanto carrega.
  - Sem paginação quando `total === 0` (mostrar apenas o estado vazio).
  - Estilo: reaproveitar `Button variant="outline" size="sm"` (padrão do projeto).
- **Rolagem**: **não** rolar para o topo ao trocar de página (D10).
- **Cartões**: manter `OrderCard` como está (motion/AnimatePresence).

### Estados vazios / carregando

- Carregando: reaproveitar "Buscando histórico..." com spinner.
- Vazio com filtro ativo: mencionar a mesa (ex.: `Nenhum pedido no histórico para a mesa "<X>".`).
- Vazio sem filtro: manter "Nenhum pedido no histórico.".

### Intocado

- `fetchPedidos`, polling de 10s, `prevDataStr`, `playNotificationSound`,
  `showBrowserNotification`, `updateStatus`, abas do dia e o badge de Pendentes.

---

## 7. Casos extremos

| Caso | Comportamento esperado |
|---|---|
| `?page=99` (acima do fim) | Servidor devolve a **última página válida**; front atualiza a URL (D12). |
| `total === 0` | `totalPages = 0`, sem controles, estado vazio. |
| Última página incompleta | Mostra os itens restantes normalmente. |
| Filtro sem resultados | Estado vazio mencionando a mesa; `page` volta a 1. |
| Digitação rápida no filtro | Debounce; requisições em excesso evitadas; respostas obsoletas descartadas. |
| Troca de página durante carregamento | Botões desabilitados. |
| Virada do dia com a tela aberta | Registros migram de "hoje" para o Histórico; recarregar a aba Histórico resolve (sem auto-refresh). |
| `limit` absurdo na URL (ex.: 9999) | Clampado para 100 no servidor. |
| `page` não numérico | Cai para 1. |
| Acentuação/caixa no filtro | Match case-insensitive e parcial (ex.: "mesa 5" acha "Mesa 5"). |

---

## 8. Performance

- **Índice**: a consulta do histórico filtra por faixa de `createdAt` e ordena por
  `createdAt: -1`. Sem índice, páginas profundas (skip alto) ficam lentas.
  Ação acordada (D13): **verificar** se existe índice em `createdAt` na coleção
  `pedidos` e **reportar ao usuário**, sem criar nada.
- **`countDocuments`** roda a cada requisição paginada; aceitável no volume atual.
- **Skip/limit** é consequência direta de D7+D8+D9 (posição + total). Se o volume
  crescer muito, avaliar cursor pagination — que exigiria abandonar "Página X de Y".

---

## 9. Critérios de aceitação

1. A aba **Histórico** mostra no máximo **20** pedidos por vez.
2. Os controles exibem **"Página X de Y"** com `Anterior`/`Próxima`, desabilitados
   nos limites e durante o carregamento.
3. A página atual aparece na URL como **`?page=N`** (`page=1` omitido), sobrevive
   ao **F5** e funciona com **voltar/avançar** do navegador.
4. Trocar de página **não** rola a lista para o topo.
5. O **total** exibido corresponde ao filtro ativo.
6. Digitar no filtro de mesa **reseta para a página 1**, com **debounce**, e o
   filtro é aplicado **no servidor** (encontra pedidos de qualquer página).
7. Página fora do intervalo é **corrigida para a última válida** e a URL é ajustada.
8. O **agrupamento por mês/ano** é mantido, com o cabeçalho **repetido** quando o
   mês continua na página seguinte.
9. As abas **Pendentes / Entregues / Cancelados** permanecem funcionalmente
   idênticas (inclusive o filtro no cliente).
10. **Som + notificação de novo pedido** continuam funcionando (polling de 10s
    intacto).
11. `GET /api/pedidos` **sem** `history=true` continua devolvendo **array puro**.
12. `pnpm tsc --noEmit`, `pnpm lint` e `pnpm build` terminam com **exit 0**.

---

## 10. Verificação (D16)

Sem infraestrutura de testes no projeto (0 arquivos de teste), a validação será:

1. `pnpm tsc --noEmit` → exit 0
2. `pnpm lint` → exit 0
3. `pnpm build` → exit 0, todas as rotas compiladas
4. **Checklist manual** entregue ao usuário para testar logado:
   - Abrir `/admin/fila` → aba Histórico → conferir 20 itens e "Página 1 de Y".
   - Navegar com Anterior/Próxima; conferir URL e que a rolagem não volta ao topo.
   - Recarregar (F5) e usar voltar/avançar do navegador.
   - Digitar uma mesa que só aparece em página distante → conferir que encontra.
   - Forçar `?page=999` → conferir correção para a última página.
   - Conferir que Pendentes/Entregues/Cancelados e o alerta sonoro não mudaram.
5. **Relatar** o resultado da checagem do índice em `createdAt`.

---

## 11. Riscos e limitações conhecidas

- **Dois formatos de resposta** em `GET /api/pedidos` (D14) — previsível, mas é
  uma dívida de contrato.
- **Rolagem preservada** pode posicionar o usuário no meio de uma página nova (D10).
- **Mês repetido** entre páginas por causa do agrupamento + tamanho fixo (D3/D6).
- **Sem índice**, páginas profundas podem ficar lentas — por isso a verificação (D13).
- **Sem testes automatizados**: a garantia vem de verificação estática + checklist
  manual, não de testes de comportamento.
- Não foi possível validar visualmente nas entrevistas; a tela exige login
  (Google OAuth).

---

## 12. Premissas e itens abertos

Premissas assumidas (ajustáveis):

- Debounce do filtro: **300 ms**.
- Nomes dos parâmetros: `page`, `limit`, `mesa`; envelope com `items`, `total`,
  `page`, `pageSize`, `totalPages`.
- Limite máximo de `limit`: **100**.
- Clicar na aba Histórico sempre rebusca a página atual (sem cache de páginas).
- Ao sair da aba Histórico, o param `page` é removido da URL.

A confirmar com o usuário se discordar de algum ponto acima.
