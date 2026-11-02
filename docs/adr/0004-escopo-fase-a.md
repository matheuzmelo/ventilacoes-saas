# ADR 0004 — Escopo da Fase A e adiamentos

## Status

Aceito.

## Contexto

Há duas especificações: a Fase A (escopo comercial e operacional do piloto) e um
anexo de engenharia com funcionalidades amplas. Implementar tudo de uma vez
aumentaria o risco e o tempo até o primeiro cliente.

## Decisão

A Fase A governa o escopo. Ficam para a Fase B, salvo pedido explícito:

- estoque, rentabilidade, garantia e PMOC;
- portal do cliente, QR code e IA;
- link público de orçamento com aceite;
- WhatsApp Cloud API e Google OAuth;
- relatórios avançados e integrações fiscais.

No piloto, orçamento é enviado por e-mail/PDF e o contato usa `wa.me`; a agenda
exporta ICS antes de integração com Google Calendar.

## Consequências

- Entregas menores e verificáveis.
- O anexo permanece como backlog técnico.
- Funcionalidades da Fase B não devem vazar para o código sem decisão de
  produto.
