export class InputController {
  constructor(root = document) {
    this.root = root;
    this.keys = new Set();
    this.pointers = new Map();
    this.buttons = [...root.querySelectorAll("[data-action]")];

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.clear = this.clear.bind(this);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) this.clear();
    });

    for (const button of this.buttons) {
      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.pointers.set(event.pointerId, button.dataset.action);
        button.classList.add("is-pressed");
      });

      const release = event => {
        if (!this.pointers.has(event.pointerId)) return;
        this.pointers.delete(event.pointerId);
        button.classList.remove("is-pressed");
      };

      button.addEventListener("pointerup", release);
      button.addEventListener("pointercancel", release);
      button.addEventListener("lostpointercapture", release);
      button.addEventListener("contextmenu", event => event.preventDefault());
    }
  }

  handleKeyDown(event) {
    const key = event.key.toLowerCase();
    if (["a", "arrowleft", "d", "arrowright", " ", "w", "arrowup"].includes(key)) {
      event.preventDefault();
      this.keys.add(key);
    }
  }

  handleKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  snapshot() {
    const left = this.keys.has("a") || this.keys.has("arrowleft")
      || [...this.pointers.values()].includes("left");
    const right = this.keys.has("d") || this.keys.has("arrowright")
      || [...this.pointers.values()].includes("right");
    const jump = this.keys.has(" ") || this.keys.has("w") || this.keys.has("arrowup")
      || [...this.pointers.values()].includes("jump");

    return {
      move: Number(right) - Number(left),
      jumpHeld: jump
    };
  }

  clear() {
    this.keys.clear();
    this.pointers.clear();
    for (const button of this.buttons) button.classList.remove("is-pressed");
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.clear);
    this.clear();
  }
}
