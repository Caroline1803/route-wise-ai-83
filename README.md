# 🚀 MaaS Corporate AI

## Mobilidade corporativa inteligente em uma única plataforma

O **MaaS Corporate AI** é uma plataforma baseada no conceito **Mobility as a Service (MaaS)**, criada para centralizar a gestão dos benefícios de mobilidade oferecidos pelas empresas aos seus colaboradores.

A solução permite que empresas disponibilizem créditos em uma **carteira digital corporativa**, possibilitando ao colaborador utilizar diferentes meios de transporte, como transporte público, Uber, 99 e bicicletas compartilhadas.

Além da integração multimodal, a plataforma utiliza **Inteligência Artificial** para recomendar alternativas de deslocamento considerando custo, tempo, sustentabilidade, cashback e políticas corporativas.

---

## 🎯 Problema

Atualmente, empresas podem utilizar diferentes soluções para administrar a mobilidade dos colaboradores:

- Vale-transporte
- Transporte público
- Uber corporativo
- Aplicativos de mobilidade
- Reembolso
- Bicicletas compartilhadas
- Outros benefícios de transporte

Esses serviços normalmente funcionam de maneira independente, dificultando a gestão financeira e reduzindo a flexibilidade do colaborador.

O MaaS Corporate AI propõe centralizar esse ecossistema.

---

## 💡 Proposta de Valor

> **Uma única carteira. Diferentes formas de se movimentar.**

A empresa administra os créditos de mobilidade em uma única plataforma e o colaborador escolhe o modal mais adequado para cada deslocamento, respeitando as políticas corporativas.

### Para empresas

- Gestão centralizada dos créditos
- Controle de gastos
- Políticas de mobilidade
- Dashboards para RH
- Previsão de gastos
- Identificação de oportunidades de economia
- Indicadores ESG
- Gestão de cashback

### Para colaboradores

- Carteira digital única
- Planejamento multimodal
- Consulta de saldo
- Histórico de viagens
- Cashback
- Recomendação inteligente de mobilidade
- Mais liberdade na escolha do transporte

---

# 🧠 MaaS AI

A camada de Inteligência Artificial auxilia na escolha das melhores alternativas de mobilidade.

O motor de recomendação considera:

- Custo
- Tempo de deslocamento
- Sustentabilidade
- Cashback
- Preferências do usuário
- Política corporativa
- Saldo disponível

Exemplo:

> ✨ **Recomendado pela MaaS AI**
>
> Metrô + Bicicleta  
> 42 minutos  
> R$ 9,50  
> Cashback: R$ 2,50
>
> Esta opção apresenta um bom equilíbrio entre custo, tempo e sustentabilidade.

As regras financeiras e corporativas permanecem determinísticas no backend. A IA não pode autorizar pagamentos ou ignorar políticas definidas pela empresa.

---

# 🗺️ Planejamento de Viagens

A plataforma foi projetada para utilizar o **Google Maps Platform** como camada geográfica.

A integração pode fornecer:

- Pesquisa de endereços
- Autocomplete
- Geolocalização
- Origem e destino
- Distância
- Duração
- Visualização da rota
- Coordenadas geográficas

Essas informações alimentam o **Mobility Gateway**, responsável por consultar os provedores de mobilidade.

---

# 🚗 Provedores de Mobilidade

A arquitetura foi preparada para integração com:

### Uber

Consulta de produtos e estimativas quando houver acesso autorizado às APIs oficiais.

### 99

Arquitetura preparada para futura integração mediante disponibilidade e autorização de API.

### Bicicletas compartilhadas

Possibilidade de utilização de operadores e feeds compatíveis com padrões como GBFS.

### Transporte público

Preparação para dados de:

- Ônibus
- Metrô
- Trem

Com possibilidade de utilização de padrões como:

- GTFS
- GTFS-Realtime

---

# 🏗️ Arquitetura

```text
                    MaaS Corporate AI

                           │
                           ▼

                React + TypeScript
                TanStack Router
                  Tailwind CSS

                           │
                           ▼

                     MaaS API
                     FastAPI

                           │
                           ▼

                   Mobility Gateway

          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼

       Uber             99             Bicicletas
                                           
                           │
                           ▼

                  Transporte Público

                           │
                           ▼

                Dados Normalizados

                           │
                           ▼

              Recommendation Engine

                           │
                           ▼

                       MaaS AI
