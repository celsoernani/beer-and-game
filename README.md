# Beer and Game – Plano Arquitetural

## Visão Geral
Aplicativo para registrar partidas de campeonato em tempo real em um único dispositivo, oferecendo importação de jogadores, montagem de partidas, registro de eventos e geração de relatórios. A primeira versão roda inteiramente sobre o backend do Next.js com banco local, e já prepara o terreno para migração futura para um backend NestJS.

## Stack Atual (MVP)
- **Frontend e Backend**: Next.js mais recente (App Router) com TypeScript.
- **Persistência local**: SQLite através de ORM (ex.: Prisma) operando no servidor Next.js.
- **Estado cliente**: React Query/Zustand conforme necessidade de cache offline.
- **Infraestrutura**: App rodando em um único dispositivo; sincronização em nuvem não é necessária nesta fase.

## Evolução Planejada
- **Backend dedicado**: Migração para NestJS (Node.js/TypeScript) mantendo modelos e serviços compatíveis.
- **Banco de dados**: PostgreSQL hospedado + filas gerenciadas na AWS (ex.: SQS) para processamento assíncrono quando houver múltiplos dispositivos.
- **Integrações futuras**: Serviços de IA para balanceamento de times e sugestões automáticas.

## Domínio e Atores
- **Organizador**: administra jogadores, agenda partidas, acessa relatórios.
- **Anotador**: registra eventos em tempo real no dispositivo.
- **Jogador**: consulta estatísticas e histórico (via portal público futuro).

## Módulos (Fase Atual)
1. **Core**
   - Modelos: `Player`, `Match`, `Team`, `Event`.
   - Serviços: `MatchService`, `BalanceService`, `StatsService`, `ImportService`.
2. **Interfaces (Next API Routes)**
   - `POST /api/players/import`
   - `GET/POST /api/players`
   - `GET/POST /api/matches`
   - `POST /api/matches/{id}/events`
   - `GET /api/matches/{id}/timeline`
   - `GET /api/stats/player/{id}`
3. **UI**
   - `app/(dashboard)/matches` – lista e filtros.
   - `app/(dashboard)/matches/[id]` – tela principal com cronômetro e timeline.
   - `app/(dashboard)/players` – CRUD e importação.
   - `app/(public)/stats/players/[id]` – estatísticas por jogador (fase futura).

## Considerações Técnicas
- **Cronômetro**: controlado localmente pelo dispositivo; sem necessidade de sincronização via websocket.
- **Atalhos de teclado**: configuráveis por usuário, armazenados localmente.
- **Auditoria**: log mínimo dos eventos registrados para permitir desfazer ações.

## Migração para NestJS
- Manter definição dos modelos e serviços em módulos independentes reutilizáveis.
- Planejar separação da camada de persistência em repositórios para troca de implementações (SQLite → PostgreSQL).
- Preparar contrato de APIs para fácil portabilidade dos endpoints das rotas do Next para controllers NestJS.

## Roadmap
1. Importação CSV e gestão de jogadores no backend Next.js.
2. CRUD de partidas com cronômetro manual e registro de eventos locais.
3. Relatórios exportáveis (CSV/Excel).
4. Migração gradual para NestJS + banco remoto, incluindo adoção de filas AWS para orquestração quando houver múltiplos dispositivos.
5. Integração IA para balanceamento e sugestões de substituição.

## Desenvolvimento Local
```bash
npm install
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) para visualizar o app.
