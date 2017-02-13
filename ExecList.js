function ExecList() {
    this.funcs = [];
    this.end = false; //是否已经终止
    this.isRunning = false; //任务是否正在运行, 还没有调用参数上的next()
    this.catchFunc = null; //用于捕捉错误的回调函数
}

ExecList.prototype.catch = function (callback) {
    this.catchFunc = callback;
}

ExecList.prototype.pending = function (callback) {
    this.funcs.push(callback);
    return this;
}

/**
 * 在执行任务未完成前不会执行下一个任务，在任务链中有一个任务出错，剩余任务不会再执行
 */
ExecList.prototype.exec = function () {
    if (this.end || this.isRunning) return;

    var func = this.funcs.shift(); //队列中第一个任务
    if (func) {
        this.isRunning = true;  //当前任务完成前，不得进行下一次任务

        //复制参数
        var arr = [], thisObj = this;
        for (var k in arguments) {
            arr[k] = arguments[k];
        }
        arr[arr.length] = function (err) { //作为任务的最后一个参数，用来确定任务是否成功完成
            thisObj.isRunning = false;
            if (err) {
                thisObj.end = true;
                thisObj.catchFunc && thisObj.catchFunc(err);
            }
        };

        func.apply(this, arr);
    }
}
exports = module.exports = ExecList;

