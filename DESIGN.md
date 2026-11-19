---
version: alpha
name: toshiotomikawa
description: GitHub profile README made of animated SVG cards, in a dark and a light version.
colors:
  background: "#e6e6e6"
  text: "#1a1a1a"
  muted: "#5c5c64"
  line: "#c8c8ce"
  background-dark: "#1a1a1a"
  text-dark: "#e6e6e6"
  muted-dark: "#9a9aa2"
  line-dark: "#34343a"
typography:
  name:
    fontFamily: Allo
    fontSize: 32px
    fontWeight: 800
  title:
    fontFamily: Allo
    fontSize: 16px
    fontWeight: 700
  body:
    fontFamily: Allo
    fontSize: 15px
    fontWeight: 400
  caption:
    fontFamily: Allo
    fontSize: 13px
    fontWeight: 400
rounded:
  card: 12px
spacing:
  line: 24px
  gutter: 12px
components:
  hero:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    width: 846px
    height: 372px
  tile:
    backgroundColor: "{colors.background}"
    textColor: "{colors.text}"
    rounded: "{rounded.card}"
    width: 282px
    height: 198px
  tile-caption:
    typography: "{typography.caption}"
    textColor: "{colors.muted}"
---

## Overview

The README is only images: a hero card and nine project tiles, each linked to its repository. `scripts/build.mjs` draws every SVG and writes `README.md`, so a change goes in the script and a rebuild. Text is outlined from the fonts in `fonts/`, so it looks the same on every machine.

## Colors

Graphite (`#1a1a1a`) and paper (`#e6e6e6`), swapped between the dark and light versions; GitHub picks one through `<picture>` and `prefers-color-scheme`. No accent colour. Shapes use the text colour, sometimes at lower opacity.

## Typography

Allo throughout, with its `ss02` set. The Firefonts tile cycles "Aa" through seven other OFL typefaces.

## Layout

Spacing is counted in lines of 24px. Cards sit 6px inside their image, so neighbours are 12px apart both ways; tiles have no bottom margin because the page adds about 6px under each row of images. Tiles are a third of the page wide each, so the grid stays three by three at any width and shrinks with the page on phones.

## Elevation & Depth

Flat: a 1px outline per card, no shadows.

## Shapes

Cards round to half a line (12px). Pictures are built from dots, rounded bars and rounded squares.

## Components

Each tile is a picture in the top five lines, then the name and one line about the project. Every animation loops, and each has a resting state for people who turn motion off.

## Do's and Don'ts

Do keep each description to one line; the build warns when it is too wide. Don't add colours or a third font size to the tiles.
