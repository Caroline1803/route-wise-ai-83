# Smart Commute Hub

PROMPT LOVABLE — INTEGRAÇÃO MULTIMODAL MaaS CORPORATE AI

Quero evoluir meu projeto existente chamado MaaS Corporate AI.

O sistema é uma plataforma de mobilidade corporativa na qual empresas disponibilizam créditos de transporte para seus colaboradores. O funcionário utiliza uma única carteira digital para acessar diferentes opções de mobilidade.

O frontend existente utiliza:

React

TypeScript

TanStack Router

Tailwind CSS

OBJETIVO

Implementar uma funcionalidade de Planejamento Inteligente de Viagens Multimodais, integrando:

Uber

99

Bicicletas compartilhadas

Transporte público: ônibus, metrô e trem

O usuário informa origem e destino e o sistema apresenta as opções disponíveis, considerando:

preço;

tempo estimado;

ETA;

distância;

número de integrações;

cashback;

sustentabilidade;

política de mobilidade da empresa;

saldo disponível.

1. ARQUITETURA

Não conectar o frontend diretamente aos provedores.

Implementar:

React + TypeScript
        ↓
MaaS Backend API
        ↓
Mobility Gateway
        ↓
Provider Adapters
   ↙      ↓       ↓        ↘
 Uber     99     Bikes    Transporte Público
        ↓
Mobility Recommendation Engine
        ↓
MaaS AI


Utilizar Adapter Pattern para evitar acoplamento com fornecedores específicos.

Criar uma interface:

interface MobilityProvider {
  getEstimate(origin: Location, destination: Location): Promise<MobilityOption[]>
  getAvailability(location: Location): Promise<Availability>
  getStatus(): Promise<ProviderStatus>
}


Implementações:

UberAdapter
NinetyNineAdapter
BikeAdapter
PublicTransportAdapter


2. REGRA FUNDAMENTAL SOBRE APIs

NÃO inventar APIs, endpoints, SDKs, tokens ou credenciais.

Utilizar integrações reais somente quando existir documentação oficial e acesso autorizado.

Quando uma API não estiver disponível, utilizar um MockProvider.

Criar:

UberMockProvider
NinetyNineMockProvider
BikeMockProvider
PublicTransportMockProvider


Todo resultado deve informar:

LIVE
SANDBOX
MOCK


Nunca apresentar informação simulada como dado real.

Tokens e secrets devem existir somente no backend através de variáveis de ambiente.

3. MODELO PADRÃO DE MOBILIDADE

Normalizar todos os provedores para:

interface MobilityOption {

  id: string

  provider:
    | "UBER"
    | "99"
    | "BIKE"
    | "PUBLIC_TRANSPORT"

  modal:
    | "RIDE_HAILING"
    | "BUS"
    | "METRO"
    | "TRAIN"
    | "BIKE"
    | "MULTIMODAL"

  productName: string

  estimatedPrice: number
  currency: "BRL"

  estimatedTimeMinutes: number
  etaMinutes?: number

  distanceKm?: number

  transfers?: number

  cashback?: number

  co2Kg?: number

  available: boolean

  corporateEligible: boolean

  corporateRestrictionReason?: string

  dataSource:
    | "LIVE"
    | "SANDBOX"
    | "MOCK"
}


4. UBER

Criar:

UberAdapter


Preparar o backend para integração com APIs oficiais da Uber quando as credenciais e permissões estiverem disponíveis.

As credenciais devem ficar exclusivamente no backend.

Preparar variáveis:

UBER_CLIENT_ID
UBER_CLIENT_SECRET
UBER_REDIRECT_URI


Implementar tratamento de:

autenticação;

timeout;

rate limit;

401;

403;

429;

indisponibilidade do serviço.

Sem acesso autorizado, utilizar:

UberMockProvider


5. 99

Criar:

NinetyNineAdapter


Não presumir que existe uma API pública adequada ao projeto.

A arquitetura deve estar preparada para receber posteriormente documentação e credenciais oficiais da 99.

Enquanto isso, utilizar:

NinetyNineMockProvider


Simular para demonstração:

categoria 99Pop;

preço;

ETA;

duração;

distância.

Marcar obrigatoriamente:

dataSource: "MOCK"


6. BICICLETAS

Criar:

BikeAdapter


Preparar suporte a operadores de bicicletas compartilhadas.

Quando disponível, utilizar feeds públicos compatíveis com GBFS.

Consultar informações como:

estações próximas;

bicicletas disponíveis;

vagas disponíveis;

localização das estações;

distância até a estação;

disponibilidade.

Caso não exista integração real configurada:

BikeMockProvider


7. TRANSPORTE PÚBLICO

Criar:

PublicTransportAdapter


Preparar arquitetura para integração com dados de:

ônibus;

metrô;

trem.

Priorizar padrões abertos quando disponíveis:

GTFS
GTFS-Realtime


O sistema deve conseguir trabalhar com:

linhas;

pontos;

estações;

horários;

itinerários;

conexões;

integrações;

tempo estimado;

chegada prevista;

alertas operacionais.

A arquitetura deve permitir futuramente integrar operadores como:

SPTrans
Metrô
CPTM
EMTU


somente quando existirem APIs, feeds ou acordos adequados.

Não inventar endpoints dessas organizações.

Sem integração disponível, utilizar:

PublicTransportMockProvider


8. PLANEJAMENTO MULTIMODAL

Criar endpoint interno:

POST /api/mobility/search


Exemplo de entrada:

{
  "origin": {
    "latitude": -23.5505,
    "longitude": -46.6333
  },
  "destination": {
    "latitude": -23.5874,
    "longitude": -46.6576
  }
}


O backend deve consultar os providers disponíveis em paralelo.

Exemplo conceitual:

               Mobility Gateway

          ┌─────────┼─────────┐
          ↓         ↓         ↓
        Uber       99       Bikes
                             
                  Transporte Público
                         ↓
                 Dados normalizados
                         ↓
                 Recommendation Engine


Uma falha de um provider NÃO pode impedir o retorno dos demais.

9. CRIAR ROTAS MULTIMODAIS

Além de opções individuais, criar combinações como:

Opção A

Ônibus → Metrô

Opção B

Bicicleta → Metrô

Opção C

Metrô → Uber

Opção D

Ônibus → Trem → Bicicleta

Representar cada trecho separadamente.

Exemplo:

{
  "modal": "MULTIMODAL",
  "estimatedPrice": 11.50,
  "estimatedTimeMinutes": 43,
  "transfers": 1,
  "segments": [
    {
      "modal": "METRO",
      "duration": 30
    },
    {
      "modal": "BIKE",
      "duration": 13
    }
  ]
}


10. TELA "PLANEJAR VIAGEM"

Criar/atualizar:

/planejar


Campos:

De onde você está saindo?

Para onde você vai?

Botão:

Buscar opções

Permitir filtros:

Melhor opção

Mais rápido

Mais barato

Mais sustentável

Maior cashback

11. RESULTADOS

Mostrar primeiro:

✨ Recomendado pela MaaS AI

Exemplo:

Metrô + Bicicleta

42 minutos

R$ 9,50

Cashback: R$ 2,50

Baixa emissão de CO₂

Economia estimada: R$ 23,00

Depois apresentar as demais opções:

🚇 Transporte público

Metrô + ônibus

48 min

R$ 10,20

🚲 Bicicleta

Bike compartilhada

35 min

R$ 8,00

🚗 Uber

UberX

25 min

R$ 32,50

🚗 99

99Pop

27 min

R$ 29,90

Cada card deve mostrar claramente:

DADO EM TEMPO REAL


ou

DADO DE SANDBOX


ou

SIMULAÇÃO DO MVP


12. IA — MOBILITY RECOMMENDATION ENGINE

Criar:

MobilityRecommendationService


A primeira versão deve utilizar algoritmo determinístico de score.

Exemplo:

Preço                  30%
Tempo                   25%
Sustentabilidade        20%
Política corporativa    15%
Cashback                10%


Gerar:

mobilityScore = 0–100


A opção com melhor score elegível será destacada.

13. IA GENERATIVA

Depois que o algoritmo escolher a opção, utilizar IA generativa somente para explicar a recomendação.

Exemplo:

MaaS AI

"Recomendamos metrô + bicicleta porque essa opção oferece o melhor equilíbrio entre custo, tempo e sustentabilidade. Você economiza aproximadamente R$ 23 em comparação com uma viagem individual por carro."

Não permitir que o LLM:

aprove pagamentos;

altere saldo;

altere política corporativa;

autorize modal;

calcule valores financeiros oficiais.

Essas decisões devem permanecer no backend através de regras determinísticas.

14. CARTEIRA CORPORATIVA

Antes de recomendar uma opção como utilizável com créditos corporativos, validar:

saldo disponível
+
limite mensal
+
modal permitido
+
horário permitido
+
política da empresa


Exemplo:

Uber

Disponível: SIM

Crédito corporativo: NÃO

Motivo:
Uber permitido pela empresa somente após 20h.


O colaborador ainda pode visualizar a alternativa, mas deve saber que não poderá utilizar o saldo corporativo.

15. CASHBACK

Criar regras de incentivo.

Exemplo:

Ônibus/Metrô → 3%

Bicicleta → 5%

Uber/99 → 1%


Permitir campanhas corporativas.

Exemplo:

Semana da Mobilidade Sustentável

Use transporte público ou bicicleta e receba cashback adicional.

Cashback somente deve ser creditado após confirmação da viagem.

16. RESILIÊNCIA

Implementar:

timeout;

retry controlado;

cache;

fallback;

logs;

tratamento de erros;

circuit breaker quando apropriado.

Exemplo:

Se Uber estiver fora:

Uber
Temporariamente indisponível


mas continuar mostrando:

99
Bicicleta
Ônibus
Metrô
Trem


17. PORTAL RH

Manter/criar dashboard corporativo mostrando:

créditos distribuídos;

créditos utilizados;

gastos por modal;

gasto por colaborador;

utilização de transporte público;

utilização de mobilidade compartilhada;

cashback;

economia estimada;

indicadores ambientais.

Criar seção:

MaaS Intelligence

Exemplos:

"38% das viagens corporativas utilizaram transporte coletivo."

"A empresa poderia economizar R$ 18.500/mês incentivando alternativas multimodais em determinados trajetos."

"O uso de bicicletas cresceu 12% após a campanha de cashback."

18. TECNOLOGIAS

Manter:

Frontend:

React
TypeScript
TanStack Router
Tailwind CSS


Backend:

API REST


Arquitetura preparada para:

PostgreSQL
Redis
Mensageria
Cloud
OAuth 2.0
OpenAPI/Swagger


19. SEGURANÇA

Implementar conceito de:

autenticação;

autorização por perfil;

LGPD;

logs de auditoria;

proteção de credenciais;

rate limiting;

secrets somente no backend.

Nunca enviar API Keys ou Client Secrets para o navegador.

20. NÃO QUEBRAR O PROJETO EXISTENTE

Antes de implementar:

Analise toda a estrutura existente.

Identifique componentes reutilizáveis.

Preserve TanStack Router.

Preserve Tailwind.

Preserve as telas existentes.

Não substitua componentes que já funcionam sem necessidade.

Faça alterações incrementais.

21. ENTREGA

Ao finalizar, apresente um resumo contendo:

Arquivos criados

Liste os novos arquivos.

Arquivos modificados

Liste os arquivos alterados.

Providers

Informe:

Uber             LIVE / SANDBOX / MOCK
99               LIVE / SANDBOX / MOCK
Bicicletas       LIVE / SANDBOX / MOCK
Transporte       LIVE / SANDBOX / MOCK


Variáveis de ambiente

Liste todas as variáveis necessárias sem revelar secrets.

APIs

Liste os endpoints internos criados.

Testes

Explique como testar:

Planejamento de viagem

Uber

99

Bicicletas

Transporte público

Rotas multimodais

Recomendação MaaS AI

Política corporativa

Cashback

O resultado final deve ser um MVP funcional e demonstrável da MaaS Corporate AI, no qual o usuário consegue pesquisar um deslocamento e visualizar diferentes alternativas de mobilidade em uma única experiência.

se possível nao quero a marca do lovable no meu código para poder subir no GitHub

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://route-wise-ai-83.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/c6f595bb-2b98-4be7-8648-f595132aa9cd).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
