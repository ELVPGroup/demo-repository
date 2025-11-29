// 前端应用入口文件
console.log('Demo Frontend Client is running');

// 创建根元素并挂载到DOM
const rootElement = document.getElementById('root');
if (rootElement) {
    const appElement = document.createElement('div');
    appElement.innerHTML = `
        <h1>欢迎使用Demo前端客户端</h1>
        <p>项目已成功初始化</p>
    `;
    rootElement.appendChild(appElement);
}