# nanodsh-distros

nanodsh 的发行版（distro）包。发行版是 dsh profile 解析依赖时所在的宿主环境：它固定同一 instance 内所有 profile 共用的包，并指明新 profile 默认启用的 bundle。

## 包

| 包 | 内容 |
|---|---|
| `@nanodsh/distro-standard` | `@deepseek-ai/dsh-base` 及其所需 peer，供官方 profile 使用 |

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

`dependencies` 承载宿主包，每个都钉死到一个版本。需要执行安装脚本的包，在 `dsh.distro.allowBuilds` 里声明。
