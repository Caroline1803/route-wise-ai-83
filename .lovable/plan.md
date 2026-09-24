# Portal do Colaborador: cadastro, login, painel e estimativa de gastos

## O que o colaborador vai ver
- **/employee/register**: todos os campos pedidos, aceite dos termos e o botão "Criar conta". Os campos são conferidos (CPF, senha forte, e-mail repetido, empresa existente). Ao terminar, o sistema manda o e-mail de confirmação e leva para a tela de login.
- **/employee/login**: e-mail, senha, "Lembrar de mim", "Esqueci minha senha", "Primeiro acesso", "Criar cadastro" e o botão "Entrar". Também inclui a página **/reset-password**.
- **/employee/dashboard**: "Olá, {nome} 👋", com saldo, crédito corporativo, cashback, gasto no mês, estimativa até o fim do mês e saldo previsto. Tem os botões Planejar viagem, Estimar gastos, Minha carteira e Histórico. Traz também o bloco "Seu benefício como planejamento financeiro", com as 6 perguntas do TCC.
- **/employee/spending-estimate**: formulário com origem, destino, dias por semana (1 a 7), viagens por dia, modal (Ônibus, Metrô, Uber, 99, Bicicleta, Patinete, Multimodal), período e dias úteis (digitados ou calculados automaticamente). A tela mostra:
  - resultado diário, semanal e mensal;
  - cards comparando os modais, com os selos "Mais econômica" e "Mais rápida";
  - comparação com o crédito corporativo (sobra ou quanto falta, e a % coberta);
  - gráfico com benefício, gasto, saldo restante e complemento pessoal;
  - montador de trechos multimodais (ex.: Ônibus → Metrô grátis por integração → Patinete);
  - bloco "Como você pode economizar?" com sugestões calculadas;
  - botões "Salvar estimativa" e "Planejar viagem".
- **/employee/spending-estimate/history**: tabela com data, origem, destino, modal, valor mensal, crédito e diferença. Ações: ver, refazer, excluir e comparar até 3 estimativas.
- **Patinete** entra como opção nova no planejador de viagens, com preços de demonstração.
- O portal RH continua como está, separado do portal do colaborador.

## Regras
- Todo colaborador novo recebe o perfil EMPLOYEE, uma carteira digital e a política de mobilidade padrão da empresa.
- O status fica PENDING até a empresa aprovar. Empresas com "ativação automática" liberam o acesso na hora.
- Colaborador PENDING consegue entrar, mas vê um aviso de "aguardando aprovação" em vez do painel.
- Custos por viagem de demonstração: transporte público R$ 5,20, Bicicleta R$ 8, Patinete R$ 12, 99 R$ 22 e Uber R$ 25. Tudo aparece marcado como MOCK.
- Valores iniciais da carteira: saldo R$ 420, crédito R$ 350, cashback R$ 35 e gasto no mês R$ 186,50.

## Detalhes técnicos
- Liga o Lovable Cloud e ativa o login por e-mail e senha. Tokens JWT de acesso e de renovação, senha criptografada e expiração de sessão já vêm prontos.
- Tabelas:
  - `companies`: 2 empresas de exemplo, uma com ativação automática e outra com aprovação;
  - `employees`: perfil, com o CPF guardado de forma única;
  - `user_roles`: tabela separada, com enum que inclui `employee`;
  - `wallets`;
  - `spending_estimates`: com os campos pedidos;
  - `access_logs`;
  - `login_attempts`: bloqueio de 15 minutos depois de 5 erros.
- Todas as tabelas têm permissões e regras de acesso (RLS) para que cada colaborador veja só os próprios dados.
- Ao se cadastrar, um gatilho cria automaticamente o perfil, o papel, a carteira e o status a partir dos dados enviados.
- Funções de servidor com validação zod:
  - `registerEmployee`: confere CPF e empresa e checa se o e-mail já existe;
  - `recordLoginAttempt` e `checkLock`;
  - `getEmployeeDashboard`;
  - `estimateSpending`, `compareCosts`, `saveEstimate`, `listEstimates` e `deleteEstimate`.
- Também são criados os endereços `POST /api/employees/register`, `/api/auth/login`, `/api/mobility/spending-estimate` e `/api/mobility/compare-costs`, que seguem os formatos do seu pedido.
- A lógica de cálculo fica em um módulo puro e compartilhado (`src/lib/estimate/`), o mesmo usado pelo servidor e pela tela.
- As telas protegidas ficam atrás da proteção de login: `/employee/dashboard`, `/employee/spending-estimate` e `/employee/spending-estimate/history`.
