# 三花/PCS 开发约束

- 原有 WPF .NET Framework 4.5.2 项目保持版本不变。
- 新建 WPF 项目统一使用 .NET Framework 4.7.2（项目约束，非全局规则）。
- 4.5.2 项目使用 PropertyChanged.Fody；4.7.2 项目使用 CommunityToolkit.Mvvm，实际以项目现状为准。
- WPF 结构通常分为 Assets、Models、Resources、Services、ViewModels、Views；不要为套目录改造现有项目。
- 具体代码仍遵循全局 C#、WPF 和项目级规则。
