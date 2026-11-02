# Especificação funcional e técnica — SaaS de gestão para instalação e manutenção de ar-condicionado

**Tipo:** Documento-base de produto e implementação  
**Público:** Claude Code / equipe de engenharia  
**Status:** Especificação inicial para orientar descoberta, arquitetura e desenvolvimento incremental  
**Idioma da aplicação:** Português do Brasil (pt-BR)  
**Moeda e formatação padrão:** BRL (R$), datas `dd/MM/yyyy`, fuso horário configurável por empresa  

---

## 0. Instruções de execução para o Claude Code

Você é o agente responsável por analisar, projetar e implementar este produto. Este documento descreve o comportamento esperado do sistema, não autoriza reescrever indiscriminadamente o projeto.

### 0.1 Antes de alterar qualquer código

1. Leia integralmente `AGENTS.md`, `CLAUDE.md`, `README.md`, documentos em `docs/` e instruções locais existentes. Respeite as regras do repositório.
2. Inspecione a estrutura do projeto, `package.json`, gerenciador de pacotes, scripts, framework, banco, migrations, autenticação, autorização, padrões de API, componentes visuais e testes.
3. Identifique o que já está implementado. Não duplique módulos, entidades, componentes ou integrações existentes.
4. Apresente um diagnóstico curto com:
   - stack e arquitetura identificadas;
   - funcionalidades existentes que podem ser reaproveitadas;
   - lacunas em relação a esta especificação;
   - riscos técnicos e dependências;
   - sequência de implementação proposta.
5. Se o repositório já possuir decisões arquiteturais, mantenha-as. Não introduza uma segunda arquitetura em paralelo.
6. Se o repositório estiver vazio, use a arquitetura de referência da seção 3, ajustando somente o que for necessário e registrando as decisões.

### 0.2 Regras obrigatórias de desenvolvimento

- Trabalhe em entregas verticais pequenas: banco de dados, backend, interface, testes e documentação de cada módulo.
- Preserve funcionalidades existentes e compatibilidade das APIs, salvo quando uma alteração for necessária e documentada.
- Não faça refatorações amplas fora do escopo da funcionalidade atual.
- Não implemente regras de negócio importantes somente no frontend. Valide-as também no backend.
- Não confie em `tenant_id`, `user_id`, preço, custo, permissões ou IDs enviados pelo navegador sem validar a sessão e o escopo no servidor.
- Use transações nas operações que alterem simultaneamente orçamento, estoque, ordem de serviço e financeiro.
- Use consultas parametrizadas. Nunca concatene dados do usuário em SQL.
- Não introduza bibliotecas ou serviços pagos sem justificar a necessidade e registrar a decisão. Prefira recursos já disponíveis no projeto.
- Não use dados reais de clientes em fixtures, logs ou testes.
- Não exponha informações de uma empresa para outra. O isolamento entre empresas é requisito crítico.
- Não considere uma funcionalidade concluída sem validações, tratamento de erros, testes relevantes e estados de carregamento/vazio/erro na interface.
- Não invente integrações. Quando um serviço externo ainda não estiver configurado, crie uma interface/adapter e apresente o recurso como não configurado, sem simular sucesso.
- Não use IA para decidir autonomamente preço final, dimensionamento definitivo, conformidade técnica ou segurança da instalação. IA pode auxiliar; regras determinísticas e aprovação humana continuam sendo a fonte de verdade.
- Não declare conformidade legal/técnica automática. PMOC, ART/TRT, procedimentos e garantias devem ser configuráveis e revisados por profissional habilitado.

### 0.3 Como trabalhar com dúvidas

Se uma regra não estiver especificada e puder causar perda financeira, movimentação incorreta de estoque, exposição de dados ou comportamento irreversível, pare essa parte e apresente a dúvida com alternativas. Para decisões de baixo risco, escolha a solução mais simples, registre a premissa e siga.

### 0.4 Critério de conclusão por módulo

Um módulo só pode ser considerado concluído quando:

- os fluxos descritos estiverem implementados;
- autorização e isolamento por empresa estiverem validados;
- entradas tiverem validação no backend;
- erros forem claros e não vazarem detalhes internos;
- interface contemplar loading, vazio, sucesso e falha;
- operações críticas tiverem testes automatizados;
- documentação de uso/API/migração estiver atualizada;
- não houver regressão nos testes existentes.

---

## 1. Visão do produto

### 1.1 Objetivo

Construir um SaaS multiempresa para profissional autônomo e empresas que vendem, instalam e fazem manutenção de ar-condicionado. O sistema deve administrar o ciclo completo do serviço:

**Lead/cliente → levantamento técnico → orçamento → aprovação → agendamento → separação de materiais → execução → aceite → apuração de custos e lucro → garantia → pós-venda/manutenção.**

A proposta principal não é ser apenas um emissor de ordem de serviço. O produto deve ajudar a empresa a:

- responder solicitações e elaborar orçamentos mais rapidamente;
- padronizar o levantamento e a execução de instalações;
- planejar agenda e equipes;
- evitar falta, desperdício e perda de materiais;
- conhecer o custo e a rentabilidade de cada serviço;
- manter histórico confiável de cada equipamento instalado;
- transformar uma instalação pontual em relacionamento recorrente.

### 1.2 Público-alvo

1. Técnico autônomo que executa instalações e manutenções.
2. Pequena instaladora com proprietário, atendente e poucos técnicos.
3. Empresa de climatização com equipes, estoque, contratos e rotinas administrativas.
4. Operação maior que precisa de permissões, indicadores, rastreabilidade e gestão multiunidade.

### 1.3 Princípios do produto

- **Mobile-first na execução:** técnico deve conseguir consultar e atualizar uma ordem de serviço pelo celular.
- **Operação simples:** formulários curtos, dados reaproveitados e automações úteis.
- **Rastreabilidade:** alterações importantes devem deixar histórico de autor, data e conteúdo.
- **Dados conectados:** cliente, endereço, equipamento, orçamento, ordem de serviço, materiais, custos e garantia devem estar relacionados.
- **Preço transparente:** o cálculo do orçamento precisa permitir entender os componentes do valor.
- **Configuração por empresa:** preços, checklists, custos, regras de garantia e parâmetros de cálculo não devem ficar hardcoded.
- **Evolução por módulos:** funcionalidades avançadas não podem bloquear o fluxo essencial de instalação.

### 1.4 Fora do escopo inicial

Não implementar no primeiro MVP, salvo se já existir no projeto:

- contabilidade fiscal completa;
- emissão fiscal própria ou substituição de contador/ERP;
- folha de pagamento;
- marketplace de técnicos;
- roteirização avançada com otimização matemática;
- rastreamento GPS contínuo obrigatório;
- integração nativa com todos os fabricantes de ar-condicionado;
- diagnóstico automático de defeitos com responsabilidade técnica;
- monitoramento IoT de temperatura;
- geração automática de ART/TRT ou assinatura profissional;
- cobrança recorrente integrada a adquirentes sem definição do provedor.

---

## 2. Escopo funcional e prioridades

### 2.1 MVP — fluxo principal que precisa funcionar ponta a ponta

1. Cadastro da empresa, usuários, clientes e endereços de atendimento.
2. Cadastro de catálogo de serviços, produtos e materiais.
3. Cadastro de equipamentos/modelos e equipamentos instalados nos clientes.
4. Criação de levantamento técnico e orçamento detalhado.
5. Compartilhamento do orçamento por link e registro de aprovação/recusa.
6. Conversão de orçamento aprovado em ordem de serviço.
7. Agendamento de técnico/equipe.
8. Reserva e baixa de materiais vinculados à ordem de serviço.
9. Execução com checklist, fotos, dados técnicos e aceite do cliente.
10. Apuração dos custos reais e rentabilidade do serviço.
11. Registro de garantia da instalação e histórico do equipamento.
12. Dashboard básico e relatórios operacionais.

### 2.2 Pós-MVP — módulos de expansão

- portal autenticado do cliente;
- QR Code por equipamento;
- manutenção preventiva e contratos recorrentes;
- PMOC e gestão documental;
- notificações WhatsApp/e-mail/SMS;
- aplicação PWA/offline para técnicos;
- assinatura eletrônica avançada, se houver provedor;
- integração com gateways de pagamento e emissão fiscal;
- IA como assistente de orçamento e atendimento;
- base técnica por fabricante/modelo e biblioteca de códigos de erro;
- monitoramento IoT e integrações com controladores externos.

### 2.3 Legenda de prioridade

- **P0:** indispensável para o MVP.
- **P1:** importante para uma versão comercial competitiva.
- **P2:** expansão posterior.

---

## 3. Arquitetura de referência

> Esta seção é uma referência para projeto novo. Se o repositório já tiver stack e padrões definidos, adapte a especificação à realidade encontrada e não migre a stack sem autorização.

### 3.1 Stack de referência

- **Frontend:** Next.js + React + TypeScript.
- **UI:** Tailwind CSS + shadcn/ui, com componentes reutilizáveis e acessíveis.
- **Backend:** NestJS + TypeScript, API REST versionada.
- **Banco:** PostgreSQL.
- **Persistência:** SQL parametrizado por camada de repositórios/serviço de banco; usar ORM somente se já fizer parte do projeto ou houver decisão explícita.
- **Validação:** DTOs e validação backend com a biblioteca já adotada pelo repositório. Validar também no frontend para experiência do usuário.
- **Arquivos:** armazenamento de objetos compatível com S3/GCS ou serviço já existente. Guardar metadados no PostgreSQL.
- **Autenticação:** sessão/JWT com estratégia já adotada pelo projeto; refresh/expiração e revogação tratados com segurança.
- **Jobs:** fila ou scheduler para notificações, lembretes e tarefas assíncronas; não executar tarefas demoradas dentro de requests HTTP.
- **Testes:** unitários, integração de API/repositório e E2E dos principais fluxos.
- **Monorepo:** não adotar automaticamente; respeitar a estrutura atual.

### 3.2 Organização lógica sugerida

Backend NestJS, caso novo:

```text
src/
  modules/
    auth/
    tenants/
    users/
    customers/
    locations/
    catalog/
    equipment/
    leads/
    surveys/
    quotes/
    scheduling/
    work-orders/
    inventory/
    costs/
    warranties/
    after-sales/
    dashboard/
    files/
    notifications/
    audit/
  common/
    auth/
    decorators/
    guards/
    filters/
    interceptors/
    pipes/
    database/
    storage/
```

Frontend Next.js, caso novo:

```text
src/
  app/
    (auth)/
    (app)/
      dashboard/
      clientes/
      catalogo/
      equipamentos/
      orcamentos/
      agenda/
      ordens-servico/
      estoque/
      financeiro/
      garantias/
      relatorios/
      configuracoes/
  components/
    ui/
    layout/
    forms/
    data-table/
  features/
    customers/
    quotes/
    work-orders/
    inventory/
    scheduling/
  lib/
    api/
    auth/
    formatters/
    permissions/
    validations/
```

Os diretórios são sugestão, não obrigação. Evite criar camadas abstratas sem necessidade.

### 3.3 Multi-tenancy e isolamento de dados — requisito crítico

O SaaS deve suportar várias empresas (`tenants`) na mesma instalação.

Regras:

1. Toda entidade operacional pertence a uma empresa por `tenant_id`.
2. O `tenant_id` deve ser derivado da identidade/sessão e do vínculo ativo do usuário no backend, nunca aceito cegamente do body/query.
3. Toda consulta, atualização, exclusão e associação deve restringir o escopo ao tenant autenticado.
4. IDs de outro tenant devem retornar resposta indistinguível de recurso inexistente, evitando enumeração.
5. Usuário pode pertencer a mais de uma empresa somente se o produto suportar explicitamente essa relação; nesse caso deve haver seleção/escopo ativo validado no servidor.
6. Índices únicos devem considerar tenant quando o valor não for global: por exemplo `(tenant_id, sku)`.
7. Arquivos devem ser organizados e autorizados por tenant; URL temporária não pode ser pública permanentemente para documentos privados.
8. Testes automatizados devem tentar acessar dados de outro tenant em todos os módulos principais.
9. Avaliar Row Level Security do PostgreSQL somente se a arquitetura e conexão permitirem aplicá-la corretamente; ela complementa, não substitui, autorização da aplicação.

### 3.4 Segurança e LGPD

- Coletar somente dados necessários ao serviço.
- Proteger CPF, telefone, endereço, documentos, fotos e assinaturas.
- Definir política de retenção e exclusão/anonimização conforme obrigações legais e operacionais.
- Registrar consentimento/base legal pertinente para comunicação de marketing quando aplicável.
- Não incluir segredos, tokens, dados pessoais ou conteúdo de documentos em logs.
- Criptografar tráfego e usar criptografia de armazenamento oferecida pela infraestrutura.
- Validar tipo, tamanho e extensão real dos arquivos; limitar upload e impedir execução de arquivos.
- Usar URLs assinadas e de curta duração para documentos privados.
- Implementar rate limit em autenticação, links públicos de orçamento e endpoints sensíveis.
- Registrar auditoria de ações críticas sem armazenar dados excessivos.

---

## 4. Modelo de usuários, papéis e permissões

### 4.1 Papéis iniciais

| Papel | Responsabilidade | Acesso padrão |
|---|---|---|
| Proprietário | Dono da conta e da operação | Total, incluindo assinatura/plano e configurações críticas |
| Administrador | Configuração e operação | Quase total, sem transferência de propriedade quando aplicável |
| Atendimento/Vendas | Clientes, leads e orçamentos | CRM, levantamentos e orçamentos; sem custo interno completo por padrão |
| Gestor operacional | Agenda, equipes e ordens | Agenda, estoque operacional e execução |
| Técnico | Execução em campo | Apenas ordens atribuídas, dados necessários do cliente e materiais da tarefa |
| Financeiro | Custos, recebimentos e relatórios | Financeiro e rentabilidade conforme permissão |
| Leitura | Consulta | Leitura dos módulos explicitamente permitidos |

### 4.2 Permissões granulares

Não basear todo o acesso exclusivamente no nome do papel. Implementar permissões por ação e recurso, por exemplo:

- `customers.read`, `customers.create`, `customers.update`, `customers.delete`;
- `quotes.read`, `quotes.create`, `quotes.send`, `quotes.approve_internal`, `quotes.discount`;
- `quotes.cost.read`, `quotes.margin.read`;
- `work_orders.assign`, `work_orders.execute`, `work_orders.close`;
- `inventory.read`, `inventory.adjust`, `inventory.consume`;
- `finance.read`, `finance.manage`;
- `settings.manage`, `users.manage`.

O sistema deve permitir configurar papéis e permissões em fase posterior. No MVP, papéis padrão podem mapear para um conjunto fixo de permissões, desde que a verificação seja centralizada.

### 4.3 Acesso do técnico

- Técnico só visualiza ordens atribuídas ou liberadas a sua equipe.
- Não deve visualizar margem, custo de compra, lucro ou dados financeiros por padrão.
- Pode consultar endereço, contato operacional, equipamento, checklist e materiais da ordem.
- Pode registrar execução, fotos, observações, consumo e devolução de materiais conforme permissão.

---

## 5. Módulo de empresa e configurações

**Prioridade:** P0

### Objetivo

Armazenar os dados da empresa e parâmetros que controlam documentos, preços, agenda e operação.

### Funcionalidades

- Razão/nome fantasia, CNPJ opcional, logo, endereço e contatos.
- Fuso horário, moeda e formatos regionais.
- Numeração de orçamento e ordem de serviço.
- Prazo padrão de validade do orçamento.
- Parâmetros comerciais: margem-alvo, desconto máximo por papel, preço de deslocamento, valor/hora técnico e política de arredondamento.
- Parâmetros técnicos de cálculo de BTU, apresentados como referência editável e sujeitos a validação profissional.
- Configuração de garantia padrão por tipo de serviço e regras de cobertura.
- Horário de funcionamento, dias úteis e duração padrão dos serviços.
- Modelos de mensagens e documentos.

### Regras

- Configurações são isoladas por tenant.
- Alteração de preço/custo não altera retroativamente orçamentos enviados ou aprovados.
- Mudanças em parâmetros técnicos devem registrar autor e data.
- Campos de identificação fiscal não devem ser obrigatórios para autônomo quando não forem necessários ao uso.

---

## 6. CRM: clientes, contatos e locais de atendimento

**Prioridade:** P0

### Objetivo

Manter cadastro central de clientes e seus endereços. Um cliente pode possuir vários imóveis/locais e cada local pode conter vários equipamentos.

### Entidades principais

**Customer**

- `id`, `tenant_id`;
- `type`: `PERSON` ou `COMPANY`;
- `name`;
- `document` (CPF/CNPJ, opcional conforme contexto);
- `email`, `phone`, `whatsapp`;
- `notes`;
- `status`: ativo/inativo;
- `created_at`, `updated_at`, `deleted_at`.

**CustomerContact** (opcional no MVP, recomendado para empresa)

- cliente, nome, função, telefone, e-mail e indicador de contato principal.

**ServiceLocation**

- `id`, `tenant_id`, `customer_id`;
- apelido do local (ex.: Matriz, Apartamento, Loja 02);
- CEP, logradouro, número, complemento, bairro, cidade, UF;
- referência e instruções de acesso;
- coordenadas opcionais, somente se houver uso justificado;
- horário/restrição de acesso;
- `created_at`, `updated_at`.

### Funcionalidades

- Busca por nome, documento, telefone e e-mail.
- Cadastro rápido durante criação do orçamento.
- Vários endereços para o mesmo cliente.
- Histórico cronológico de orçamentos, instalações, manutenções, equipamentos e garantias.
- Detecção de possíveis duplicidades por documento/telefone dentro do mesmo tenant.
- Importação CSV em fase posterior.

### Critérios de aceite

- É possível criar cliente e local de atendimento sem sair do fluxo do orçamento.
- Não é possível associar a ordem de serviço a local pertencente a outro cliente/tenant.
- A listagem não exibe dados de outra empresa.

---

## 7. Catálogo de serviços, produtos, materiais e mão de obra

**Prioridade:** P0

### Objetivo

Centralizar os itens utilizados em orçamentos e instalações, separando o que é vendido do que é consumido.

### Tipos de item

- `SERVICE`: serviço (instalação, higienização, visita técnica etc.).
- `MATERIAL`: material consumível (tubo de cobre, cabo, dreno, isolamento etc.).
- `PRODUCT`: equipamento/produto vendido (split, condensadora, evaporadora etc.).
- `LABOR`: mão de obra, caso o projeto prefira modelá-la como item específico.
- `FEE`: taxa/deslocamento/adicional.

### Campos

- código/SKU, descrição, categoria e unidade (`UN`, `M`, `KG`, `H`, `KIT` etc.);
- preço de venda padrão;
- custo de referência;
- controla estoque (sim/não);
- ativo/inativo;
- fornecedor preferencial opcional;
- para materiais: unidade de compra e fator de conversão para unidade de consumo, se necessário;
- para serviços: duração estimada e checklist padrão opcional.

### Regras

- Preço e custo usados em um orçamento devem ser copiados como snapshot para o item do orçamento.
- Alterar catálogo não muda orçamento antigo.
- Item inativo não pode ser adicionado a um novo orçamento, mas continua aparecendo no histórico.
- Não permitir unidade incompatível sem conversão explícita.

---

## 8. Equipamentos e levantamento técnico

**Prioridade:** P0 para cadastro/histórico; P1 para levantamento avançado

### Objetivo

Representar o equipamento vendido/instalado e registrar informações do ambiente antes do orçamento.

### Catálogo de modelos

**EquipmentModel**

- fabricante/marca;
- modelo;
- categoria (split hi-wall, piso-teto, cassete, janela, multi-split etc.);
- capacidade nominal em BTU/h;
- tecnologia/tipo de ciclo (frio/quente-frio);
- tensão e fase, quando conhecidas;
- eficiência/refrigerante e especificações adicionais opcionais;
- observações e origem dos dados.

**InstalledEquipment**

- cliente e local;
- modelo/catálogo associado (opcional);
- marca/modelo informados manualmente;
- capacidade BTU/h;
- número de série da evaporadora e condensadora, quando aplicável;
- data de instalação;
- empresa/técnico instalador;
- ordem de serviço de origem;
- status (ativo, removido, substituído, inativo);
- garantia de produto e garantia de instalação em registros separados;
- QR Code identificador.

### Levantamento técnico

Registrar antes de orçar, sempre que necessário:

- tipo e uso do ambiente;
- comprimento, largura e altura;
- área e volume calculados;
- quantidade média de pessoas;
- exposição solar (configuração simplificada: baixa/média/alta);
- equipamentos que geram calor;
- quantidade de janelas e características relevantes;
- pavimento/altura e condição de acesso;
- distância estimada entre unidades;
- metragem de tubulação prevista;
- necessidade de suporte, dreno, circuito elétrico ou infraestrutura adicional;
- fotos do ambiente e pontos de instalação;
- observações e restrições.

### Calculadora de capacidade/BTU

- Criar serviço de domínio isolado para cálculo estimativo.
- Parâmetros e fatores precisam ser configuráveis por tenant ou por tabela de referência administrada.
- Mostrar a memória do cálculo: dimensões, premissas e fatores aplicados.
- Permitir ajuste manual justificado pelo profissional.
- Exibir aviso: resultado é estimativa inicial e requer validação técnica no local; não substitui projeto ou avaliação profissional.
- Não escolher equipamento automaticamente sem registrar a regra e permitir confirmação humana.
- Não codificar uma fórmula única como verdade universal.

### Critérios de aceite

- O levantamento pode ser vinculado ao cliente, local e orçamento.
- Uma alteração posterior no modelo de equipamento não modifica o snapshot de uma instalação já executada.
- Toda recomendação de BTU apresenta parâmetros e permite revisão manual.

---

## 9. Orçamento inteligente de instalação

**Prioridade:** P0 — núcleo comercial do produto

### Objetivo

Criar orçamento detalhado, consistente e explicável, reduzindo trabalho manual e permitindo estimar custos e margem antes da execução.

### 9.1 Composição do orçamento

Um orçamento pode conter:

1. Equipamentos/produtos.
2. Serviço de instalação por equipamento ou conjunto.
3. Materiais calculados pela metragem/quantidade.
4. Mão de obra adicional.
5. Deslocamento.
6. Adicionais (altura, acesso difícil, trabalho em horário especial, infraestrutura elétrica, bomba de dreno etc.).
7. Descontos.
8. Taxas/impostos, somente conforme configuração e sem alegar substituição fiscal.

Cada linha deve possuir:

- descrição;
- tipo de item;
- quantidade e unidade;
- preço unitário de venda;
- custo unitário estimado (interno);
- desconto;
- total de venda;
- observações;
- origem: catálogo, cálculo, inclusão manual ou IA sugerida;
- snapshot dos dados utilizados.

### 9.2 Regras de cálculo

Para cada item:

`subtotal_linha = quantidade × preço_unitário - desconto_linha`

Para o orçamento:

`subtotal = soma(subtotais_linha)`

`total = subtotal + taxas_configuradas - desconto_global`

Regras adicionais:

- Nunca permitir total negativo.
- Descontos devem respeitar permissão e limite configurado.
- Arredondamento monetário deve ser consistente, usando precisão decimal no backend; não usar `float` binário para dinheiro.
- Custo, preço, margem e impostos devem ser mantidos separados.
- Definir se os valores exibidos incluem impostos conforme configuração; essa definição precisa aparecer no documento.
- O frontend nunca é fonte definitiva do total. O backend recalcula todos os valores.

### 9.3 Cálculo de materiais

Criar regras editáveis para sugerir quantidades com base no tipo/capacidade de instalação e no levantamento. Exemplos de itens configuráveis:

- tubulação de cobre por bitola;
- isolamento térmico;
- cabo de comunicação/energia;
- mangueira/tubo de dreno;
- canaleta;
- suporte;
- parafusos e buchas;
- fita, acabamento e consumíveis;
- disjuntor/circuito ou infraestrutura, quando aplicável.

Não presumir metragem ou bitola universal. Cada regra deve conter:

- condição de aplicação;
- unidade;
- quantidade sugerida ou fórmula simples configurável;
- margem técnica/perda opcional;
- versão e data de vigência;
- autor da alteração.

O usuário pode ajustar quantidades antes de enviar o orçamento. A sugestão deve ser identificada como estimativa.

### 9.4 Formação de preço e margem

O sistema deve diferenciar:

- **Markup:** acréscimo aplicado ao custo.
- **Margem:** percentual do preço de venda que sobra após os custos considerados.

Não tratar os dois conceitos como equivalentes.

Disponibilizar dois modos configuráveis:

1. preço unitário informado manualmente;
2. preço sugerido por custo + markup ou margem-alvo.

O sistema deve mostrar internamente:

- receita prevista;
- custo estimado de materiais;
- custo estimado de mão de obra;
- deslocamento e terceiros;
- lucro/contribuição estimada;
- margem estimada.

Não exibir custos e margem ao cliente final. O acesso interno deve depender de permissão.

### 9.5 Ciclo de vida do orçamento

Estados sugeridos:

`DRAFT → READY_TO_SEND → SENT → VIEWED → APPROVED | REJECTED | EXPIRED | CANCELLED`

- `DRAFT`: editável.
- `READY_TO_SEND`: passou por validações para envio.
- `SENT`: link/documento enviado.
- `VIEWED`: cliente acessou a proposta, se houver rastreio permitido.
- `APPROVED`: cliente aceitou ou usuário interno registrou aceite com evidência.
- `REJECTED`: cliente recusou, com motivo opcional.
- `EXPIRED`: prazo terminou sem aceite.
- `CANCELLED`: cancelado por usuário autorizado.

Ao reenviar proposta com alterações comerciais relevantes, criar nova versão. Não sobrescrever silenciosamente conteúdo já enviado/aprovado.

### 9.6 Link público de orçamento

- Token aleatório, não sequencial, armazenado com hash quando viável.
- Data de expiração configurável.
- Mostrar somente conteúdo comercial permitido: empresa, itens, condições, total, validade e observações públicas.
- Nunca mostrar custos, margens, notas internas, IDs internos ou dados de outros clientes.
- Registrar eventos de visualização sem coletar dados excessivos.
- Permitir aceitar/recusar; exigir identificação mínima e confirmação explícita.
- Salvar data/hora, versão aceita, texto de aceite, nome informado e evidência técnica disponível (ex.: IP com política de retenção definida).
- Não apresentar aceite simples como assinatura digital qualificada.

### 9.7 Conversão em ordem de serviço

- Somente orçamento aprovado pode ser convertido, salvo permissão de exceção com motivo auditado.
- Converter a versão aceita, não a versão mais recente se houver divergência.
- Criar ordem de serviço e copiar itens, quantidades, preços e escopo como snapshot.
- Evitar conversão duplicada usando transação e restrição de unicidade/idempotência.

### Critérios de aceite do orçamento

- Total é recalculado no servidor e bate com a soma das linhas.
- Alterar preço do catálogo não altera proposta já enviada.
- Usuário sem permissão não visualiza custo ou margem.
- Link público não expõe informação interna.
- Aceite guarda exatamente a versão aprovada.
- Não é possível converter o mesmo orçamento duas vezes.

---

## 10. Agenda e despacho de equipes

**Prioridade:** P0

### Objetivo

Planejar execução, alocar técnicos e evitar conflitos de agenda.

### Recursos

- visualização diária, semanal e mensal;
- filtros por técnico, equipe, status, tipo de serviço e região;
- atribuição de um ou mais técnicos;
- duração prevista;
- endereço e instruções de acesso;
- janela de atendimento;
- bloqueios de agenda, folgas e indisponibilidade;
- reatribuição e reagendamento com motivo;
- status e linha do tempo.

### Regras

- Alertar ou impedir sobreposição de agendamentos do mesmo técnico conforme configuração.
- Considerar duração prevista e intervalo configurável entre atendimentos.
- Não prometer cálculo de trânsito/roteirização no MVP.
- Reagendamento deve registrar autor, data e motivo.
- Mudanças de agenda devem gerar evento para futura notificação.
- Uma ordem pode ter equipe e responsável principal.

### Estados de agendamento

`UNSCHEDULED`, `SCHEDULED`, `CONFIRMED`, `IN_PROGRESS`, `COMPLETED`, `RESCHEDULED`, `CANCELLED`, `NO_SHOW`.

A ordem de serviço e o agendamento são conceitos relacionados, mas não devem compartilhar obrigatoriamente o mesmo estado. Uma OS pode continuar aberta após o agendamento ser concluído, por exemplo, aguardando validação administrativa.

### Critérios de aceite

- Gestor consegue atribuir técnico e horário.
- Sistema alerta conflitos e permite exceção somente a usuário autorizado.
- Técnico visualiza agenda própria e detalhes necessários.
- Reagendamento gera histórico.

---

## 11. Ordem de serviço e execução em campo

**Prioridade:** P0 — núcleo operacional

### Objetivo

Transformar o escopo aprovado em instrução de trabalho rastreável e registrar o que realmente foi executado.

### 11.1 Dados da ordem

- número sequencial por tenant;
- cliente e local;
- orçamento e versão de origem;
- tipo de serviço: instalação, manutenção, higienização, visita, reparo, retirada, reinstalação ou outro configurável;
- equipamentos envolvidos;
- equipe/técnicos;
- data e janela de atendimento;
- escopo contratado;
- itens e materiais previstos;
- instruções e riscos informados;
- status;
- anexos e evidências.

### 11.2 Estados da ordem

Sugestão:

`OPEN → SCHEDULED → ASSIGNED → IN_PROGRESS → WAITING_CUSTOMER | WAITING_PARTS | COMPLETED → REVIEWED → CLOSED`

Estados alternativos: `CANCELLED`, `ON_HOLD`.

- `OPEN`: criada e ainda não planejada.
- `SCHEDULED`: possui horário.
- `ASSIGNED`: equipe definida.
- `IN_PROGRESS`: técnico iniciou execução.
- `WAITING_CUSTOMER`: depende do cliente/acesso/decisão.
- `WAITING_PARTS`: depende de material.
- `COMPLETED`: execução declarada concluída pelo técnico.
- `REVIEWED`: conferida pelo gestor, se a empresa usar aprovação.
- `CLOSED`: encerramento administrativo.

Implementar transições válidas centralizadas no backend. Não permitir qualquer mudança arbitrária de status via endpoint genérico.

### 11.3 Checklist técnico

- Checklists são templates por tipo de serviço/equipamento.
- Itens podem ser obrigatórios, opcionais ou condicionais.
- Tipos de resposta: sim/não, texto, número com unidade, seleção, data, foto/arquivo e assinatura.
- Registrar responsável, horário e resposta.
- Permitir bloquear conclusão quando um item obrigatório estiver pendente.
- Versionar templates; ordens existentes mantêm a versão usada ao iniciar.
- Templates não devem impor procedimento técnico universal sem validação de profissional responsável.

Exemplos configuráveis para instalação:

- confirmar local e modelo do equipamento;
- registrar número de série;
- conferir local de evaporadora e condensadora;
- registrar metragem de linha;
- registrar materiais efetivamente utilizados;
- registrar testes e medições definidos pela empresa/procedimento técnico;
- registrar fotos antes/depois;
- confirmar limpeza e organização do local;
- orientar cliente sobre uso e cuidados;
- coletar aceite.

### 11.4 Evidências

- Fotos antes, durante e depois.
- Documentos e anexos.
- Observação técnica.
- Autor e data de cada evidência.
- Relação da evidência com OS, equipamento e item do checklist.
- Compressão/thumbnail quando aplicável, sem perda do original necessário.

### 11.5 Assinatura/aceite do cliente

- Registrar nome, confirmação de aceite, data/hora, OS e versão do termo.
- Capturar assinatura desenhada apenas como evidência de aceite simples, com identificação do método.
- Integrar provedor de assinatura eletrônica em etapa futura se necessário.
- Não afirmar validade de assinatura qualificada sem provedor e requisitos correspondentes.

### 11.6 Relatório de execução

Gerar documento/PDF com:

- identificação da empresa e cliente;
- endereço;
- número da OS;
- data e técnicos;
- equipamentos;
- serviços e materiais realizados;
- checklist e medições configuradas;
- fotos selecionadas;
- observações;
- aceite do cliente;
- garantia aplicável e orientações.

O relatório deve preservar o snapshot da execução. Reemissão posterior não pode alterar silenciosamente o histórico original.

### Critérios de aceite

- Técnico só inicia OS atribuída ou autorizada.
- Não é possível finalizar com checklist obrigatório pendente.
- Fotos e anexos ficam vinculados à OS correta e isolados por tenant.
- O gestor consegue revisar e encerrar sem apagar evidências.
- A OS concluída alimenta estoque, custos, equipamento instalado e garantia de forma transacional ou por processo idempotente.

---

## 12. Estoque por instalação, depósito e veículo

**Prioridade:** P0 básico; P1 estoque por veículo/kits

### Objetivo

Saber o que existe, onde está, o que foi reservado e o que foi efetivamente consumido em cada OS.

### 12.1 Conceitos

- **Produto/material:** item controlado.
- **Local de estoque:** depósito, loja ou veículo.
- **Saldo:** quantidade por item e local.
- **Movimentação:** entrada, saída, transferência, ajuste, reserva, consumo, devolução ou perda.
- **Reserva:** quantidade comprometida com uma OS, mas ainda não consumida.
- **Consumo:** baixa efetiva durante a execução.

### 12.2 Funcionalidades

- cadastro de depósitos e veículos;
- entradas por compra/ajuste;
- transferência entre locais;
- reserva automática ou manual ao agendar/confirmar OS;
- separação de materiais;
- baixa do consumo real pelo técnico;
- devolução de material não utilizado;
- registro de perda/avaria com motivo;
- alerta de estoque mínimo;
- histórico por item e local;
- kits padrão de instalação configuráveis;
- inventário e ajuste com permissão.

### 12.3 Regras de consistência

- O saldo deve ser derivado ou mantido a partir de um ledger de movimentações imutável; não depender somente de um campo editável de quantidade.
- Toda movimentação deve guardar tenant, item, local de origem/destino, quantidade, unidade, custo unitário quando aplicável, usuário, data, motivo e referência (OS/compra/ajuste).
- Transferência deve debitar origem e creditar destino na mesma transação.
- Reserva não é consumo. Cancelamento/reagendamento deve liberar ou preservar reserva conforme regra configurada.
- Consumo vinculado à OS deve ser idempotente para evitar baixa duplicada.
- Por padrão, impedir saldo negativo. Se a empresa permitir, exigir permissão e registrar alerta/auditoria.
- Ajuste manual exige motivo e permissão.
- Custo do material consumido deve usar método definido (ex.: custo médio ponderado); escolher e documentar um método único no MVP.
- Mudanças futuras no custo de compra não alteram o custo histórico já atribuído à OS.

### 12.4 Estoque em veículo

Cada veículo pode ser um local de estoque. O gestor transfere material do depósito para o veículo; técnico consome da carga disponível na execução.

### 12.5 Kit de instalação

Template de kit pode sugerir materiais padrão conforme capacidade/tipo de instalação. Não baixar automaticamente o kit inteiro sem confirmação do que foi efetivamente utilizado.

### Critérios de aceite

- Transferência mantém saldo consistente em origem/destino.
- Não ocorre consumo duplicado em retentativas.
- Relatório mostra previsto, reservado, consumido, devolvido e perdido por OS.
- Usuário sem permissão não realiza ajustes.

---

## 13. Rentabilidade por instalação e financeiro operacional

**Prioridade:** P0 para custos e margem; P1 para contas a receber/pagar

### Objetivo

Comparar o previsto no orçamento com o realizado e indicar se a instalação gerou resultado positivo.

### 13.1 Componentes de custo

- materiais efetivamente consumidos;
- mão de obra interna (horas × custo/hora configurado ou custo atribuído);
- mão de obra terceirizada;
- deslocamento/combustível/pedágio;
- comissão;
- locação/equipamentos adicionais;
- despesas específicas atribuídas à OS;
- outros custos diretos configuráveis.

Não incluir automaticamente despesas administrativas rateadas no lucro por OS sem regra explícita. Separar custo direto e rateio gerencial.

### 13.2 Fórmulas gerenciais

Definir e documentar uma base consistente:

`receita_bruta_servico = soma dos valores comerciais da OS - descontos comerciais`

`receita_liquida_gerencial = receita_bruta_servico - tributos/taxas configurados como dedução`

`custo_direto_real = materiais + mao_de_obra + deslocamento + terceiros + comissoes + outros_custos_diretos`

`resultado_direto = receita_liquida_gerencial - custo_direto_real`

`margem_direta_percentual = (resultado_direto / receita_liquida_gerencial) × 100`, quando receita líquida for maior que zero.

Os nomes devem ser apresentados como indicadores gerenciais, não como apuração contábil/fiscal oficial.

### 13.3 Previsto versus realizado

Mostrar:

- receita prevista e final;
- custo estimado e realizado por categoria;
- diferença absoluta e percentual;
- quantidade prevista e consumida de materiais;
- horas estimadas e realizadas;
- margem estimada versus margem final;
- motivo de desvios, quando informado.

### 13.4 Recebimentos e sinal

No MVP, registrar manualmente valores recebidos:

- valor;
- meio de pagamento;
- data;
- referência/observação;
- usuário que registrou.

Permitir sinal, pagamento parcial e saldo pendente. Não marcar uma ordem como financeiramente quitada apenas porque foi concluída.

Integração com gateway e conciliação automática ficam para fase posterior.

### 13.5 Permissões

- Técnico não vê custo, preço de compra, lucro ou margem por padrão.
- Vendas pode ver valor de venda e desconto permitido.
- Financeiro/gestor autorizado vê rentabilidade.
- Alteração manual de custo real exige justificativa e auditoria.

### Critérios de aceite

- O custo real utiliza o snapshot do custo do material no momento do consumo.
- Reprocessar OS não duplica custos.
- Margem é calculada no backend e tem denominador claramente definido.
- Interface diferencia estimativa de valor realizado.

---

## 14. Garantia e chamados de pós-venda

**Prioridade:** P0 básico; P1 fluxo de chamados completo

### Objetivo

Controlar a garantia do serviço de instalação separadamente da garantia de fábrica do equipamento e organizar solicitações posteriores.

### 14.1 Tipos de garantia

- garantia de instalação/serviço;
- garantia do equipamento/fabricante;
- garantia de peça/material;
- garantia adicional concedida pela empresa.

Cada registro deve indicar responsável, período, início, fim, condições, documento e origem.

### 14.2 Geração da garantia

Ao concluir/revisar a OS:

- permitir criar garantia automaticamente conforme regra vigente;
- definir início (data de conclusão, aceite ou outra regra configurável);
- definir duração por tipo de serviço/equipamento;
- salvar snapshot dos termos e política aplicada;
- vincular ao equipamento instalado e à OS de origem.

Não alterar garantias emitidas quando a configuração padrão mudar.

### 14.3 Solicitação de garantia

Criar chamado com:

- cliente, local, equipamento e garantia relacionada;
- data e descrição da solicitação;
- anexos/fotos;
- triagem e classificação;
- decisão: coberto, não coberto, cortesia ou pendente de avaliação;
- justificativa obrigatória para negativa;
- equipe responsável e agenda;
- custos e resultado do atendimento;
- histórico de comunicação.

Estados sugeridos:

`OPEN → TRIAGE → APPROVED | DENIED | NEEDS_INFORMATION → SCHEDULED → IN_PROGRESS → RESOLVED → CLOSED`

### 14.4 Alertas

- aviso interno de garantia próxima do vencimento;
- acompanhamento de chamados parados;
- lembrete de revisão pós-instalação;
- comunicação ao cliente somente conforme preferências/consentimento aplicável.

### Critérios de aceite

- Garantia de instalação não é confundida com garantia do fabricante.
- Chamado de garantia aponta para equipamento e serviço original.
- Negativa exige motivo.
- Alteração de política não modifica garantias existentes.

---

## 15. Pós-venda, manutenção preventiva e contratos recorrentes

**Prioridade:** P1

### Objetivo

Aumentar retenção e gerar novas oportunidades depois da instalação.

### Funcionalidades

- tarefas de acompanhamento após instalação;
- lembrete para primeira revisão;
- agenda de manutenção por equipamento;
- campanhas segmentadas por tipo de equipamento, cidade ou data, respeitando consentimento;
- registro de contato e resultado;
- conversão de atendimento em orçamento/OS;
- contratos recorrentes com periodicidade, escopo, locais/equipamentos cobertos e valor;
- geração de visitas/OS futuras a partir do contrato;
- controle de vigência, renovação e cancelamento.

### Regras

- Não criar OS duplicada ao executar novamente um job.
- Visitas geradas por contrato precisam guardar a versão do contrato e ciclo de origem.
- Cancelar contrato não apaga histórico ou OS realizadas.
- Lembretes devem permitir pausar/opt-out conforme configuração aplicável.

---

## 16. Portal do cliente, QR Code e histórico do equipamento

**Prioridade:** P1

### Objetivo

Permitir que o cliente acompanhe serviços e consulte o histórico dos equipamentos sem depender de contato manual com a empresa.

### Portal do cliente

- acesso por convite, senha ou link seguro com expiração;
- consulta dos próprios locais e equipamentos;
- consulta de orçamentos e seu status;
- aceite/recusa de propostas;
- acompanhamento de agendamentos;
- consulta de relatórios e garantias;
- abertura de solicitação;
- atualização de dados de contato conforme política da empresa.

### QR Code por equipamento

- identificador público aleatório, sem ID sequencial;
- QR Code direciona para página segura do equipamento;
- exibição pública mínima: identificação amigável e canal de contato da empresa;
- dados completos exigem autenticação/autorização;
- permitir revogar ou regenerar o identificador;
- não expor nome completo, telefone, endereço detalhado, documentos ou histórico privado sem autenticação.

### Critérios de aceite

- Cliente A nunca consulta equipamentos/documentos do cliente B.
- Link expirado/revogado não concede acesso.
- QR Code não contém dados pessoais codificados diretamente.

---

## 17. PMOC e gestão documental de manutenção

**Prioridade:** P2, ou P1 caso o público-alvo principal inclua contratos corporativos

### Objetivo

Organizar equipamentos, planos de manutenção, cronogramas, evidências e documentos associados a rotinas de climatização.

### Funcionalidades potenciais

- inventário de equipamentos por cliente/local;
- plano e periodicidade de atividades;
- cronograma preventivo;
- geração de ordens de serviço programadas;
- histórico de execução e pendências;
- anexos e relatórios;
- responsáveis e documentos técnicos aplicáveis;
- controle de versão e validade documental;
- alertas de atividades atrasadas.

### Cuidados

- O software organiza registros e documentos, mas não substitui avaliação de profissional habilitado.
- Não afirmar que um PMOC gerado automaticamente está legalmente completo.
- Estruturas, campos, modelos e obrigações precisam ser validados conforme legislação vigente e orientação de responsável técnico.
- Não gerar ART/TRT como se o documento tivesse sido emitido por conselho/profissional.

---

## 18. Assistente de IA e automações inteligentes

**Prioridade:** P2

### Objetivo

Reduzir digitação e ajudar atendimento/técnico sem delegar decisões críticas ao modelo.

### Casos de uso possíveis

1. Transformar descrição em linguagem natural em rascunho de orçamento.
2. Extrair dados de texto/foto enviados pelo cliente, sempre sujeitos à confirmação.
3. Sugerir perguntas que faltam no levantamento.
4. Resumir histórico do cliente/equipamento.
5. Gerar mensagem de envio de orçamento.
6. Organizar observações técnicas em relatório.
7. Sugerir categoria de atendimento ou checklist, com confirmação.

### Regras de segurança e confiabilidade

- IA não define preço final; o motor determinístico recalcula valores.
- IA não confirma capacidade/instalação segura; profissional valida.
- Conteúdo gerado deve ser marcado como sugestão até aprovação.
- Não enviar dados pessoais a provedores sem avaliar contrato, finalidade e política de privacidade.
- Registrar versão do modelo/provedor e origem dos dados quando for relevante à auditoria.
- Fornecer fallback manual se a IA estiver indisponível.
- Limitar custo e volume por tenant.

---

## 19. Dashboard e relatórios

**Prioridade:** P0 básico; P1 avançado

### Dashboard operacional

- orçamentos aguardando resposta;
- orçamentos aprovados no período;
- instalações agendadas para hoje/semana;
- OS em andamento;
- OS aguardando material/cliente;
- chamados de garantia abertos;
- alertas de estoque mínimo.

### Dashboard comercial

- quantidade e valor de orçamentos;
- taxa de conversão por período;
- tempo médio entre solicitação e envio;
- ticket médio;
- origem do lead, se registrada.

### Dashboard financeiro gerencial

- receita vendida/recebida;
- custos diretos realizados;
- resultado direto estimado/realizado;
- margem por tipo de serviço;
- rentabilidade por técnico/equipe, com cuidado para não criar indicador injusto sem contexto.

### Filtros

- intervalo de datas;
- técnico/equipe;
- tipo de serviço;
- cliente;
- status;
- local/unidade.

### Regras

- Definir claramente o significado de cada KPI e seu período.
- Não somar valor orçado, vendido e recebido como se fossem a mesma métrica.
- Aplicar permissões a métricas financeiras.
- Agregações pesadas devem ser paginadas, otimizadas ou pré-calculadas quando necessário.

---

## 20. Notificações e integrações

**Prioridade:** P1

### Eventos que podem disparar notificações

- orçamento enviado;
- orçamento visualizado;
- orçamento aprovado/recusado;
- agendamento criado/alterado;
- técnico atribuído;
- lembrete de atendimento;
- OS concluída e relatório disponível;
- garantia próxima do vencimento;
- manutenção preventiva próxima;
- contrato próximo da renovação.

### Canais

- e-mail;
- WhatsApp Business API ou provedor oficial;
- SMS, se necessário;
- notificações internas.

### Arquitetura

- Criar interface de provedor (`NotificationProvider`) e adapters específicos.
- Guardar status de envio, destinatário, template, tentativas, erro normalizado e referência externa.
- Envio assíncrono com fila, retentativa e backoff.
- Idempotência por evento/canal/destinatário para evitar mensagens duplicadas.
- Templates por tenant com variáveis permitidas.
- Nunca registrar token/chave do provedor em logs.
- Não marcar mensagem enviada antes da confirmação do provedor.

---

## 21. Modelo de dados conceitual

O Claude Code deve mapear o modelo ao banco existente e gerar migrations incrementais. A lista abaixo é conceitual e pode ser normalizada conforme a arquitetura.

### 21.1 Tabelas centrais

| Entidade | Finalidade | Relações principais |
|---|---|---|
| `tenants` | Empresa/conta SaaS | Usuários, clientes e dados operacionais |
| `users` | Usuários de acesso | Vínculos com empresas |
| `tenant_users` | Associação usuário/empresa/papel | Tenant e usuário |
| `roles` / `permissions` | Controle de acesso | Tenant ou papéis padrão |
| `customers` | Clientes | Locais, contatos, orçamentos, equipamentos |
| `customer_contacts` | Contatos do cliente | Cliente |
| `service_locations` | Endereços de atendimento | Cliente, equipamentos, OS |
| `catalog_items` | Serviços/produtos/materiais | Orçamentos, estoque |
| `equipment_models` | Catálogo de modelos | Equipamentos instalados |
| `installed_equipment` | Equipamento real do cliente | Local, OS, garantias, QR |
| `surveys` | Levantamento técnico | Cliente, local, orçamento |
| `survey_photos` | Evidências do levantamento | Levantamento, arquivo |
| `quotes` | Cabeçalho do orçamento | Cliente, local, levantamento |
| `quote_versions` | Versões imutáveis enviadas | Orçamento |
| `quote_items` | Linhas do orçamento | Versão, item de catálogo snapshot |
| `quote_public_tokens` | Links públicos seguros | Versão/orçamento |
| `appointments` | Agendamento | OS, local, equipe |
| `teams` / `team_members` | Equipes | Usuários |
| `work_orders` | Ordem de serviço | Orçamento, cliente, local |
| `work_order_items` | Itens contratados/previstos | OS, catálogo snapshot |
| `checklist_templates` | Modelos de checklist | Tenant, tipo de serviço |
| `checklist_template_versions` | Versões de checklist | Template |
| `work_order_checklist_items` | Respostas da execução | OS, versão do template |
| `files` | Metadados de arquivos | Tenant e entidade de origem |
| `warehouses` | Depósito/veículo | Tenant |
| `inventory_balances` | Saldo materializado por local | Item e depósito; opcional se saldo for calculado |
| `inventory_movements` | Ledger de estoque | Item, origem/destino, OS |
| `inventory_reservations` | Reserva por OS | Item, local, OS |
| `labor_entries` | Horas/custos de mão de obra | OS, usuário |
| `work_order_expenses` | Custos adicionais | OS |
| `payments_received` | Recebimentos registrados | Cliente/OS |
| `warranties` | Garantias | Equipamento, OS |
| `warranty_claims` | Chamados de garantia | Garantia, OS |
| `maintenance_contracts` | Contratos recorrentes | Cliente, local/equipamento |
| `maintenance_schedules` | Agenda preventiva | Contrato, equipamento |
| `notifications` | Fila/histórico de mensagens | Tenant e entidade |
| `audit_logs` | Auditoria | Tenant, usuário, entidade |

### 21.2 Campos técnicos comuns

Nas tabelas operacionais, avaliar:

- `id` UUID;
- `tenant_id` UUID não nulo;
- `created_at`, `updated_at` com timezone;
- `created_by`, `updated_by` quando houver ator;
- `deleted_at` apenas para entidades que aceitam exclusão lógica;
- versão/controle de concorrência em agregados críticos, se necessário.

Não adicionar `deleted_at` indiscriminadamente. Movimentações, aceites e logs devem ser imutáveis ou corrigidos por eventos compensatórios.

### 21.3 Índices e restrições

Criar índices conforme consultas reais, considerando ao menos:

- `(tenant_id, created_at)` em listagens por empresa;
- `(tenant_id, status)` nas filas operacionais;
- `(tenant_id, customer_id)` nas relações;
- unicidade `(tenant_id, number)` para orçamento/OS;
- unicidade `(tenant_id, sku)` quando SKU informado;
- chaves estrangeiras compostas ou validações que impeçam relações cross-tenant;
- restrição de idempotência para conversão de orçamento e movimentações originadas por eventos.

### 21.4 Dinheiro e precisão

- Usar `NUMERIC/DECIMAL` no banco para preços, custos, taxas e margens.
- Definir escala e arredondamento de forma consistente.
- Não usar `FLOAT/REAL` para valores monetários.
- Manter moeda na empresa/documento, ainda que inicialmente só BRL.

---

## 22. API — contratos de referência

A API deve respeitar convenções já existentes. Se o projeto não tiver convenção, usar REST versionada (`/api/v1`) e respostas consistentes.

### 22.1 Endpoints sugeridos

**Clientes**

```text
GET    /api/v1/customers
POST   /api/v1/customers
GET    /api/v1/customers/:id
PATCH  /api/v1/customers/:id
GET    /api/v1/customers/:id/history
POST   /api/v1/customers/:id/locations
```

**Catálogo/equipamentos**

```text
GET    /api/v1/catalog-items
POST   /api/v1/catalog-items
PATCH  /api/v1/catalog-items/:id
GET    /api/v1/equipment-models
POST   /api/v1/installed-equipment
GET    /api/v1/installed-equipment/:id
```

**Levantamento/orçamento**

```text
POST   /api/v1/surveys
GET    /api/v1/surveys/:id
POST   /api/v1/surveys/:id/files
POST   /api/v1/surveys/:id/calculate-capacity
POST   /api/v1/quotes
GET    /api/v1/quotes
GET    /api/v1/quotes/:id
PATCH  /api/v1/quotes/:id
POST   /api/v1/quotes/:id/versions
POST   /api/v1/quotes/:id/send
POST   /api/v1/quotes/:id/convert-to-work-order
GET    /api/v1/public/quotes/:token
POST   /api/v1/public/quotes/:token/accept
POST   /api/v1/public/quotes/:token/reject
```

**Agenda/ordens**

```text
GET    /api/v1/appointments
POST   /api/v1/appointments
PATCH  /api/v1/appointments/:id
POST   /api/v1/work-orders
GET    /api/v1/work-orders
GET    /api/v1/work-orders/:id
POST   /api/v1/work-orders/:id/assign
POST   /api/v1/work-orders/:id/start
POST   /api/v1/work-orders/:id/pause
POST   /api/v1/work-orders/:id/complete
POST   /api/v1/work-orders/:id/review
POST   /api/v1/work-orders/:id/close
POST   /api/v1/work-orders/:id/checklist-responses
POST   /api/v1/work-orders/:id/files
POST   /api/v1/work-orders/:id/customer-acceptance
```

**Estoque/custos/garantia**

```text
GET    /api/v1/inventory/balances
POST   /api/v1/inventory/movements
POST   /api/v1/inventory/transfers
POST   /api/v1/work-orders/:id/reservations
POST   /api/v1/work-orders/:id/material-consumption
POST   /api/v1/work-orders/:id/material-returns
POST   /api/v1/work-orders/:id/labor-entries
POST   /api/v1/work-orders/:id/expenses
GET    /api/v1/work-orders/:id/profitability
POST   /api/v1/work-orders/:id/payments
GET    /api/v1/warranties
POST   /api/v1/warranty-claims
PATCH  /api/v1/warranty-claims/:id
```

Estes endpoints são contratos ilustrativos. Ajustar nomes, verbos e agrupamentos ao padrão já existente.

### 22.2 Paginação e filtros

- Listagens devem ser paginadas no servidor.
- Permitir filtros explícitos e documentados.
- Ordenação deve usar campos permitidos por whitelist.
- Evitar trazer todos os registros para filtrar no frontend.
- Respostas devem incluir metadados de paginação conforme padrão do projeto.

### 22.3 Erros

Padronizar erros de validação, autorização, conflito de estado e falha interna. Não retornar stack trace, query SQL, token ou dado sensível.

Exemplos conceituais:

- `400 VALIDATION_ERROR` — campos inválidos;
- `401 UNAUTHENTICATED` — sessão ausente/inválida;
- `403 FORBIDDEN` — sem permissão;
- `404 NOT_FOUND` — inexistente ou fora do escopo;
- `409 BUSINESS_RULE_CONFLICT` — transição inválida, estoque insuficiente ou duplicidade;
- `500 INTERNAL_ERROR` — falha inesperada com correlation ID.

---

## 23. Interface e experiência do usuário

### 23.1 Navegação inicial

- Dashboard
- Clientes
- Equipamentos
- Catálogo
- Orçamentos
- Agenda
- Ordens de serviço
- Estoque
- Financeiro/Rentabilidade
- Garantias
- Relatórios
- Configurações

Esconder módulos sem permissão, mas manter autorização efetiva no backend.

### 23.2 Padrões de UX

- Layout responsivo com prioridade para desktop administrativo e celular do técnico.
- Interface minimalista, consistente e acessível.
- Formulários divididos em etapas quando longos.
- Máscaras e formatação para CPF/CNPJ, telefone, CEP e moeda sem alterar o valor canônico.
- Busca com debounce e estados claros.
- Tabelas com filtros, paginação, ordenação e ações coerentes.
- Confirmação para operações irreversíveis ou financeiramente relevantes.
- Skeleton/loading, estado vazio com orientação, feedback de sucesso e erro acionável.
- Não depender exclusivamente de cor para representar status.
- Evitar modal sobre modal e formulários extensos sem salvamento.
- No celular, priorizar ações do técnico: iniciar, pausar, checklist, foto, material, observação e concluir.

### 23.3 Telas essenciais do MVP

1. Login/seleção de empresa.
2. Dashboard.
3. Lista/detalhe/criação de cliente.
4. Detalhe do local e equipamentos.
5. Catálogo de itens.
6. Levantamento técnico.
7. Editor de orçamento.
8. Prévia/link público do orçamento.
9. Agenda.
10. Lista/detalhe da OS.
11. Tela mobile de execução.
12. Estoque e movimentações.
13. Rentabilidade por OS.
14. Garantias.
15. Usuários/permissões/configurações.

---

## 24. Auditoria, eventos e consistência

### Eventos que precisam de auditoria

- criação/alteração de cliente e endereço;
- mudança de preço/custo de catálogo;
- alteração de orçamento enviado/aprovado;
- aceite/recusa do cliente;
- conversão para OS;
- atribuição/reagendamento;
- transição de estado da OS;
- consumo/devolução/ajuste/transferência de estoque;
- alteração de custo real;
- conclusão e encerramento;
- criação/alteração de garantia;
- alteração de permissão/configuração.

### Registro mínimo

- tenant;
- usuário/ator ou origem do processo;
- ação;
- entidade e identificador;
- data/hora;
- valores anteriores e posteriores quando apropriado, com cuidado para não copiar dados sensíveis;
- correlation ID.

### Processos assíncronos

Notificações, lembretes, geração de documentos pesados e tarefas recorrentes devem ser processados com controle de tentativas, idempotência e observabilidade.

---

## 25. Estratégia de testes

### 25.1 Unitários

- cálculo monetário e arredondamento;
- cálculo estimativo de BTU e memória de cálculo;
- cálculo de quantidade sugerida de materiais;
- descontos, markup e margem;
- transições de orçamento e OS;
- cálculo de custo/margem;
- regras de garantia;
- permissões por papel/ação.

### 25.2 Integração

- isolamento multi-tenant em cada repositório/serviço;
- conversão de orçamento em OS;
- movimentação e reserva de estoque;
- consumo/devolução de materiais;
- conclusão da OS e criação de garantia;
- idempotência de jobs e notificações;
- upload e acesso a arquivos.

### 25.3 E2E obrigatório — fluxo principal

1. Criar tenant e usuário administrador.
2. Criar cliente e endereço.
3. Criar equipamento/modelo ou item de catálogo.
4. Registrar levantamento técnico.
5. Criar orçamento com equipamento, instalação e materiais.
6. Conferir cálculo no backend.
7. Enviar e abrir link público.
8. Aceitar orçamento.
9. Converter em OS sem duplicidade.
10. Agendar e atribuir técnico.
11. Reservar material.
12. Técnico inicia OS, responde checklist, registra fotos e consumo.
13. Concluir e obter aceite.
14. Apurar custo real e margem.
15. Criar garantia e visualizar histórico do equipamento.
16. Confirmar que outro tenant não consegue consultar nenhum dos registros.

### 25.4 Cenários negativos obrigatórios

- usuário tenta acessar ID de outro tenant;
- técnico tenta abrir OS não atribuída;
- desconto acima do limite;
- orçamento expirado tenta ser aceito;
- orçamento é convertido duas vezes;
- estoque insuficiente;
- request de consumo repetido;
- checklist obrigatório incompleto;
- conclusão de OS em estado inválido;
- link público expirado/revogado;
- tentativa de consultar margem sem permissão;
- arquivo com tipo/tamanho inválido.

---

## 26. Roadmap recomendado de implementação

A implementação deve ser incremental. Não tente criar todos os módulos em uma única alteração.

### Fase 0 — diagnóstico e fundação

- analisar repositório e instruções;
- validar arquitetura, autenticação e banco;
- definir tenant e permissões;
- preparar padrões de resposta, erros, auditoria e testes;
- desenhar migrations iniciais.

**Saída:** arquitetura documentada e fundação multi-tenant testada.

### Fase 1 — cadastros e catálogo

- empresa/configurações;
- usuários e papéis;
- clientes/locais/contatos;
- catálogo de serviços, produtos e materiais;
- modelos e equipamentos instalados.

**Saída:** cadastros utilizáveis e isolados por empresa.

### Fase 2 — levantamento e orçamento

- levantamento técnico;
- estimativa de capacidade com configuração;
- motor de materiais/preços;
- orçamento, versões e link público;
- aceite/recusa e conversão idempotente.

**Saída:** cliente aceita um orçamento e o sistema gera uma OS coerente.

### Fase 3 — agenda e execução

- agenda e equipe;
- OS e transições;
- checklist versionado;
- fotos/anexos;
- aceite e relatório.

**Saída:** técnico executa instalação pelo celular e deixa histórico completo.

### Fase 4 — estoque e rentabilidade

- depósitos/veículos;
- movimentos/reservas/consumo/devolução;
- horas e despesas;
- custos previstos e reais;
- indicadores por OS.

**Saída:** empresa sabe o material consumido e a rentabilidade gerencial de cada serviço.

### Fase 5 — garantia e pós-venda

- garantias;
- chamados;
- tarefas e lembretes;
- portal básico do cliente/QR Code.

**Saída:** histórico e pós-venda conectados à instalação original.

### Fase 6 — expansão

- contratos recorrentes;
- manutenção preventiva e PMOC;
- WhatsApp/e-mail e integrações;
- PWA/offline;
- IA assistiva;
- monitoramento IoT.

**Saída:** plataforma ampliada sem comprometer o fluxo principal.

---

## 27. Backlog inicial em épicos

O Claude Code deve transformar estes épicos em tarefas pequenas no mecanismo de planejamento disponível no repositório.

| Épico | Resultado esperado | Prioridade |
|---|---|---|
| EP01 — Multi-tenancy e acesso | Dados isolados e autorização centralizada | P0 |
| EP02 — Cadastros | Empresa, usuários, clientes e locais | P0 |
| EP03 — Catálogo | Serviços, equipamentos, produtos e materiais | P0 |
| EP04 — Levantamento técnico | Dados do ambiente e evidências | P0 |
| EP05 — Orçamento | Composição, cálculo, versão e aceite | P0 |
| EP06 — Agenda | Alocação e conflito de horários | P0 |
| EP07 — Ordem de serviço | Execução, checklist e relatório | P0 |
| EP08 — Estoque | Reserva, consumo, devolução e transferência | P0 básico |
| EP09 — Rentabilidade | Previsto versus realizado | P0 básico |
| EP10 — Garantia | Garantias e chamados | P0 básico |
| EP11 — Pós-venda | Lembretes e manutenção recorrente | P1 |
| EP12 — Portal/QR | Consulta segura do cliente/equipamento | P1 |
| EP13 — PMOC | Plano e registros de manutenção | P2 |
| EP14 — Integrações | Mensageria, pagamento e fiscal | P1/P2 |
| EP15 — IA assistiva | Sugestões controladas e auditáveis | P2 |

---

## 28. Definição de pronto do MVP

O MVP estará pronto para piloto quando todos os itens abaixo forem verdadeiros:

- [ ] Uma empresa consegue criar e administrar sua conta.
- [ ] Usuários possuem papéis e não acessam recursos sem permissão.
- [ ] Duas empresas de teste não conseguem acessar dados uma da outra.
- [ ] É possível cadastrar cliente, local, equipamento, serviço e material.
- [ ] É possível registrar levantamento técnico com fotos.
- [ ] É possível gerar orçamento com materiais, mão de obra e adicionais.
- [ ] O orçamento apresenta memória de cálculo interna e proposta comercial externa.
- [ ] Cliente consegue aceitar/recusar por link seguro.
- [ ] Aceite guarda a versão exata da proposta.
- [ ] Orçamento aprovado vira uma única OS.
- [ ] Gestor agenda a OS e atribui técnico.
- [ ] Técnico registra execução e checklist pelo celular.
- [ ] Técnico registra fotos e materiais utilizados.
- [ ] Estoque registra reserva, consumo e devolução sem duplicidade.
- [ ] A OS registra custos previstos e reais.
- [ ] O sistema apresenta resultado e margem gerencial por instalação.
- [ ] É possível registrar aceite e gerar relatório de execução.
- [ ] Equipamento fica no histórico do cliente/local.
- [ ] Garantia de instalação fica vinculada à OS/equipamento.
- [ ] Dashboard apresenta dados coerentes e respeita permissões.
- [ ] Testes críticos e E2E do fluxo principal passam.
- [ ] Backups, logs, monitoramento e processo de recuperação estão definidos para o ambiente de produção.

---

## 29. Prompt operacional para iniciar no Claude Code

Copie o texto abaixo ao iniciar uma sessão do Claude Code junto com este documento:

```text
Leia integralmente o arquivo ESPECIFICACAO_TECNICA_SAAS_GESTAO_CLIMATIZACAO.md e todas as instruções do repositório, especialmente AGENTS.md e CLAUDE.md.

Seu objetivo é implementar o SaaS descrito na especificação, respeitando rigorosamente a arquitetura e os padrões já existentes.

ETAPA 1 — DIAGNÓSTICO (não altere código ainda)
1. Inspecione a estrutura do repositório, stack, scripts, banco, migrations, autenticação, autorização, UI, integrações e testes.
2. Identifique módulos existentes e o que pode ser reaproveitado.
3. Compare o estado atual com as seções 1, 2 e 27 desta especificação.
4. Liste lacunas, riscos, dependências e decisões que precisam de confirmação.
5. Proponha um plano de implementação em tarefas pequenas, com critérios de aceite e arquivos prováveis de alteração.
6. Não invente que algo está implementado: cite arquivos/classes reais encontrados.

ETAPA 2 — PLANEJAMENTO
1. Comece pela Fase 0 e EP01, a menos que o repositório já tenha multi-tenancy e autorização corretamente implementados.
2. Defina uma entrega vertical por vez; não implemente todos os épicos em um único lote.
3. Para cada entrega, descreva mudanças de banco, backend, frontend, testes e documentação.
4. Registre decisões arquiteturais relevantes em documento ADR ou no padrão já adotado.

ETAPA 3 — IMPLEMENTAÇÃO INCREMENTAL
1. Implemente somente a primeira entrega aprovada pelo plano, respeitando as instruções do repositório.
2. Preserve comportamentos e funcionalidades existentes.
3. Valide dados e regras de negócio no backend.
4. Proteja toda consulta pelo tenant autenticado e permissões efetivas.
5. Use transações em operações financeiras, de orçamento, estoque e conversões.
6. Garanta idempotência de operações que possam ser repetidas.
7. Inclua testes unitários, integração e/ou E2E pertinentes à entrega.
8. Execute lint, typecheck e testes disponíveis.
9. Corrija regressões introduzidas pela implementação.
10. Atualize documentação e migrations.

RESTRIÇÕES
- Não faça refatoração ampla sem necessidade comprovada.
- Não substitua a stack ou bibliotecas existentes.
- Não introduza dependências sem explicar benefício, custo e alternativa.
- Não use valores monetários com ponto flutuante binário.
- Não confie em tenant_id ou permissões enviados pelo cliente.
- Não exponha dados de outro tenant.
- Não implemente integrações externas como se estivessem funcionando sem credenciais e validação real.
- Não permita que IA determine autonomamente preço, dimensionamento final ou segurança técnica.
- Não considere uma tarefa concluída sem testes e critérios de aceite.

Ao finalizar cada entrega, informe:
1. o que foi implementado;
2. arquivos criados/alterados;
3. migrations e comandos necessários;
4. testes executados e resultados;
5. limitações conhecidas;
6. próxima entrega recomendada.

Comece agora pela ETAPA 1 — DIAGNÓSTICO. Não altere arquivos nesta primeira resposta.
```

---

## 30. Decisões em aberto que não devem ser presumidas pelo agente

Antes de implementar as partes correspondentes, confirmar ou propor alternativas para:

1. Nome comercial e identidade visual do produto.
2. Se haverá conta por empresa com vários usuários ou plano individual para autônomos.
3. Limites de usuários, técnicos, ordens, armazenamento e equipamentos por plano.
4. Se o preço será por empresa, usuário, técnico ou combinação.
5. Se o orçamento inclui impostos/taxas ou apenas valores comerciais gerenciais.
6. Método de custeio do estoque (custo médio ponderado ou outro).
7. Política de estoque negativo e reserva automática.
8. Se técnico pode registrar recebimento no local.
9. Provedor de e-mail e WhatsApp.
10. Provedor de armazenamento de arquivos.
11. Provedor de pagamento/assinatura SaaS.
12. Se haverá portal do cliente no MVP.
13. Regras de garantia oferecidas pela empresa.
14. Modelos e checklists técnicos validados por responsável da operação.
15. Escopo regulatório e profissional do módulo PMOC.
16. Regras de cálculo de capacidade térmica e materiais por tipo de instalação.

O agente deve evitar bloquear o MVP por decisões de módulos P1/P2. Quando possível, criar interfaces e pontos de extensão sem implementar integração prematuramente.

---

## 31. Diretriz final de produto

A prioridade é entregar um fluxo confiável e integrado, não uma grande quantidade de telas desconectadas.

O primeiro resultado de valor deve ser:

**A empresa cadastra um cliente, levanta o ambiente, monta e envia um orçamento, recebe o aceite, agenda a equipe, separa materiais, executa a instalação, registra evidências, apura o custo real e entrega a garantia.**

Todos os módulos do MVP devem contribuir para esse fluxo. Funcionalidades avançadas só devem entrar depois que esse processo estiver estável, testado e simples de usar.
