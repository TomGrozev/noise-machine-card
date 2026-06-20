import resolve from "@rollup/plugin-node-resolve";
// import terser from "@rollup/plugin-terser";

// Note: The source file uses CDN imports (https://unpkg.com/lit-element)
// so rollup with node-resolve won't inline them — the output is effectively
// a copy of the source.  This is intentional: the card is a single ES module
// meant to be served directly by Home Assistant.

export default {
  input: "src/noise-card.js",
  output: {
    file: "noise-card.js",
    format: "es",
  },
  plugins: [
    resolve(),
    // terser(),
  ],
};
