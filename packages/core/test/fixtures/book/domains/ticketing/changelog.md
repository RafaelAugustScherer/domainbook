# Changelog

All notable changes to the ticketing context are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

## [Unreleased]

### Added

- Queue position for fans whose hold expires on a sold-out event.

## [1.2.0] - 2026-06-30

### Added

- Automatic refund when a payment is captured after the hold expired.

### Changed

- A hold now lasts ten minutes for every event; the per-venue setting is gone.

### Removed

- Per-venue hold duration.

### Fixed

- Two fans could hold the same seat when a seat map changed mid-checkout.

## [1.1.0] - 2026-05-04 [YANKED]

### Added

- Per-venue hold duration.

### Security

- Hold identifiers are no longer guessable from the seat number.

## [1.0.0] - 2026-04-02

### Added

- Holds, payment capture, and ticket issuing for seated events.
