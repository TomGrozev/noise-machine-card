# 🌙 Noise Card for Home Assistant

[![GitHub Release][release_badge]][release]
[![Downloads][downloads_badge]][release]
[![HACS][hacs_badge]][hacs]

[release_badge]: https://img.shields.io/github/v/release/TomGrozev/noise-machine-card
[release]: https://github.com/TomGrozev/noise-machine-card/releases
[downloads_badge]: https://img.shields.io/github/downloads/TomGrozev/noise-machine-card/total.svg
[hacs_badge]: https://img.shields.io/badge/HACS-Custom-41BDF5.svg
[hacs]: https://hacs.xyz/

A sleek, modern Lovelace card to control Tuya-compatible noise machines in Home Assistant. Uses the `siren` entity model (via [tuya-local](https://github.com/make-all/tuya-local)) with `available_tones`, `tone`, and `volume_level`.

Forked from [eyalgal/hatch-card](https://github.com/eyalgal/hatch-card).

> ⚠️ **BREAKING CHANGES (unreleased):**
> - `child_lock_entity` must now be a `lock.*` entity (was `switch.*`); the card calls `lock.lock` / `lock.unlock` based on the current state.
> - The `controls_order` slot key `brightness` has been renamed to `light`.
> - `show_brightness_control` is now `show_light_control`.
> - `show_brightness_when_off` is now `show_light_when_off`.
>
> See the "Light Control", "Child Lock", and "Sound Buttons" sections below for details.

## ✨ Features

- **Sound Control:** Configurable button row + dropdown picker for tones, powered by `available_tones` / `siren.turn_on`. Optional icon-only mode.
- **Volume Control:** +/- buttons, optional slider, and volume presets — all via `siren.turn_on(volume_level)`.
- **Light Control (Optional):** Brightness slider, colour swatch row (one tap sets the light colour), palette-icon "more colours" button, and colour-aware dynamic background for an optional `light` entity.
- **Child Lock (Optional):** Toggle a `lock` entity directly from the card.
- **Sleep Timer (Optional):** Preset buttons that start an HA `timer.*` helper, with live remaining-time display and a timer ring around the icon.
- **Scenes:** Configurable scene buttons that execute siren + light presets or activate HA scene entities.
- **Customisable Layout:** Horizontal or vertical, with an optional expand button to tuck away controls.
- **Sound Buttons:** Auto-derives the first 6 tones as icon buttons — or supply your own `sound_buttons` array, edited in the GUI.
- **Full Action Support:** `tap_action`, `hold_action`, `double_tap_action` on the icon.
- **Visual Editor:** Full Lovelace UI editor with search, expansion panels, and ha-form fields.
- **Dynamic Icons:** Icons change automatically based on the active tone.
- **Haptic Feedback:** Optional vibration on mobile.

## ✅ Requirements

- **Home Assistant:** Version 2023.4 or newer.
- **A `siren` entity** that exposes `available_tones`, `tone`, and `volume_level` attributes (typical for Tuya noise machines via `tuya-local`).
- **Timer feature (optional):** A Home Assistant `timer.*` helper entity.

## 🚀 Installation

### HACS (Custom Repository)

1. Install [HACS](https://hacs.xyz/) if you haven't already.
2. In HACS, go to **Frontend** → **⋮** → **Custom repositories**.
3. Add `TomGrozev/noise-machine-card` as a **Lovelace** repository.
4. Install **Noise Card** from the list.
5. Add the resource to Lovelace (if not auto-added):

   ```yaml
   url: /local/noise-card.js
   type: module
   ```

### Manual

1. Copy `noise-card.js` into your Home Assistant `config/www/` folder.
2. Refresh the browser cache (or restart Home Assistant).
3. Add the resource to Lovelace (Configuration → Dashboards → Resources):

   ```yaml
   url: /local/noise-card.js
   type: module
   ```

4. Add the card to a dashboard.

---

## Main Configuration

| Name                       | Type      | Default             | Description                                                                          |
| :------------------------- | :-------- | :------------------ | :----------------------------------------------------------------------------------- |
| `type`                     | `string`  | **Required**        | `custom:noise-card`                                                                  |
| `siren_entity`             | `string`  | **Required**        | The `siren` entity that plays sounds.                                                |
| `light_entity`             | `string`  | `null`              | Optional `light` entity.                                                             |
| `child_lock_entity`        | `string`  | `null`              | Optional `lock` entity for child lock. The card calls `lock.lock` / `lock.unlock`.   |
| `timer_entity`             | `string`  | `null`              | Optional HA `timer.*` helper for sleep timer presets.                                |
| `name`                     | `string`  | Entity Name         | A custom name for the card.                                                          |
| `icon`                     | `string`  | `mdi:speaker`       | A custom icon (overridden by dynamic tone icons unless set).                         |
| `user_photo`               | `string`  | `null`              | A URL to a photo to use instead of an icon.                                          |
| `layout`                   | `string`  | `horizontal`        | Card layout: `horizontal` or `vertical`.                                             |
| `background_mode`          | `string`  | `full`              | Background style: `full`, `volume`, or `none` (requires light entity).               |
| `secondary_info`           | `string`  | auto                | Custom text with `{volume}`, `{sound}`, `{brightness}` placeholders. Empty = auto.   |
| `controls_order`           | `array`   | `[...]`             | Comma-separated list to re-order expanded controls. See below.                       |
| `show_volume_buttons`      | `boolean` | `true`              | Show the volume up/down buttons.                                                     |
| `show_volume_slider`       | `boolean` | `false`             | Show a volume slider in expanded controls.                                           |
| `show_expand_button`       | `boolean` | `false`             | Hide expanded controls behind an expand button.                                      |
| `show_sound_control`       | `boolean` | `true`              | Show the sound picker (button row + dropdown).                                       |
| `show_light_control`       | `boolean` | `false`             | Show the light control row — brightness slider + colour swatches (requires light).   |
| `show_light_when_off`      | `boolean` | `false`             | Show the light control row even when the light is off.                               |
| `show_timer`               | `boolean` | `false`             | Show sleep timer presets (requires `timer_entity`).                                  |
| `show_child_lock`          | `boolean` | `false`             | Show child lock toggle (requires `child_lock_entity`).                               |
| `show_scenes`              | `boolean` | `false`             | Show scene buttons.                                                                  |
| `volume_step`              | `number`  | `0.05`              | Amount to change the volume with each button press (0.0 – 1.0).                      |
| `volume_presets`           | `array`   | `[]`                | Array of volume levels (0.0 – 1.0) for preset buttons. Example: `[0.25, 0.5, 0.75]`. |
| `sound_buttons`            | `array`   | `null`              | Custom button definitions. `null` = auto-derive from `available_tones`. See below.   |
| `sound_buttons_show_labels` | `boolean` | `true`             | When `false`, sound buttons render as icon-only (36×36 squares, no label text).      |
| `timer_presets`            | `array`   | `[15, 30, 60, 120]` | Timer presets in minutes.                                                            |
| `scenes`                   | `array`   | `[]`                | Scene definitions. See Scene Configuration below.                                    |
| `scenes_per_row`           | `number`  | `4`                 | Number of scene buttons per row.                                                     |
| `haptic`                   | `boolean` | `true`              | Enable haptic feedback on touch.                                                     |
| `volume_click_control`     | `boolean` | `true`              | When `background_mode` is `volume`, click card background to set volume.             |
| `animation_duration`       | `number`  | `250`               | Duration of animations in ms. Set to `0` to disable.                                 |
| `tap_action`               | `object`  | `action: toggle`    | Action on icon tap.                                                                  |
| `hold_action`              | `object`  | `action: more-info` | Action on icon hold.                                                                 |
| `double_tap_action`        | `object`  | `action: none`      | Action on icon double-tap.                                                           |

---

## Sound Buttons

When `sound_buttons` is `null` (default), the card auto-derives the first 6 tones from the siren's `available_tones` attribute, mapping each to an icon via case-insensitive substring matching.

You can override this with an explicit array:

```yaml
sound_buttons:
  - label: Rain
    icon: mdi:weather-rainy
    tone: Rain
  - label: Fan
    icon: mdi:fan
    tone: Fan
  - label: White Noise
    icon: mdi:waveform
    tone: White Noise
```

Tones shown as buttons are **removed** from the dropdown below, so each tone appears exactly once.

### GUI editor

The card's Lovelace editor has a dedicated **Sound Buttons** panel — you can add, edit, reorder, and delete buttons (tone, icon, label) without hand-editing JSON. A "Reset to auto-derive" button restores the runtime default.

### Icon-only mode

Set `sound_buttons_show_labels: false` to render each sound button as a 36×36 icon-only square (label text hidden). Defaults to `true` (label visible).

```yaml
sound_buttons_show_labels: false
```

---

## Light Control

Set `show_light_control: true` (and configure `light_entity`) to add a combined light control row to the expanded controls. The row includes:

- A **brightness slider** (1–255, with a percentage readout) that drives `light.turn_on` with `brightness`.
- A **colour swatch row** with one button per colour in the built-in palette (red, green, blue, yellow, orange, purple, pink, white, warm white, cool white, amber, cyan, magenta, lime, maroon, navy, olive, teal, silver, gray, black, dark blue, light blue).
- A **palette-icon button** at the end of the swatch row that opens the light entity's "more info" dialog (so you can use the full HA colour picker for tones not in the swatch palette).

The currently-active swatch (matching `light.attributes.rgb_color`) is marked with a 2px ring and a small white check mark.

### `show_light_when_off`

By default, the light control row is hidden whenever the light is `off`. Set `show_light_when_off: true` to keep the swatches visible when the light is off — useful if you want to tap a colour to turn the light on with that colour.

```yaml
show_light_control: true
show_light_when_off: true
```

### Colour Swatches

The swatch row is a small flex row of 24×24 rounded squares, each filled with the colour's RGB. Tapping a swatch calls `light.turn_on` with `rgb_color: [r, g, b]`. The button at the end of the row (a small palette icon) fires a `hass-more-info` event for `light_entity`, opening the full Home Assistant light card so you can pick any colour via the HA colour wheel.

The swatch row is hidden entirely if `light_entity` is not configured.

---

## Child Lock

The card toggles a `lock` entity (not `switch`) for the child-lock row.

```yaml
show_child_lock: true
child_lock_entity: lock.bedroom_door
```

The card reads the current `state` attribute and calls `lock.lock` if `unlocked` or `lock.unlock` if `locked`.

---

## Controls Order

`controls_order` is a comma-separated list of slot keys that determines which expanded-control rows are shown and in what order. The default is:

```yaml
controls_order:
  - light
  - volume_slider
  - volume_presets
  - sound
  - scenes
  - timer
  - child_lock
```

Valid keys:

- `light` — brightness slider + colour swatch row (requires `light_entity` and `show_light_control: true`).
- `volume_slider` — linear volume slider.
- `volume_presets` — preset percentage buttons (requires non-empty `volume_presets`).
- `sound` — sound button row + dropdown (requires `show_sound_control: true` and at least one `available_tone`).
- `scenes` — scene buttons (requires `show_scenes: true` and at least one scene).
- `timer` — sleep-timer preset buttons (requires `timer_entity` and `show_timer: true`).
- `child_lock` — child lock toggle (requires `show_child_lock: true` and `child_lock_entity`).

A row is hidden if its key is not in the list OR if its visibility condition is not met.

---

## Timer

The timer UI uses a Home Assistant `timer.*` helper.

### Setup

1. Create a timer helper: **Settings → Devices & Services → Helpers → Create Helper → Timer**.
2. Add it to your card config:

```yaml
type: custom:noise-card
siren_entity: siren.sleep_noise_machine
light_entity: light.sleep_noise_machine
show_expand_button: true
show_timer: true
timer_entity: timer.sleep_timer
timer_presets: [15, 30, 60, 120]
```

### Important

The card starts and cancels the timer. It does not execute "when the timer is up" actions inside the card. Use an automation triggered by `timer.finished`.

### Example: turn off sound when timer finishes

```yaml
alias: Noise machine — sleep timer finished
mode: single
trigger:
  - platform: event
    event_type: timer.finished
    event_data:
      entity_id: timer.sleep_timer
action:
  - service: siren.turn_off
    target:
      entity_id: siren.sleep_noise_machine
  - service: light.turn_off
    target:
      entity_id: light.sleep_noise_machine
```

---

## Scene Configuration

The `scenes` option takes a list of scene objects.

| Name             | Type      | Description                                                           |
| :--------------- | :-------- | :-------------------------------------------------------------------- |
| `name`           | `string`  | **Required.** The name displayed on the scene button.                 |
| `icon`           | `string`  | An icon for the scene button (e.g. `mdi:weather-night`).              |
| `entity_id`      | `string`  | Entity ID of a Home Assistant scene. Overrides manual settings below. |
| `transition`     | `number`  | Transition time (seconds).                                            |
| `turn_off_light` | `boolean` | Set to `true` to turn the light off.                                  |
| `turn_off_siren` | `boolean` | Set to `true` to turn the siren off.                                  |
| `color`          | `string`  | Light color by name (`'red'`) or RGB (`'255,0,0'`).                   |
| `brightness`     | `number`  | Light brightness 1–100.                                               |
| `sound_mode`     | `string`  | Tone to play (maps to `siren.turn_on` with `tone`).                   |
| `volume`         | `number`  | Volume 0–100 (mapped to 0.0–1.0).                                     |

---

## Use Cases & Examples

### Minimal Configuration

```yaml
type: custom:noise-card
siren_entity: siren.sleep_noise_machine
name: Sleep Machine
```

### With Timer and Light

```yaml
type: custom:noise-card
siren_entity: siren.sleep_noise_machine
light_entity: light.sleep_noise_machine
name: Baby's Room
show_expand_button: true
show_timer: true
timer_entity: timer.sleep_timer
timer_presets: [15, 30, 60, 120]
show_light_control: true
```

### Full Control Center with Scenes

```yaml
type: custom:noise-card
siren_entity: siren.sleep_noise_machine
light_entity: light.sleep_noise_machine
child_lock_entity: lock.sleep_noise_machine_child_lock
name: Noise Machine
background_mode: volume
secondary_info: "Sound: {sound} • Brightness: {brightness}%"
show_expand_button: true
show_light_control: true
show_sound_control: true
show_timer: true
show_child_lock: true
show_scenes: true
timer_entity: timer.sleep_timer
timer_presets: [15, 30, 60, 120]
volume_presets: [0.25, 0.5, 0.75, 1.0]
scenes_per_row: 3
scenes:
  - name: Sleep
    icon: mdi:weather-night
    color: red
    brightness: 5
    sound_mode: White Noise
    volume: 30
  - name: Reading
    icon: mdi:book-open-page-variant
    brightness: 80
    color: white
    turn_off_siren: true
  - name: Off
    icon: mdi:power-off
    turn_off_light: true
    turn_off_siren: true
```

### Vertical Layout

```yaml
type: custom:noise-card
siren_entity: siren.sleep_noise_machine
light_entity: light.sleep_noise_machine
layout: vertical
name: Bedside
secondary_info: "{sound}"
```

---

## Actions

The card supports standard Home Assistant actions for `tap_action`, `hold_action`, and `double_tap_action`.

```yaml
type: custom:noise-card
siren_entity: siren.sleep_noise_machine
hold_action:
  action: call-service
  service: light.turn_on
  target:
    entity_id: light.sleep_noise_machine
  data:
    color_name: green
```

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.
