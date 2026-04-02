# RELIC (Rare Editions & Legendary Items Collection)

Protótipo de marketplace para itens colecionáveis, raros e vintage, desenvolvido para a disciplina de **Interação Humano-Computador (IHC)**.

O projeto foi pensado para melhorar a experiência de compra e navegação de usuários interessados em **vinis, cartas, livros e jogos clássicos**, com foco em **usabilidade, feedback visual, prevenção de erros e clareza nas ações**.

## Visão geral

O **RELIC (Rare Editions & Legendary Items Collection)** foi criado para resolver um problema comum em marketplaces genéricos: a dificuldade de encontrar itens colecionáveis com informações claras sobre **estado**, **autenticidade**, **disponibilidade** e **segurança no processo de compra**.

A proposta da interface é oferecer uma navegação mais intuitiva, visualmente consistente e mais adequada ao nicho de colecionadores.

## Objetivo do projeto

Desenvolver uma interface digital para um marketplace de itens colecionáveis que seja:

- intuitiva
- eficiente
- segura
- visualmente consistente
- fácil de navegar

## Público-alvo

O projeto foi pensado principalmente para:

- jovens adultos entre 18 e 35 anos
- colecionadores de itens raros
- usuários interessados em vinis, cartas, livros e jogos clássicos
- pequenos vendedores e compradores de produtos colecionáveis

## Principais funcionalidades

- página inicial com destaques e navegação entre categorias
- páginas de categorias para `vinil`, `cartas`, `livros` e `jogos`
- página individual de produto
- sistema de login e cadastro
- página de perfil do usuário
- favoritos
- carrinho com persistência via `localStorage`
- finalização de compra
- tela de compra concluída
- histórico de pedidos
- busca com sugestões automáticas
- feedback visual para ações importantes
- tratamento de erros no login e no fluxo de compra
- modo claro e escuro

## Estrutura do projeto

```text
Projeto-IHC/
|-- index.html
|-- README.md
|-- assets/
|   |-- imagens dos produtos
|-- css/
|   |-- style.css
|-- html/
|   |-- entra.html
|   |-- perfil.html
|   |-- favoritos.html
|   |-- pedidos.html
|   |-- carrinho.html
|   |-- finalizar-compra.html
|   |-- compra-realizada.html
|   |-- produto.html
|   |-- vinil.html
|   |-- cartas.html
|   |-- livros.html
|   |-- jogos.html
|-- js/
|   |-- script.js
|   |-- products.js
|   |-- favoritos.js
```

## Fluxos implementados

### Fluxo principal

1. acessar a tela inicial
2. fazer login
3. pesquisar ou navegar por um item
4. abrir a página do produto
5. adicionar ao carrinho
6. acessar o carrinho
7. finalizar a compra

### Fluxo alternativo de erro

1. acessar a tela de login
2. inserir dados inválidos
3. receber feedback de erro
4. corrigir as informações
5. tentar novamente

## Estados do sistema

O protótipo contempla os principais estados de interação:

- `normal`
- `carregamento`
- `erro`
- `sucesso`

## Conceitos de IHC aplicados

Durante o desenvolvimento do projeto, foram trabalhados conceitos como:

- usabilidade
- affordances
- eficiência
- eficácia
- feedback do sistema
- prevenção e recuperação de erros
- consistência visual entre telas

## Teste de usabilidade

Foi realizado um mini teste de usabilidade com a tarefa:

> encontrar um item colecionável e adicioná-lo ao carrinho

### Resultados

- Participante 1
  - Tempo: `03:04`
  - Erros: `5`
  - Conclusão: `Sim`
  - Satisfação: `3,5 / 5`

- Participante 2
  - Tempo: `01:52`
  - Erros: `5`
  - Conclusão: `Sim`
  - Satisfação: `4,75 / 5`

### Principal melhoria aplicada após o teste

Antes, a busca exigia que o usuário digitasse o nome completo do item.  
Depois, foi implementado um sistema de **sugestões automáticas**, reduzindo esforço cognitivo e tornando a pesquisa mais rápida e intuitiva.

## Tecnologias utilizadas

- `HTML5`
- `CSS3`
- `JavaScript`
- `localStorage`
- `Visual Studio Code`
- `Git` e `GitHub`

## Como executar

1. Clone este repositório.
2. Abra a pasta do projeto.
3. Execute o arquivo `index.html` no navegador.

## Equipe

- Arthur de Almeida Oliveira
- Arthur Filipe Silva dos Reis
- Gabriel Gondim Malta
- Luísa Fischer Veras Mascena
- Maria Luísa Dijck Muniz
- Matheus Assis de Souza Jácome
- Sofia Villela Vieira

## Referências

- NIELSEN, Jakob. *Usability Engineering*.
- NORMAN, Don. *The Design of Everyday Things*.
- Material disponibilizado pela professora Renatta Nigro.

## Status

Projeto finalizado para apresentação da disciplina de IHC.
