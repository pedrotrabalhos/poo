# Interface baseada no Quadro

Referências lidas no projeto local `~/www/xyz/quadro`:

- `interface/DESIGN.md` e a documentação de interface em `interface/CLAUDE.md`;
- `layouts/header-layout.tsx`, `layouts/inset.tsx` e `organisms/tab-bar.tsx`;
- `molecules/page-header.tsx`, `empty-state.tsx`, `toolbar-menu.tsx`,
  `search-field.tsx` e os componentes Base UI;
- `icons/contract.ts`, `icons/lucide.ts`, `icons/contract.check.ts`;
- A definição de fontes de `interface/theme.css`.

## Padrões adotados

1. O app-header tem duas linhas: contexto e ações acima, abas abaixo. O conteúdo
   ocupa o painel `Inset`, com bordas arredondadas, margens responsivas e rolagem
   própria. O cabeçalho permanece visível.
2. Cada página começa com `PageHeader`: título, descrição curta e ações reais à
   direita. Não há nome, marca, perfil ou organização fictícios.
3. Dentro do painel, as seções são planas. Apenas objetos, como tabelas e estados
   vazios, recebem uma borda. Sombras são reservadas a elementos flutuantes.
4. O tema neutro `b0` foi preservado. Os componentes usam tokens semânticos;
   superfícies novas são derivadas desses mesmos tokens. As cores azuis do Quadro
   não foram importadas.
5. Plus Jakarta Sans é a fonte principal, com IBM Plex Sans como fallback. As fontes
   são servidas pelo próprio build, sem requisições a provedores externos.
6. Todo ícone vem de `import * as Icon from '@/icons'`. Nomes representam conceitos
   (`Icon.Inventory`, `Icon.Edit`), o provedor escolhe os desenhos e `className`
   define o tamanho e a cor. O contrato é verificado no build.
7. Controles da toolbar têm 32 px, largura definida pelo conteúdo e rótulos claros.
   Filtros simples usam `ToolbarMenu`; filtros adicionais usam um popover com
   formulário. Campos de formulário não substituem menus da toolbar.
8. Filtros ativos usam chips no mesmo padrão dos botões. Filtros vazios mostram
   somente seu rótulo; opções como “Qualquer marca” existem apenas dentro do menu.
9. Skeletons ocupam a região que está carregando, com `role="status"`, nome
   acessível e `aria-busy`. Erros mantêm uma ação de recuperação disponível.
10. Os textos da interface e as mensagens apresentadas da API são em português
    brasileiro. Nomes, cores e especificações cadastrados pelo usuário são dados.
