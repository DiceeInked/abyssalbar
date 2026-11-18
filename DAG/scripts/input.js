export class InputController {
  constructor(root = document) {
    this.root = root;
    this.keys = new Set();
    this.pointers = new Map();
    this.buttons = [...root.querySelectorAll("[data-action]")];
    this.attackQueued = false;
    this.resetQueued = false;

    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleKeyUp = this.handleKeyUp.bind(this);
    this.handleVisibilityChange = this.handleVisibilityChange.bind(this);
    this.clear = this.clear.bind(this);

    window.addEventListener("keydown", this.handleKeyDown);
    window.addEventListener("keyup", this.handleKeyUp);
    window.addEventListener("blur", this.clear);
    document.addEventListener("visibilitychange", this.handleVisibilityChange);

    for (const button of this.buttons) {
      button.addEventListener("pointerdown", event => {
        event.preventDefault();
        button.setPointerCapture?.(event.pointerId);
        this.pointers.set(event.pointerId, button.dataset.action);
        if (button.dataset.action === "attack") this.attackQueued = true;
        if (button.dataset.action === "reset") this.resetQueued = true;
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
    if (["a", "arrowleft", "d", "arrowright", " ", "w", "arrowup", "j", "r"].includes(key)) {
      event.preventDefault();
    }

    if (key === "j" && !event.repeat) this.attackQueued = true;
    if (key === "r" && !event.repeat) this.resetQueued = true;
    this.keys.add(key);
  }

  handleKeyUp(event) {
    this.keys.delete(event.key.toLowerCase());
  }

  handleVisibilityChange() {
    if (document.hidden) this.clear();
  }

  snapshot() {
    const activeActions = [...this.pointers.values()];
    const left = this.keys.has("a") || this.keys.has("arrowleft")
      || activeActions.includes("left");
    const right = this.keys.has("d") || this.keys.has("arrowright")
      || activeActions.includes("right");
    const jump = this.keys.has(" ") || this.keys.has("w") || this.keys.has("arrowup")
      || activeActions.includes("jump");
    const attackPressed = this.attackQueued;
    const resetPressed = this.resetQueued;
    this.attackQueued = false;
    this.resetQueued = false;

    return {
      move: Number(right) - Number(left),
      jumpHeld: jump,
      attackPressed,
      resetPressed
    };
  }

  clear() {
    this.keys.clear();
    this.pointers.clear();
    this.attackQueued = false;
    this.resetQueued = false;
    for (const button of this.buttons) button.classList.remove("is-pressed");
  }

  destroy() {
    window.removeEventListener("keydown", this.handleKeyDown);
    window.removeEventListener("keyup", this.handleKeyUp);
    window.removeEventListener("blur", this.clear);
    document.removeEventListener("visibilitychange", this.handleVisibilityChange);
    this.clear();
  }
}