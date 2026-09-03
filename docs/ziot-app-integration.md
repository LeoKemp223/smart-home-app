# ZIOT Console APP 端接入文档

> 依据《ZIOT Console 接入文档》（HTML 版）与后端 `docs/api/app-api.md` **v0.2**（2026-09-03）整理，面向 smart-home-app（uni-app + Vue 3）。
> 覆盖：统一包络与错误码、注册/登录/令牌管理、扫码绑定、设备列表/状态、**SSE 实时事件流**、控制设备（投递语义）、别名/解绑。
> 原 v0.1 的资料缺口清单 #2–#9 已全部由后端文档补齐并回填到本文；仍存缺口见 §7。

---

## 1. 总体架构

```
┌──────────┐  HTTPS + Bearer Token + SSE   ┌──────────────┐   MQTT(EMQX)   ┌────────┐
│  手机APP  │ ────────────────────────────> │ ZIOT Console  │ <────────────> │  设备   │
│ (uni-app) │ <──────────────────────────── │   服务端 API   │                │ (固件)  │
└──────────┘   (REST + 事件流长连接)        └──────────────┘                └────────┘
```

- APP **不直连 MQTT**，所有操作走 ZIOT 服务端 HTTP API；服务端再通过 MQTT 下发到设备。
- App 用户体系独立于控制台账号（手机号 + 密码，开放注册，无需邀请码），两套账号互不通用。
- 设备实时性：**SSE 事件流已上线**（`GET /api/v1/app/events/stream`，原缺口 #8 已解决）——属性上报合并影子时推 `device.shadow.updated`、设备真实上下线翻转时推 `device.status.changed`；轮询降级为兜底。

### 环境

| 环境 | Base URL | 说明 |
|---|---|---|
| 生产 | `https://www.ziot.asia` | 已确认（2026-09-03）；二维码域名与此一致 |
| 本地调试（文档示例） | `http://localhost:3000` | 原始 curl 示例地址，仅联调时用 |

> Base URL 建议做成可配置（dev/prod 环境切换）。小程序端发布前需把 `https://www.ziot.asia` 配置到微信后台的 request 合法域名。

---

## 2. 统一响应包络与错误码（原缺口 #4 已补齐）

所有 `/api/v1/app/**` 接口（SSE 流除外）返回统一包络；HTTP 状态码与 `code` 一一对应：

```jsonc
// 成功（data 为业务数据；DELETE 类接口可能是 {} 或 null）
{ "code": 0, "message": "ok", "request_id": "req_xxx", "data": { ... } }
// 失败（data 恒为 null；message 为中文，可直连展示）
{ "code": 401001, "message": "缺少访问令牌", "request_id": "req_xxx", "data": null }
```

| code | HTTP | 场景 |
|---|---|---|
| `0` | 200 / 201 | 成功 |
| `400001` | 400 | 参数错误：手机号/密码/别名/绑定码格式不合法，绑定码不存在（含已轮换旧码，防枚举），JSON 体不合法 |
| `401001` | 401 | 未登录、令牌缺失/过期/无效、refresh_token 已吊销或过期、账号或密码错误 |
| `403001` | 403 | 账号禁用、设备禁用、未绑定该设备就访问其子资源 |
| `404001` | 404 | 设备或命令不存在（含曾绑定但已解绑） |
| `409001` | 409 | 手机号已注册 |
| `429001` | 429 | 请求过于频繁（限流见 §2.6） |
| `500001` | 500 | 服务器内部错误（message 固定为「服务器内部错误」） |

---

## 3. 认证与令牌管理

### 3.1 接口一览

| 功能 | 方法 & 路径 | 认证 |
|---|---|---|
| 注册（开放） | `POST /api/v1/app/auth/register` | 无 |
| 登录 | `POST /api/v1/app/auth/login` | 无 |
| 刷新令牌（旋转式） | `POST /api/v1/app/auth/refresh` | 无（凭 refresh_token） |
| **修改密码** | `POST /api/v1/app/auth/change-password` | Bearer |
| 登出 | `POST /api/v1/app/auth/logout` | 无（凭 refresh_token） |
| 当前用户 | `GET /api/v1/app/me` | Bearer |
| 业务接口 | — | `Authorization: Bearer <access_token>` |

### 3.2 令牌规则

| 项 | 值 |
|---|---|
| access_token 有效期 | **15 分钟**（JWT，`utype:"app"` + `aud:"ziot-app"`，与控制台会话互不可用） |
| refresh_token 有效期 | **30 天**（`art_` 前缀不透明串，服务端只存 sha256） |
| 下发方式 | 响应体返回（**不下发 Cookie**），APP 自行安全存储 |
| 过期信号 | 业务请求返回 **401001** 时，用 refresh_token 换新令牌后**重放原请求** |
| 刷新方式 | 旋转式：每次 refresh 发放新的 access+refresh 一对，旧 refresh_token **立即吊销**——必须原子替换存储 |

### 3.3 请求体与响应（原缺口 #2、#3、#7 已确认）

注册/登录/刷新三个接口的响应 `data` 结构**完全相同**：

```jsonc
{
  "user": {
    "id": "app_xxx",
    "phone": "13912345678",
    "nickname": "小明",
    "status": "active",
    "created_at": "2026-09-03T08:00:00.000Z"
  },
  "access_token": "eyJhbGciOiJIUzI1NiJ9...",
  "refresh_token": "art_xxx",
  "access_token_expires_at": "2026-09-03T08:15:00.000Z",
  "refresh_token_expires_at": "2026-10-03T08:00:00.000Z"
}
```

| 接口 | 请求体 |
|---|---|
| 注册 | `{"phone":"13912345678","password":"Pass1234","nickname":"小明"}`（nickname 可选，缺省为「用户」+手机尾 4 位） |
| 登录 | `{"phone":"...","password":"..."}` ✅ 已确认 |
| 刷新 | `{"refresh_token":"art_xxx"}` ✅ 已确认 |
| **修改密码** | `{"old_password":"...","new_password":"..."}`（Bearer，新密码 8-128 位；限流 10/min/IP）。成功后**吊销全部刷新令牌（其它设备全部登出）**，响应返回新令牌对，当前设备原子替换后无感续用 |
| 登出 | `{"refresh_token":"art_xxx"}`，响应 `data: {}`；access_token 未过期前仍有效（最多 15 分钟），介意由 APP 端立即丢弃 |

字段规则（已确认）：
- `phone`：大陆手机号 `1[3-9]\d{9}`，唯一；已注册 `409001`。
- `password`：**8-128 位**（原按 8-20 前置校验可以放宽，下限 8 一致）。
- `nickname`：1-128 位，可选。

### 3.4 APP 端实现要点（uni-app）

1. **存储**：`uni.setStorageSync('auth', { access_token, refresh_token })`；敏感令牌不落日志。
2. **请求封装**：统一 request 拦截器注入 `Authorization` 头。
3. **401001 自动刷新**：响应拦截器捕获 401001 → 调 refresh → **原子替换**两个令牌 → 重放原请求；refresh 也失败（401001）则清空令牌跳登录页。并发请求同时过期时需**加锁去重**（只发一次 refresh，其余排队等待）——后端是旋转式 + 旧 token 立即吊销，并发两次 refresh 会把会话刷死。
4. **错误文案**：直接映射 `message`，或按 §2 错误码表自定义。

### 3.5 限流（原缺口 #10 部分补齐）

| 接口 | 阈值 | 超限 |
|---|---|---|
| 注册 | 5 次/分钟/IP | `429001`，退避重试 |
| 登录 | 10 次/分钟/IP | 同上 |
| 绑定 | 20 次/分钟/用户 | 同上 |

---

## 4. 扫码绑定设备

### 4.1 绑定码机制

- 每台设备一个**永久绑定码**，由控制台设备列表行「二维码」按钮查看（首次查看自动生成），可印刷到产品上。
- 二维码内容是一个 URL，**绑定码在 `#` 之后（URL fragment，不经过任何服务器）**，APP 本地解析即可：

```
https://www.ziot.asia/b/#BD7K2M9XQ4ABCDEFGH
└─────── APP 可达域名 ──────┘└└─── 绑定码(永久) ────┘
```

- 绑定码**永不过期**；同一张码可被多个 App 用户扫描绑定（**家庭共享**）。
- 码泄露时在控制台重新生成，旧码**立即失效**。
- **设备密钥（Device Secret）不出现在二维码上**。
- 解绑后再扫同一张码可重新绑定。

### 4.2 APP 端解析逻辑

```ts
// 扫码结果 -> 绑定码
function parseBindCode(scanResult: string): string | null {
  const i = scanResult.indexOf('#')
  if (i < 0) return null
  return scanResult.slice(i + 1).toUpperCase() // 支持手动输码，自动转大写
}
```

校验规则：只识别 APP 可达域名（如 `www.ziot.asia/b/`）开头的 URL；手动输码入口同样支持，自动转大写。

### 4.3 绑定接口

```bash
curl -s -X POST {BASE_URL}/api/v1/app/devices/bind \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"code":"BD7K2M9XQ4ABCDEFGH"}'
```

响应 `data` 为**设备对象**（原缺口 #5 已补齐，bind 响应 / 列表项 / 改别名响应同一结构）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `device_id` | string | 设备 ID，**所有子资源路径用它**（不是 device_key） |
| `alias` | string \| null | 当前用户起的别名，null = 未设置（展示回退 `name`） |
| `name` | string | 控制台侧设备名称 |
| `product_id` / `product_name` / `product_key` | string | 产品信息（pk_ 前缀的是 product_key） |
| `device_key` | string | 设备标识（dk_ 前缀） |
| `status` | `active` \| `disabled` | 设备启用状态 |
| `online_status` | `online` \| `offline` \| `unknown` | 实时在线状态（注意有第三态 unknown） |
| `firmware_version` | string \| null | 固件版本（OTA 成功后更新） |
| `bound_at` | string (ISO 8601) | 本次绑定时间 |
| `shadow_reported` | object | 最近上报的属性全集快照；`{}` = 尚无上报 |
| `shadow_updated_at` | string \| null | 影子最后更新时间 |

绑定成功后设备进入「我的设备」列表。错误：码格式不正确/不存在（含已轮换旧码，防枚举）`400001`、设备禁用 `403001`。

---

## 5. 设备列表与状态

### 5.1 我的设备列表

```bash
curl -s {BASE_URL}/api/v1/app/devices -H "Authorization: Bearer $ACCESS_TOKEN"
# data: { "items": [ { ...设备对象 }, ... ] }
```

返回全部有效绑定（**无分页**，全量返回）；解绑的不出现。设备离线时 `online_status: "offline"`，快照字段保留最近值。

### 5.2 设备影子（属性全集）

```bash
curl -s {BASE_URL}/api/v1/app/devices/{deviceId}/shadow -H "Authorization: Bearer $ACCESS_TOKEN"
# data: { "device_id", "reported": {...}, "desired": {...}, "version": 12, "updated_at": "..." }
```

- `reported` = 设备当前上报的**属性全集**，APP 控制面板以此渲染 UI；`version` 单调递增，可做变更检测。
- `desired` = 期望值（通常与最近一次 property_set 一致）。
- 首选数据源：列表页用设备列表（自带快照，一次请求）；设备详情页用 shadow（全量、最新）。

### 5.3 实时事件流 SSE（原缺口 #8 已解决，推荐前台使用）

```bash
curl -N {BASE_URL}/api/v1/app/events/stream -H "Authorization: Bearer $ACCESS_TOKEN"
```

长连接（`text/event-stream`），**只推当前用户有效绑定的设备**，绑定集每 60s 自动重载（连接期间新绑定/解绑自动生效）。仅连接建立时校验一次 Bearer。事件：

| event | data | 说明 |
|---|---|---|
| `ready` | `{"device_ids":["dev_xxx"]}` | 连接建立后的初始事件，列出会推送的设备 |
| `device.shadow.updated` | `{"type","device_id","reported":{...},"version":12,"updated_at"}` | 设备属性上报合并进影子后推送 |
| `device.status.changed` | `{"type","device_id","online_status":"online","occurred_at"}` | 设备真实上下线**翻转**时推送 |
| `heartbeat` | `{"now":"..."}` | 每 20 秒一次保活 |
| `error` | `{"message":"..."}` | 服务端内部异常（连接保持） |

实现要点（uni-app）：
- **无历史重放**：断线重连后先拉一次设备列表 + shadow 对齐，再继续收流。
- H5 原生 `EventSource` **不能带 Authorization 头**，需用 fetch 流式读取（ReadableStream + TextDecoder 解析 `event:`/`data:` 帧）或支持自定义 header 的库；App/小程序端同理用 request 分块回传或插件实现。
- **推荐策略**：前台 SSE 实时刷新 + 轮询兜底（详情页 3–5s、`onHide` 停）；列表页 `onShow` 拉取 + 下拉刷新即可。
- 属性 `identifier` 由各产品固件定义（如 temperature/humidity/power），APP 需按产品做属性映射表。

---

## 6. 控制设备（投递语义，已更新）

### 6.1 控制接口

单接口两种 `kind`。异步 `POST /commands` 返回 201 + 命令对象；**推荐用同步版** `commands:sync`——**投递完成即返回终态命令对象（通常几十毫秒）**：

```bash
# ① 服务调用（需要 identifier）
curl -s -X POST {BASE_URL}/api/v1/app/devices/{deviceId}/commands:sync \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"kind":"service","identifier":"reboot","params":{}}'

# ② 属性设置（不需要 identifier）
curl -s -X POST {BASE_URL}/api/v1/app/devices/{deviceId}/commands:sync \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"kind":"property_set","params":{"power":true}}'

# 查询命令详情（发起者或对该设备仍有有效绑定的用户可查）
curl -s {BASE_URL}/api/v1/app/commands/{commandId} -H "Authorization: Bearer $ACCESS_TOKEN"
```

### 6.2 命令对象（Command）字段 ✅ 已回填

`commands` / `commands:sync` 的响应 `data`、命令详情的响应 `data` 均为同一结构（18 个字段）：

| 字段 | 类型 | 说明 |
|---|---|---|
| `id` | string | 命令 ID（**字段名就是 `id`**，不是 command_id） |
| `org_id` | string | 组织 ID |
| `device_id` | string | 目标设备 ID |
| `device_name` | string | 设备名称 |
| `product_key` | string | 产品标识 |
| `device_key` | string | 设备标识 |
| `identifier` | string | `property.set`（属性设置）或服务标识（服务调用）。**请求里的 `kind` 不回显**，靠它区分 |
| `params` | unknown | 请求参数**原样回显** |
| `status` | string | `pending` / `success` / `failed`（存量历史可能出现 `sent` / `timeout`） |
| `request_id` | string | MQTT 报文关联 ID，与 `id` 同值 |
| `result` | unknown \| null | 设备应答透传数据；投递语义下通常为 `null` |
| `error_code` | string \| null | 失败错误码（如 `publish_failed`） |
| `error_message` | string \| null | 失败原因，UI 失败提示可直接用 |
| `timeout_at` | string (ISO 8601) | 兼容保留的超时时刻，不再影响结果 |
| `sent_at` | string \| null | 发布到 Broker 的时间 |
| `replied_at` | string \| null | 收到设备可选应答的时间（通常 `null`） |
| `created_at` | string (ISO 8601) | 创建时间 |
| `updated_at` | string (ISO 8601) | 状态最后更新时间 |

```ts
// TypeScript 参考
interface AppCommand {
  id: string;
  org_id: string;
  device_id: string;
  device_name: string;
  product_key: string;
  device_key: string;
  identifier: string;          // "property.set" 或服务标识
  params: unknown;
  status: "pending" | "success" | "failed" | string;  // 存量含 sent/timeout
  request_id: string;
  result: unknown;
  error_code: string | null;
  error_message: string | null;
  timeout_at: string;
  sent_at: string | null;
  replied_at: string | null;
  created_at: string;
  updated_at: string;
}
```

### 6.3 参数说明

| 字段 | 类型 | 说明 |
|---|---|---|
| kind | string | `service`（服务调用）/ `property_set`（属性设置） |
| identifier | string | 服务标识，**kind=service 必填**（字母/下划线开头 1-128 位）；property_set 不需要 |
| params | object | 参数，必须是 JSON 对象；取值由产品固件定义，需与设备侧约定对齐 |
| timeout_ms | number | **兼容保留字段，不再影响结果**（新命令创建即终态）；可不传 |

### 6.4 命令状态机（⚠️ v0.1 文档已过期，以此为准）

```
pending → success / failed
```

- `success` = 平台已成功发布到 MQTT Broker（**投递成功，不代表设备已执行**）；`failed` = 发布失败（重试耗尽），看 `error_message`。
- 平台**不再等待设备应答**：设备侧回复 Topic（service/reply、property/set_reply）保留为可选透传，谁需要执行确认谁自己消费，命令状态不依赖它。
- 存量历史命令可能出现 `sent` / `timeout`（旧版等待应答的语义），UI 兜底展示即可。
- **确认设备真实执行**：看 SSE `device.shadow.updated` 推送或轮询 shadow `reported` 是否收敛到设置值。

### 6.5 APP 端实现要点

- 控制按钮置 loading；接口几十毫秒返回投递结果——`success` 只代表「已送达 Broker」，UI 提示建议用「已发送」而非「已执行」。
- 控制后**以 shadow/SSE 回读值为准**刷新 UI，不要直接改本地状态（设备可能拒绝或修正参数）。
- `identifier` 与 `params` 的合法取值由产品固件定义，APP 端需按产品维护控制项配置。

---

## 7. 别名与解绑（原缺口 #9 已解决）

```bash
# 改别名（1-128 位，空串 "" 清除；响应为更新后的设备对象）
curl -s -X PATCH {BASE_URL}/api/v1/app/devices/{deviceId} \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"alias":"客厅的空调"}'

# 解绑（软删除，仅影响自己，不影响其他家庭成员；再扫同一张码可重新绑定）
curl -s -X DELETE {BASE_URL}/api/v1/app/devices/{deviceId} \
  -H "Authorization: Bearer $ACCESS_TOKEN"
# 响应 data: { "device_id": "...", "org_id": "...", "unbound_at": "..." }
```

- 别名是**当前用户视角**的（`alias` 字段），不改控制台侧设备名 `name`；无有效绑定返回 `404001`。
- 解绑后访问该设备子资源（shadow/commands）返回 `403001`。

---

## 8. 核心 API 汇总表

| # | 功能 | 方法 | 路径 | 认证 |
|---|---|---|---|---|
| 1 | 注册 | POST | `/api/v1/app/auth/register` | — |
| 2 | 登录 | POST | `/api/v1/app/auth/login` | — |
| 3 | 刷新令牌 | POST | `/api/v1/app/auth/refresh` | — |
| 4 | 修改密码 | POST | `/api/v1/app/auth/change-password` | Bearer |
| 5 | 登出 | POST | `/api/v1/app/auth/logout` | — |
| 6 | 当前用户 | GET | `/api/v1/app/me` | Bearer |
| 7 | 绑定设备 | POST | `/api/v1/app/devices/bind` | Bearer |
| 8 | 我的设备列表 | GET | `/api/v1/app/devices` | Bearer |
| 9 | 改别名 | PATCH | `/api/v1/app/devices/{deviceId}` | Bearer |
| 10 | 解绑 | DELETE | `/api/v1/app/devices/{deviceId}` | Bearer |
| 11 | 设备影子 | GET | `/api/v1/app/devices/{deviceId}/shadow` | Bearer |
| 12 | 异步控制 | POST | `/api/v1/app/devices/{deviceId}/commands` | Bearer |
| 13 | 同步控制（推荐） | POST | `/api/v1/app/devices/{deviceId}/commands:sync` | Bearer |
| 14 | 命令详情 | GET | `/api/v1/app/commands/{commandId}` | Bearer |
| 15 | 实时事件流 | GET（SSE） | `/api/v1/app/events/stream` | Bearer |

---

## 8A. 附录：原文档中与 APP 侧相关的其余信息

### A1. 原始来源

- 在线地址：`https://ziot.asia/integration-docs`（HTML 版可随时查看最新版）
- 控制台入口：`https://ziot.asia/`，模块包括：首页概览、产品管理、设备管理、设备控制、OTA 升级、审计日志、用户管理、邀请码、系统设置
- 仓库内文档（权威字段级参考）：`docs/api/app-api.md`（v0.2，含包络/错误码/设备对象/SSE）、`docs/app-integration/integration-guide.md`

### A2. 设备侧 MQTT 概要（APP 调试时理解链路用）

APP 的 `commands:sync` 在服务端转成 MQTT 下发，理解设备侧 Topic 有助于排查问题：

| 功能 | 方向 | Topic |
|---|---|---|
| 属性设置下发（对应 kind=property_set） | 设备订阅 | `/sys/{pk}/{dk}/thing/property/set` |
| 属性设置应答（可选） | 设备发布 | `/sys/{pk}/{dk}/thing/property/set_reply` |
| 服务调用下发（对应 kind=service） | 设备订阅 | `/sys/{pk}/{dk}/thing/service/+/invoke` |
| 服务调用回复（可选透传） | 设备发布 | `/sys/{pk}/{dk}/thing/service/{identifier}/reply` |
| 属性上报（更新 shadow reported） | 设备发布 | `/sys/{pk}/{dk}/thing/property/post` |

- Broker：`www.ziot.asia:1883`（明文）/ `:8883`（TLS，Let's Encrypt 证书），EMQX 实现。
- ⚠️ 投递语义（v0.1 的「服务调用回复决定命令 success/failed」已过期）：命令状态只看平台发布是否成功；设备 reply/set_reply 是可选透传，**执行确认以属性上报→影子收敛为准**。
- 属性上报会写入设备记录时间线，并同步更新设备影子的 reported。
- 设备凭据三元组：Product Key / Device Key / Device Secret（Secret 仅创建或重置时显示一次，不在二维码上）。

### A3. 控制台侧操作（联调时要找谁/在哪里操作）

| 要确认的事 | 在控制台哪里看 |
|---|---|
| MQTT 连接状态（设备在不在线） | 设备列表 & 设备详情页 |
| 命令下发与设备上报记录（**统一时间线，含上下线事件**） | 设备详情页 / 控制台「设备记录」表 |
| 日志明细 | 日志中心 |
| OTA 进度 | OTA 任务详情页 |
| 设备绑定码查看/重新生成 | 设备列表行「二维码」按钮弹窗（首次查看自动生成） |
| 已绑定该设备的 App 用户（手机号脱敏） | 同上弹窗 |

### A4. Demo 凭据（可用于联调自测）

```
PRODUCT_KEY=pk_demo  DEVICE_KEY=dk_mqtt_demo  DEVICE_SECRET=DeviceSecret123
Broker: www.ziot.asia:1883 / 8883(TLS)
```

---

## 9. 资料缺口清单（2026-09-03 更新）

**结论：v0.1 的 #2–#9 已全部由 `docs/api/app-api.md` v0.2 补齐并回填本文。剩余缺口：**

| # | 缺口 | 影响 | 状态 |
|---|---|---|---|
| ~~1~~ | ~~生产 Base URL~~ | — | ✅ 已确认 `https://www.ziot.asia` |
| ~~2~~ | ~~登录请求体字段~~ | — | ✅ `{"phone","password"}` |
| ~~3~~ | ~~刷新令牌请求体~~ | — | ✅ `{"refresh_token"}` |
| ~~4~~ | ~~统一响应包络与错误码表~~ | — | ✅ 见 §2 |
| ~~5~~ | ~~设备列表/绑定响应字段结构~~ | — | ✅ 见 §4.3 设备对象 |
| ~~6~~ | ~~commands:sync 响应字段与终态判定~~ | — | ✅ 命令对象 18 字段见 §6.2；投递语义与状态机见 §6.4 |
| ~~7~~ | ~~user 对象字段~~ | — | ✅ `{id, phone, nickname, status, created_at}` |
| ~~8~~ | ~~实时推送通道~~ | — | ✅ SSE 已上线，见 §5.3 |
| ~~9~~ | ~~解绑接口~~ | — | ✅ `DELETE /api/v1/app/devices/{id}`，见 §7 |
| ~~10a~~ | ~~修改密码接口~~ | — | ✅ `POST /app/auth/change-password`（旧密码校验 + 全量吊销刷新令牌 + 返回新会话） |
| 10b | 设备日志/上报记录的 App 端查询接口 | 设备详情日志页 | 🟡 未提供（控制台有「设备记录」接口但走 Cookie 会话，App 不可用） |
| 10c | 消息推送（后台/离线通知） | 消息中心 | 🟡 未提供（SSE 仅前台长连接；前台实时展示已覆盖） |
| 10d | App 端查看设备绑定码 | 设备设置页「分享给家人」 | 🟢 未提供（绑定码查看/轮换是控制台接口；家人扫码用机身印刷的码即可） |
| 10e | 设备列表分页 | 设备很多时 | 🟢 当前全量返回，量级大时需后端加 |

### 后续建议

1. ~~拿字段级文档补齐~~ ✅ 已完成。
2. ~~确认生产 API 域名~~ ✅ 已确认；小程序发布前配置微信后台合法域名。
3. ~~确认推送通道~~ ✅ SSE 已上线；离线推送（厂商通道）按需再向后端提。

---

## 10. APP 端建议架构（基于现有 uni-app 工程）

```
src/
├── api/                  # 按域拆分的 API 模块
│   ├── request.ts        # uni.request 封装：注入 Bearer、401001 自动刷新+重放（加锁，旋转式令牌）
│   ├── auth.ts           # register / login / refresh / change-password / logout / me
│   ├── device.ts         # bind / list / alias(PATCH) / unbind(DELETE) / shadow / commands(:sync) / command detail
│   └── sse.ts            # SSE 长连接：fetch 流式解析 event:/data: 帧，断线重连后先拉列表+shadow 对齐
├── stores/auth.ts        # 令牌持久化（uni.setStorageSync，原子替换）
├── utils/qrcode.ts       # 扫码结果解析绑定码（#fragment，自动大写）
├── composables/useDeviceEvents.ts  # 订阅 SSE，按 device_id 分发到页面（首页/详情页共用一条连接）
└── pages/
    ├── login/            # 登录 + 注册
    ├── devices/          # 我的设备（onShow 拉取 + SSE 增量）
    ├── device-detail/    # 影子渲染 + 控制面板（SSE 实时刷新 + 控制后回读）
    └── bind-device/      # 扫码（uni.scanCode）/ 手动输码
```

关键实现细节均已在 §3.4、§4.2、§5.3、§6.4、§7 标注。
