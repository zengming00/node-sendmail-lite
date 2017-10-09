export type ErrorCallback = (err: Error) => void;
export type PendingCallback = (line: string, next: (err?: Error) => void) => void;

export class ExecList {
  public funcs: PendingCallback[] = [];
  public isEnd = false; // 是否已经终止
  public isRunning = false; // 任务是否正在运行, 还没有调用参数上的next()
  public catchFunc: ErrorCallback | null = null; // 用于捕捉错误的回调函数

  // 调用多次next(err) 会触发多次catch
  public catch(callback: ErrorCallback) {
    this.catchFunc = callback;
  }

  public pending(callback: PendingCallback) {
    this.funcs.push(callback);
    return this;
  }

  public terminated() {
    this.isEnd = true;
  }

  /**
   * 在执行任务未完成前不会执行下一个任务，在任务链中有一个任务出错，剩余任务不会再执行
   */
  public exec(...args: any[]) {
    const thisObj = this;
    if (thisObj.isEnd) {
      throw new Error('ExecList is terminated.');
    }

    if (thisObj.isRunning) {
      throw new Error('Previous task not call next()');
    }

    const func = thisObj.funcs.shift(); // 队列中第一个任务
    if (func) {
      thisObj.isRunning = true;  // 当前任务完成前，不得进行下一次任务

      args[args.length] = function (err: Error | undefined) { // 作为任务的最后一个参数，用来确定任务是否成功完成
        thisObj.isRunning = false;
        if (err) {
          thisObj.isEnd = true;
          if (thisObj.catchFunc) {
            thisObj.catchFunc(err);
          }
        }
      };

      func.apply(thisObj, args);
    }
  }
}

