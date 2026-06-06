# 接口契约模板

## 使用说明

跨项目开发时，必须先填写此模板，作为各项目 Agent 的输入。

---

## 基本信息

- **功能名称**: [功能名称]
- **创建日期**: [YYYY-MM-DD]
- **负责人**: [姓名]
- **涉及项目**: [项目列表]

---

## API 端点列表

### 端点 1: [端点名称]

**基本信息**
- **路径**: [METHOD] /api/[resource]
- **认证**: [需要 JWT / 公开]
- **说明**: [一句话描述]

**请求格式**
```json
{
  "field1": "string (必填, 说明)",
  "field2": 123,
  "field3": ["array"],
  "field4": {
    "nested": "object"
  }
}
```

**请求参数说明**

| 字段 | 类型 | 必填 | 说明 | 示例 |
|------|------|------|------|------|
| field1 | string | 是 | 说明 | "value" |
| field2 | int | 否 | 说明 | 123 |

**响应格式（成功）**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "id": 1,
    "name": "xxx",
    "createdAt": "2026-01-01T00:00:00Z"
  }
}
```

**响应格式（分页）**
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "items": [],
    "total": 100,
    "pageIndex": 1,
    "pageSize": 20
  }
}
```

**错误码**

| code | message | 说明 | 处理方式 |
|------|---------|------|---------|
| 400 | 参数错误 | 请求参数校验失败 | 检查输入 |
| 401 | 未认证 | Token 无效或过期 | 重新登录 |
| 403 | 无权限 | 没有操作权限 | 联系管理员 |
| 404 | 不存在 | 资源不存在 | 检查 ID |
| 500 | 服务器错误 | 后端异常 | 联系开发 |

---

## 数据模型

### [模型名称]

```json
{
  "id": "int (主键)",
  "name": "string (名称)",
  "status": "int (状态: 0-禁用, 1-启用)",
  "createdAt": "datetime (创建时间)",
  "updatedAt": "datetime (更新时间)"
}
```

---

## 调用示例

### 前端 (Vue 2)

```javascript
// api/equipment.js
import request from '@/utils/request'

export function getEquipmentList(params) {
  return request({
    url: '/api/equipment/list',
    method: 'get',
    params
  })
}

export function createEquipment(data) {
  return request({
    url: '/api/equipment',
    method: 'post',
    data
  })
}

export function updateEquipment(id, data) {
  return request({
    url: `/api/equipment/${id}`,
    method: 'put',
    data
  })
}

export function deleteEquipment(id) {
  return request({
    url: `/api/equipment/${id}`,
    method: 'delete'
  })
}
```

### WPF 客户端

```csharp
// Services/EquipmentService.cs
public class EquipmentService
{
    private readonly HttpClient _httpClient;

    public async Task<List<Equipment>> GetListAsync()
    {
        var response = await _httpClient.GetAsync("/api/equipment/list");
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<List<Equipment>>();
    }

    public async Task<Equipment> CreateAsync(CreateEquipmentRequest request)
    {
        var response = await _httpClient.PostAsJsonAsync("/api/equipment", request);
        response.EnsureSuccessStatusCode();
        return await response.Content.ReadFromJsonAsync<Equipment>();
    }
}
```

### curl

```bash
# 获取列表
curl -X GET "http://localhost:5000/api/equipment/list?pageIndex=1&pageSize=20" \
  -H "Authorization: Bearer {token}"

# 创建
curl -X POST "http://localhost:5000/api/equipment" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{"name": "设备1", "status": 1}'
```

---

## 测试用例

### 正常场景

| 场景 | 请求 | 预期响应 |
|------|------|---------|
| 获取列表 | GET /api/equipment/list | 200 + 分页数据 |
| 创建成功 | POST /api/equipment | 200 + 新创建的对象 |
| 更新成功 | PUT /api/equipment/1 | 200 + 更新后的对象 |
| 删除成功 | DELETE /api/equipment/1 | 200 |

### 异常场景

| 场景 | 请求 | 预期响应 |
|------|------|---------|
| 参数缺失 | POST /api/equipment (无 name) | 400 参数错误 |
| ID 不存在 | GET /api/equipment/999 | 404 不存在 |
| 未认证 | GET /api/equipment/list (无 Token) | 401 未认证 |

---

## 变更记录

| 日期 | 版本 | 变更内容 | 负责人 |
|------|------|---------|--------|
| YYYY-MM-DD | 1.0 | 初始版本 | - |
