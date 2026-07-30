---
id: 販売
name: 販売
classification:
  domain: core-domain
  business-model: revenue-generator
  evolution: custom-built
owners: [ada]
code:
  - src/販売/**
---

## Purpose

選ばれた座席を支払い済みの券に変え、その券を当日まで有効に保つ。

## Domain Roles

- 実行の文脈。決済の手順を回すが、座席が何であるかは決めない。

## Inbound Communication

| Message     | Collaborator | Type    |
| ----------- | ------------ | ------- |
| `HoldSeats` | 販売画面     | Command |

## Outbound Communication

| Message        | Collaborator | Type  |
| -------------- | ------------ | ----- |
| `TicketIssued` | 入場端末     | Event |

## Business Decisions

- メンバー先行の間は、会員だけが仮押さえを置ける。

## Assumptions

- 会員かどうかは会員基盤が答える。

## Verification Metrics

- メンバー先行で売れた枚数と、一般発売で売れた枚数の比。

## Open Questions

- 会員でない来場者に、先行の残り枚数を見せるべきか。
