export type AppErrorContent = {
  content: string;
  kind: string;
  title: string;
};

export class AppError extends Error {
  public kind?: string;
  public title?: string;

  constructor(err: AppErrorContent) {
    super(err.content);
    this.name = "AppError";
    this.kind = err.kind;
    this.title = err.title;

    Object.setPrototypeOf(this, AppError.prototype);
  }
}
