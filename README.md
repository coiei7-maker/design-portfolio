# 张国凤的工业设计作品集

本科、研究生及工程设计项目的个人作品集，包含杂志书架、双面翻页、项目筛选和工具图标交互。

## 发布到 GitHub Pages

将本项目上传至 GitHub 仓库的 `main` 分支，在仓库的 **Settings → Pages → Build and deployment → Source** 中选择 **GitHub Actions**。

在 **Actions** 中查看 `Deploy portfolio to GitHub Pages` 的执行结果。发布完成后，在 **Settings → Pages** 中打开网站网址。

每次向 `main` 分支推送修改，GitHub Actions 会自动生成并发布网站。页面和图片使用相对路径，支持仓库子目录网址。

## 更新与预览

`projects.json` 保存项目内容，`build.py` 生成首页和项目详情页，`dist/` 保存页面、样式、交互脚本和图片。

需要 Python 3，无需额外依赖。在项目目录执行以下命令。

```sh
python build.py
python -m http.server 8000 --directory dist
```

然后打开 `http://localhost:8000/`。

作品内容与图像的权利归原作者及相关权利人所有。
