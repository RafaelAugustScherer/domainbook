---
id: bilheteria
name: Bilheteria
classification:
  domain: core-domain
  business-model: revenue-generator
  evolution: custom-built
owners: [ada]
code:
  - src/bilheteria/**
---

## Purpose

Transformar um lugar escolhido em um ingresso pago, e manter esse ingresso
válido até o público entrar na casa.

## Domain Roles

- Contexto de execução: conduz o pagamento, mas não decide o que é um lugar.

## Inbound Communication

| Message     | Collaborator   | Type    |
| ----------- | -------------- | ------- |
| `HoldSeats` | tela de compra | Command |

## Outbound Communication

| Message        | Collaborator | Type  |
| -------------- | ------------ | ----- |
| `TicketIssued` | portaria     | Event |

## Business Decisions

- Na pré-venda só compra quem tem cadastro; a venda geral abre para todos.
- Um lugar dá um ingresso para um espetáculo.

## Assumptions

- O meio de pagamento responde dentro da janela da reserva.

## Verification Metrics

- Reservas que expiram sem pagamento, por espetáculo.

## Open Questions

- A pré-venda deve mostrar quantos lugares ainda restam?
