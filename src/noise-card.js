/*
 * Noise Card
 *
 * A Home Assistant Lovelace card for Tuya-compatible noise machines
 * that expose their sound as a siren.* entity (via tuya-local).
 *
 * Forked from eyalgal/hatch-card (MIT).
 * Author: Tom Grozev
 * License: MIT
 * Version: 1.0.0
 */
import {
  LitElement,
  html,
  css,
} from "https://unpkg.com/lit-element@2.0.1/lit-element.js?module";

const cardVersion = "1.0.0";
console.info(
  `%c NOISE-CARD %c v${cardVersion} `,
  "color: white; background: #039be5; font-weight: 700;",
  "color: #039be5; background: white; font-weight: 700;",
);

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const SOUND_ICON_MAP = {
  "White Noise": "mdi:waveform",
  "Pink noise": "mdi:waveform",
  "Brown noise": "mdi:waveform",
  "White noise": "mdi:waveform",
  "Wall fan": "mdi:fan",
  Fan: "mdi:fan",
  "Floor fan": "mdi:fan",
  Wind: "mdi:weather-windy",
  "Rain on roof": "mdi:weather-rainy",
  Rain: "mdi:weather-rainy",
  Thunderstorm: "mdi:weather-lightning",
  "Light rain": "mdi:weather-rainy",
  "Ocean wave": "mdi:waves",
  "Water stream": "mdi:water",
  Birds: "mdi:bird",
  Crickets: "mdi:bug",
  Frog: "mdi:frog",
  Fireplace: "mdi:fireplace",
  Campfire: "mdi:campfire",
  Womb: "mdi:heart-pulse",
  Heartbeat: "mdi:heart-pulse",
  Shushing: "mdi:face-shushing",
  Cafe: "mdi:coffee",
  Maracas: "mdi:music-note",
  Clock: "mdi:clock",
  Buddha: "mdi:meditation",
  "Wind chimes": "mdi:wind-power",
  Steamship: "mdi:ferry",
  Aircraft: "mdi:airplane",
  Train: "mdi:train",
  Lullaby: "mdi:music-box",
  "Music box": "mdi:music-box",
  "Twinkle little star": "mdi:star-shooting",
  "Good morning": "mdi:white-balance-sunny",
  Fantasy: "mdi:wizard-hat",
  Joyful: "mdi:emoticon-happy",
  NONE: null,
};

const COLOR_NAMES = {
  red: [255, 0, 0],
  green: [92, 210, 157],
  blue: [0, 0, 255],
  yellow: [255, 255, 0],
  orange: [234, 141, 71],
  purple: [128, 0, 128],
  pink: [246, 98, 170],
  white: [255, 255, 255],
  "warm white": [255, 206, 84],
  "cool white": [173, 216, 230],
  amber: [255, 191, 0],
  cyan: [0, 255, 255],
  magenta: [255, 0, 255],
  lime: [0, 255, 0],
  maroon: [128, 0, 0],
  navy: [0, 0, 128],
  olive: [128, 128, 0],
  teal: [0, 128, 128],
  silver: [192, 192, 192],
  gray: [128, 128, 128],
  black: [0, 0, 0],
  "dark blue": [73, 143, 225],
  "light blue": [41, 193, 215],
};

/* ------------------------------------------------------------------ */
/*  Helper functions                                                   */
/* ------------------------------------------------------------------ */

function formatTimerDuration(minutes) {
  if (minutes < 60) return `${minutes}m`;
  if (minutes === 60) return "1h";
  if (minutes % 60 === 0) return `${minutes / 60}h`;
  return `${Math.floor(minutes / 60)}h${minutes % 60}m`;
}

function _parseHADurationToSeconds(str) {
  if (!str || typeof str !== "string") return null;
  const m = str.trim().match(/^(\d+):(\d{2}):(\d{2})$/);
  if (!m) return null;
  const h = parseInt(m[1], 10);
  const mm = parseInt(m[2], 10);
  const s = parseInt(m[3], 10);
  if ([h, mm, s].some((v) => isNaN(v))) return null;
  return h * 3600 + mm * 60 + s;
}

function _formatClockFromSeconds(totalSeconds) {
  const s = Math.max(0, Math.floor(totalSeconds || 0));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const pad = (n) => String(n).padStart(2, "0");
  if (h > 0) return `${h}:${pad(m)}:${pad(ss)}`;
  return `${m}:${pad(ss)}`;
}

function parseColorInput(input) {
  if (!input || !input.trim()) return null;
  const trimmed = input.trim().toLowerCase();
  if (COLOR_NAMES[trimmed]) return COLOR_NAMES[trimmed];
  const rgbMatch = trimmed.match(/^\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*$/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1], 10);
    const g = parseInt(rgbMatch[2], 10);
    const b = parseInt(rgbMatch[3], 10);
    if (r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255) {
      return [r, g, b];
    }
  }
  return null;
}

function getColorNameFromRgb(rgbArray) {
  if (!rgbArray || !Array.isArray(rgbArray)) return "";
  const rgbString = rgbArray.join(",");
  for (const [name, rgb] of Object.entries(COLOR_NAMES)) {
    if (rgb.join(",") === rgbString) return name;
  }
  return rgbArray.join(", ");
}

/** Case-insensitive icon lookup for a tone name. */
function _getIconForTone(toneName) {
  if (!toneName) return "mdi:music-note";
  // Exact match in SOUND_ICON_MAP
  if (SOUND_ICON_MAP[toneName]) return SOUND_ICON_MAP[toneName];
  const lower = toneName.toLowerCase();
  // Case-insensitive exact match
  for (const [key, icon] of Object.entries(SOUND_ICON_MAP)) {
    if (key.toLowerCase() === lower && icon) return icon;
  }
  // Substring matching
  if (/white\s*noise|pink\s*noise|brown\s*noise/.test(lower))
    return "mdi:waveform";
  if (/fan/.test(lower)) return "mdi:fan";
  if (/rain/.test(lower)) return "mdi:weather-rainy";
  if (/thunder|storm/.test(lower)) return "mdi:weather-lightning";
  if (/ocean|wave|water/.test(lower)) return "mdi:waves";
  if (/wind/.test(lower)) return "mdi:weather-windy";
  if (/bird/.test(lower)) return "mdi:bird";
  if (/fire|campfire|fireplace/.test(lower)) return "mdi:fireplace";
  if (/heart|womb/.test(lower)) return "mdi:heart-pulse";
  if (/lullaby|music/.test(lower)) return "mdi:music-box";
  if (/cricket/.test(lower)) return "mdi:bug";
  if (/frog/.test(lower)) return "mdi:frog";
  if (/shush/.test(lower)) return "mdi:face-shushing";
  if (/cafe|coffee/.test(lower)) return "mdi:coffee";
  if (/clock/.test(lower)) return "mdi:clock";
  if (/buddha|meditat/.test(lower)) return "mdi:meditation";
  if (/twinkle|star/.test(lower)) return "mdi:star-shooting";
  return "mdi:music-note";
}

/** Auto-derive sound_buttons from available_tones (first 6). */
function _autoSoundButtons(tones) {
  if (!tones || !tones.length) return [];
  return tones.slice(0, 6).map((tone) => ({
    label: tone,
    icon: _getIconForTone(tone),
    tone: tone,
  }));
}

/** Helper for the editor: fetch available_tones from a siren entity. */
function baseTonesForEditor(hass, sirenEntity) {
  if (!hass || !sirenEntity) return [];
  const entity = hass.states?.[sirenEntity];
  if (!entity) return [];
  return Array.isArray(entity.attributes?.available_tones)
    ? entity.attributes.available_tones
    : [];
}

/* ================================================================== */
/*  NoiseCard – runtime card                                          */
/* ================================================================== */

class NoiseCard extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _timerRemaining: { type: String },
      _timerPercent: { type: Number },
      _showControls: { type: Boolean },
    };
  }

  constructor() {
    super();
    this._holdFired = false;
    this._timerRemaining = "";
    this._timerPercent = 0;
    this._showControls = false;
    this._timerInterval = null;
    this._holdTimer = null;
    this._tapTimer = null;
    this._tapCount = 0;
    this._userProvidedIcon = null;
  }

  /* ---- Config ---- */

  setConfig(config) {
    this._userProvidedIcon = config.icon;

    this._config = {
      layout: "horizontal",
      icon: "mdi:speaker",
      name: null,
      light_entity: null,
      child_lock_entity: null,
      timer_entity: null,
      user_photo: null,
      background_mode: "full",
      secondary_info: null,
      show_volume_buttons: true,
      show_volume_slider: false,
      show_sound_control: true,
      show_light_control: false,
      show_light_when_off: false,
      sound_buttons_show_labels: true,
      show_child_lock: false,
      show_timer: false,
      show_expand_button: false,
      show_scenes: false,
      volume_step: 0.05,
      volume_presets: [],
      sound_buttons: null,
      haptic: true,
      animation_duration: 250,
      tap_action: { action: "toggle" },
      hold_action: { action: "more-info" },
      double_tap_action: { action: "none" },
      volume_click_control: true,
      timer_presets: [15, 30, 60, 120],
      controls_order: [
        "light",
        "volume_slider",
        "volume_presets",
        "sound",
        "scenes",
        "timer",
        "child_lock",
      ],
      scenes: [],
      scenes_per_row: 4,
      ...config,
    };

    this._config.volume_step = parseFloat(this._config.volume_step) || 0.05;
    this._config = this._sanitizeConfig(this._config);
  }

  static getStubConfig() {
    return {
      type: "custom:noise-card",
      siren_entity: "",
    };
  }

  /* ---- Lifecycle ---- */

  connectedCallback() {
    super.connectedCallback();
    this._startTimerUpdate();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this._stopTimerUpdate();
    this._clearHoldTimer();
  }

  /* ---- Timer polling (from hatch) ---- */

  _startTimerUpdate() {
    this._stopTimerUpdate();
    this._updateTimer();
    this._timerInterval = setInterval(() => this._updateTimer(), 1000);
  }

  _stopTimerUpdate() {
    if (this._timerInterval) {
      clearInterval(this._timerInterval);
      this._timerInterval = null;
    }
  }

  _getTimerEntity() {
    const id = this._config.timer_entity;
    if (!id) return null;
    return this.hass?.states?.[id] || null;
  }

  _updateTimer() {
    const timerEntity = this._getTimerEntity();
    if (!timerEntity || !timerEntity.attributes) {
      this._timerRemaining = "";
      this._timerPercent = 0;
      return;
    }

    const state = timerEntity.state;
    const durationSeconds =
      _parseHADurationToSeconds(timerEntity.attributes.duration) || null;

    if (state === "active") {
      const finishesAt = timerEntity.attributes.finishes_at;
      const endMs = finishesAt ? Date.parse(finishesAt) : null;
      let remainingSeconds;
      if (endMs && !isNaN(endMs)) {
        remainingSeconds = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      } else {
        remainingSeconds =
          _parseHADurationToSeconds(timerEntity.attributes.remaining) || 0;
      }
      this._timerRemaining =
        remainingSeconds > 0 ? _formatClockFromSeconds(remainingSeconds) : "";
      if (durationSeconds && durationSeconds > 0) {
        this._timerPercent = Math.min(
          100,
          Math.max(0, (remainingSeconds / durationSeconds) * 100),
        );
      } else {
        this._timerPercent = remainingSeconds > 0 ? 100 : 0;
      }
      return;
    }

    if (state === "paused") {
      const remainingSeconds =
        _parseHADurationToSeconds(timerEntity.attributes.remaining) || 0;
      this._timerRemaining =
        remainingSeconds > 0 ? _formatClockFromSeconds(remainingSeconds) : "";
      if (durationSeconds && durationSeconds > 0) {
        this._timerPercent = Math.min(
          100,
          Math.max(0, (remainingSeconds / durationSeconds) * 100),
        );
      } else {
        this._timerPercent = remainingSeconds > 0 ? 100 : 0;
      }
      return;
    }

    this._timerRemaining = "";
    this._timerPercent = 0;
  }

  /* ---- Entity helpers ---- */

  _sirenState() {
    if (!this._config.siren_entity) return null;
    return this.hass?.states?.[this._config.siren_entity] || null;
  }

  _lightState() {
    if (!this._config.light_entity) return null;
    return this.hass?.states?.[this._config.light_entity] || null;
  }

  _childLockState() {
    if (!this._config.child_lock_entity) return null;
    return this.hass?.states?.[this._config.child_lock_entity] || null;
  }

  _sanitizeConfig(obj) {
    const BAD_KEYS = new Set(["__proto__", "constructor", "prototype"]);
    const out = {};
    for (const k of Object.keys(obj)) {
      if (BAD_KEYS.has(k)) continue;
      out[k] = obj[k];
    }
    return out;
  }

  _isOn() {
    const light = this._lightState();
    const siren = this._sirenState();
    if (light) return light.state === "on";
    if (siren) return siren.state === "on";
    return false;
  }

  _volume() {
    const siren = this._sirenState();
    return siren?.attributes?.volume_level || 0;
  }

  _tone() {
    const siren = this._sirenState();
    return siren?.attributes?.tone || "";
  }

  _tonesList() {
    const siren = this._sirenState();
    return siren?.attributes?.available_tones || [];
  }

  _effectiveSoundButtons() {
    if (
      this._config.sound_buttons !== null &&
      Array.isArray(this._config.sound_buttons)
    ) {
      return this._config.sound_buttons;
    }
    return _autoSoundButtons(this._tonesList());
  }

  /* ---- Render ---- */

  render() {
    this.style.setProperty(
      "--animation-duration",
      `${this._config.animation_duration || 250}ms`,
    );
    if (!this.hass || !this._config) return html``;

    if (!this._config.siren_entity) {
      return html`
        <ha-card>
          <div class="grid">
            <div
              style="padding: 16px; text-align: center; color: var(--secondary-text-color);"
            >
              <ha-icon
                icon="mdi:sleep"
                style="width: 40px; height: 40px; margin-bottom: 8px;"
              ></ha-icon>
              <div style="font-weight: bold; margin-bottom: 4px;">
                Noise Card
              </div>
              <div>Please configure a siren entity.</div>
            </div>
          </div>
        </ha-card>
      `;
    }

    const siren = this._sirenState();
    if (!siren) {
      return this._renderError("Siren entity not found.");
    }

    const light = this._lightState();
    const hasLight = !!light;

    const isOn = this._isOn();
    const volumeLevel = this._volume();
    const volumePercent = Math.round(volumeLevel * 100);
    const tone = this._tone();
    const brightness = hasLight ? light.attributes.brightness || 0 : 0;

    let activeIcon =
      this._userProvidedIcon ||
      siren.attributes.icon ||
      _getIconForTone(tone) ||
      this._config.icon;

    const name =
      this._config.name ||
      (
        (hasLight
          ? light.attributes.friendly_name
          : siren.attributes.friendly_name) || "Noise Machine"
      ).replace(/ Sound$/i, "");

    // Secondary info
    let secondaryInfo = "";
    if (
      this._config.secondary_info &&
      this._config.secondary_info.trim() !== ""
    ) {
      secondaryInfo = this._config.secondary_info
        .replace("{volume}", volumePercent)
        .replace("{sound}", tone)
        .replace("{brightness}", Math.round((brightness / 255) * 100));
    } else if (tone) {
      secondaryInfo = `${tone} \u2022 ${volumePercent}%`;
    } else {
      secondaryInfo = `Volume ${volumePercent}%`;
    }

    if (this._timerRemaining && secondaryInfo) {
      secondaryInfo = `${secondaryInfo} \u2022 ${this._timerRemaining}`;
    } else if (this._timerRemaining) {
      secondaryInfo = this._timerRemaining;
    }

    // Light colour
    let lightColor = "var(--state-icon-color)";
    let lightColorRgb = null;
    if (hasLight) {
      const rgbColor = light.attributes.rgb_color;
      const hsColor = light.attributes.hs_color;
      const isWhiteLight =
        isOn &&
        rgbColor &&
        ((rgbColor.join(",") === "0,0,0" && brightness > 0) ||
          (hsColor && hsColor[1] === 0));
      if (isOn) {
        if (isWhiteLight) {
          const warmWhite = [255, 206, 84];
          lightColor = `rgb(${warmWhite.join(",")})`;
          lightColorRgb = warmWhite.join(",");
        } else if (rgbColor) {
          lightColor = `rgb(${rgbColor.join(",")})`;
          lightColorRgb = rgbColor.join(",");
        }
      }
    } else if (isOn) {
      lightColor = "var(--primary-color)";
    }

    const cardStyle = this._getCardBackgroundStyle(
      lightColorRgb,
      volumePercent,
      hasLight,
    );
    const isVertical = this._config.layout === "vertical";
    const layoutClass = isVertical ? "vertical-layout" : "horizontal-layout";
    const expandedClass = this._showControls ? "expanded" : "";

    const hasExpandable = this._hasExpandableControls();
    const showExpandButton = this._config.show_expand_button && hasExpandable;
    const showExpandedControls = showExpandButton
      ? this._showControls
      : hasExpandable;
    const hasExpandButtonClass = showExpandButton ? "has-expand-button" : "";

    return html`
      <ha-card
        style="${cardStyle}"
        class="${layoutClass} ${expandedClass} ${hasExpandButtonClass}"
        @click="${this._handleCardClick}"
      >
        <div class="grid">
          ${isVertical
            ? this._renderVerticalLayout(
                isOn,
                lightColor,
                secondaryInfo,
                activeIcon,
                volumePercent,
                name,
                showExpandButton,
              )
            : this._renderHorizontalLayout(
                isOn,
                lightColor,
                secondaryInfo,
                activeIcon,
                volumePercent,
                name,
                showExpandButton,
              )}
          ${showExpandedControls
            ? this._renderExpandedControls(
                isOn,
                lightColor,
                brightness,
                volumeLevel,
                siren,
                light,
                hasLight,
              )
            : ""}
        </div>
      </ha-card>
    `;
  }

  _renderError(message) {
    return html`
      <ha-card>
        <div class="grid">
          <div
            style="padding: 16px; text-align: center; color: var(--error-color);"
          >
            <ha-icon
              icon="mdi:alert-circle"
              style="width: 40px; height: 40px; margin-bottom: 8px;"
            ></ha-icon>
            <div style="font-weight: bold; margin-bottom: 4px;">Noise Card</div>
            <div>${message}</div>
          </div>
        </div>
      </ha-card>
    `;
  }

  /* ---- Layouts ---- */

  _renderHorizontalLayout(
    isOn,
    lightColor,
    secondaryInfo,
    activeIcon,
    volumePercent,
    name,
    showExpandButton,
  ) {
    return html`
      <div class="content-wrapper">
        <div class="header">
          <div
            class="icon-container"
            @mousedown="${this._handleMouseDown}"
            @mouseup="${this._handleMouseUp}"
            @touchstart="${this._handleTouchStart}"
            @touchend="${this._handleTouchEnd}"
            @touchcancel="${this._handleTouchCancel}"
            @click="${(e) => e.stopPropagation()}"
            role="button"
            tabindex="0"
            aria-label="Toggle"
          >
            ${this._renderIconOrPhoto(isOn, lightColor, activeIcon)}
          </div>
          <div class="info">
            <div class="name">${name}</div>
            ${secondaryInfo
              ? html`<div class="secondary-info">${secondaryInfo}</div>`
              : ""}
          </div>
        </div>
        <div class="actions">
          ${this._config.show_volume_buttons
            ? html`
                ${this._renderVolumeButton(
                  -Math.abs(this._config.volume_step),
                  "mdi:volume-minus",
                  lightColor,
                )}
                <div class="volume-percent">${volumePercent}%</div>
                ${this._renderVolumeButton(
                  Math.abs(this._config.volume_step),
                  "mdi:volume-plus",
                  lightColor,
                )}
              `
            : ""}
          ${showExpandButton
            ? html`
                <div
                  class="expand-button"
                  role="button"
                  tabindex="0"
                  aria-expanded="${this._showControls ? "true" : "false"}"
                  aria-label="${this._showControls
                    ? "Collapse controls"
                    : "Expand controls"}"
                  @click="${this._toggleControls}"
                  @keydown="${this._handleExpandKeydown}"
                >
                  <ha-icon
                    class="expand-icon ${this._showControls ? "expanded" : ""}"
                    icon="mdi:chevron-down"
                  ></ha-icon>
                </div>
              `
            : ""}
        </div>
      </div>
    `;
  }

  _renderVerticalLayout(
    isOn,
    lightColor,
    secondaryInfo,
    activeIcon,
    volumePercent,
    name,
    showExpandButton,
  ) {
    return html`
      <div class="content-wrapper vertical">
        <div class="vertical-top-block">
          <div class="vertical-icon-container">
            ${this._config.show_volume_buttons
              ? this._renderVolumeButton(
                  -Math.abs(this._config.volume_step),
                  "mdi:volume-minus",
                  lightColor,
                )
              : ""}
            <div
              class="icon-container"
              @mousedown="${this._handleMouseDown}"
              @mouseup="${this._handleMouseUp}"
              @touchstart="${this._handleTouchStart}"
              @touchend="${this._handleTouchEnd}"
              @touchcancel="${this._handleTouchCancel}"
              @click="${(e) => e.stopPropagation()}"
            >
              ${this._renderIconOrPhoto(isOn, lightColor, activeIcon, true)}
            </div>
            ${this._config.show_volume_buttons
              ? this._renderVolumeButton(
                  Math.abs(this._config.volume_step),
                  "mdi:volume-plus",
                  lightColor,
                )
              : ""}
          </div>
        </div>
        <div class="info vertical">
          <div class="name">${name}</div>
          ${secondaryInfo
            ? html`<div class="secondary-info">${secondaryInfo}</div>`
            : ""}
        </div>
        ${showExpandButton
          ? html`
              <div
                class="expand-button vertical"
                role="button"
                tabindex="0"
                aria-expanded="${this._showControls ? "true" : "false"}"
                aria-label="${this._showControls
                  ? "Collapse controls"
                  : "Expand controls"}"
                @click="${this._toggleControls}"
                @keydown="${this._handleExpandKeydown}"
              >
                <ha-icon
                  class="expand-icon ${this._showControls ? "expanded" : ""}"
                  icon="mdi:chevron-down"
                ></ha-icon>
              </div>
            `
          : ""}
      </div>
    `;
  }

  /* ---- Expanded controls ---- */

  _renderExpandedControls(
    isOn,
    lightColor,
    brightness,
    volumeLevel,
    siren,
    light,
    hasLight,
  ) {
    const showAlways = !this._config.show_expand_button;
    const controlsMap = {
      light: {
        is_visible: () =>
          hasLight &&
          this._config.show_light_control &&
          (isOn || this._config.show_light_when_off),
        render: () => this._renderLightControl(lightColor, brightness, isOn, light),
      },
      volume_slider: {
        is_visible: () => this._config.show_volume_slider,
        render: () => this._renderVolumeSliderControl(volumeLevel, lightColor),
      },
      volume_presets: {
        is_visible: () =>
          this._config.volume_presets && this._config.volume_presets.length > 0,
        render: () => this._renderVolumePresetsControl(volumeLevel, lightColor),
      },
      sound: {
        is_visible: () =>
          this._config.show_sound_control && this._tonesList().length > 0,
        render: () => this._renderSoundControl(),
      },
      scenes: {
        is_visible: () =>
          this._config.show_scenes &&
          this._config.scenes &&
          this._config.scenes.length > 0,
        render: () => this._renderScenesControl(lightColor, hasLight),
      },
      timer: {
        is_visible: () =>
          this._config.show_timer &&
          !!this._config.timer_entity &&
          String(this._config.timer_entity).startsWith("timer."),
        render: () => this._renderTimerControl(lightColor),
      },
      child_lock: {
        is_visible: () =>
          this._config.show_child_lock && this._config.child_lock_entity,
        render: () => this._renderChildLockControl(),
      },
    };

    const ordered = (this._config.controls_order || [])
      .map((key) => controlsMap[key])
      .filter((control) => control && control.is_visible())
      .map((control) => control.render());

    if (ordered.length === 0) return html``;

    return html`
      <div class="expanded-controls ${showAlways ? "always-visible" : ""}">
        ${ordered}
      </div>
    `;
  }

  _hasExpandableControls() {
    const hasLight = !!this._lightState();
    const controlsMap = {
      light: () => hasLight && this._config.show_light_control,
      volume_slider: () => this._config.show_volume_slider,
      volume_presets: () =>
        this._config.volume_presets && this._config.volume_presets.length > 0,
      sound: () =>
        this._config.show_sound_control && this._tonesList().length > 0,
      scenes: () =>
        this._config.show_scenes &&
        this._config.scenes &&
        this._config.scenes.length > 0,
      timer: () =>
        this._config.show_timer &&
        !!this._config.timer_entity &&
        String(this._config.timer_entity).startsWith("timer."),
      child_lock: () =>
        this._config.show_child_lock && !!this._config.child_lock_entity,
    };
    return (this._config.controls_order || []).some(
      (key) => controlsMap[key] && controlsMap[key](),
    );
  }

  /* ---- Background ---- */

  _getCardBackgroundStyle(rgb, volumePercent, hasLight) {
    const defaultBg =
      "var(--ha-card-background, var(--card-background-color, #FFF))";
    if (!hasLight || !rgb || this._config.background_mode === "none") {
      return `background: ${defaultBg};`;
    }
    const color = `rgba(${rgb}, 0.1)`;
    switch (this._config.background_mode) {
      case "full":
        return `background: ${color};`;
      case "volume":
        return `background: linear-gradient(to right, ${color} ${volumePercent}%, ${defaultBg} ${volumePercent}%);`;
      default:
        return `background: ${defaultBg};`;
    }
  }

  /* ---- Icon / Photo (with timer ring) ---- */

  _renderIconOrPhoto(isOn, lightColorStyle, activeIcon, isVertical = false) {
    if (this._config.user_photo) {
      return html`<img
        class="user-photo ${isVertical ? "vertical" : ""}"
        src="${this._config.user_photo}"
        alt="${this._config.name || "Noise machine"}"
      />`;
    }

    let shapeBg;
    if (isOn) {
      if (lightColorStyle.startsWith("rgb")) {
        shapeBg = lightColorStyle.replace("rgb", "rgba").replace(")", ", 0.2)");
      } else {
        shapeBg = "rgba(var(--rgb-primary-color), 0.2)";
      }
    } else {
      shapeBg = "rgba(var(--rgb-primary-text-color), 0.05)";
    }
    const shapeStyle = `background-color: ${shapeBg}`;
    const iconStyle = `color: ${isOn ? lightColorStyle : "var(--primary-text-color, var(--paper-item-icon-color))"}`;

    // Timer ring (from hatch)
    const size = isVertical ? 48 : 36;
    const strokeWidth = 3;
    const svgSize = size + strokeWidth * 2;
    const center = svgSize / 2;
    const radius = size / 2 + strokeWidth / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset =
      circumference - (this._timerPercent / 100) * circumference;

    const timerRing =
      this._timerPercent > 0
        ? html`
            <svg
              style="
                    position: absolute;
                    top: -${strokeWidth}px;
                    left: -${strokeWidth}px;
                    width: ${svgSize}px;
                    height: ${svgSize}px;
                    transform: rotate(-90deg);
                    pointer-events: none;
                "
            >
              <circle
                stroke="rgba(var(--rgb-primary-text-color), 0.1)"
                fill="transparent"
                stroke-width="${strokeWidth}"
                r="${radius}"
                cx="${center}"
                cy="${center}"
              />
              <circle
                stroke="${lightColorStyle}"
                fill="transparent"
                stroke-width="${strokeWidth}"
                stroke-dasharray="${circumference} ${circumference}"
                style="stroke-dashoffset: ${strokeDashoffset}; transition: stroke-dashoffset 0.25s;"
                r="${radius}"
                cx="${center}"
                cy="${center}"
              />
            </svg>
          `
        : "";

    return html`
      <div
        class="shape ${isVertical ? "vertical" : ""}"
        style="${shapeStyle}; position: relative;"
      >
        ${timerRing}
        <ha-icon .icon="${activeIcon}" style="${iconStyle}"></ha-icon>
      </div>
    `;
  }

  /* ---- Volume button ---- */

  _renderVolumeButton(change, icon, lightColorStyle) {
    const isOn = this._isOn();
    let bg = "rgba(var(--rgb-primary-text-color), 0.05)";
    let fg = "var(--primary-text-color)";
    if (isOn) {
      if (lightColorStyle && lightColorStyle.startsWith("rgb")) {
        bg = lightColorStyle.replace("rgb", "rgba").replace(")", ", 0.15)");
        fg = lightColorStyle;
      } else {
        bg = "rgba(var(--rgb-primary-color), 0.15)";
        fg = lightColorStyle || "var(--primary-color)";
      }
    }
    return html`
      <button
        class="action-button icon-button"
        style="--button-bg: ${bg}; --button-fg: ${fg};"
        @click="${(e) => {
          e.stopPropagation();
          this._handleVolumeChange(change);
        }}"
        aria-label="${change > 0 ? "Increase" : "Decrease"} volume"
      >
        <ha-icon .icon="${icon}"></ha-icon>
      </button>
    `;
  }

  /* ---- Individual control renderers ---- */

  _renderLightControl(lightColor, brightness, isOn, light) {
    return html`
      <div class="control-row">
        <ha-icon icon="mdi:brightness-6"></ha-icon>
        <div class="slider-container">
          <div class="slider-track">
            <div
              class="slider-fill"
              style="width: ${(brightness / 255) *
              100}%; background-color: ${lightColor};"
            ></div>
          </div>
          <input
            type="range"
            class="slider-input"
            min="1"
            max="255"
            .value="${brightness}"
            @input="${this._handleBrightnessChange}"
          />
        </div>
        <span class="control-value"
          >${Math.round((brightness / 255) * 100)}%</span
        >
      </div>
      ${isOn || this._config.show_light_when_off
        ? this._renderColourSwatches(light)
        : ""}
    `;
  }

  _renderColourSwatches(light) {
    if (!this._config.light_entity) return html``;
    const currentRgb = light?.attributes?.rgb_color;
    const isWhiteLight =
      currentRgb &&
      currentRgb.join(",") === "0,0,0" &&
      (light?.attributes?.brightness || 0) > 0;
    const activeRgb = isWhiteLight
      ? null
      : currentRgb
        ? currentRgb.join(",")
        : null;

    return html`
      <div class="colour-swatches">
        ${Object.entries(COLOR_NAMES).map(
          ([name, rgb]) => html`
            <button
              class="colour-swatch ${activeRgb === rgb.join(",")
                ? "active"
                : ""}"
              style="background-color: rgb(${rgb.join(",")});"
              title="${name}"
              aria-label="${name}"
              @click="${() => this._handleColourSwatchTap(rgb)}"
            ></button>
          `,
        )}
        <button
          class="colour-swatch colour-swatch-more"
          title="More colours"
          aria-label="More colours"
          @click="${this._handleColourMoreInfo}"
        >
          <ha-icon icon="mdi:palette"></ha-icon>
        </button>
      </div>
    `;
  }

  _handleColourSwatchTap(rgb) {
    this._vibrate();
    if (!this._config.light_entity) return;
    this.hass.callService("light", "turn_on", {
      entity_id: this._config.light_entity,
      rgb_color: rgb,
    });
  }

  _handleColourMoreInfo() {
    this._vibrate();
    if (!this._config.light_entity) return;
    this._showMoreInfo();
  }

  _renderVolumeSliderControl(volumeLevel, lightColor) {
    return html`
      <div class="control-row">
        <ha-icon icon="mdi:volume-high"></ha-icon>
        <div class="slider-container">
          <div class="slider-track">
            <div
              class="slider-fill"
              style="width: ${volumeLevel *
              100}%; background-color: ${lightColor};"
            ></div>
          </div>
          <input
            type="range"
            class="slider-input"
            min="0"
            max="1"
            step="0.01"
            .value="${volumeLevel}"
            @input="${(e) => this._setVolume(parseFloat(e.target.value))}"
          />
        </div>
        <span class="control-value">${Math.round(volumeLevel * 100)}%</span>
      </div>
    `;
  }

  _renderVolumePresetsControl(volumeLevel, lightColor) {
    return html`
      <div class="control-row presets">
        <ha-icon icon="mdi:volume-high"></ha-icon>
        <div class="action-buttons">
          ${(this._config.volume_presets || []).map(
            (preset) => html`
              <button
                class="action-button ${Math.abs(volumeLevel - preset) < 0.01
                  ? "active"
                  : ""}"
                @click="${() => this._setVolume(preset)}"
                style="--button-color: ${lightColor}"
              >
                ${Math.round(preset * 100)}%
              </button>
            `,
          )}
        </div>
      </div>
    `;
  }

  /* ---- Sound control: button row + dropdown ---- */

  _renderSoundControl() {
    const tones = this._tonesList();
    if (!tones.length) return this._renderWarning("No available_tones found.");

    const buttons = this._effectiveSoundButtons();
    const currentTone = this._tone() || "";
    const buttonTones = new Set(buttons.map((b) => b.tone));
    const dropdownTones = tones.filter((t) => !buttonTones.has(t));
    const stop = (e) => e.stopPropagation();
    const showLabels = this._config.sound_buttons_show_labels !== false;

    return html`
      <div class="control-row sound-control">
        <ha-icon icon="mdi:music-note"></ha-icon>
        <div class="sound-control-wrapper">
          ${buttons.length > 0
            ? html`
                <div class="sound-buttons">
                  ${buttons.map(
                    (btn) => html`
                      <button
                        class="action-button ${btn.tone === currentTone
                          ? "active"
                          : ""} ${showLabels ? "" : "icon-only"}"
                        @click="${(e) => {
                          e.stopPropagation();
                          this._handleSoundButtonTap(btn.tone);
                        }}"
                        title="${btn.label || btn.tone}"
                      >
                        <ha-icon
                          icon="${btn.icon || "mdi:music-note"}"
                        ></ha-icon>
                        ${showLabels
                          ? html`<span class="sound-btn-label"
                              >${btn.label || btn.tone}</span
                            >`
                          : ""}
                      </button>
                    `,
                  )}
                </div>
              `
            : ""}
          ${dropdownTones.length > 0
            ? html`
                <select
                  class="sound-select"
                  @change="${this._handleSoundChange}"
                  @mousedown="${stop}"
                  @click="${stop}"
                  @touchstart="${stop}"
                >
                  ${dropdownTones.map(
                    (t) =>
                      html`<option
                        value="${t}"
                        ?selected="${t === currentTone}"
                      >
                        ${t}
                      </option>`,
                  )}
                </select>
              `
            : ""}
        </div>
      </div>
    `;
  }

  /* ---- Timer control (from hatch pattern) ---- */

  _renderTimerControl(lightColor) {
    const timerEntityId = this._config.timer_entity;
    const hasTimerEntity =
      !!timerEntityId && String(timerEntityId).startsWith("timer.");
    const hasActiveTimer = !!this._timerRemaining;

    if (!hasTimerEntity) return html``;

    return html`
      <div class="control-row">
        <ha-icon icon="mdi:timer-outline"></ha-icon>
        <div class="timer-buttons">
          ${this._getTimerPresets().map(
            (preset) => html`
              <button
                class="action-button"
                @click="${() => this._setTimer(preset.value)}"
                style="--button-color: ${lightColor}"
              >
                ${preset.label}
              </button>
            `,
          )}
          ${hasActiveTimer
            ? html`
                <button
                  class="action-button danger"
                  @click="${() => this._cancelTimer()}"
                >
                  Cancel
                </button>
              `
            : ""}
        </div>
        ${hasActiveTimer
          ? html` <span class="timer-remaining">${this._timerRemaining}</span> `
          : ""}
      </div>
    `;
  }

  /* ---- Child lock control ---- */

  _renderChildLockControl() {
    const lockEntity = this._childLockState();
    if (!lockEntity) return this._renderWarning("Child lock entity not found.");
    const locked = lockEntity.state === "locked";

    return html`
      <div class="control-row toggle-row">
        <ha-icon icon="mdi:baby-carriage"></ha-icon>
        <span class="lock-label">Child lock</span>
        <button
          class="action-button ${locked ? "active" : ""}"
          @click="${this._toggleChildLock}"
        >
          ${locked ? "Locked" : "Unlocked"}
        </button>
      </div>
    `;
  }

  /* ---- Scenes control ---- */

  _renderScenesControl(lightColor, hasLight) {
    return html`
      <div class="control-row scenes">
        <ha-icon icon="mdi:palette"></ha-icon>
        <div
          class="scene-buttons ${this._config.layout === "vertical"
            ? "vertical"
            : ""}"
          style="--scenes-per-row: ${this._config.scenes_per_row || 4}"
        >
          ${(this._config.scenes || []).map((scene) => {
            const sceneColor =
              hasLight && scene.color
                ? Array.isArray(scene.color)
                  ? `rgb(${scene.color.join(",")})`
                  : scene.color
                : lightColor;
            const hasName =
              typeof scene.name === "string"
                ? scene.name.trim().length > 0
                : !!scene.name;
            const hasIcon =
              typeof scene.icon === "string"
                ? scene.icon.trim().length > 0
                : !!scene.icon;
            const icon = hasIcon ? scene.icon : !hasName ? "mdi:palette" : null;
            return html`
              <button
                class="action-button"
                @click="${() => this._activateScene(scene, hasLight)}"
                aria-label="${hasName ? scene.name : "Scene"}"
                style="--scene-color: ${sceneColor}"
              >
                ${icon ? html`<ha-icon icon="${icon}"></ha-icon>` : ""}
                ${hasName ? html`<span>${scene.name}</span>` : ""}
              </button>
            `;
          })}
        </div>
      </div>
    `;
  }

  /* ---- Warning ---- */

  _renderWarning(message) {
    return html`
      <div class="control-row">
        <ha-icon
          icon="mdi:alert-circle-outline"
          style="color: var(--error-color);"
        ></ha-icon>
        <span class="control-value" style="color: var(--error-color);"
          >${message}</span
        >
      </div>
    `;
  }

  /* ================================================================== */
  /*  Actions                                                           */
  /* ================================================================== */

  /* ---- Tap / hold / double-tap ---- */

  _handleMouseDown(e) {
    this._handleStart(e);
  }
  _handleMouseUp(e) {
    this._handleEnd(e);
  }
  _handleTouchStart(e) {
    this._handleStart(e);
  }
  _handleTouchEnd(e) {
    this._handleEnd(e);
  }
  _handleTouchCancel(e) {
    this._clearHoldTimer();
  }

  _handleStart(e) {
    this._clearHoldTimer();
    this._holdFired = false;
    this._holdTimer = setTimeout(() => {
      this._holdFired = true;
      this._holdTimer = null;
      clearTimeout(this._tapTimer);
      this._tapCount = 0;
      this._handleAction(this._config.hold_action);
    }, 500);
  }

  _handleEnd(e) {
    e.stopPropagation();
    const hadHoldTimer = !!this._holdTimer;
    this._clearHoldTimer();

    if (this._holdFired) {
      this._holdFired = false;
      return;
    }
    if (!hadHoldTimer) return;
    this._tapCount++;

    if (this._tapCount === 1) {
      this._tapTimer = setTimeout(() => {
        this._handleAction(this._config.tap_action);
        this._tapCount = 0;
      }, 250);
    } else if (this._tapCount === 2) {
      clearTimeout(this._tapTimer);
      this._handleAction(this._config.double_tap_action);
      this._tapCount = 0;
    }
  }

  _clearHoldTimer() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer);
      this._holdTimer = null;
    }
  }

  _handleAction(action) {
    if (!action || action.action === "none") return;
    this._vibrate();
    switch (action.action) {
      case "toggle":
        this._toggleDevice();
        break;
      case "more-info":
        this._showMoreInfo();
        break;
      case "call-service":
        this._callService(action);
        break;
      case "navigate":
        if (action.navigation_path) {
          history.pushState(null, "", action.navigation_path);
          const event = new Event("location-changed", {
            bubbles: true,
            composed: true,
          });
          window.dispatchEvent(event);
        }
        break;
      case "url":
        if (action.url_path)
          window.open(
            action.url_path,
            action.new_tab !== false ? "_blank" : "_self",
          );
        break;
    }
  }

  /* ---- Toggle device ---- */

  async _toggleDevice() {
    const light = this._lightState();
    const siren = this._sirenState();

    const lightOn = light && light.state === "on";
    const sirenOn = siren && siren.state === "on";
    if (lightOn || sirenOn) {
      if (lightOn) {
        this.hass.callService("light", "turn_off", {
          entity_id: this._config.light_entity,
        });
      }
      if (sirenOn) {
        this.hass.callService("siren", "turn_off", {
          entity_id: this._config.siren_entity,
        });
      }
    } else {
      if (light) {
        this.hass.callService("light", "turn_on", {
          entity_id: this._config.light_entity,
        });
      }
      if (siren) {
        const tone = this._tone();
        const serviceData = { entity_id: this._config.siren_entity };
        if (tone) serviceData.tone = tone;
        serviceData.volume_level = this._volume();
        this.hass.callService("siren", "turn_on", serviceData);
      }
    }
  }

  _showMoreInfo() {
    const entityId = this._config.light_entity || this._config.siren_entity;
    const event = new Event("hass-more-info", {
      bubbles: true,
      composed: true,
    });
    event.detail = { entityId };
    this.dispatchEvent(event);
  }

  _callService(action) {
    const service = action.service;
    if (!service) return;
    const [domain, svc] = service.split(".");
    const serviceData = {
      ...(action.service_data || {}),
      ...(action.data || {}),
    };

    let entityId = null;
    if (action.target && action.target.entity_id) {
      entityId = action.target.entity_id;
    } else if (serviceData.entity_id) {
      entityId = serviceData.entity_id;
    }

    if (entityId === "light") entityId = this._config.light_entity;
    else if (entityId === "siren") entityId = this._config.siren_entity;

    if (!entityId) {
      if (domain === "light") entityId = this._config.light_entity;
      else if (domain === "siren") entityId = this._config.siren_entity;
    }
    if (!entityId)
      entityId = this._config.light_entity || this._config.siren_entity;

    if (entityId) {
      serviceData.entity_id = entityId;
      this.hass.callService(domain, svc, serviceData);
    }
  }

  _toggleControls(e) {
    e.stopPropagation();
    this._vibrate();
    this._showControls = !this._showControls;
  }

  _handleExpandKeydown(e) {
    if (e.key === "Enter" || e.key === " " || e.key === "Spacebar") {
      e.preventDefault();
      this._toggleControls(e);
    }
  }

  /* ---- Volume ---- */

  _handleVolumeChange(change) {
    const newVolume = Math.max(0, Math.min(1, this._volume() + change));
    this._setVolume(newVolume);
  }

  _setVolume(volume) {
    this._vibrate();
    if (!this._isOn()) return;
    const volumeFloat = parseFloat(Math.max(0, Math.min(1, volume)).toFixed(2));
    this.hass.callService("siren", "turn_on", {
      entity_id: this._config.siren_entity,
      volume_level: volumeFloat,
    });
  }

  /* ---- Brightness ---- */

  _handleBrightnessChange(e) {
    const brightness = parseInt(e.target.value);
    this._vibrate();
    this.hass.callService("light", "turn_on", {
      entity_id: this._config.light_entity,
      brightness: brightness,
    });
  }

  /* ---- Sound ---- */

  _handleSoundChange(e) {
    const newTone = e.target.value;
    const siren = this._sirenState();
    if (siren && newTone && newTone !== this._tone()) {
      this._vibrate();
      this.hass.callService("siren", "turn_on", {
        entity_id: this._config.siren_entity,
        tone: newTone,
        volume_level: this._volume(),
      });
    }
  }

  _handleSoundButtonTap(tone) {
    this._vibrate();
    this.hass.callService("siren", "turn_on", {
      entity_id: this._config.siren_entity,
      tone: tone,
      volume_level: this._volume(),
    });
  }

  /* ---- Child lock ---- */

  _toggleChildLock() {
    this._vibrate();
    const lockState = this._childLockState();
    if (!lockState) return;
    const isLocked = lockState.state === "locked";
    this.hass.callService("lock", isLocked ? "unlock" : "lock", {
      entity_id: this._config.child_lock_entity,
    });
  }

  /* ---- Timer ---- */

  _formatDurationForService(totalSeconds) {
    const s = Math.max(0, Math.floor(totalSeconds));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const ss = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(h)}:${pad(m)}:${pad(ss)}`;
  }

  _setTimer(minutes) {
    this._vibrate();
    const timerEntityId = this._config.timer_entity;
    if (!timerEntityId || !String(timerEntityId).startsWith("timer.")) return;

    const totalSeconds = minutes * 60;
    const serviceDuration = this._formatDurationForService(totalSeconds);

    this.hass.callService("timer", "start", {
      entity_id: timerEntityId,
      duration: serviceDuration,
    });
  }

  _cancelTimer() {
    this._vibrate();
    const timerEntityId = this._config.timer_entity;
    if (timerEntityId && String(timerEntityId).startsWith("timer.")) {
      this.hass.callService("timer", "cancel", { entity_id: timerEntityId });
    }
  }

  _getTimerPresets() {
    const presets = this._config.timer_presets || [15, 30, 60, 120];
    return presets.map((minutes) => ({
      label: formatTimerDuration(minutes),
      value: minutes,
    }));
  }

  /* ---- Scene activation (siren-aware) ---- */

  _activateScene(scene, hasLight) {
    this._vibrate();

    // If scene points to an HA scene entity, activate it directly
    if (scene.entity_id) {
      const serviceData = { entity_id: scene.entity_id };
      if (scene.transition !== undefined && scene.transition !== null) {
        serviceData.transition = scene.transition;
      }
      this.hass.callService("scene", "turn_on", serviceData);
      return;
    }

    // Light
    if (hasLight) {
      if (scene.turn_off_light) {
        this.hass.callService("light", "turn_off", {
          entity_id: this._config.light_entity,
        });
      } else {
        const lightData = {};
        let hasLightChanges = false;
        if (scene.brightness !== undefined && scene.brightness !== null) {
          lightData.brightness_pct = parseInt(scene.brightness);
          hasLightChanges = true;
        }
        if (scene.color && Array.isArray(scene.color)) {
          lightData.rgb_color = scene.color;
          hasLightChanges = true;
        }
        if (scene.transition !== undefined && scene.transition !== null) {
          lightData.transition = scene.transition;
          hasLightChanges = true;
        }
        if (hasLightChanges) {
          this.hass.callService("light", "turn_on", {
            entity_id: this._config.light_entity,
            ...lightData,
          });
        }
      }
    }

    // Siren (replaces media_player calls)
    if (scene.turn_off_media || scene.turn_off_siren) {
      this.hass.callService("siren", "turn_off", {
        entity_id: this._config.siren_entity,
      });
    } else {
      const sirenData = {};
      let hasSirenChanges = false;
      if (scene.sound_mode) {
        sirenData.tone = scene.sound_mode;
        hasSirenChanges = true;
      }
      if (
        scene.volume !== undefined &&
        scene.volume !== null &&
        scene.volume !== ""
      ) {
        sirenData.volume_level = Math.max(
          0,
          Math.min(1, parseFloat(scene.volume) / 100),
        );
        hasSirenChanges = true;
      }
      if (hasSirenChanges) {
        this.hass.callService("siren", "turn_on", {
          entity_id: this._config.siren_entity,
          ...sirenData,
        });
      }
    }
  }

  /* ---- Card click (volume background) ---- */

  _handleCardClick(e) {
    if (
      this._config.background_mode !== "volume" ||
      !this._config.volume_click_control
    )
      return;
    if (
      e.target.closest(
        ".action-button, .icon-container, .header, .expand-button, .expanded-controls",
      )
    )
      return;

    const rect = e.currentTarget.getBoundingClientRect();
    const position = (e.clientX - rect.left) / rect.width;
    const newVolume = Math.max(0, Math.min(1, position));
    this._setVolume(newVolume);
  }

  _vibrate() {
    if (this._config.haptic && navigator.vibrate) {
      navigator.vibrate(50);
    }
  }

  /* ---- Layout helpers ---- */

  _countAlwaysVisibleControlRows() {
    const c = this._config;
    if (!c) return 0;
    if (c.show_expand_button) return 0;

    const lightState = c.light_entity
      ? this.hass?.states?.[c.light_entity]
      : null;
    const hasLight = !!lightState;
    const lightOn = hasLight && lightState.state === "on";
    const sirenState = c.siren_entity
      ? this.hass?.states?.[c.siren_entity]
      : null;
    const tones = sirenState?.attributes?.available_tones;
    const controls = Array.isArray(c.controls_order) ? c.controls_order : [];
    let rows = 0;

    for (const key of controls) {
      let enabled = false;
      switch (key) {
        case "light":
          enabled =
            hasLight &&
            !!c.show_light_control &&
            (lightOn || !!c.show_light_when_off);
          break;
        case "volume_slider":
          enabled = !!c.show_volume_slider;
          break;
        case "volume_presets":
          enabled =
            Array.isArray(c.volume_presets) && c.volume_presets.length > 0;
          break;
        case "sound":
          enabled =
            !!c.show_sound_control && Array.isArray(tones) && tones.length > 0;
          break;
        case "scenes":
          enabled =
            !!c.show_scenes && Array.isArray(c.scenes) && c.scenes.length > 0;
          break;
        case "timer":
          enabled =
            !!c.show_timer &&
            !!c.timer_entity &&
            String(c.timer_entity).startsWith("timer.");
          break;
        case "child_lock":
          enabled = !!c.show_child_lock && !!c.child_lock_entity;
          break;
      }
      if (enabled) rows++;
    }
    return rows;
  }

  getCardSize() {
    const base = this._config?.layout === "vertical" ? 3 : 1;
    return base + this._countAlwaysVisibleControlRows();
  }

  getLayoutOptions() {
    const isVertical = this._config?.layout === "vertical";
    if (this._config?.show_expand_button) {
      return {
        grid_rows: "auto",
        grid_columns: 4,
        grid_min_columns: 2,
      };
    }
    const extra = this._countAlwaysVisibleControlRows();
    if (isVertical) {
      return {
        grid_rows: 3 + extra,
        grid_min_rows: 3,
        grid_columns: 2,
        grid_min_columns: 2,
      };
    }
    return {
      grid_rows: 1 + extra,
      grid_min_rows: 1,
      grid_columns: 4,
      grid_min_columns: 2,
    };
  }

  /* ================================================================== */
  /*  Styles                                                            */
  /* ================================================================== */

  static get styles() {
    return css`
      :host {
        display: block;
      }
      ha-card {
        position: relative;
        transition: all var(--animation-duration, 250ms) ease-in-out;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        border-radius: var(--ha-card-border-radius, 12px);
        overflow: hidden;
        padding: 0;
        background: var(--ha-card-background, var(--card-background-color));
      }
      .grid {
        display: grid;
        grid-template-columns: 1fr;
        padding: 0;
        margin: -1px 0;
      }
      .horizontal-layout {
        padding: 0 8px;
        min-height: 56px;
      }
      .horizontal-layout.expanded {
        height: auto;
      }
      .content-wrapper {
        position: relative;
        z-index: 1;
        display: flex;
        overflow: visible;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        min-width: 0;
        gap: 12px;
        min-height: 56px;
      }
      .header {
        display: flex;
        align-items: center;
        gap: 12px;
        flex: 1 1 auto;
        min-width: 0;
        -webkit-tap-highlight-color: transparent;
        min-height: 56px;
      }
      .actions {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;
      }
      .vertical-layout {
        padding: 0 8px;
        min-height: 120px;
        position: relative;
      }
      .vertical-layout.expanded {
        height: auto;
      }
      .vertical-layout.has-expand-button {
        min-height: 120px;
      }
      .vertical-layout:has(.expanded-controls.always-visible) {
        height: auto;
      }
      .content-wrapper.vertical {
        height: 100%;
        position: relative;
        display: block;
        min-height: 120px;
      }
      .vertical-layout.has-expand-button .content-wrapper.vertical {
        min-height: 120px;
      }
      .vertical-top-block {
        position: absolute;
        top: 12px;
        left: 16px;
        right: 16px;
        display: flex;
        justify-content: center;
      }
      .vertical-icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }
      .info.vertical {
        position: absolute;
        bottom: 10px;
        left: 16px;
        right: 16px;
        height: 40px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        text-align: center;
      }
      .expand-button.vertical {
        position: absolute;
        bottom: 12px;
        right: 12px;
        left: auto;
        transform: none;
        margin-left: 0;
      }
      .icon-container {
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        width: 36px;
        flex-shrink: 0;
        cursor: pointer;
        -webkit-tap-highlight-color: transparent;
      }
      .vertical-layout .icon-container {
        width: 48px;
        height: 48px;
      }
      .shape {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        height: 36px;
        width: 36px;
        border-radius: 50%;
        transition: background-color var(--animation-duration, 250ms);
      }
      .shape.vertical {
        width: 48px;
        height: 48px;
      }
      .shape.vertical ha-icon {
        --mdc-icon-size: 28px;
      }
      .shape ha-icon {
        transition: color var(--animation-duration, 250ms);
        --mdc-icon-size: 22px;
      }
      .user-photo {
        height: 36px;
        width: 36px;
        border-radius: 50%;
        object-fit: cover;
      }
      .user-photo.vertical {
        width: auto;
        height: auto;
        max-height: 48px;
        object-fit: contain;
        border-radius: 4px;
      }
      .info {
        overflow: hidden;
        flex: 1 1 auto;
        min-width: 0;
      }
      .name {
        font-size: 14px;
        font-weight: 500;
        line-height: 20px;
        color: var(--primary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .secondary-info {
        font-size: 12px;
        font-weight: 400;
        line-height: 16px;
        color: var(--secondary-text-color);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .expand-button {
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        width: 24px;
        height: 24px;
        border-radius: 5px;
        margin-left: 8px;
        color: var(--secondary-text-color);
        transition: transform var(--animation-duration, 250ms);
      }
      .expand-button:hover {
        color: var(--primary-text-color);
      }
      .expand-button:focus-visible {
        outline: 2px solid var(--primary-color);
        outline-offset: 2px;
      }
      .expand-icon {
        display: flex;
        transition: transform var(--animation-duration, 250ms) ease-in-out;
      }
      .expand-icon.expanded {
        transform: rotate(180deg);
      }
      .expanded-controls {
        margin-top: 0;
        padding: 0;
        padding-top: 8px;
        border-top: 1px solid var(--divider-color);
        display: flex;
        flex-direction: column;
        gap: 8px;
        animation: slideDown var(--animation-duration, 250ms) ease-out;
        position: relative;
        z-index: 1;
        overflow: visible;
      }
      .horizontal-layout.has-expand-button .expanded-controls {
        margin-top: 3px;
        margin-bottom: 4px;
        padding-top: 0;
      }
      .vertical-layout.has-expand-button .expanded-controls {
        margin-top: 3px;
        margin-bottom: 4px;
        padding: 0;
        border-top: none;
      }
      .vertical-layout .expanded-controls {
        margin-top: 12px;
        position: relative;
        z-index: 1;
        overflow: visible;
      }
      .expanded-controls.always-visible {
        animation: none;
        margin-top: 3px;
        margin-bottom: 4px;
        padding-top: 0;
        padding-bottom: 0;
      }
      .vertical-layout .expanded-controls.always-visible {
        margin-top: 3px;
        margin-bottom: 4px;
        padding: 0;
        position: relative;
        z-index: 1;
        overflow: visible;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .control-row {
        display: flex;
        align-items: center;
        gap: 12px;
        min-height: 56px;
      }
      .control-row ha-icon {
        color: var(--secondary-text-color);
        width: 24px;
        flex-shrink: 0;
      }
      .control-value {
        font-size: 0.875rem;
        color: var(--secondary-text-color);
        min-width: 24px;
        text-align: right;
      }
      .slider-container {
        position: relative;
        flex: 1;
        height: 40px;
        display: flex;
        align-items: center;
        border-radius: var(--ha-card-border-radius, 12px);
      }
      .slider-track {
        position: absolute;
        width: 100%;
        height: 40px;
        background-color: rgba(var(--rgb-primary-text-color), 0.05);
        border-radius: inherit;
        overflow: hidden;
      }
      .slider-fill {
        position: absolute;
        top: 0;
        left: 0;
        height: 100%;
        transition: width var(--animation-duration, 250ms) ease-out;
        background-color: var(--primary-color);
      }
      .slider-input {
        position: relative;
        width: 100%;
        height: 40px;
        -webkit-appearance: none;
        appearance: none;
        background: transparent;
        cursor: pointer;
        z-index: 1;
        margin: 0;
        outline: none;
      }
      .slider-input::-webkit-slider-thumb {
        -webkit-appearance: none;
        appearance: none;
        width: 0;
        height: 0;
      }
      .slider-input::-moz-range-thumb {
        width: 0;
        height: 0;
        border: 0;
      }
      .action-buttons,
      .preset-buttons,
      .timer-buttons {
        display: flex;
        gap: 8px;
        flex: 1;
      }
      .action-button {
        flex: 1;
        height: 40px;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        background-color: var(
          --button-bg,
          rgba(var(--rgb-primary-text-color), 0.05)
        );
        color: var(--button-fg, var(--primary-text-color));
        border: none;
        border-radius: var(--ha-card-border-radius, 12px);
        cursor: pointer;
        font-size: 0.875rem;
        transition:
          background-color var(--animation-duration, 250ms),
          color var(--animation-duration, 250ms);
        box-sizing: border-box;
      }
      .action-button:hover {
        background-color: var(
          --button-color,
          rgba(var(--rgb-primary-color), 0.12)
        );
      }
      .action-button.active {
        background-color: var(--button-color, var(--primary-color));
        color: white;
      }
      .action-button.danger {
        background-color: var(--error-color);
        color: white;
      }
      .action-button.icon-button {
        flex: 0 0 40px;
        width: 40px;
        padding: 0;
      }
      .action-button.icon-button ha-icon {
        --mdc-icon-size: 20px;
      }
      .error-msg,
      .warning-msg {
        background-color: var(--error-color, #db4437);
        color: white;
        padding: 16px;
        border-radius: var(--ha-card-border-radius, 12px);
      }
      .warning-msg {
        background-color: var(--warning-color, #ffa600);
      }
      .sound-select {
        width: 100%;
        height: 40px;
        border-radius: var(--ha-card-border-radius, 12px);
        border: 1px solid var(--divider-color);
        background: var(--ha-card-background, var(--card-background-color));
        color: var(--primary-text-color);
        -webkit-appearance: none;
        -moz-appearance: none;
        appearance: none;
        padding: 0 44px 0 12px;
        font-size: 14px;
        outline: none;
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24'><path fill='rgb(160,160,160)' d='M7 10l5 5 5-5z'/></svg>");
        background-repeat: no-repeat;
        background-position: right 14px center;
        background-size: 16px 16px;
      }
      .sound-select::-ms-expand {
        display: none;
      }
      .sound-select:focus {
        border-color: var(--primary-color);
      }
      .sound-control-wrapper {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
      }
      .sound-buttons {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      .sound-buttons .action-button {
        flex: 0 0 auto;
        padding: 6px 10px;
        height: 36px;
        gap: 4px;
      }
      .sound-buttons .action-button.icon-only {
        width: 36px;
        padding: 0;
        justify-content: center;
      }
      .sound-btn-label {
        font-size: 12px;
        max-width: 80px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .timer-buttons {
        flex-wrap: wrap;
      }
      .timer-remaining {
        font-size: 0.875rem;
        color: var(--primary-color);
        font-weight: 500;
        min-width: 40px;
        text-align: right;
      }
      .control-row.toggle-row {
        justify-content: space-between;
      }
      .colour-swatches {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding-top: 8px;
        padding-left: 36px;
      }
      .colour-swatch {
        width: 24px;
        height: 24px;
        border-radius: 6px;
        border: 1px solid rgba(0, 0, 0, 0.1);
        cursor: pointer;
        position: relative;
        flex: 0 0 auto;
        padding: 0;
        box-sizing: border-box;
        transition:
          transform var(--animation-duration, 250ms) ease-out,
          box-shadow var(--animation-duration, 250ms) ease-out;
      }
      .colour-swatch:hover {
        transform: scale(1.1);
      }
      .colour-swatch:active {
        transform: scale(0.95);
      }
      .colour-swatch.active {
        box-shadow: 0 0 0 2px var(--primary-color);
      }
      .colour-swatch.active::after {
        content: "";
        position: absolute;
        top: 50%;
        left: 50%;
        width: 12px;
        height: 12px;
        transform: translate(-50%, -50%);
        background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><path fill='white' d='M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z'/></svg>");
        background-size: contain;
        background-repeat: no-repeat;
        filter: drop-shadow(0 0 1px rgba(0, 0, 0, 0.6));
      }
      .colour-swatch-more {
        background-color: rgba(var(--rgb-primary-text-color), 0.05);
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
      .colour-swatch-more ha-icon {
        --mdc-icon-size: 16px;
        color: var(--primary-text-color);
      }
      .colour-swatch-more:hover {
        background-color: rgba(var(--rgb-primary-color), 0.12);
      }
      .lock-label,
      .timer-label {
        flex: 1;
        font-size: 14px;
        color: var(--primary-text-color);
      }
      .volume-percent {
        font-size: 13px;
        color: var(--secondary-text-color);
        min-width: 32px;
        text-align: center;
      }
      .scene-buttons {
        display: grid;
        grid-template-columns: repeat(var(--scenes-per-row, 4), 1fr);
        gap: 8px;
        width: 100%;
        box-sizing: border-box;
      }
      .toggle-control {
        justify-content: space-between;
      }
      .toggle-label {
        display: flex;
        align-items: center;
        gap: 12px;
      }
      .toggle-label ha-icon {
        color: var(--secondary-text-color);
      }
      .toggle-label span {
        color: var(--primary-text-color);
        font-size: 1rem;
      }
      .toggle-switch {
        position: relative;
        width: 60px;
        height: 40px;
        background-color: rgba(var(--rgb-primary-text-color), 0.05);
        border-radius: var(--ha-card-border-radius, 12px);
        cursor: pointer;
        transition: background-color 0.2s ease-in-out;
        flex-shrink: 0;
      }
      .toggle-switch.locked {
        background-color: var(--primary-color);
      }
      .toggle-thumb {
        position: relative;
        top: 2px;
        left: 2px;
        width: 36px;
        height: 36px;
        background-color: var(--card-background-color, #fff);
        border-radius: var(--ha-card-border-radius, 12px);
        display: grid;
        place-items: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
        transition: transform 0.2s ease-in-out;
        color: var(--secondary-text-color);
      }
      .toggle-thumb ha-icon {
        --mdc-icon-size: 26px;
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
      }
      .toggle-switch.locked .toggle-thumb {
        transform: translateX(20px);
        color: var(--primary-color);
      }
      @media (prefers-reduced-motion: reduce) {
        * {
          animation-duration: 0.01ms !important;
          transition-duration: 0.01ms !important;
        }
      }
    `;
  }
}

/* ================================================================== */
/*  NoiseCardEditor – visual editor                                   */
/* ================================================================== */

class NoiseCardEditor extends LitElement {
  static get properties() {
    return {
      hass: {},
      _config: {},
      _expandedSections: { type: Object },
      _searchQuery: { type: String },
      _editingSceneIndex: { type: Number },
      _editingSoundButtonIndex: { type: Number },
    };
  }

  set hass(hass) {
    this._hass = hass;
    this.requestUpdate();
  }

  get hass() {
    return this._hass;
  }

  constructor() {
    super();
    this._expandedSections = {
      basic: true,
      layout: false,
      controls: false,
      device_controls: false,
      advanced: false,
      timer: false,
      scenes: false,
    };
    this._searchQuery = "";
    this._editingSceneIndex = null;
    this._editingSoundButtonIndex = null;
  }

  setConfig(config) {
    this._config = { ...config };
  }

  /* ---- Lazy-load trick (from hatch) ---- */

  firstUpdated() {
    const tags = [
      "ha-entity-picker",
      "ha-select",
      "ha-textfield",
      "ha-input",
      "ha-icon-picker",
      "ha-form",
      "mwc-list-item",
    ];
    tags.forEach((t) => {
      customElements
        .whenDefined(t)
        .then(() => this.requestUpdate())
        .catch(() => {});
    });
    this._ensureHACommonsLoaded();
    this.requestUpdate();
  }

  _ensureHACommonsLoaded() {
    const needText =
      !customElements.get("ha-textfield") && !customElements.get("ha-input");
    const needEntity = !customElements.get("ha-entity-picker");
    const needIcon = !customElements.get("ha-icon-picker");
    if (!needText && !needEntity && !needIcon) return;
    try {
      const loader = document.createElement("ha-form");
      loader.style.display = "none";
      loader.schema = [
        { name: "_t", selector: { text: {} } },
        { name: "_n", selector: { number: { min: 0, mode: "box" } } },
        { name: "_e", selector: { entity: {} } },
        { name: "_i", selector: { icon: {} } },
      ];
      loader.data = { _t: "", _n: 0, _e: "", _i: "" };
      loader.hass = this.hass;
      this.shadowRoot?.appendChild(loader);
      setTimeout(() => {
        try {
          loader.remove();
        } catch (_) {}
      }, 0);
    } catch (_) {}
  }

  /* ---- Text field helper (ha-input / ha-textfield fallback) ---- */

  _tf({
    id = "",
    label = "",
    value = "",
    type = "text",
    min = "",
    max = "",
    step = "",
    helper = "",
    placeholder = "",
    change,
  } = {}) {
    const handler = change || ((e) => this._valueChanged(e));
    const v = value ?? "";
    if (customElements.get("ha-input")) {
      return html`<ha-input
        id="${id}"
        label="${label}"
        .value="${v}"
        type="${type}"
        min="${min}"
        max="${max}"
        step="${step}"
        helper="${helper}"
        placeholder="${placeholder}"
        @input="${handler}"
        @change="${handler}"
      ></ha-input>`;
    }
    return html`<ha-textfield
      id="${id}"
      label="${label}"
      .value="${v}"
      type="${type}"
      min="${min}"
      max="${max}"
      step="${step}"
      helper="${helper}"
      placeholder="${placeholder}"
      @input="${handler}"
      @change="${handler}"
    ></ha-textfield>`;
  }

  _renderSearchInput() {
    const handler = (e) => {
      this._searchQuery = e.target.value || "";
    };
    if (customElements.get("ha-input")) {
      return html`<ha-input
        class="editor-search"
        outlined
        label="Search settings"
        .value="${this._searchQuery || ""}"
        @input="${handler}"
      ></ha-input>`;
    }
    return html`<ha-textfield
      class="editor-search"
      outlined
      label="Search settings"
      .value="${this._searchQuery || ""}"
      @input="${handler}"
    ></ha-textfield>`;
  }

  /* ---- Search filter ---- */

  updated() {
    this._applySearchFilter();
  }

  _applySearchFilter() {
    const root = this.shadowRoot;
    if (!root) return;
    const q = (this._searchQuery || "").trim().toLowerCase();
    const panels = root.querySelectorAll("ha-expansion-panel");
    panels.forEach((panel) => {
      const body = panel.querySelector(".panel-body");
      if (!body) return;
      let matchCount = 0;
      Array.from(body.children).forEach((el) => {
        const text = this._extractSearchableText(el);
        const matches = !q || text.includes(q);
        el.toggleAttribute("data-search-hidden", !!q && !matches);
        if (matches) matchCount++;
      });
      panel.toggleAttribute("data-search-hidden", !!q && matchCount === 0);
    });
  }

  _extractSearchableText(el) {
    if (!el || el.nodeType !== 1) return "";
    const parts = [];
    const dataText = el.getAttribute && el.getAttribute("data-search-text");
    if (dataText) parts.push(dataText);
    const own = el.getAttribute && el.getAttribute("label");
    if (own) parts.push(own);
    const labelled = el.querySelectorAll ? el.querySelectorAll("[label]") : [];
    labelled.forEach((n) => {
      const v = n.getAttribute("label");
      if (v) parts.push(v);
    });
    if (el.textContent) parts.push(el.textContent);
    return parts.join(" ").toLowerCase();
  }

  /* ---- Section toggle ---- */

  _toggleSection(section) {
    this._expandedSections = {
      ...this._expandedSections,
      [section]: !this._expandedSections[section],
    };
    this.requestUpdate();
  }

  /* ---- Value changed handler ---- */

  _valueChanged(e) {
    if (!this._config || !this.hass) return;

    let newConfig = { ...this._config };

    if (
      e.detail &&
      e.detail.value !== undefined &&
      typeof e.detail.value === "object" &&
      e.detail.value !== null
    ) {
      newConfig = { ...this._config, ...e.detail.value };
    } else {
      const target = e.target;
      let key = target.id || target.configValue || target.getAttribute("key");
      let value;

      if (target.tagName === "HA-SWITCH") {
        value = target.checked;
      } else if (
        target.tagName === "HA-SELECT" ||
        target.tagName === "HA-ENTITY-PICKER"
      ) {
        value = e.detail?.value ?? target.value;
      } else if (target.tagName === "HA-ICON-PICKER") {
        value = e.detail?.value || "";
      } else if (key === "volume_presets") {
        value = target.value
          .split(",")
          .map((v) => parseFloat(v.trim()))
          .filter((v) => !isNaN(v) && v >= 0 && v <= 1);
        if (value.length === 0) value = null;
      } else if (key === "timer_presets") {
        value = target.value
          .split(",")
          .map((v) => parseInt(v.trim()))
          .filter((v) => !isNaN(v) && v > 0);
        if (value.length === 0) value = [15, 30, 60, 120];
      } else if (key === "scenes_per_row") {
        const numValue = parseInt(target.value);
        value =
          !isNaN(numValue) && numValue >= 1 && numValue <= 8 ? numValue : 4;
      } else if (key === "controls_order") {
        value = target.value
          .split(",")
          .map((v) => v.trim())
          .filter((v) => v);
        if (value.length === 0) value = undefined;
      } else {
        value = target.value;
      }

      const defaults = {
        background_mode: "full",
        layout: "horizontal",
        show_volume_buttons: true,
        show_volume_slider: false,
        show_sound_control: true,
        show_light_control: false,
        show_timer: false,
        show_scenes: false,
        show_expand_button: false,
        show_light_when_off: false,
        show_child_lock: false,
        sound_buttons_show_labels: true,
        haptic: true,
        volume_click_control: true,
        animation_duration: 250,
        volume_step: 0.05,
        secondary_info: null,
        timer_presets: [15, 30, 60, 120],
        scenes_per_row: 4,
        controls_order: [
          "light",
          "volume_slider",
          "volume_presets",
          "sound",
          "scenes",
          "timer",
          "child_lock",
        ],
      };

      const booleanFieldsWithTrueDefaults = [
        "show_volume_buttons",
        "show_sound_control",
        "haptic",
        "volume_click_control",
        "sound_buttons_show_labels",
      ];

      if (booleanFieldsWithTrueDefaults.includes(key)) {
        if (value === true) delete newConfig[key];
        else newConfig[key] = value;
      } else if (
        (defaults[key] !== undefined &&
          JSON.stringify(value) === JSON.stringify(defaults[key])) ||
        value === null ||
        value === "" ||
        value === undefined
      ) {
        delete newConfig[key];
      } else {
        newConfig[key] = value;
      }
    }

    const event = new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    });
    this.dispatchEvent(event);
  }

  /* ---- Scene management ---- */

  _addScene() {
    const newConfig = { ...this._config };
    if (!newConfig.scenes) newConfig.scenes = [];
    newConfig.scenes = [
      ...newConfig.scenes,
      { name: `Scene ${newConfig.scenes.length + 1}` },
    ];
    this._editingSceneIndex = newConfig.scenes.length - 1;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _editScene(index) {
    this._editingSceneIndex = index;
  }

  _deleteScene(index) {
    const newConfig = { ...this._config };
    newConfig.scenes = newConfig.scenes.filter((_, i) => i !== index);
    if (this._editingSceneIndex === index) this._editingSceneIndex = null;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _updateScene(e, index, field) {
    const newConfig = { ...this._config };
    const newScenes = structuredClone(this._config.scenes || []);
    const sceneToUpdate = newScenes[index];

    let value;
    const target = e.target;

    if (target.tagName === "HA-SWITCH") value = target.checked;
    else if (target.tagName === "HA-SELECT")
      value = e.detail?.value ?? target.value;
    else if (target.tagName === "HA-ICON-PICKER") value = e.detail?.value || "";
    else value = target.value;

    if (field === "color") value = parseColorInput(value);
    else if (
      field === "brightness" ||
      field === "volume" ||
      field === "transition"
    ) {
      const numValue = parseInt(value);
      value =
        target.value.trim() === "" || isNaN(numValue)
          ? null
          : numValue >= 0
            ? numValue
            : null;
    }

    const isMeaningful = value !== null && value !== undefined && value !== "";
    if (isMeaningful) sceneToUpdate[field] = value;
    else delete sceneToUpdate[field];

    const defaultSceneValues = { turn_off_light: false, turn_off_siren: false };
    if (
      defaultSceneValues[field] !== undefined &&
      sceneToUpdate[field] === defaultSceneValues[field]
    ) {
      delete sceneToUpdate[field];
    }

    newConfig.scenes = newScenes;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /* ---- Sound buttons management ---- */

  _addSoundButton() {
    const newConfig = { ...this._config };
    const currentButtons = Array.isArray(newConfig.sound_buttons)
      ? newConfig.sound_buttons
      : [];
    const usedTones = new Set(currentButtons.map((b) => b.tone));
    const availableTones = baseTonesForEditor(
      this.hass,
      newConfig.siren_entity,
    ).filter((t) => !usedTones.has(t));
    const newTone = availableTones[0] || "";
    const newButton = {
      label: newTone,
      icon: "mdi:music-note",
      tone: newTone,
    };
    newConfig.sound_buttons = [...currentButtons, newButton];
    this._editingSoundButtonIndex = newConfig.sound_buttons.length - 1;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _editSoundButton(index) {
    this._editingSoundButtonIndex = index;
  }

  _deleteSoundButton(index) {
    const newConfig = { ...this._config };
    const currentButtons = Array.isArray(newConfig.sound_buttons)
      ? newConfig.sound_buttons
      : [];
    newConfig.sound_buttons = currentButtons.filter((_, i) => i !== index);
    if (newConfig.sound_buttons.length === 0) newConfig.sound_buttons = null;
    if (this._editingSoundButtonIndex === index)
      this._editingSoundButtonIndex = null;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _updateSoundButton(e, index, field) {
    const newConfig = { ...this._config };
    const newButtons = structuredClone(
      Array.isArray(newConfig.sound_buttons) ? newConfig.sound_buttons : [],
    );
    const buttonToUpdate = newButtons[index];
    if (!buttonToUpdate) return;

    const target = e.target;
    let value;
    if (target.tagName === "HA-SWITCH") value = target.checked;
    else if (target.tagName === "HA-SELECT")
      value = e.detail?.value ?? target.value;
    else if (target.tagName === "HA-ICON-PICKER")
      value = e.detail?.value || "";
    else value = target.value;

    if (value === "" || value === null || value === undefined) {
      delete buttonToUpdate[field];
    } else {
      buttonToUpdate[field] = value;
    }

    newConfig.sound_buttons = newButtons;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _moveSoundButton(index, direction) {
    const newConfig = { ...this._config };
    const buttons = Array.isArray(newConfig.sound_buttons)
      ? [...newConfig.sound_buttons]
      : [];
    const target = index + direction;
    if (target < 0 || target >= buttons.length) return;
    [buttons[index], buttons[target]] = [buttons[target], buttons[index]];
    newConfig.sound_buttons = buttons;
    this._editingSoundButtonIndex = target;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _resetSoundButtonsToAuto() {
    const newConfig = { ...this._config };
    newConfig.sound_buttons = null;
    this._editingSoundButtonIndex = null;
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: newConfig },
        bubbles: true,
        composed: true,
      }),
    );
  }

  /* ---- Render ---- */

  render() {
    if (!this.hass) return html`<div>Loading...</div>`;
    if (!this._config) return html`<div>No configuration</div>`;

    const hasLight = !!this._config.light_entity;
    const currentSiren = this._config?.siren_entity;
    const baseTones =
      currentSiren && this.hass.states[currentSiren]
        ? this.hass.states[currentSiren].attributes.available_tones || []
        : [];

    const basicSchema = [
      { name: "name", label: "Name (Optional)", selector: { text: {} } },
      {
        name: "siren_entity",
        label: "Siren Entity (Required)",
        selector: { entity: { domain: "siren" } },
        required: true,
      },
      {
        name: "light_entity",
        label: "Light Entity (Optional)",
        selector: { entity: { domain: "light" } },
      },
      {
        name: "icon",
        label: "Default Icon (Optional)",
        selector: { icon: { placeholder: "mdi:speaker" } },
      },
      {
        name: "user_photo",
        label: "User Photo URL (Optional)",
        selector: { text: { type: "url" } },
      },
    ];

    const deviceControlsSchema = [];
    if (this._config.show_child_lock) {
      deviceControlsSchema.push({
        name: "child_lock_entity",
        label: "Child Lock Entity (lock)",
        selector: { entity: { domain: "lock" } },
      });
    }

    const timerSchema = [
      {
        name: "timer_entity",
        label: "Timer Entity",
        selector: { entity: { domain: "timer" } },
      },
    ];

    const panel = (key, title, icon, content) => {
      const isSearching = !!(this._searchQuery && this._searchQuery.trim());
      const expanded = isSearching ? true : !!this._expandedSections?.[key];
      return html`
        <ha-expansion-panel
          outlined
          ?expanded=${expanded}
          @expanded-changed=${(e) => {
            this._expandedSections = {
              ...(this._expandedSections || {}),
              [key]: !!e.detail?.expanded,
            };
          }}
        >
          <div slot="header" class="panel-header">
            <ha-icon class="panel-header-icon" icon=${icon}></ha-icon>
            <span class="panel-header-label">${title}</span>
          </div>
          <div class="panel-body">${content}</div>
        </ha-expansion-panel>
      `;
    };

    /* -- Basic -- */
    const basicContent = html`
      <div
        class="form-block"
        data-search-text="name siren entity light entity default icon user photo url"
      >
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${basicSchema}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
    `;

    /* -- Layout -- */
    const layoutContent = html`
      <ha-select
        key="layout"
        label="Layout"
        .value="${this._config?.layout || "horizontal"}"
        .options=${[
          { value: "horizontal", label: "Horizontal" },
          { value: "vertical", label: "Vertical" },
        ]}
        @selected="${this._valueChanged}"
        @change="${this._valueChanged}"
        @closed="${(e) => e.stopPropagation()}"
      >
        <mwc-list-item value="horizontal">Horizontal</mwc-list-item>
        <mwc-list-item value="vertical">Vertical</mwc-list-item>
      </ha-select>
      ${hasLight
        ? html`
            <ha-select
              key="background_mode"
              label="Background Mode"
              .value="${this._config?.background_mode || "full"}"
              .options=${[
                { value: "none", label: "None" },
                { value: "full", label: "Full Color" },
                { value: "volume", label: "Volume Fill" },
              ]}
              @selected="${this._valueChanged}"
              @change="${this._valueChanged}"
              @closed="${(e) => e.stopPropagation()}"
            >
              <mwc-list-item value="none">None</mwc-list-item>
              <mwc-list-item value="full">Full Color</mwc-list-item>
              <mwc-list-item value="volume">Volume Fill</mwc-list-item>
            </ha-select>
          `
        : ""}
      ${this._tf({
        id: "secondary_info",
        label: "Secondary Info (Optional)",
        value:
          this._config?.secondary_info !== undefined
            ? this._config.secondary_info
            : "",
        helper:
          "Use {volume}, {sound}, {brightness} as placeholders. Leave empty for auto.",
      })}
      ${this._tf({
        id: "controls_order",
        label: "Expanded Controls Order",
        value: (
          this._config?.controls_order || [
            "light",
            "volume_slider",
            "volume_presets",
            "sound",
            "scenes",
            "timer",
            "child_lock",
          ]
        ).join(", "),
        helper: "Comma-separated list of control keys.",
      })}
    `;

    /* -- Controls -- */
    const controlsContent = html`
      <div class="switches">
        <label class="switch-wrapper"
          ><ha-switch
            id="show_volume_buttons"
            .checked="${this._config?.show_volume_buttons !== false}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label">
            <span>Show Volume Buttons</span>
          </div></label
        >
        <label class="switch-wrapper"
          ><ha-switch
            id="show_volume_slider"
            .checked="${this._config?.show_volume_slider === true}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label"><span>Show Volume Slider</span></div></label
        >
        <label class="switch-wrapper"
          ><ha-switch
            id="show_expand_button"
            .checked="${this._config?.show_expand_button === true}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label">
            <span>Show Expand Button</span>
            <div class="switch-description">
              Hide controls behind a toggle button
            </div>
          </div></label
        >
        <label class="switch-wrapper"
          ><ha-switch
            id="show_sound_control"
            .checked="${this._config?.show_sound_control !== false}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label"><span>Show Sound Control</span></div></label
        >
        ${hasLight
          ? html`
              <label class="switch-wrapper"
                ><ha-switch
                  id="show_light_control"
                  .checked="${this._config?.show_light_control === true}"
                  @change="${this._valueChanged}"
                ></ha-switch>
                <div class="switch-label">
                  <span>Show Light Control</span>
                  <div class="switch-description">
                    Brightness slider and colour swatches
                  </div>
                </div></label
              >
              <label class="switch-wrapper"
                ><ha-switch
                  id="show_light_when_off"
                  .checked="${this._config?.show_light_when_off === true}"
                  @change="${this._valueChanged}"
                ></ha-switch>
                <div class="switch-label">
                  <span>Show Light When Off</span>
                </div></label
              >
            `
          : ""}
        <label class="switch-wrapper"
          ><ha-switch
            id="show_timer"
            .checked="${this._config?.show_timer === true}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label"><span>Show Timer Control</span></div></label
        >
        <label class="switch-wrapper"
          ><ha-switch
            id="show_scenes"
            .checked="${this._config?.show_scenes === true}"
            @change="${this._valueChanged}"
          ></ha-switch>
          <div class="switch-label"><span>Show Scene Control</span></div></label
        >
      </div>
    `;

    /* -- Device-Specific Controls -- */
    const deviceControlsContent = html`
      <label class="switch-wrapper"
        ><ha-switch
          id="show_child_lock"
          .checked="${this._config?.show_child_lock === true}"
          @change="${this._valueChanged}"
        ></ha-switch>
        <div class="switch-label"><span>Show Child Lock</span></div></label
      >
      ${deviceControlsSchema.length > 0
        ? html`
            <div class="form-block" data-search-text="child lock entity switch">
              <ha-form
                .hass=${this.hass}
                .data=${this._config}
                .schema=${deviceControlsSchema}
                @value-changed=${this._valueChanged}
              ></ha-form>
            </div>
          `
        : ""}
    `;

    /* -- Advanced -- */
    const advancedContent = html`
      <label class="switch-wrapper"
        ><ha-switch
          id="haptic"
          .checked="${this._config?.haptic !== false}"
          @change="${this._valueChanged}"
        ></ha-switch>
        <div class="switch-label"><span>Haptic Feedback</span></div></label
      >
      ${hasLight
        ? html`
            <label class="switch-wrapper"
              ><ha-switch
                id="volume_click_control"
                .checked="${this._config?.volume_click_control !== false}"
                @change="${this._valueChanged}"
              ></ha-switch>
              <div class="switch-label">
                <span>Volume Click Control</span>
                <div class="switch-description">
                  Click on card background to set volume
                </div>
              </div></label
            >
          `
        : ""}
      ${this._tf({
        id: "volume_presets",
        label: "Volume Presets (Optional)",
        value: this._config?.volume_presets
          ? this._config.volume_presets.join(", ")
          : "",
        helper: "Comma-separated values (0.0-1.0): 0.2, 0.5, 0.8",
      })}
      ${this._tf({
        id: "volume_step",
        label: "Volume Step",
        type: "number",
        min: "0.01",
        max: "0.5",
        step: "0.01",
        value: this._config?.volume_step || 0.05,
        helper: "Volume change per button press",
      })}
      ${this._tf({
        id: "animation_duration",
        label: "Animation Duration (ms)",
        type: "number",
        min: "0",
        max: "1000",
        step: "50",
        value: this._config?.animation_duration || 250,
      })}
    `;

    /* -- Timer -- */
    const timerContent = html`
      <div class="form-block" data-search-text="timer entity">
        <ha-form
          .hass=${this.hass}
          .data=${this._config}
          .schema=${timerSchema}
          @value-changed=${this._valueChanged}
        ></ha-form>
      </div>
      ${this._tf({
        id: "timer_presets",
        label: "Timer Presets (minutes)",
        value: this._config.timer_presets
          ? this._config.timer_presets.join(", ")
          : "15, 30, 60, 120",
        helper: "Comma-separated values in minutes",
      })}
    `;

    /* -- Scenes -- */
    const scenesContent = html`
      ${this._tf({
        id: "scenes_per_row",
        label: "Scenes Per Row",
        type: "number",
        min: "1",
        max: "8",
        value: this._config?.scenes_per_row || 4,
        helper: "Number of scene buttons per row",
      })}
      <div class="subsection-title">Scenes</div>
      ${this._config?.scenes && this._config.scenes.length > 0
        ? html`
            <div class="scene-list">
              ${this._config.scenes.map((scene, index) => {
                const configuredSceneTone = scene.sound_mode;
                const sceneTones = [...baseTones];
                if (
                  configuredSceneTone &&
                  !sceneTones.includes(configuredSceneTone)
                )
                  sceneTones.unshift(configuredSceneTone);
                return html`
                  <div class="scene-item">
                    <div
                      class="scene-summary"
                      @click="${() => this._editScene(index)}"
                    >
                      <ha-icon icon="${scene.icon || "mdi:palette"}"></ha-icon>
                      <span>${scene.name || `Scene ${index + 1}`}</span>
                      <ha-icon
                        icon="mdi:delete"
                        class="delete-icon"
                        @click="${(e) => {
                          e.stopPropagation();
                          this._deleteScene(index);
                        }}"
                      ></ha-icon>
                    </div>
                    ${this._editingSceneIndex === index
                      ? html`
                          <div class="scene-edit">
                            ${this._tf({
                              label: "Name",
                              value: scene.name || "",
                              placeholder: "Scene name",
                              change: (e) =>
                                this._updateScene(e, index, "name"),
                            })}
                            <ha-icon-picker
                              label="Icon"
                              .value="${scene.icon || ""}"
                              @value-changed="${(e) =>
                                this._updateScene(e, index, "icon")}"
                              .placeholder="${"mdi:palette"}"
                            ></ha-icon-picker>
                            <div class="subsection-title">
                              Option 1: Activate HA Scene
                            </div>
                            <ha-entity-picker
                              .hass=${this.hass}
                              .value=${scene.entity_id}
                              @value-changed=${(e) =>
                                this._updateScene(e, index, "entity_id")}
                              label="Scene Entity (Optional)"
                              .includeDomains=${["scene"]}
                            ></ha-entity-picker>
                            ${this._tf({
                              label: "Transition (seconds)",
                              type: "number",
                              min: "0",
                              value: scene.transition ?? "",
                              change: (e) =>
                                this._updateScene(e, index, "transition"),
                            })}
                            <div class="subsection-title">
                              Option 2: Manual Controls
                            </div>
                            <div
                              class="manual-controls ${scene.entity_id
                                ? "disabled"
                                : ""}"
                            >
                              ${hasLight
                                ? html`
                                    <label class="switch-wrapper"
                                      ><ha-switch
                                        .checked="${scene.turn_off_light ===
                                        true}"
                                        @change="${(e) =>
                                          this._updateScene(
                                            e,
                                            index,
                                            "turn_off_light",
                                          )}"
                                      ></ha-switch>
                                      <div class="switch-label">
                                        <span>Turn Off Light</span>
                                      </div></label
                                    >
                                  `
                                : ""}
                              <label class="switch-wrapper"
                                ><ha-switch
                                  .checked="${scene.turn_off_siren === true}"
                                  @change="${(e) =>
                                    this._updateScene(
                                      e,
                                      index,
                                      "turn_off_siren",
                                    )}"
                                ></ha-switch>
                                <div class="switch-label">
                                  <span>Turn Off Sound</span>
                                </div></label
                              >
                              ${hasLight
                                ? html`
                                    ${this._tf({
                                      label: "Color",
                                      value: scene.color
                                        ? getColorNameFromRgb(scene.color)
                                        : "",
                                      helper: "Color name or RGB (255,255,255)",
                                      change: (e) =>
                                        this._updateScene(e, index, "color"),
                                    })}
                                    ${this._tf({
                                      label: "Brightness (%)",
                                      type: "number",
                                      min: "1",
                                      max: "100",
                                      value: scene.brightness ?? "",
                                      change: (e) =>
                                        this._updateScene(
                                          e,
                                          index,
                                          "brightness",
                                        ),
                                    })}
                                  `
                                : ""}
                              ${sceneTones.length > 0
                                ? html`
                                    <ha-select
                                      label="Sound (tone)"
                                      .value="${scene.sound_mode || ""}"
                                      .options=${[
                                        { value: "", label: "" },
                                        ...sceneTones.map((m) => ({
                                          value: m,
                                          label: m,
                                        })),
                                      ]}
                                      @selected="${(e) =>
                                        this._updateScene(
                                          e,
                                          index,
                                          "sound_mode",
                                        )}"
                                      @change="${(e) =>
                                        this._updateScene(
                                          e,
                                          index,
                                          "sound_mode",
                                        )}"
                                      @closed="${(e) => e.stopPropagation()}"
                                    >
                                      <mwc-list-item value=""></mwc-list-item>
                                      ${sceneTones.map(
                                        (mode) =>
                                          html`<mwc-list-item .value="${mode}"
                                            >${mode}</mwc-list-item
                                          >`,
                                      )}
                                    </ha-select>
                                  `
                                : ""}
                              ${this._tf({
                                label: "Volume (%)",
                                type: "number",
                                min: "0",
                                max: "100",
                                value: scene.volume ?? "",
                                change: (e) =>
                                  this._updateScene(e, index, "volume"),
                              })}
                            </div>
                            <button
                              class="done-button"
                              @click="${() => (this._editingSceneIndex = null)}"
                            >
                              Done
                            </button>
                          </div>
                        `
                      : ""}
                  </div>
                `;
              })}
            </div>
          `
        : html`<div class="no-scenes">No scenes configured</div>`}
      <button class="add-scene-button" @click="${this._addScene}">
        <ha-icon icon="mdi:plus"></ha-icon>Add Scene
      </button>
    `;

    /* -- Sound Buttons -- */
    const hasSiren = !!this._config?.siren_entity;
    const currentSirenForSound = this._config?.siren_entity;
    const soundButtonTones = baseTonesForEditor(
      this.hass,
      currentSirenForSound,
    );
    const currentSoundButtons = Array.isArray(this._config?.sound_buttons)
      ? this._config.sound_buttons
      : null;

    const soundButtonsContent = html`
      <label class="switch-wrapper"
        ><ha-switch
          id="sound_buttons_show_labels"
          .checked="${this._config?.sound_buttons_show_labels !== false}"
          @change="${this._valueChanged}"
        ></ha-switch>
        <div class="switch-label">
          <span>Show Labels on Sound Buttons</span>
          <div class="switch-description">
            When off, only icons are shown.
          </div>
        </div></label
      >
      ${!hasSiren
        ? html`<div class="no-scenes">
            Set siren entity first to configure sound buttons.
          </div>`
        : currentSoundButtons === null
          ? html`
              <div class="no-scenes">
                Using auto-derived buttons (first 6 tones).
              </div>
              <button
                class="add-scene-button"
                @click="${this._addSoundButton}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>Customize Sound Buttons
              </button>
            `
          : html`
              <div class="scene-list">
                ${currentSoundButtons.map((btn, index) => {
                  const configuredTone = btn.tone;
                  const optionTones = [...soundButtonTones];
                  if (
                    configuredTone &&
                    !optionTones.includes(configuredTone)
                  )
                    optionTones.unshift(configuredTone);
                  return html`
                    <div class="scene-item">
                      <div
                        class="scene-summary"
                        @click="${() => this._editSoundButton(index)}"
                      >
                        <ha-icon
                          icon="${btn.icon || "mdi:music-note"}"
                        ></ha-icon>
                        <span>${btn.label || btn.tone || "Button"}</span>
                        <ha-icon
                          icon="mdi:arrow-up"
                          class="reorder-icon"
                          @click="${(e) => {
                            e.stopPropagation();
                            this._moveSoundButton(index, -1);
                          }}"
                        ></ha-icon>
                        <ha-icon
                          icon="mdi:arrow-down"
                          class="reorder-icon"
                          @click="${(e) => {
                            e.stopPropagation();
                            this._moveSoundButton(index, 1);
                          }}"
                        ></ha-icon>
                        <ha-icon
                          icon="mdi:delete"
                          class="delete-icon"
                          @click="${(e) => {
                            e.stopPropagation();
                            this._deleteSoundButton(index);
                          }}"
                        ></ha-icon>
                      </div>
                      ${this._editingSoundButtonIndex === index
                        ? html`
                            <div class="scene-edit">
                              <ha-select
                                label="Tone"
                                .value="${btn.tone || ""}"
                                .options=${optionTones.map((m) => ({
                                  value: m,
                                  label: m,
                                }))}
                                @selected="${(e) =>
                                  this._updateSoundButton(
                                    e,
                                    index,
                                    "tone",
                                  )}"
                                @change="${(e) =>
                                  this._updateSoundButton(
                                    e,
                                    index,
                                    "tone",
                                  )}"
                                @closed="${(e) => e.stopPropagation()}"
                              >
                                ${optionTones.map(
                                  (mode) =>
                                    html`<mwc-list-item
                                      .value="${mode}"
                                      >${mode}</mwc-list-item
                                    >`,
                                )}
                              </ha-select>
                              <ha-icon-picker
                                label="Icon"
                                .value="${btn.icon || ""}"
                                @value-changed="${(e) =>
                                  this._updateSoundButton(
                                    e,
                                    index,
                                    "icon",
                                  )}"
                                .placeholder="${"mdi:music-note"}"
                              ></ha-icon-picker>
                              ${this._tf({
                                label: "Label",
                                value: btn.label || "",
                                placeholder: "Optional",
                                change: (e) =>
                                  this._updateSoundButton(
                                    e,
                                    index,
                                    "label",
                                  ),
                              })}
                              <button
                                class="done-button"
                                @click="${() =>
                                  (this._editingSoundButtonIndex = null)}"
                              >
                                Done
                              </button>
                            </div>
                          `
                        : ""}
                    </div>
                  `;
                })}
              </div>
              <button
                class="add-scene-button"
                @click="${this._addSoundButton}"
              >
                <ha-icon icon="mdi:plus"></ha-icon>Add Sound Button
              </button>
              <button
                class="add-scene-button"
                @click="${this._resetSoundButtonsToAuto}"
              >
                <ha-icon icon="mdi:restore"></ha-icon>Reset to Auto-Derive
              </button>
            `}
    `;

    return html`
      <div class="editor-toolbar">${this._renderSearchInput()}</div>
      <div class="card-config">
        ${panel("basic", "Basic Configuration", "mdi:tune", basicContent)}
        ${panel(
          "layout",
          "Layout Options",
          "mdi:view-dashboard-outline",
          layoutContent,
        )}
        ${panel(
          "controls",
          "Control Visibility",
          "mdi:toggle-switch-outline",
          controlsContent,
        )}
        ${panel(
          "device_controls",
          "Device-Specific Controls",
          "mdi:devices",
          deviceControlsContent,
        )}
        ${panel(
          "advanced",
          "Advanced Options",
          "mdi:cog-outline",
          advancedContent,
        )}
        ${panel("timer", "Timer Options", "mdi:timer-outline", timerContent)}
        ${panel("scenes", "Scene Control", "mdi:palette", scenesContent)}
        ${panel(
          "sound_buttons",
          "Sound Buttons",
          "mdi:music-note",
          soundButtonsContent,
        )}
      </div>
    `;
  }

  static get styles() {
    return css`
      .card-config {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .editor-toolbar {
        padding: 4px 0 8px;
      }
      .editor-search {
        width: 100%;
      }
      [data-search-hidden] {
        display: none !important;
      }
      ha-expansion-panel {
        --expansion-panel-summary-padding: 0 16px;
        --expansion-panel-content-padding: 0;
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        background: var(--card-background-color);
        overflow: hidden;
      }
      .panel-header {
        display: flex;
        align-items: center;
        gap: 12px;
        width: 100%;
        padding: 12px 0;
      }
      .panel-header-icon {
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
        flex-shrink: 0;
      }
      .panel-header-label {
        font-size: 14px;
        font-weight: 500;
        color: var(--primary-text-color);
        flex: 1;
        min-width: 0;
      }
      .panel-body {
        padding: 8px 16px 16px;
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .form-block {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      @keyframes slideDown {
        from {
          opacity: 0;
          transform: translateY(-8px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      .subsection-title {
        font-weight: 500;
        margin-top: 8px;
        margin-bottom: -8px;
        color: var(--primary-text-color);
        font-size: 0.9rem;
      }
      ha-select,
      ha-textfield,
      ha-input,
      ha-entity-picker,
      ha-icon-picker {
        width: 100%;
      }
      .switches {
        display: flex;
        flex-direction: column;
        gap: 12px;
      }
      .switch-wrapper {
        display: flex;
        align-items: center;
        gap: 16px;
        cursor: pointer;
        padding: 4px 0;
      }
      .switch-label {
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .switch-label span:first-child {
        font-weight: 500;
        color: var(--primary-text-color);
        font-size: 14px;
      }
      .switch-description {
        font-size: 12px;
        color: var(--secondary-text-color);
        margin-top: 2px;
        line-height: 1.4;
      }
      ha-textfield[type="number"],
      ha-input[type="number"] {
        width: 100%;
      }
      .scene-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .scene-item {
        border: 1px solid var(--divider-color);
        border-radius: 8px;
        overflow: hidden;
      }
      .scene-summary {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        cursor: pointer;
        background: rgba(var(--rgb-primary-text-color), 0.02);
        transition: background-color 0.1s;
      }
      .scene-summary:hover {
        background: rgba(var(--rgb-primary-text-color), 0.06);
      }
      .scene-summary ha-icon:first-child {
        color: var(--primary-text-color);
      }
      .scene-summary span {
        flex: 1;
        font-weight: 500;
        color: var(--primary-text-color);
      }
      .delete-icon {
        color: var(--error-color);
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .delete-icon:hover {
        opacity: 1;
      }
      .reorder-icon {
        color: var(--secondary-text-color);
        cursor: pointer;
        opacity: 0.7;
        transition: opacity 0.2s;
      }
      .reorder-icon:hover {
        opacity: 1;
      }
      .scene-edit {
        padding: 16px;
        background: rgba(var(--rgb-primary-text-color), 0.02);
        display: flex;
        flex-direction: column;
        gap: 12px;
        animation: slideDown 0.2s ease-out;
      }
      .manual-controls.disabled {
        opacity: 0.4;
        pointer-events: none;
      }
      .no-scenes {
        text-align: center;
        color: var(--secondary-text-color);
        padding: 24px;
        font-style: italic;
      }
      .add-scene-button,
      .done-button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        padding: 12px;
        border: 2px dashed var(--divider-color);
        border-radius: 8px;
        background: transparent;
        color: var(--primary-text-color);
        cursor: pointer;
        transition: all 0.2s;
      }
      .done-button {
        border-style: solid;
        background: var(--primary-color);
        color: white;
      }
      .add-scene-button:hover {
        border-color: var(--primary-color);
        background: rgba(var(--rgb-primary-color), 0.1);
      }
      .done-button:hover {
        opacity: 0.9;
      }
      ha-select {
        --mdc-menu-max-width: 100%;
      }
    `;
  }
}

/* ================================================================== */
/*  Registration                                                       */
/* ================================================================== */

customElements.define("noise-card", NoiseCard);

const registerEditor = () => {
  const isEditorReady = !!(
    customElements.get("ha-entity-picker") ||
    customElements.get("hui-entity-editor") ||
    customElements.get("hui-card-element-editor") ||
    window.customElements.get("ha-form")
  );

  if (isEditorReady && !customElements.get("noise-card-editor")) {
    customElements.define("noise-card-editor", NoiseCardEditor);
  } else if (!isEditorReady) {
    setTimeout(registerEditor, 100);
  }
};

registerEditor();

window.addEventListener("location-changed", () => {
  setTimeout(registerEditor, 100);
});

NoiseCard.getConfigElement = function () {
  registerEditor();

  if (customElements.get("noise-card-editor")) {
    return document.createElement("noise-card-editor");
  } else {
    const placeholder = document.createElement("div");
    placeholder.textContent = "Loading editor...";

    const checkInterval = setInterval(() => {
      if (customElements.get("noise-card-editor")) {
        clearInterval(checkInterval);
        const editor = document.createElement("noise-card-editor");
        placeholder.replaceWith(editor);
        if (placeholder._config) {
          editor.setConfig(placeholder._config);
        }
        if (placeholder._hass) {
          editor.hass = placeholder._hass;
        }
      }
    }, 100);

    const originalSetConfig = placeholder.setConfig;
    placeholder.setConfig = function (config) {
      placeholder._config = config;
      if (originalSetConfig) originalSetConfig.call(placeholder, config);
    };

    Object.defineProperty(placeholder, "hass", {
      set: function (hass) {
        placeholder._hass = hass;
      },
      get: function () {
        return placeholder._hass;
      },
    });

    return placeholder;
  }
};

setTimeout(() => {
  window.customCards = window.customCards || [];
  window.customCards.push({
    type: "noise-card",
    name: "Noise Card",
    preview: true,
    description: "A Lovelace card for Tuya noise machines (siren + light).",
    editor: "noise-card-editor",
    getEntitySuggestion: (hass, entityId) => {
      if (typeof entityId !== "string") return null;
      if (entityId.split(".")[0] !== "siren") return null;
      const platform = hass?.entities?.[entityId]?.platform || "";
      if (!/tuya/i.test(platform)) return null;
      return { config: { type: "custom:noise-card", siren_entity: entityId } };
    },
  });
}, 0);
