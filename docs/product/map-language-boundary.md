# Map Language Boundary

## Purpose

The Hudson Hustle board is not a generic UI surface.

This document defines what shell-level design work may influence during `v2.1`, and what must remain map-first.

## Must Stay Map-First

Do not weaken:
- route legibility
- station readability
- route ownership clarity
- map label clarity
- board hierarchy
- turn-critical visual signals

## Allowed Shell Influence In `v2.1`

The shell may influence the board only through:
- surrounding chrome and framing
- panel adjacency and border language
- title and subtitle treatment near the map
- calmer typographic discipline around the map
- ownership badge integration

These are adjacent influences, not map redesign work.

## Not Allowed In `v2.1`

Do not:
- change route color logic
- flatten board contrast for elegance
- heavily restyle labels
- posterize the board
- turn the map into a shell-first composition

## Review Rule

Any map-adjacent shell change must be rejected if it:
- makes route inspection slower
- weakens player-color reading
- makes labels harder to parse
- introduces decorative noise along play-critical paths
