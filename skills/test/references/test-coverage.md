# 测试覆盖率参考

## .NET 测试覆盖率

### 安装 Coverlet
```bash
dotnet add package coverlet.collector
dotnet add package coverlet.msbuild
```

### 运行覆盖率检查
```bash
# 运行测试并收集覆盖率
dotnet test --collect:"XPlat Code Coverage"

# 生成 HTML 报告
dotnet tool install -g dotnet-reportgenerator-globaltool
reportgenerator -reports:"**/coverage.cobertura.xml" -targetdir:"coveragereport" -reporttypes:Html
```

### 覆盖率配置
```xml
<!-- 在 .csproj 中配置 -->
<PropertyGroup>
  <CollectCoverage>true</CollectCoverage>
  <CoverletOutputFormat>cobertura</CoverletOutputFormat>
  <Exclude>[*]*.Migrations.*</Exclude>
</PropertyGroup>
```

## 前端测试覆盖率

### Jest 覆盖率
```javascript
// jest.config.js
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
  ],
};
```

### 运行覆盖率检查
```bash
# 运行测试并收集覆盖率
npm test -- --coverage

# 查看 HTML 报告
open coverage/lcov-report/index.html
```

## 覆盖率指标

### 行覆盖率
- **定义：** 被测试执行的代码行百分比
- **目标：** >= 80%
- **意义：** 基本的覆盖度指标

### 分支覆盖率
- **定义：** 被测试执行的分支百分比
- **目标：** >= 70%
- **意义：** 更严格的覆盖度指标

### 函数覆盖率
- **定义：** 被测试调用的函数百分比
- **目标：** >= 90%
- **意义：** 确保所有函数都被测试

## 覆盖率报告解读

### 报告内容
- **行覆盖率：** 哪些行被测试执行
- **分支覆盖率：** 哪些分支被测试执行
- **未覆盖代码：** 哪些代码没有被测试

### 改进建议
1. **优先覆盖关键路径** — 业务逻辑、错误处理
2. **关注未覆盖分支** — 边界条件、异常路径
3. **定期检查覆盖率** — 确保覆盖率不下降
