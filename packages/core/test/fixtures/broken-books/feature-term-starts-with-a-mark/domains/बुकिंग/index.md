---
id: बुकिंग
name: बुकिंग
classification:
  domain: core-domain
  business-model: revenue-generator
  evolution: custom-built
owners: [ada]
code:
  - src/बुकिंग/**
---

## Purpose

चुनी हुई सीट को भुगतान किए गए टिकट में बदलना, और उस टिकट को प्रदर्शन के दिन तक
वैध रखना।

## Domain Roles

- कार्यान्वयन संदर्भ: यह भुगतान की प्रक्रिया चलाता है, सीट क्या है यह तय नहीं करता।

## Inbound Communication

| Message     | Collaborator | Type    |
| ----------- | ------------ | ------- |
| `HoldSeats` | बुकिंग पृष्ठ  | Command |

## Outbound Communication

| Message        | Collaborator | Type  |
| -------------- | ------------ | ----- |
| `TicketIssued` | प्रवेश द्वार  | Event |

## Business Decisions

- सीट आरक्षण दस मिनट चलता है और बढ़ाया नहीं जाता।

## Assumptions

- भुगतान सेवा आरक्षण की अवधि के भीतर उत्तर देती है।

## Verification Metrics

- हर प्रदर्शन में बिना भुगतान के समाप्त हुए आरक्षणों की संख्या।

## Open Questions

- बिक चुके प्रदर्शन में आरक्षण खोने वाले दर्शक को प्रतीक्षा क्रम देना चाहिए?
