# nanodsh-distros

nanodsh 的发行版（distro）包。发行版是 dsh profile 解析依赖时所在的宿主环境：它固定同一 instance 内所有 profile 共用的包，并指明新 profile 默认启用的 bundle。

## 包

| 包 | 内容 |
|---|---|
| `@nanodsh/distro-standard` | `@deepseek-ai/dsh-base` 及其所需 peer，供官方 profile 使用 |
| `@nanodsh/distro-full` | `@nanodsh/distro-standard` 加上 `@deepseek-ai/dsh-web-app` 与官方可选 bundle，插件页因此能列出它们 |

## 用法

```bash
nanodsh distro add @nanodsh/distro-standard
nanodsh distro show
```

发行版就是一个普通 npm 包，nanodsh 从它的 manifest 读取这段元数据：

```json
{
  "dsh": {
    "distro": {
      "api": 1,
      "defaultBundles": ["@deepseek-ai/dsh-base"]
    }
  }
}
```

`dependencies` 承载官方 dsh 包在 bundle 之外提供的宿主包，外加 `@deepseek-ai/dsh-base`，每个都钉死到一个版本。包版本与它钉住的 `@deepseek-ai/dsh-base` 一致：`@nanodsh/distro-standard@0.2.2-rc.5` 就是 dsh `0.2.2-rc.5` 的标准宿主集。需要执行安装脚本的包，在 `dsh.distro.allowBuilds` 里声明。
