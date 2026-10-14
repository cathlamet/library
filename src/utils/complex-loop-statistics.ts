import { LoopStatistics } from "./loop-statistics";

export class ComplexLoopStatistics {

  buffer: Int32Array;
  bufferIndex: number;
  intervalMillis: number;

  startTime: number = 0;
  endTime: number = 0;

  loop: LoopStatistics = new LoopStatistics();
  innerLoop: LoopStatistics = new LoopStatistics();
  outerLoop: LoopStatistics = new LoopStatistics();
  overhead: LoopStatistics = new LoopStatistics();

  constructor (buffer: Int32Array, bufferIndex: number, intervalMillis: number) {
    this.buffer = buffer;
    this.bufferIndex = bufferIndex;
    this.intervalMillis = intervalMillis;
  }

  get message (): string {
    return `${this.innerLoop.mean.toFixed(4)} ${this.outerLoop.mean.toFixed(4)} ${this.loop.mean.toFixed(4)} ${this.overhead.mean.toFixed(4)}`;
  }

  start (): void {
    this.startTime = performance.now();
    this.loop.mark(this.startTime);
    this.outerLoop.begin(this.startTime);
    this.innerLoop.begin(this.startTime);
  }

  finish (): void {
    this.innerLoop.add(performance.now() - this.startTime);

    const remainingTime = this.startTime + (this.intervalMillis - this.overhead.mean) - performance.now();
    if (remainingTime > 0) {
      Atomics.wait(this.buffer, this.bufferIndex, 0, remainingTime);
    }

    this.endTime = performance.now();
    this.outerLoop.add(this.endTime - this.startTime);
    this.overhead.add(Math.max(0, this.endTime - this.startTime - this.intervalMillis));
  }

}
