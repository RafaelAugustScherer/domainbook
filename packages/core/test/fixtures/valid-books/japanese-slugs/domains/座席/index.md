---
id: 座席
name: 座席
classification:
  domain: supporting-domain
  business-model: engagement-creator
  evolution: custom-built
owners: [kwame]
code:
  - src/座席/**
---

## Purpose

会場の座席の並びを一つの座席表にまとめ、公演ごとに出す。

## Domain Roles

- 発行の文脈。座席表を出すのはここだけで、ほかの文脈は読むだけ。

## Inbound Communication

| Message         | Collaborator | Type    |
| --------------- | ------------ | ------- |
| `PublishSeatMap` | 会場担当     | Command |

## Outbound Communication

| Message           | Collaborator | Type  |
| ----------------- | ------------ | ----- |
| `SeatMapPublished` | 販売         | Event |

## Business Decisions

- 売り出した後の座席表は差し替えず、次の公演から新しいものを使う。

## Assumptions

- 会場の座席の並びは一公演の間は変わらない。

## Verification Metrics

- 売り出し後に差し替えを求められた座席表の数。

## Open Questions

- 車椅子席の並びを座席表に含めるか、別に持つか。
