import Spinner from "spinnies";
import { v4 as uuid } from "uuid";

export class StatusManager {
  private static spinner: Spinner;

  private spinner: Spinner;

  public readonly name: string;

  private constructor(spinner: Spinner, targetName: string) {
    this.spinner = spinner;
    this.name = targetName;
  }

  public add(msg: string) {
    this.spinner.add(this.name, { text: msg });
  }

  public update(msg: string) {
    this.spinner.update(this.name, { text: msg });
  }

  public remove() {
    this.spinner.remove(this.name);
  }

  public succeed(msg: string) {
    this.spinner.succeed(this.name, { text: msg });
  }

  public fail(msg: string) {
    this.spinner.fail(this.name, { text: msg });
  }

  public stopAll(status: "succeed" | "fail" | "stopped") {
    this.spinner.stopAll(status);
  }

  public static create(): StatusManager {
    if (!this.spinner) {
      this.spinner = new Spinner({ color: "blue" });
    }
    const name = uuid();
    return new StatusManager(this.spinner, name);
  }
}
