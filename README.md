
# Aniversários da Família Vieira

## Visão Geral

Este projeto é um site de portal familiar para a Família Vieira, projetado para rastrear e celebrar os aniversários dos membros da família. Ele fornece uma interface amigável para visualizar os próximos aniversários, os detalhes dos membros da família e gerenciar as informações dos membros.

## Funcionalidades

- **Autenticação de Usuário:** Login seguro com contas do Google para garantir que apenas membros da família possam acessar o conteúdo.
- **Contagem Regressiva para o Próximo Aniversário:** Exibe um cronômetro de contagem regressiva em tempo real para o próximo aniversário.
- **Visualização de Membros por Categoria:** Os membros da família são organizados em abas (Netos, Avós, Filhos, etc.).
- **Busca e Filtro:**
  - **Buscar por nome:** Encontre rapidamente qualquer membro da família.
  - **Filtrar por mês:** Veja todos os aniversariantes do mês atual.
  - **Próximo aniversário:** Destaque o próximo membro da família a comemorar seu aniversário.
- **Perfis de Membros Detalhados:** Cada membro tem um cartão com sua foto, idade, preferências de presentes e uma lista de desejos.
- **Destaque de Aniversariante:** No dia do aniversário de um membro, seu cartão é destacado e uma animação de confete é acionada.
- **Gerenciamento de Membros:**
  - **Adicionar:** Adicione facilmente novos membros da família através de um formulário modal.
  - **Editar:** Atualize as informações existentes, como preferências ou foto do perfil.
- **Design Responsivo:** A interface se adapta perfeitamente a diferentes tamanhos de tela, de desktops a dispositivos móveis.

## Estrutura do Projeto

O projeto é estruturado com uma abordagem de código limpo, separando HTML, CSS e JavaScript para melhor manutenção e escalabilidade.

- `index.html`: O arquivo HTML principal, contendo a estrutura da página.
- `style.css`: A folha de estilo, que define a aparência e o layout do aplicativo.
- `app.js`: O arquivo JavaScript principal, construído em módulos para lidar com:
  - Autenticação de usuário (Auth)
  - Manipulação do DOM (UI)
  - Interação com o banco de dados (Services)
  - Lógica de negócios principal (App)
- `firebase-config.js`: Contém a configuração do Firebase (este arquivo é gerado a partir de `firebase-config.example.js`).

## Tecnologias Utilizadas

- **Frontend:** HTML5, CSS3, JavaScript (ES6 Modules)
- **Backend:** Firebase (Firestore, Authentication, Storage)
- **Hospedagem:** Firebase Hosting

## Como Executar Localmente

1.  **Clone o repositório:**
    ```bash
    git clone https://github.com/seu-usuario/aniversarios-familia-vieira.git
    cd aniversarios-familia-vieira
    ```

2.  **Configure o Firebase:**
    - Crie um projeto no [console do Firebase](https://console.firebase.google.com/).
    - Adicione um aplicativo da web ao seu projeto.
    - Copie as credenciais do Firebase e cole-as em um novo arquivo chamado `firebase-config.js` (você pode usar `firebase-config.example.js` como modelo).

3.  **Abra `index.html` em seu navegador.**

## Histórico de Implementações Recentes

- ✅ **Autenticação com Google:**
  - ✅ Correção do erro `auth/operation-not-allowed` através da ativação do provedor de login do Google no console do Firebase.
  - ✅ Diagnóstico e resolução do erro de chave de API inválida (`auth/invalid-api-key`), garantindo a correta configuração no arquivo `firebase-config.js`.
- ✅ **Interface de Usuário (UI):**
  - ✅ Resolução de um bug visual no botão de login, onde o texto alternativo da imagem se sobrepunha ao texto principal.
  - ✅ Refatoração do botão, substituindo a tag `<img>` por um pseudo-elemento `::before` em CSS para uma implementação mais robusta e limpa.
- ✅ **Deploy:**
  - ✅ Implantação contínua da aplicação no Firebase Hosting para refletir as correções e atualizações em tempo real.
