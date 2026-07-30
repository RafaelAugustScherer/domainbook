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
relationships:
  - with: 座席
    type: customer-supplier
    direction: downstream
    patterns: [ACL]
---

## Purpose

選ばれた座席を支払い済みの券に変え、その券を当日まで有効に保つ。

## Domain Roles

- 実行の文脈。決済の手順を回すが、座席が何であるかは決めない。
- 出入口の文脈。決済会社と話すのはここだけ。

## Inbound Communication

| Message           | Collaborator | Type    |
| ----------------- | ------------ | ------- |
| `HoldSeats`       | 販売画面     | Command |
| `PaymentCaptured` | 決済会社     | Event   |

## Outbound Communication

| Message        | Collaborator | Type  |
| -------------- | ------------ | ----- |
| `TicketIssued` | 入場端末     | Event |

## Business Decisions

- 仮押さえは十五分で切れ、延ばさない。足りない来場者は取り直す。
- 一席につき一公演の券が一枚。

## Assumptions

- 決済会社は仮押さえの間に決済の可否を返す。

## Verification Metrics

- 公演ごとの、支払いのないまま切れた仮押さえの数。
- 週ごとの、期限後の決済による払い戻しの数。

## Open Questions

- 売り切れの公演で仮押さえを失った来場者に、待ち順を出すべきか。
