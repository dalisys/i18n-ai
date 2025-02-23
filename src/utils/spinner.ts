import { stdout } from "process";

const spinnerFrames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];

export class Spinner {
  private message: string;
  private currentFrame: number;
  private interval: NodeJS.Timeout | null;
  private isSpinning: boolean;

  constructor(message: string = "") {
    this.message = message;
    this.currentFrame = 0;
    this.interval = null;
    this.isSpinning = false;
  }

  start(message?: string): void {
    if (message) {
      this.message = message;
    }

    if (this.isSpinning) {
      return;
    }

    this.isSpinning = true;
    this.interval = setInterval(() => {
      this.currentFrame = (this.currentFrame + 1) % spinnerFrames.length;
      this.render();
    }, 80);

    this.render();
  }

  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.isSpinning = false;
    stdout.clearLine(0);
    stdout.cursorTo(0);
  }

  succeed(message?: string): void {
    this.stop();
    console.log(`✓ ${message || this.message}`);
  }

  fail(message?: string): void {
    this.stop();
    console.log(`✗ ${message || this.message}`);
  }

  update(message: string): void {
    this.message = message;
    if (this.isSpinning) {
      this.render();
    }
  }

  private render(): void {
    stdout.clearLine(0);
    stdout.cursorTo(0);
    stdout.write(`${spinnerFrames[this.currentFrame]} ${this.message}`);
  }
}
