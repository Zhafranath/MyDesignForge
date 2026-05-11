# Design Theme Options Design

## Goal

Add a manual theme selector so generated Redbubble prompt packs can follow a chosen visual density/style such as Minimalis, Full acc terkontrol, Kawaii pastel, and other recommended presets.

## User Experience

Add a `Tema desain` selector near the existing generation controls. The control is a single-choice preset selector, matching the existing radio-button style used by `Bentuk karakter`.

Initial themes:

- `AI pilih`
- `Minimalis`
- `Simple cute`
- `Full acc terkontrol`
- `Kawaii pastel`
- `Bold vector`
- `Retro 90s`
- `Streetwear`
- `Goth cute`
- `Pattern dekoratif`
- `Premium mascot`

`Full acc terkontrol` means the prompt may use a few relevant accessories only, around 2-4 items, not every possible accessory and not cluttered.

## Data Model

Extend `GenerationOptions` with:

- `theme: DesignTheme`

`DesignTheme` is a union of the preset ids. Default is `auto`.

## Prompt Behavior

`buildSystemPrompt` and `buildRegeneratePrompt` include a dedicated theme guide:

- `auto`: AI chooses the best visual theme.
- `minimalist`: restricts props, accessories, and background detail.
- `controlled-accessories`: uses only 2-4 relevant accessories/props and avoids clutter.
- Other themes: lock the selected style direction across the concept and all 9 prompt variations.

## Random Ideas

`getRandomIdea` receives the theme in `GenerationOptions` and appends a concise theme hint. This prevents shuffled ideas from contradicting the selected theme.

## Validation

The API accepts only known `theme` values. Missing `theme` defaults to `auto` for backwards compatibility.

## Tests

Add focused coverage for:

- Prompt builder includes selected theme guidance.
- Random idea includes theme hints.
- API rejects invalid theme.
- UI selector calls `onChange` with selected theme.
