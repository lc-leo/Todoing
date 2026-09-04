# Todoing

Windows 风格待办：我的一天、日历、番茄钟，任务保存在本机。

## 运行

需要 Node.js 20+。

```bash
npm install
npm run dev
```

浏览器打开提示的本地地址即可。

## 打包 Windows 安装包

```bash
npm run build
npm run dist:win
```

生成 `Todoing-Setup-1.0.0.exe`。Windows 11 自带 WebView2；Windows 10 请先安装 Microsoft Edge。

## 使用

- 左上角菜单可折叠侧边栏
- 「我的一天 / 我的一周 / 番茄钟」可贴到桌面
- 数据存在浏览器本地，不需要账号
