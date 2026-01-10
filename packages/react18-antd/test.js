// test-exit.js
console.log('进程启动，PID:', process.pid);

// 监听不同事件
process.on('exit', () => console.log('exit 事件触发'));
process.on('SIGINT', () => {
    console.log('SIGINT 收到，3秒后退出');
    setTimeout(() => {
        console.log('调用 process.exit()');
        process.exit(0);
    }, 3000);
});

console.log('现在尝试:');
console.log('1. 直接运行: node test-exit.js (等待自然结束)');
console.log('2. 按 Ctrl+C 中断');
console.log('3. 另一个终端执行: kill -SIGINT', process.pid);