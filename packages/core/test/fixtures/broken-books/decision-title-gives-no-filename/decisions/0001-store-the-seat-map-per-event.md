---
status: accepted
date: 2026-03-05
decision-makers: [ada, yuki]
---

# 〇〇

## Context and Problem Statement

販売中に会場が座席表を差し替えると、同じ席が二人に売れてしまう。販売のたびに
seating から読み直す今のやり方では、その差し替えを止められない。

## Considered Options

- 販売開始時の座席表をイベントごとに保存する。
- 毎回 seating から読み直し、差し替えを検知したら販売を止める。

## Decision Outcome

販売開始時の座席表をイベントごとに保存する。販売中は座席表が動かないので、
二重販売がなくなる。

### Consequences

- Good、販売中の座席表が動かないため、保留と発券が同じ席を指す。
- Bad、会場が座席を閉じても次の販売まで反映されない。
