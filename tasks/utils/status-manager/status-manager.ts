import Spinner, { SpinnerOptions } from "spinnies";
import { v4 as uuid } from "uuid";

export class StatusManager {
  private static spinner: Spinner;

  private spinner: Spinner;

  public readonly name: string;

  private constructor(spinner: Spinner, targetName: string) {
    this.spinner = spinner;
    this.name = targetName;
  }

  public add(msg: string, opts?: SpinnerOptions) {
    this.spinner.add(this.name, { ...opts, text: msg });
  }

  public update(msg: string, opts?: SpinnerOptions) {
    this.spinner.update(this.name, { ...opts, text: msg });
  }

  public remove() {
    this.spinner.remove(this.name);
  }

  public succeed(msg: string, opts?: SpinnerOptions) {
    this.spinner.succeed(this.name, { ...opts, text: msg });
  }

  public fail(msg: string, opts?: SpinnerOptions) {
    this.spinner.fail(this.name, { ...opts, text: msg });
  }

  public stopAll(status: "succeed" | "fail" | "stopped") {
    this.spinner.stopAll(status);
  }

  public static create(opts?: SpinnerOptions): StatusManager {
    if (!this.spinner) {
      this.spinner = new Spinner({ color: "blue", ...opts });
    }
    const name = uuid();
    return new StatusManager(this.spinner, name);
  }
}
