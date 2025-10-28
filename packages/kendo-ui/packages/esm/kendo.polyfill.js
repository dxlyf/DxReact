/* eslint no-console: ["error", { allow: ["warn", "error"] }] */
const __meta__ = {
    id: "polifill",
    name: "Polifill",
    category: "web",
    description: "A polifill for kendo. Typically injected in messages and cultures.",
    depends: [ ],
};

if (!window.kendo) {
    console.error("kendo is not loaded.", "Ensure that kendo scripts are loaded before this script.");
}

export { __meta__ };
