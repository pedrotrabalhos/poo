# Interface web

Aplicação React e TypeScript com Vite e Bun, integrada à API Spring de estoque de
veículos. A interface segue o design system do projeto local
`~/www/xyz/quadro`, com a abordagem de **app-header**, mantendo o tema neutro `b0`.

## Executar

Na raiz do repositório, inicie o backend:

```bash
./scripts/mvn spring-boot:run
```

Em outro terminal:

```bash
cd web
bun install --frozen-lockfile
bun run dev
```

Abra **http://localhost:5173**. A API padrão é `http://localhost:8080`.
Para alterá-la, copie `.env.example` para `.env.local`, ajuste
`VITE_API_BASE_URL` e reinicie o Vite. As variáveis `VITE_*` são públicas: as
credenciais do PostgreSQL ficam exclusivamente no backend.

## Interface e design system

- Cabeçalho em duas linhas, navegação por abas e conteúdo no painel `Inset`, que
  possui rolagem própria; sem sidebar ou identidade de produto inventada.
- Fontes Plus Jakarta Sans e IBM Plex Sans, como no Quadro, hospedadas localmente.
- Tema neutro preservado, com cores semânticas e suporte aos tokens claros/escuros.
- Superfícies planas, sem cartões ou sombras para agrupar seções.
- Ícones semânticos em `@/icons`, com contrato validado pelo TypeScript. Somente
  `icons/lucide.ts` importa a biblioteca de ícones.
- Filtros em menus e popover, com controles de 32 px e chips com o mesmo padrão.
- Textos, rótulos, estados vazios, ações e erros em português brasileiro.

As regras adaptadas e as referências consultadas estão em [DESIGN.md](DESIGN.md).

## Funcionalidades

CRUD de marcas, modelos, configurações e unidades físicas; filtros combináveis,
paginação, edição de preço/quilometragem/situação, marcação de venda e exclusão com
confirmação. Os totais de estoque consideram todas as configurações, sem depender
dos filtros aplicados. Os preços são exibidos em reais, sem conversão do valor
numérico armazenado no backend.

## Organização

| Pasta | Responsabilidade |
| --- | --- |
| `src/atoms` | Botões, campos, badges e outros elementos básicos |
| `src/molecules` | Diálogos, tabelas, menus, busca e componentes compostos |
| `src/organisms` | Navegação compartilhada |
| `src/layouts` | `HeaderLayout` e painel `Inset` |
| `src/icons` | Contrato de ícones semânticos e provedor |
| `src/features/inventory` | Formulários, filtros, tabela e tipos do estoque |
| `src/lib` | Cliente HTTP, carregamento do catálogo e mensagens de erro |

O frontend e o backend compartilham o repositório, com builds independentes.
O Maven não executa o Bun e não inclui `web/dist` no JAR.

## Build e testes

```bash
bun run build
bunx playwright install chromium
bun run test:e2e
```

O build valida TypeScript e o contrato dos ícones e gera os arquivos em `dist/`.
Os testes iniciam seu próprio Spring em **18080**, com o banco
`vehicle_inventory_test`, e seu próprio Vite em **5174**. Essas portas precisam
estar disponíveis; a aplicação de desenvolvimento em 5173 é preservada.

Os testes criam registros com identificadores únicos, verificam o CRUD, filtros,
validação e conflitos em português, exclusão, layout mobile e recuperação de
conexão; ao terminar, excluem apenas os registros que criaram. Capturas de tela
ficam em `test-results/`, ignorado pelo Git.

Para visualizar o build, use `bun run preview`. A porta padrão é 4173; inclua essa
origem no `CORS_ALLOWED_ORIGINS` do backend caso queira conectar a prévia à API.
