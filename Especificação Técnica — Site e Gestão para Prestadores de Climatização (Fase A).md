# Especificação Técnica — Plataforma de Site e Gestão para Prestadores de Climatização (Fase A)

**Versão:** 1.0, proposta para revisão conjunta · **Data:** 01/11/2026 · **Idioma e moeda:** pt-BR, BRL **Base:** briefing do projeto, anexo `ESPECIFICACAO_TECNICA_SAAS_GESTAO_CLIMATIZACAO.md` e pesquisa de mercado (fontes na seção 19) **Leitor principal:** equipe de engenharia e Claude Code. Este documento delimita o escopo da Fase A. O anexo continua valendo como referência de engenharia e como backlog da Fase B.

## 1. Resumo executivo

- **O briefing** pede um produto enxuto: site institucional com estimativa e formulário que chega ao WhatsApp, painel admin com CMS, agenda integrada ao Google, link de cobrança e uma visão simplificada para o instalador.
- **O anexo** descreve um ERP de campo completo (31 seções, 15 épicos: estoque, rentabilidade, garantia, PMOC, portal do cliente, IA). É ótimo como visão e como base de regras de engenharia, mas o MVP dele é bem maior que o briefing e **não cobre** site, CMS, formulário para WhatsApp nem link de cobrança (trata WhatsApp e gateways de pagamento como pós-MVP).
- **Recomendação:** construir um **MVP-Lite (Fase A)** com o escopo do briefing, sobre as fundações do anexo (multi-tenant, permissões, orçamento com snapshot, ordem de serviço, auditoria). Assim estoque, rentabilidade, garantia e PMOC entram na Fase B sem retrabalho de modelo de dados.
- **Mercado:** Produttivo, Auvo, Field Control, iClass e Leankeep são plataformas de gestão de campo e manutenção pensadas para equipes. Entre as soluções encontradas, nenhuma combina site próprio do prestador, estimativa online, fluxo centrado em WhatsApp e cobrança por Pix num produto leve para autônomo e pequena instaladora. Esse é o posicionamento sugerido (limites da pesquisa na seção 3.5).
- **Quatro riscos moldam o desenho:** (1) a API oficial do WhatsApp exige templates aprovados e cobra por mensagem; (2) o Google Agenda exige OAuth com escopo sensível e verificação do app; (3) cobrança para vários prestadores tem implicações financeiras e regulatórias; (4) textos de LGPD, fatores de BTU e preços-base precisam de revisão humana especializada.
- **Preciso de você** nas decisões da seção 18. As duas que mais mudam o desenho: multi-tenant desde o início? E qual modelo de WhatsApp (número compartilhado da plataforma ou número de cada prestador)?

## 2. Análise do material enviado

### 2.1 O que manter do anexo

- Regras de engenharia (§0): backend como fonte de verdade, transações, idempotência, nenhuma integração simulada, IA nunca decide preço.
- Isolamento entre empresas com testes de acesso cruzado (§3.3) e permissões granulares (§4).
- Orçamento com snapshot, memória de cálculo, dinheiro sem ponto flutuante, markup diferente de margem (§9) e técnico sem acesso a custo e margem (§4.3).
- Critérios de aceite por módulo (§0.4), definição de pronto (§28) e prompt operacional (§29).

### 2.2 Lacunas frente ao briefing

| Item do briefing | Situação no anexo | Ação proposta |
| --- | --- | --- |
| Site institucional público | Ausente | Módulo `site` (RF-S) |
| CMS: conteúdo, FAQ, política de privacidade | Ausente | Módulo `cms` (RF-A01) |
| Cálculo orçamentário no site | Parcial: §9 trata do orçamento interno | Estimador público com tabelas de preço (RF-E) |
| Formulário enviado ao WhatsApp do prestador | Ausente; WhatsApp é P1 (§20) | Promover a P0 com outbox e fallback (ADR-003) |
| Mensagem de WhatsApp editável pelo admin | Modelos de mensagem citados (§5) sem a regra de aprovação da Meta | Dois tipos de mensagem (seção 9.1) |
| Solicitação de orçamento enviada ao instalador | Leads existem (§21), despacho não | Fluxo de despacho com notificação |
| Google Agenda com local e horário | Agenda interna (§10); sem integração externa | Sincronização unidirecional (ADR-004) |
| Link de cobrança | Recebimento manual (§13.4); gateway fora do MVP | Adapter de provedor de pagamento (ADR-005) |
| Instalador: agenda, PDF do orçamento, observações | Parcial (§4.3, §11) | Visão mobile do instalador (RF-I) |
| Política de privacidade | LGPD como diretriz (§3.4) | Documento versionado por tenant e registro de consentimento |

### 2.3 Inconsistências a resolver

1. **Tamanho do MVP.** O anexo (§2.1) lista 12 capacidades P0, incluindo estoque e rentabilidade. O briefing pede outras. Proposta: Fase A = briefing; Fase B = anexo §12 a §17.
2. **Prioridade de WhatsApp e cobrança.** São P1/P2 no anexo e núcleo no briefing.
3. **Perfis.** O anexo define 7 papéis; o briefing, 2 (Admin e Instalador). Mapeamento na seção 5.
4. **Site público.** Exige renderização no servidor para SEO e resolução do tenant pelo domínio, o que o anexo não prevê (ADR-001 e ADR-002).
5. **PDF exportado pelo instalador.** Será sempre a versão comercial, sem custo nem margem, em coerência com o §4.3 do anexo.

### 2.4 Decisão de escopo

| Entra na Fase A (MVP-Lite) | Fica para a Fase B (anexo) |
| --- | --- |
| Site, CMS, FAQ, privacidade, formulário, estimador | Estoque, reserva e baixa de materiais (§12) |
| Leads, orçamento interno, PDF | Rentabilidade e custos reais (§13) |
| Notificações WhatsApp e e-mail | Garantia e chamados (§14) |
| Agenda, OS simplificada, Google Agenda | Contratos e manutenção recorrente (§15) |
| Cobrança por link com Pix | Portal do cliente e QR Code (§16) |
| Perfil Admin e Instalador, auditoria | PMOC (§17), IA (§18), PWA offline |

## 3. Análise de mercado

### 3.1 Panorama

| Solução | Foco | Recursos relevantes encontrados | Observação |
| --- | --- | --- | --- |
| Produttivo | Gestão de serviços em campo, de 3 a 500+ técnicos | OS, checklists, relatório fotográfico, planos de atividades recorrentes, roteirização, mapa da equipe, app offline, IA própria, módulo PMOC | Assinatura por número de usuários; distribui modelos gratuitos de OS e PMOC |
| Auvo | Gestão de equipe externa | Agenda, envio de orçamentos e OS, acompanhamento da equipe em tempo real | Avaliações isoladas citam falta de suporte 24 h e sincronização irregular |
| Field Control | Controle de campo | Indicadores de produtividade, app para técnico e para gestor | Comparativo de um concorrente o descreve como mais complexo e caro (fonte parcial) |
| iClass | OS online | Relatórios de desempenho; solução de PMOC para refrigeração e ar-condicionado | Empresa informa 27 anos de mercado |
| Leankeep | Manutenção predial | Apoio à elaboração de PMOC | Foco em edifícios e ativos |
| Infraspeak | Manutenção, ativos e conformidade | Preventiva, estoque, compras, auditoria e SLA | Internacional |
| Geradores gratuitos (ex.: ShiftFlow) | Captação de leads | OS e orçamento de ar-condicionado em PDF, sem cadastro, compartilhamento por WhatsApp, custo interno fora do documento | Declaram que não geram PMOC nem ART |

### 3.2 O que os profissionais já seguem

- A OS começa pelo **equipamento** (tipo, marca, modelo, número de série, garantia) e só depois lista o trabalho.
- O orçamento separa **equipamento, materiais, mão de obra e condições de instalação**, e o documento do cliente não mostra custo interno.
- **Checklist digital e fotos** durante o atendimento, e **relatório em PDF** compartilhável por WhatsApp ou e-mail.
- **Agenda e despacho** de técnicos, e **planos recorrentes** de manutenção.
- **PMOC** como referência regulatória para ambientes de uso coletivo.
- Os provedores de pagamento brasileiros pesquisados (Asaas, Mercado Pago, entre outros) oferecem Pix com confirmação por webhook, o que torna o link de cobrança tecnicamente simples de integrar.

### 3.3 Marco regulatório (informativo, não é parecer jurídico)

- A Lei 13.589/2018 e a Portaria 3.523/1998 do Ministério da Saúde tratam do PMOC para edifícios de uso público e coletivo com ambientes climatizados. A Portaria atribui a implantação a profissional legalmente habilitado; a vigilância sanitária fiscaliza o plano e o CREA fiscaliza o profissional.
- Há leituras divergentes sobre a faixa de aplicação. Uma entidade do setor (ASBRAV) afirma que a exigência vale para sistemas acima de 5 TR; a lei em si fala em todos os edifícios de uso coletivo. Isso precisa de validação por profissional habilitado.
- O cenário normativo está em movimento: material de um órgão de saúde estadual indica que a Resolução RE 09/2003 foi revogada em 2024, que a NBR 16401 está em revisão e menciona a NBR 17037/2023.
- **Consequência para o produto:** PMOC fica na Fase B. Na Fase A, todo documento gerado traz aviso de que não substitui PMOC, projeto ou ART, e os textos ficam configuráveis e revisados por responsável técnico.

### 3.4 Lacuna e posicionamento

Os concorrentes atendem bem empresas com equipes e contratos de manutenção. O prestador pequeno costuma depender de WhatsApp, planilha e indicação. O espaço sugerido é **site próprio com captação, estimativa online, orçamento em PDF, agenda no Google e cobrança por Pix**, tudo em um produto leve, com caminho de evolução para a gestão completa descrita no anexo.

### 3.5 Limites da pesquisa

Não localizei preços públicos de planos, não validei participação de mercado e as avaliações de usuários são amostrais. Recomendo 5 a 8 entrevistas com prestadores antes de fechar a Fase B e o modelo de preço do SaaS.

## 4. Requisitos funcionais da Fase A

Legenda: P0 indispensável; P1 importante, pode entrar logo após o piloto.

### 4.1 Site público (RF-S)

| ID | Requisito | Prio |
| --- | --- | --- |
| S01 | Tenant resolvido pelo domínio. Páginas: Início, Serviços, Sobre, FAQ, Contato, Política de Privacidade | P0 |
| S02 | SEO: metadados, sitemap, dados estruturados de negócio local, regeneração da página ao publicar | P0 |
| S03 | Botão de WhatsApp com mensagem pré-preenchida (link wa.me), texto editável pelo admin | P0 |
| S04 | Formulário de orçamento: nome, WhatsApp, e-mail opcional, cidade e bairro, tipo de serviço, quantidade de equipamentos, BTU opcional, observações, consentimento LGPD obrigatório | P0 |
| S05 | Anti-spam: campo isca, limite de requisições, captcha opcional | P0 |
| S06 | Página de confirmação com protocolo e prazo de resposta | P0 |
| S07 | Acessibilidade WCAG 2.1 AA e meta de LCP abaixo de 2,5 s em rede 4G | P0 |
| S08 | Banner de cookies somente se houver cookies não essenciais | P1 |

### 4.2 Estimador (RF-E)

| ID | Requisito | Prio |
| --- | --- | --- |
| E01 | Fluxo em passos: serviço, equipamentos, condições (altura, distância, infraestrutura), resultado | P0 |
| E02 | Resultado como faixa de valores, com memória de cálculo resumida e aviso de que o valor final depende de avaliação | P0 |
| E03 | Tabela de preços de referência e regras por tenant, versionadas | P0 |
| E04 | Estimativa gravada no lead como snapshot | P0 |
| E05 | Modo “somente coleta”, sem exibir preço, configurável por tenant | P0 |
| E06 | Sugestão de BTU opcional, com premissas visíveis e aviso técnico (anexo §8) | P1 |

### 4.3 Painel Admin (RF-A)

| ID | Requisito | Prio |
| --- | --- | --- |
| A01 | CMS: páginas em blocos (texto, imagem, chamada para ação, lista de serviços, depoimentos), FAQ com ordenação, política de privacidade versionada, rascunho, pré-visualização, publicar e desfazer | P0 |
| A02 | Identidade: logo, cores, contatos, horário, áreas atendidas | P0 |
| A03 | Mensagens: (a) texto pré-preenchido do wa.me, livre; (b) templates da API do WhatsApp, com variáveis fixas e status de aprovação | P0 |
| A04 | Leads: caixa de entrada, status (NOVO, EM CONTATO, ORÇAMENTO, AGENDADO, GANHO, PERDIDO), histórico e tempo de resposta | P0 |
| A05 | Orçamento interno a partir do lead: itens do catálogo, desconto com limite, memória de cálculo, custo e margem (só admin), versões | P0 |
| A06 | Despacho: atribuir ao instalador e enviar a solicitação por WhatsApp, e-mail e painel | P0 |
| A07 | Agendamento com data, hora, duração e local: cria a OS e o evento no Google Agenda; detecta conflito | P0 |
| A08 | Cobrança: gerar link (valor, descrição, vencimento), enviar ao cliente, acompanhar status, cancelar | P0 |
| A09 | Usuários, convites e papéis | P0 |
| A10 | Auditoria e log de envios (WhatsApp, e-mail) com status | P0 |

### 4.4 Perfil Instalador (RF-I)

| ID | Requisito | Prio |
| --- | --- | --- |
| I01 | Agenda interna (dia, semana, lista) apenas das suas OS, otimizada para celular | P0 |
| I02 | Detalhe da OS: cliente, endereço com link de mapa, contato, escopo do orçamento, recados do admin | P0 |
| I03 | Exportar o orçamento em PDF (versão comercial, sem custo e margem) | P0 |
| I04 | Observações do atendimento: texto com autor e data; correções entram como adendo, com histórico | P0 |
| I05 | Status da OS: AGENDADA, A CAMINHO, EM ANDAMENTO, CONCLUÍDA | P0 |
| I06 | Conectar o próprio Google Agenda | P1 |
| I07 | Anexar fotos às observações | P1 |

### 4.5 Fora da Fase A

Estoque, rentabilidade, garantia, PMOC, portal do cliente, QR Code, contratos recorrentes, assinatura de aceite, nota fiscal, IA, aplicativo offline, otimização de rotas.

## 5. Perfis e permissões

O Admin equivale a Proprietário e Administrador do anexo; o Instalador equivale a Técnico. O papel Atendimento (anexo §4.1) fica como P1. A verificação é centralizada no backend por permissões granulares, como no anexo §4.2.

| Capacidade | Admin | Instalador |
| --- | --- | --- |
| Editar e publicar conteúdo do site | Sim | Não |
| Ver leads | Todos | Não |
| Criar e editar orçamento | Sim | Não |
| Ver custo e margem | Sim | Não |
| Conceder desconto | Até o limite configurado | Não |
| Despachar e agendar | Sim | Não |
| Ver agenda | De todos | Só a sua |
| Exportar PDF do orçamento | Sim | Só das suas OS |
| Registrar observações e status | Sim | Só nas suas OS |
| Gerar e ver cobranças | Sim | Não |
| Usuários, integrações e configurações | Sim | Não |

## 6. Fluxos principais

**Fluxo 1: do site ao admin**

1. Visitante usa o estimador e envia o formulário com consentimento.
2. API valida, aplica limite de requisições, grava o lead e a estimativa (snapshot) e registra o consentimento, na mesma transação, junto com um item na tabela de saída de notificações (outbox).
3. O worker envia o template de WhatsApp ao prestador. Se falhar após as tentativas, envia e-mail e mantém o aviso no painel.
4. O lead nunca depende do WhatsApp para existir: a fonte de verdade é o banco.

**Fluxo 2: orçamento, despacho e agenda**

1. Admin abre o lead, cria o orçamento (itens, desconto, validade) e gera o PDF comercial.
2. Admin atribui o instalador e agenda data, hora, duração e endereço.
3. O sistema valida conflito de horário do instalador, cria a OS e enfileira: notificação ao instalador e evento no Google Agenda com local e horário.
4. Se a conexão com o Google estiver inválida, a OS é criada mesmo assim, o painel mostra “reconectar Google” e o instalador recebe o link do calendário por ICS.

**Fluxo 3: atendimento**

1. Instalador vê a agenda no celular, abre a OS, exporta o PDF do orçamento se precisar e atualiza o status.
2. Ao final, registra observações. Edições posteriores viram adendos com histórico.

**Fluxo 4: cobrança**

1. Admin gera o link a partir do orçamento aprovado (o valor vem do backend, nunca do navegador).
2. O link vai ao cliente por WhatsApp (mensagem pré-preenchida na Fase A; template pela API quando configurado).
3. O provedor de pagamento chama o webhook. O sistema valida a autenticidade, grava o evento de forma idempotente e atualiza o status. Um job diário reconcilia pendências.

**Máquinas de estado**

- Lead: NOVO → EM CONTATO → ORÇAMENTO → AGENDADO → GANHO | PERDIDO.
- Orçamento (anexo §9.5): DRAFT → READY\_TO\_SEND → SENT → VIEWED → APPROVED | REJECTED | EXPIRED | CANCELLED.
- OS: AGENDADA → A CAMINHO → EM ANDAMENTO → CONCLUÍDA | CANCELADA.
- Cobrança: RASCUNHO → PENDENTE → PAGA | VENCIDA | CANCELADA | ESTORNADA.

## 7. Arquitetura

### 7.1 Visão geral

```text
Visitante ──► Site público (Next.js, SSR/ISR, domínio → tenant)
                 │  POST /public/v1/leads  (limite de requisições, consentimento)
                 ▼
Admin / Instalador ──► App autenticado (Next.js) ──► API NestJS (REST /v1)
                                                       │
                      ┌────────────────────────────────┼───────────────────┐
                      ▼                                ▼                   ▼
                 PostgreSQL                      Worker (jobs)       Storage privado
             (tenant_id + RLS)              outbox, retentativas     (PDF, imagens)
                                                      │
              ┌───────────────┬───────────────────────┼─────────────────┐
              ▼               ▼                       ▼                 ▼
      WhatsApp Cloud API   E-mail            Google Agenda      Provedor Pix
                                                                (webhook de volta)
```

### 7.2 Componentes

| Componente | Responsabilidade | Observação |
| --- | --- | --- |
| Site público | Páginas do tenant, SEO, formulário, estimador | Next.js com SSR/ISR; regeneração sob demanda ao publicar |
| App autenticado | Painel Admin e visão do Instalador | Mesmo Next.js, rotas protegidas; instalador mobile-first |
| API | Regras de negócio, permissões, cálculo, webhooks | NestJS, REST versionada, validação no backend |
| Worker | Envio de mensagens, sincronização, PDF, reconciliação | Mesmo código da API, processo separado |
| Fila | Entrega confiável e retentativas | Tabela outbox no PostgreSQL com `FOR UPDATE SKIP LOCKED`, sem infraestrutura nova |
| Banco | Dados transacionais | PostgreSQL; `tenant_id` em toda tabela; RLS como defesa em profundidade |
| Storage | PDFs, logos, fotos | Compatível com S3, privado, URL assinada de curta duração |

### 7.3 Metas não funcionais (propostas, a confirmar)

- Disponibilidade de 99,5% ao mês no piloto; p95 da API abaixo de 500 ms nas leituras comuns.
- Backup diário com recuperação pontual; objetivo de perda máxima de 15 minutos e de retomada em até 4 horas.
- Premissa de volume: dezenas de tenants e centenas de leads por mês cada. Uma instância de API e um worker bastam; o desenho permite escalar horizontalmente.
- Ambientes: desenvolvimento, homologação e produção, com migrations versionadas e sem dados reais fora de produção.

## 8. Decisões de arquitetura (ADRs)

Formato resumido: contexto, decisão, alternativas e consequências. Todas com status **Proposto**, pendentes de aprovação na seção 18.

### ADR-001: Stack e modularidade

**Contexto.** O anexo (§3.1) sugere Next.js, NestJS e PostgreSQL. O produto precisa de site com SEO, painel autenticado, filas, webhooks e geração de PDF. **Decisão.** Manter a stack do anexo como **monólito modular**: um repositório, módulos de domínio isolados, e um worker separado que roda o mesmo código. **Alternativas.** (a) Next.js full-stack sem API separada: menos peças, mas filas, webhooks e PDF ficam frágeis em ambiente serverless. (b) Microsserviços: complexidade operacional sem ganho para o volume previsto. **Consequências.** Facilita transações e testes; exige disciplina de fronteiras entre módulos para permitir extração futura.

### ADR-002: Multi-tenancy e domínios

**Contexto.** O briefing fala em prestadores no plural, cada um com seu site (decisão 1 da seção 18). **Decisão.** Banco compartilhado com `tenant_id` em toda tabela e **RLS do PostgreSQL como defesa em profundidade** (`SET LOCAL app.tenant_id` por transação). Tenant resolvido pelo cabeçalho Host via tabela `tenant_domains`. MVP com subdomínio da plataforma; domínio próprio (verificação de DNS e TLS automático) na Fase A5 ou depois. **Alternativas.** Schema por tenant ou banco por tenant: isolamento maior, migrations e operação muito mais caras. **Consequências.** Custo baixo por tenant; todo teste de integração precisa cobrir acesso cruzado (anexo §3.3).

### ADR-003: WhatsApp, persistir primeiro e notificar depois

**Contexto.** O formulário deve chegar ao WhatsApp do prestador. A API oficial só entrega fora da janela de 24 horas por template aprovado e cobra por mensagem (seção 9.1). **Decisão.** (1) O lead é gravado no banco e só depois notificado por outbox. (2) Canal principal ao prestador: **WhatsApp Cloud API com template de categoria utility**, com fallback automático por e-mail e aviso no painel. (3) O botão wa.me do site (conversa iniciada pelo cliente) coexiste, mas não é o único caminho. (4) Número compartilhado da plataforma no MVP; número por prestador (cadastro incorporado da Meta) na Fase B. **Alternativas.** (a) Só wa.me: custo zero, porém o lead se perde se o cliente não apertar enviar e não há automação. (b) APIs não oficiais: risco de bloqueio e de violar termos de uso; **não recomendado**. (c) Intermediário (BSP) em vez de Meta direto: onboarding mais simples, margem e dependência extras. **Consequências.** Confiabilidade alta; exige conta Meta verificada e aprovação de templates, com prazo fora do nosso controle.

### ADR-004: Google Agenda

**Contexto.** O evento deve ir direto para o Google Agenda com local e horário, e a agenda interna precisa funcionar mesmo sem o Google. **Decisão.** A OS no banco é a **fonte de verdade**. Sincronização **unidirecional** plataforma → Google, com OAuth por usuário, escopo mínimo (preferir `calendar.events`, a confirmar na documentação), id de evento determinístico derivado da OS (idempotência) e `work_order_id` nas propriedades privadas do evento. Feed ICS assinado como alternativa. **Alternativas.** (a) Calendário único da plataforma convidando o instalador: simples, mas a agenda fica fora do controle do prestador. (b) Delegação em todo o domínio: só serve para Google Workspace. **Consequências.** Escopos de calendário são classificados como sensíveis; levar o app para produção exige verificação de consentimento pelo Google, com revisão de vários dias. Iniciar cedo (seção 17). Edições feitas direto no Google não voltam para a plataforma na Fase A (aviso na tela).

### ADR-005: Cobrança por link

**Contexto.** O admin emite link de cobrança ao cliente. Provedores brasileiros pesquisados (Asaas, Mercado Pago, entre outros) oferecem link de pagamento, Pix e webhook. **Decisão.** Interface `PaymentProvider` (criar, consultar, cancelar, validar webhook) com **um adapter inicial** a escolher na seção 18. Cada prestador conecta **a própria conta** do provedor (chave de API criptografada). A plataforma **não custodia dinheiro**. **Alternativas.** (a) Subcontas e split, com a plataforma como intermediária: abre receita, mas traz KYC, risco regulatório e de fraude. (b) Checkout próprio com cartão: escopo PCI, evitar. **Consequências.** Menor risco jurídico; o prestador precisa ter conta no provedor. Validar o modelo com contador e advogado antes do piloto.

### ADR-006: CMS

**Contexto.** O admin edita páginas, FAQ, política de privacidade e mensagens sem depender de desenvolvedor. **Decisão.** CMS próprio com **blocos tipados em JSONB**, validados por esquema, texto rico restrito (sem HTML bruto, com sanitização), versões em rascunho e publicado, e regeneração sob demanda das páginas ao publicar. **Alternativas.** (a) CMS externo (Strapi, Sanity): outro sistema, difícil de tornar multi-tenant. (b) Editor de páginas livre: risco de XSS e de quebra visual. **Consequências.** Controle de segurança e de identidade visual; menos liberdade criativa (dívida D5).

### ADR-007: Estimativa e orçamento são objetos distintos

**Contexto.** O cálculo público atrai leads e não pode virar compromisso comercial. **Decisão.** `lead.estimate` é indicativo (faixa, com aviso); `quote` é formal, com snapshot, versão e aceite (anexo §9). Cálculo **determinístico no backend** com decimal, a partir de tabelas versionadas por tenant. O navegador só exibe. IA não calcula preço (anexo §0.2). **Alternativas.** Planilha externa ou cálculo no frontend: difícil de auditar e fácil de adulterar. **Consequências.** Resultado explicável e testável; exige carga inicial de preços por tenant (dívida D1).

## 9. Integrações

### 9.1 WhatsApp

**Fatos levantados na pesquisa (conferir no painel da Meta antes de orçar):**

- Desde 01/07/2025 a cobrança é por template entregue, e não mais por conversa. As categorias são marketing, utility, authentication e service. Respostas livres dentro da janela de 24 horas aberta pelo cliente não têm custo.
- Fontes de intermediários informam que, a partir de 01/10/2026, templates utility enviados mesmo dentro de uma janela aberta passam a ser cobrados individualmente.
- Ordem de grandeza no Brasil segundo fontes de terceiros: cerca de R$ 0,04 a R$ 0,05 por mensagem utility e R$ 0,31 a R$ 0,38 por marketing. A tabela em reais publicada pela Meta é a referência.
- Uma conta WhatsApp Business brasileira conversa apenas com números brasileiros.

**Mensagens previstas (todas utility; nenhuma de marketing na Fase A):**

| # | Evento | Destinatário | Prio |
| --- | --- | --- | --- |
| 1 | Novo lead | Prestador | P0 |
| 2 | Solicitação de orçamento ou atribuição | Instalador | P0 |
| 3 | Visita agendada ou alterada | Instalador | P0 |
| 4 | Link de cobrança | Cliente | P0 (wa.me na Fase A; template quando houver número do prestador) |
| 5 | Lembrete de visita | Cliente | P1 |

**Regras.**

- **Dois tipos de mensagem.** O texto pré-preenchido do wa.me é livre e editável pelo admin. O corpo do template da API é fixo e aprovado pela Meta: o admin edita apenas variáveis permitidas (nome da empresa, assinatura). Mudar o corpo exige novo template e nova aprovação.
- **Conteúdo mínimo.** Por padrão a mensagem leva nome, serviço, cidade e link para o painel. Incluir telefone e endereço é opção do tenant (decisão 14 da seção 18).
- **Pipeline.** Estados `PENDENTE → ENVIANDO → ENVIADO → ENTREGUE | FALHOU`, retentativas com intervalos crescentes (por exemplo 1, 5 e 30 minutos, máximo de 5), fila de falhas visível no painel e fallback por e-mail. Webhook de status da Meta atualiza o estado. A chave de idempotência é o id do item da outbox.
- **Consentimento.** O aceite do formulário cobre o contato sobre o orçamento solicitado. Registrar data e hora, texto exibido, IP e agente de navegação.
- **Sem sucesso simulado.** Tenant sem configuração vê o canal como “não configurado”; o lead segue por e-mail e painel.

### 9.2 Google Agenda

- **Conexão.** OAuth por usuário. Refresh token criptografado (AES-GCM, chave fora do banco). Estado da conexão: `CONECTADO`, `RECONECTAR`, `DESCONECTADO`.
- **Evento.** Título “\[Empresa\] Instalação — Cliente”, `location` com o endereço completo, início e fim com fuso do tenant, descrição com link da OS e sem dados sensíveis desnecessários, lembretes configuráveis.
- **Ciclo.** Criar, atualizar e cancelar o evento quando a OS for criada, alterada ou cancelada. Falhas vão para a fila com retentativa; token revogado muda o estado para `RECONECTAR` e avisa o admin.
- **Conflitos.** Validação interna antes de salvar: mesmo instalador com intervalos sobrepostos é bloqueado; o admin pode forçar com justificativa registrada.
- **Fora do escopo da Fase A.** Importar alterações feitas no Google (observação por notificações de mudança: P1).

### 9.3 Cobrança

- **Interface.** `createCharge`, `getCharge`, `cancelCharge`, `verifyWebhook`; estorno entra como P1.
- **Estados internos** mapeados dos status do provedor (aguardando, confirmado, recebido, vencido, estornado).
- **Webhook.** Rota pública por provedor e tenant. Verifica autenticidade, grava o evento bruto com unicidade por (provedor, id do evento), responde 2xx rápido e processa de forma assíncrona e idempotente. Job diário reconcilia cobranças pendentes.
- **Valor.** Sempre calculado no backend a partir da versão aprovada do orçamento; cobrança referencia `quote_version_id`. Entrada e saldo parcial: P1.
- **Nota fiscal.** Emissão é responsabilidade do prestador e fica fora do escopo.

### 9.4 PDF do orçamento

- O worker renderiza um template HTML em PDF com navegador headless a partir do **snapshot** da versão do orçamento, garantindo que o documento reproduza exatamente o que foi enviado.
- Conteúdo: dados da empresa, cliente, itens agrupados (equipamento, materiais, mão de obra, condições), validade, número e versão, avisos de estimativa e de que não substitui projeto ou PMOC. **Nunca** inclui custo nem margem.
- Armazenado em storage privado, entregue por URL assinada de curta duração e guardado em cache por versão. O instalador só gera para OS atribuída a ele.

## 10. Modelo de dados

Convenções do anexo (§21): `tenant_id` obrigatório, chaves únicas incluindo o tenant, chaves estrangeiras que respeitam o tenant, exclusão lógica, `created_at`, `updated_at`, `created_by`, valores monetários em `numeric(14,2)` (nunca `float`).

| Tabela | Propósito | Pontos importantes |
| --- | --- | --- |
| `tenants`, `tenant_domains` | Empresa e domínios | Host único globalmente; um domínio principal |
| `users`, `memberships` | Usuários e papéis por tenant | Papel via vínculo; convite com token de uso único |
| `customers`, `service_locations` | Cliente e endereço de atendimento | Endereço com coordenadas opcionais |
| `leads`, `lead_events` | Solicitações do site e histórico | Origem, UTM, `estimate_snapshot`, `consent_id`, status |
| `consents` | Registro de consentimento | Texto exibido, versão da política, IP, agente, data |
| `cms_pages`, `cms_blocks`, `cms_versions` | Conteúdo do site | Rascunho e publicado; tipo e esquema do bloco |
| `faq_items` | Perguntas frequentes | Ordem e publicação |
| `legal_documents` | Política de privacidade e termos | Versionado; vigência; aceite vinculado |
| `catalog_items` | Serviços, materiais, produtos, taxas | Preço e custo de referência (anexo §7) |
| `pricing_tables`, `pricing_rules` | Preço-base e regras do estimador | Versão, vigência, autor |
| `quotes`, `quote_versions`, `quote_items` | Orçamento formal | Snapshot por versão; custo e preço separados |
| `work_orders`, `work_order_notes` | OS e observações do instalador | Início, fim, local, instalador; notas só com acréscimo |
| `calendar_connections`, `calendar_links` | Conexão e vínculo com eventos | Token criptografado; `external_event_id` |
| `charges`, `payment_events` | Cobrança e eventos do provedor | Único (provedor, id do evento); status interno |
| `payment_accounts` | Conta do provedor por tenant | Chave criptografada; modo teste ou produção |
| `outbox`, `message_templates`, `message_logs` | Notificações | Canal, estado, tentativas, próximo envio, erro |
| `files` | Metadados de arquivos | Tenant, tipo, tamanho, hash, chave de storage |
| `audit_log` | Auditoria (anexo §24) | Ator, ação, entidade, antes e depois resumidos, sem dados sensíveis |

**Restrições críticas.**

- Unicidade composta: `(tenant_id, slug)`, `(tenant_id, número do orçamento)`, `(provider, external_event_id)`.
- Um instalador não pode ter duas OS ativas com intervalos sobrepostos (restrição de exclusão por intervalo no PostgreSQL, além da validação na aplicação).
- Orçamento enviado ou aprovado é imutável; mudanças criam nova versão.
- Alteração de catálogo ou tabela de preços nunca altera orçamento já emitido.

## 11. API (contratos de referência)

Segue as convenções do anexo (§22): REST versionada em `/v1`, paginação por cursor, erros padronizados sem vazar detalhes internos. O `tenant_id` nunca vem do corpo da requisição: é derivado da sessão (área autenticada) ou do Host (área pública).

| Rota | Perfil | Observações |
| --- | --- | --- |
| `GET /public/v1/site` | Público | Conteúdo publicado do tenant do Host |
| `POST /public/v1/estimates` | Público | Calcula a faixa; não grava; limite de requisições |
| `POST /public/v1/leads` | Público | Grava lead, estimativa e consentimento; cabeçalho `Idempotency-Key`; campo isca; limite por IP e tenant |
| `GET /public/v1/legal/{slug}` | Público | Versão vigente da política e dos termos |
| `POST /v1/auth/login`, `refresh`, `logout` | Todos | Sessão com expiração e revogação |
| `GET/PATCH /v1/leads`, `/v1/leads/{id}` | Admin | Filtros por status e período |
| `POST /v1/quotes` (a partir de lead) | Admin | Backend recalcula todos os valores |
| `POST /v1/quotes/{id}/versions`, `/send`, `/pdf` | Admin; PDF também Instalador da própria OS | PDF sempre comercial |
| `POST /v1/work-orders` (agendar) | Admin | Valida conflito; enfileira notificação e evento |
| `PATCH /v1/work-orders/{id}`, `POST /{id}/cancel` | Admin | Atualiza ou cancela o evento no Google |
| `GET /v1/me/agenda?from=&to=` | Instalador | Só OS atribuídas a ele |
| `POST /v1/work-orders/{id}/status` | Admin, Instalador da OS | Transições permitidas pela máquina de estados |
| `POST/GET /v1/work-orders/{id}/notes` | Admin, Instalador da OS | Somente acréscimo |
| `POST /v1/charges`, `GET /v1/charges/{id}`, `POST /{id}/cancel` | Admin | Valor vem do orçamento aprovado |
| `PUT /v1/cms/pages/{id}/draft`, `POST /publish`, `/revert` | Admin | Valida esquema e sanitiza texto rico |
| `GET/PUT /v1/settings/pricing-tables` | Admin | Versiona preços e regras |
| `GET /v1/integrations/google/connect`, `/callback`, `DELETE` | Admin, Instalador | Parâmetro de estado anti-CSRF |
| `PUT /v1/integrations/payments` | Admin | Chave do provedor criptografada, nunca devolvida em claro |
| `GET /v1/messages/logs` | Admin | Estado de cada envio e motivo da falha |
| `POST /webhooks/whatsapp` | Meta | Verificação de assinatura; atualiza estado de entrega |
| `POST /webhooks/payments/{provider}/{tenantId}` | Provedor | Autenticidade, idempotência, 2xx rápido |

**Limites iniciais propostos:** 5 leads por hora por IP e tenant; 30 estimativas por hora por IP; tentativas de login com atraso progressivo. Valores a calibrar no piloto.

## 12. Cálculo orçamentário

### 12.1 Regras (alinhadas ao anexo §9.2)

- `subtotal_linha = quantidade × preço_unitário − desconto_linha`
- `subtotal = soma(subtotal_linha)`
- `total = subtotal + taxas_configuradas − desconto_global`, nunca negativo
- Arredondamento por linha para o centavo, no modo configurado (padrão: meio para cima), sempre com decimal exato no backend.
- **Markup** = (preço − custo) ÷ custo. **Margem** = (preço − custo) ÷ preço. Os dois nunca se misturam na tela.
- Desconto acima do limite do papel exige aprovação de quem tem permissão.

### 12.2 Estimador público (faixa)

1. Para cada equipamento, buscar o preço-base na tabela do tenant por tipo de serviço e faixa de capacidade.
2. Somar adicionais por regra: valor fixo ou por unidade (por exemplo, metros de tubulação acima do incluso, altura, infraestrutura elétrica).
3. Somar deslocamento, se a tabela do tenant o definir para a região.
4. `central = base + adicionais + deslocamento`; `mín = central × (1 − margem_inferior)`; `máx = central × (1 + margem_superior)`, com margens configuradas por tenant.
5. Exibir a faixa, as premissas usadas e o aviso de que o valor final depende de avaliação técnica. No modo “somente coleta”, nada de valor é exibido.

### 12.3 Exemplo numérico (valores ilustrativos, não são referência de mercado)

| Parte | Conta | Resultado |
| --- | --- | --- |
| Estimativa pública | 2 instalações × R$ 600,00 = 1.200,00; excedente de 4 m × R$ 80,00 = 320,00; altura R$ 150,00; deslocamento R$ 50,00 | Central R$ 1.720,00 |
| Faixa (−5% e +15%) | 1.720,00 × 0,95 e 1.720,00 × 1,15 | R$ 1.634,00 a R$ 1.978,00 |
| Orçamento formal | Instalação 600,00 + tubulação excedente 4 m × 80,00 = 320,00; subtotal 920,00; desconto global 20,00 | Total R$ 900,00 |
| Custos internos | 380,00 + 4 × 48,00 = 572,00 | Lucro R$ 328,00 |
| Margem e markup | 328 ÷ 900 e 328 ÷ 572 | Margem 36,44%; markup 57,34% |

### 12.4 Sugestão de BTU

Os fatores ficam em tabela editável e versionada, com premissas exibidas e ajuste manual justificado, conforme anexo §8. **Nenhum fator é embutido como verdade universal**; os valores iniciais devem ser validados por responsável técnico antes do uso (dívida D1).

## 13. Segurança e LGPD

**Papéis na LGPD (a validar com advogado).** Para os dados dos clientes finais, o prestador tende a ser o controlador e a plataforma, operadora. Para os dados dos usuários do SaaS, a plataforma é controladora. Isso pede contrato de tratamento de dados entre plataforma e prestador.

**Política de privacidade por tenant.** Modelo preenchido com identificação do prestador, contato do encarregado, finalidades, bases legais, compartilhamentos (provedor de WhatsApp, Google, provedor de pagamento, hospedagem), prazos de retenção e canal para direitos do titular. Versionada, com data de vigência e aceite vinculado ao consentimento do formulário. **Revisão jurídica obrigatória antes do go-live.**

**Controles técnicos.**

- Coleta mínima de dados; retenção configurável com anonimização ou exclusão de leads não convertidos (prazo a definir).
- Tokens e chaves de API criptografados; segredos fora do repositório e dos logs; logs sem dados pessoais.
- HTTPS obrigatório, cabeçalhos de segurança e CSP, cookies de sessão `HttpOnly`, `Secure` e `SameSite`.
- Limite de requisições, campo isca e captcha opcional nos endpoints públicos; validação de tamanho e tipo real dos uploads.
- Webhooks autenticados; callback do OAuth com parâmetro de estado; URLs assinadas e curtas para documentos privados.
- Fontes e scripts servidos pelo próprio domínio, sem chamadas a terceiros que exponham o IP do visitante sem necessidade.
- Auditoria das ações críticas (anexo §24) e testes de acesso cruzado entre tenants em todos os módulos.
- Backups criptografados, restauração testada, e plano de resposta a incidente com prazo de comunicação definido por advogado.

## 14. Design system

Objetivo: uma base única de tokens e componentes para o site público (marca do tenant), o painel Admin e a visão mobile do Instalador, com acessibilidade WCAG 2.1 AA. Como o projeto é novo, não há o que auditar; a regra de governança abaixo evita a dívida que uma auditoria futura encontraria.

### 14.1 Tokens

| Categoria | Token | Valor padrão | Uso |
| --- | --- | --- | --- |
| Cor | `color-primary` | `#0B6E99` (configurável por tenant) | Botões, links, destaques |
| Cor | `color-text` / `color-text-muted` | `#1F2933` / `#52606D` | Texto principal e secundário |
| Cor | `color-surface` / `color-border` | `#FFFFFF` / `#D9E2EC` | Fundos e linhas |
| Cor | `color-success` | `#1A7F4B` | Pago, concluída |
| Cor | `color-warning` | `#9A6700` | Pendente, atenção |
| Cor | `color-danger` | `#C62828` | Erro, vencida, cancelada |
| Tipografia | `font-family` | Pilha do sistema (`system-ui`, `Segoe UI`, `Roboto`, `sans-serif`) | Sem fonte externa: mais rápido e sem requisição a terceiros |
| Tipografia | `font-size` | 12, 14, 16, 18, 20, 24, 30, 36 px; corpo 16 px, entrelinha 1,5 | Escala única |
| Espaçamento | `space` | Base 4 px: 4, 8, 12, 16, 24, 32, 48, 64 | Margens e preenchimentos |
| Borda | `radius` | 4, 8, 12 px e pílula | Campos, cartões, selos |
| Sombra | `shadow` | 3 níveis | Cartões, menus, modais |
| Movimento | `motion` | 150 ms e 250 ms, saída suave; respeita `prefers-reduced-motion` | Transições |
| Layout | `breakpoint` | 360, 640, 768, 1024, 1280 px | Responsividade |

Os contrastes dos valores padrão sobre fundo branco foram calculados em pelo menos 4,5:1 para texto. **Regra para a cor do tenant:** ao salvar, o sistema calcula o contraste da cor primária com branco e do texto sobre ela, escolhe a cor de texto adequada e bloqueia combinações abaixo de 4,5:1.

### 14.2 Componentes essenciais

| Componente | Variantes | Estados | Acessibilidade |
| --- | --- | --- | --- |
| Botão | Primário, secundário, fantasma, perigo | Padrão, foco, pressionado, desabilitado, carregando | Alvo de toque mínimo de 44 px; texto do botão descreve a ação |
| Campo de formulário | Texto, telefone, e-mail, número, área de texto, seleção | Padrão, foco, preenchido, erro, desabilitado | Rótulo visível, erro associado ao campo, máscara sem bloquear colagem |
| Consentimento LGPD | Caixa com link para a política | Marcado, desmarcado, erro | Link abre a política sem perder o formulário |
| Passos do estimador | Linear com barra de progresso | Ativo, concluído, com erro | Anúncio do passo atual para leitor de tela; voltar sem perder dados |
| Faixa de preço | Com premissas, modo somente coleta | Carregando, resultado, erro | Aviso de estimativa sempre visível |
| Cartão | Lead, OS, cobrança | Padrão, selecionado, vazio | Estrutura de título e ação clara |
| Tabela de dados | Lista densa, cartões no celular | Carregando, vazia, erro | Cabeçalhos associados; ordenação por teclado |
| Selo de status | Lead, OS, cobrança, canal | Por estado | Nunca só cor: sempre ícone ou texto |
| Agenda | Dia, semana, lista | Carregando, vazia, conflito | Navegação por teclado; lista como alternativa à grade |
| Editor de blocos (CMS) | Texto, imagem, chamada, lista, FAQ | Rascunho, publicado, alterações pendentes | Campo de texto alternativo da imagem obrigatório |
| Indicador de canal | WhatsApp, Google, Pagamentos | Conectado, não configurado, erro, reconectar | Texto explica o próximo passo |
| Aviso e notificação | Sucesso, informação, atenção, erro | Com ou sem ação | Região de anúncio automática para leitor de tela |

### 14.3 Padrões

- **Formulários:** validação ao sair do campo, resumo de erros no topo ao enviar, mensagens em linguagem simples, estado de envio que impede duplo clique.
- **Navegação:** barra lateral no Admin; barra inferior com Agenda, OS e Perfil para o Instalador; breadcrumbs só em fluxos profundos.
- **Estados obrigatórios** em toda tela de dados: carregando (esqueleto), vazio (com ação sugerida), sucesso e falha (anexo §0.4).
- **Governança:** proibido valor fixo de cor, espaçamento ou fonte fora dos tokens (verificação automática no CI); nomes em minúsculas com hífen; cada componente novo exige documentação com variantes, estados e acessibilidade antes de ser integrado; quebras de compatibilidade exigem nota de migração.

## 15. Dívida técnica prevista e riscos assumidos

Projeto novo: o registro abaixo lista o que estamos escolhendo adiar de forma consciente. Prioridade = (Impacto + Risco) × (6 − Esforço), notas de 1 a 5, em ordem decrescente.

| Id | Item | Categoria | Imp. | Risco | Esf. | Prio. | Tratamento |
| --- | --- | --- | --- | --- | --- | --- | --- |
| D8 | Textos legais sem revisão jurídica no go-live | Documentação | 4 | 5 | 1 | 45 | Bloqueia o piloto; revisão antes da Fase A6 |
| D1 | Preços-base e fatores de BTU genéricos | Arquitetura | 4 | 4 | 2 | 32 | Validar com responsável técnico antes de qualquer tenant real |
| D10 | Observabilidade mínima (logs, alertas, métricas de fila) | Infraestrutura | 3 | 4 | 2 | 28 | Fazer já na A0 e ampliar a cada fase |
| D7 | RLS aplicada apenas em parte das tabelas | Arquitetura | 4 | 5 | 3 | 27 | Cobrir todas as tabelas antes do piloto; testes de acesso cruzado |
| D3 | Sincronização Google só em um sentido | Arquitetura | 3 | 2 | 2 | 20 | Notificações de mudança do Google na Fase B |
| D4 | Um único provedor de pagamento | Arquitetura | 2 | 3 | 2 | 20 | Interface já isola; segundo adapter sob demanda |
| D2 | Número de WhatsApp compartilhado | Arquitetura | 3 | 3 | 3 | 18 | Número por prestador na Fase B |
| D5 | CMS por blocos, com liberdade limitada | Código | 3 | 2 | 3 | 15 | Novos tipos de bloco sob demanda |
| D6 | Sem modo offline para o instalador | Arquitetura | 3 | 3 | 4 | 12 | PWA com fila local na Fase B |
| D9 | PDF por navegador headless (consumo e manutenção) | Dependência | 2 | 2 | 3 | 12 | Medir; trocar por biblioteca de PDF se o custo pesar |

**Plano de remediação junto às entregas.** D8, D1, D10 e D7 entram como critérios de saída das fases A0 e A6. D3, D4 e D2 são reavaliados após os primeiros 3 prestadores em produção. D5, D6 e D9 só se tratam com evidência de dor real.

## 16. Testes e critérios de aceite

**Unitários.** Cálculo de orçamento e estimador (arredondamento, desconto acima do limite, total nunca negativo, regras por vigência); máquinas de estado; mapeamento de status do provedor de pagamento; geração do id de evento do Google.

**Integração.** Acesso cruzado entre dois tenants em todas as rotas e tabelas; RLS; outbox com falha, retentativa e fallback por e-mail; webhook repetido sem duplicar efeito; conflito de horário do instalador, inclusive concorrente; sanitização do texto rico; PDF reproduz o snapshot e não contém custo nem margem.

**Ponta a ponta.** Visitante envia formulário com consentimento, prestador é notificado, admin cria orçamento, agenda a visita, o evento aparece no Google com local e horário, o instalador vê a OS no celular, exporta o PDF e registra observações, o admin gera a cobrança e o pagamento em ambiente de testes atualiza o status.

**Negativos obrigatórios.** Instalador tentando ver OS de outro instalador ou rotas de custo, margem e cobrança; envio de formulário sem consentimento; automação de spam; chamada do webhook com assinatura inválida; token do Google revogado; WhatsApp indisponível; valor de cobrança adulterado pelo navegador.

**Definição de pronto da Fase A**

- [ ] Dois tenants de teste não acessam dados um do outro em nenhuma rota.
- [ ] Lead do site é gravado com consentimento e notificado por WhatsApp ou, na falha, por e-mail.
- [ ] Estimativa e orçamento são calculados no backend com decimal, com testes de borda.
- [ ] O PDF reproduz o snapshot e não mostra custo nem margem.
- [ ] Uma OS agendada aparece no Google Agenda do instalador com local e horário corretos.
- [ ] O instalador só vê as próprias OS, exporta o PDF e registra observações.
- [ ] O link de cobrança é gerado, pago em ambiente de testes e refletido no status; webhook repetido não duplica.
- [ ] Política de privacidade publicada, versionada e revisada por advogado.
- [ ] Site sem bloqueios de acessibilidade e SEO nos fluxos principais (WCAG 2.1 AA).
- [ ] Backups restauráveis, logs, alertas e roteiro de operação definidos.

## 17. Roadmap da Fase A

Esforço relativo (P, M, G) em vez de prazos, porque depende do tamanho da equipe.

| Fase | Entrega vertical | Critério de saída | Esforço |
| --- | --- | --- | --- |
| A0 Fundação | Repositório, CI, ambientes, autenticação, multi-tenant com RLS, permissões, auditoria, tokens do design system, observabilidade mínima | Dois tenants isolados; login por papel; pipeline verde | M |
| A1 Site e CMS | Domínio → tenant, páginas, FAQ, política versionada, SEO, formulário com consentimento, lead e outbox por e-mail | Site de teste publicado; lead chega por e-mail e painel | M |
| A2 Estimador e orçamento | Tabelas de preço, estimador, orçamento interno com versões, PDF | Totais validados por testes; PDF sem custo | G |
| A3 WhatsApp | Adapter da Cloud API, templates, estado de entrega, fallback, log no painel | Lead notifica o prestador em conta de testes; falha cai no e-mail | M |
| A4 Agenda e Instalador | OS, conflito, Google OAuth e sincronização, ICS, visão mobile, observações, PDF | Teste ponta a ponta do lead ao evento no Google | G |
| A5 Cobrança | Adapter do provedor, link, webhook, reconciliação | Pagamento em testes muda o status; replay não duplica | M |
| A6 Piloto | Ponta a ponta, carga leve, revisão jurídica e LGPD, restauração de backup, onboarding de 1 a 3 prestadores | Definição de pronto da seção 16 cumprida | M |

**Prazos externos que devem começar na A0**, porque não dependem só de código: conta Meta Business verificada, número e submissão dos templates utility; projeto no Google Cloud, tela de consentimento e pedido de verificação; conta de testes do provedor de pagamento; revisão jurídica; validação dos preços e fatores com responsável técnico; domínio, DNS e e-mail transacional (SPF e DKIM).

**Uso com o Claude Code.** Entregue este documento e o anexo, e instrua: o escopo vigente é este documento; o anexo é referência de engenharia e backlog da Fase B; o prompt do §29 do anexo continua valendo, com a Etapa 1 (diagnóstico) antes de qualquer código e uma entrega vertical por vez, na ordem A0 a A6.

## 18. Decisões em aberto

Marque o que concordar e comente o que quiser mudar. Cada item traz a recomendação inicial.

- [ ] **1. Multi-tenant desde o início** (vários prestadores na mesma plataforma). Recomendo sim.
- [ ] **2. Domínio do site:** subdomínio da plataforma no MVP e domínio próprio do prestador depois. Recomendo sim.
- [ ] **3. Número de WhatsApp:** compartilhado da plataforma no MVP, número por prestador na Fase B. Recomendo sim.
- [ ] **4. Acesso ao WhatsApp:** Meta direto ou intermediário (BSP). Recomendo avaliar 2 intermediários antes de decidir.
- [ ] **5. Provedor de pagamento inicial** (Asaas, Mercado Pago ou outro), usando a conta do próprio prestador. Recomendo comparar tarifas e cobertura de Pix em conta de testes.
- [ ] **6. Google Agenda:** OAuth por usuário com ICS como alternativa. Recomendo sim e iniciar a verificação do app já na A0.
- [ ] **7. Estimador:** exibir faixa de preço ou apenas coletar dados, por tenant. Recomendo suportar os dois, com padrão de faixa.
- [ ] **8. Quem valida** a tabela de preços-base e os fatores de BTU iniciais (responsável técnico).
- [ ] **9. Impostos** no orçamento: incluir ou apenas valores comerciais (anexo §30, item 5).
- [ ] **10. Desconto:** quem pode conceder e qual o limite padrão.
- [ ] **11. Retenção de leads** não convertidos. Sugestão de partida: 12 meses, a validar juridicamente.
- [ ] **12. Revisão jurídica** da política de privacidade, dos termos e do contrato com o prestador: quem faz e quando.
- [ ] **13. Hospedagem:** região (sugestão: Brasil) e provedor de storage.
- [ ] **14. Dados na mensagem de WhatsApp:** mínimo (nome, serviço, cidade, link) ou completo (com telefone e endereço). Recomendo mínimo por padrão, configurável.
- [ ] **15. Papel Atendimento** na Fase A ou como P1. Recomendo P1.
- [ ] **16. Nome, identidade visual e modelo de preço do SaaS.** Pode esperar o piloto.

## 19. Fontes consultadas

Pesquisa feita em 01/11/2026. Preços e regras de WhatsApp, Google e provedores mudam com frequência e devem ser reconferidos nas páginas oficiais antes de decidir.

**Concorrentes e práticas do setor**

- https://www.produttivo.com.br/blog/software-para-pmoc-digital/
- https://www.produttivo.com.br/llms.txt
- https://www.produttivo.com.br/blog/aplicativo-para-tecnico-de-campo/
- https://www.capterra.com/p/201778/Auvo/reviews/
- https://www.g2.com/products/auvo-technology/discuss
- https://infraspeak.com/en/compare/field-control-alternative
- https://iclass.com.br/utilities-segment/?lang=en
- https://webarcondicionado.com.br/leankeep-software-de-manutencao-predial-auxilia-na-elaboracao-do-pmoc
- https://www.shiftflow.app/pt-br/free-tools/hvac-work-order-template
- https://www.shiftflow.app/pt-br/free-tools/hvac-estimate-generator

**PMOC e normas**

- https://portal.crea-sc.org.br/nota-tecnica-do-confea-orienta-quanto-a-fiscalizacao-em-sistemas-de-climatizacao/
- https://webarcondicionado.com.br/pmoc-lei-sobre-qualidade-do-ar-interior-esta-perto-de-ser-sancionada
- https://cvs.saude.sp.gov.br/up/EDEMILSON%20Projeto%20AVAC.pdf
- https://proadi.ufms.br/files/2023/05/PLANO-PMOC-CPAN.pdf

**WhatsApp, Google Agenda e pagamentos**

- https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing.md
- https://www.courier.com/guides/whatsapp-pricing
- https://support.zenvia.com/kb/en/article/600343/preguntas-frecuentes-nuevas-reglas-de-cobro-de-whatsapp-business
- https://www.messagecentral.com/en-in/blog/whatsapp-business-api-pricing-brazil
- https://montymobile.com/newsroom/whatsapp-business-api-pricing-the-complete-2026-cost-guide-for-enterprise-teams/
- https://developers.google.com/workspace/calendar/create-events?hl=ar
- https://www.nuget.org/packages/ToolUp.Calendar.Google/
- https://github.com/api-evangelist/asaas
- https://www.mercadopago.com.br/blog/checkout-transparente-mp-evite-mudanca-pagina

## Dark mode

Tema escuro opcional apenas no painel admin, via classe `dark` no elemento raiz e persistência em `localStorage` (`theme`). Tokens definidos em `packages/ui/src/tokens.css`.
