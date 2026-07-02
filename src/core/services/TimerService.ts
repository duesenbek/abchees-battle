export class TimerService {
  private timerId: number | null = null;
  private onTickCallback: ((timeLeft: number) => void) | null = null;
  private onCompleteCallback: (() => void) | null = null;
  private timeLeft: number = 0;

  public start(duration: number, onTick: (time: number) => void, onComplete: () => void) {
    this.stop();
    this.timeLeft = duration;
    this.onTickCallback = onTick;
    this.onCompleteCallback = onComplete;

    this.timerId = window.setInterval(() => {
      this.timeLeft--;
      if (this.onTickCallback) {
        this.onTickCallback(this.timeLeft);
      }
      
      if (this.timeLeft <= 0) {
        this.stop();
        if (this.onCompleteCallback) {
          this.onCompleteCallback();
        }
      }
    }, 1000);
  }

  public stop() {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  public getTimeLeft() {
    return this.timeLeft;
  }
}

export const globalTimer = new TimerService();
