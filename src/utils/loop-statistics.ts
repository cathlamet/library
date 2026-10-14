
export class LoopStatistics {

  index: number = 0;
  count: number = 0;
  total: number = 0;
  intervals: number[] = new Array(100).fill(0);

  t1: number = 0;
  t2: number = 0;

  get mean (): number {
    return this.count === 0 ? 0 : (this.total / this.count);
  }

  add (millis: number): void {
    this.total -= this.intervals[this.index];
    this.intervals[this.index] = millis;
    this.total += this.intervals[this.index];
    this.index++;

    if (this.index >= this.intervals.length) {
      this.index = 0;
    }
    else if (this.count < this.intervals.length) {
      this.count++;
    }
  }

  mark (time: number | undefined = undefined): void {
    this.t2 = this.t1;
    this.t1 = time ?? performance.now();

    if (this.t1 > 0 && this.t2 > 0) {
      this.add(this.t1 - this.t2);
    }
  }

  begin (time: number | undefined = undefined): void {
    this.t1 = time ?? performance.now();
  }

}
