# ZIOT Console APP 端接入文档

> 依据《ZIOT Console 接入文档》（HTML 版）整理，面向 smart-home-app（uni-app + Vue 3）。
> 覆盖：用户注册、登录、令牌管理、扫码绑定设备、设备列表/状态、控制设备。
> 文末列出**资料缺口清单**——目前的资料可以跑通 MVP 主流程，但字段级细节需补充后端 `docs/api/app-api.md`。

---

## 1. 总体架构

```
┌──────────┐   HTTPS + Bearer Token   ┌──────────────┐   MQTT(EMQX)   ┌────────┐
│  手机APP  │ ───────────────────────> │ ZIOT Console  │ <────────────> │  设备   │
│ (uni-app) │ <─────────────────────── │   服务端 API   │                │ (固件)  │
└──────────┘                          └──────────────┘                └────────┘
```

- APP **不直连 MQTT**，所有操作走 ZIOT 服务端 HTTP API；服务端再通过 MQTT 下发到设备。
- App 用户体系独立于控制台账号（手机号 + 密码，开放注册，无需邀请码），两套账号互不通用。
- 设备实时性：当前文档只提到「轮询实践」，APP 端采用**轮询**设备列表/影子获取状态（是否有 WebSocket 推送待确认，见缺口清单 #8）。

### 环境

| 环境 | Base URL | 说明 |
|---|---|---|
| 生产 | `https://www.ziot.asia` | 已确认（2026-09-03）；二维码域名与此一致 |
| 本地调试（文档示例） | `http://localhost:3000` | 原始 curl 示例地址，仅联调时用 |

> Base URL 建议做成可配置（dev/prod 环境切换）。小程序端发布前需把 `https://www.ziot.asia` 配置到微信后台的 request 合法域名。

---

## 2. 认证与令牌管理

### 2.1 接口一览

| 功能 | 方法 & 路径 | 认证 |
|---|---|---|
| 注册（开放） | `POST /api/v1/app/auth/register` | 无 |
| 登录 | `POST /api/v1/app/auth/login` | 无 |
| 刷新令牌（旋转式） | `POST /api/v1/app/auth/refresh` | 无（凭 refresh_token） |
| 业务接口 | — | `Authorization: Bearer <access_token>` |

### 2.2 令牌规则

| 项 | 值 |
|---|---|
| access_token 有效期 | **15 分钟** |
| refresh_token 有效期 | **30 天** |
| 下发方式 | 响应体返回（**不下发 Cookie**），APP 自行安全存储 |
| 过期信号 | 业务请求返回错误码 **401001** 时，用 refresh_token 换新令牌后**重放原请求** |
| 刷新方式 | 旋转式（rotating）：每次 refresh 发放新的 refresh_token，旧的一次性作废 |

### 2.3 注册

```bash
curl -s -X POST {BASE_URL}/api/v1/app/auth/register \
  -H 'content-type: application/json' \
  -d '{"phone":"13912345678","password":"Pass1234","nickname":"小明"}'
```

响应 `data`（文档明确部分）：

```jsonc
{
  "access_token": "…",
  "refresh_token": "…",
  "user": { /* 字段待确认：至少含 id；nickname、phone 大概率返回 */ }
}
```

### 2.4 登录 / 刷新

- 登录请求体文档未直接给出，按注册字段推测为 `{"phone","password"}`（**待确认**，见缺口 #2）。
- 刷新请求体推测为 `{"refresh_token":"…"}`（**待确认**，见缺口 #3）。

### 2.5 APP 端实现要点（uni-app）

1. **存储**：`uni.setStorageSync('auth', { access_token, refresh_token })`；敏感令牌不建议落日志。
2. **请求封装**：统一 request 拦截器注入 `Authorization` 头。
3. **401001 自动刷新**：响应拦截器捕获 401001 → 调 refresh → 更新存储 → 重放原请求；refresh 也失败则清空令牌跳登录页。注意并发请求同时过期时需**加锁去重**（只发一次 refresh，其余排队等待）。
4. **密码规则**：示例为 `Pass1234`（8 位含大小写+数字），具体校验规则待确认；建议 APP 端先按「8-20 位，含字母和数字」做前置校验。
5. **手机号**：示例为 11 位大陆手机号，前端做格式校验。

---

## 3. 扫码绑定设备

### 3.1 绑定码机制

- 每台设备一个**永久绑定码**，由控制台设备列表行「二维码」按钮查看（首次查看自动生成），可印刷到产品上。
- 二维码内容是一个 URL，**绑定码在 `#` 之后（URL fragment，不经过任何服务器）**，APP 本地解析即可，无隐私泄露：

```
https://www.ziot.asia/b/#BD7K2M9XQ4ABCDEFGH
└─────── APP 可达域名 ──────┘└└─── 绑定码(永久) ────┘
```

- 绑定码**永不过期**；同一张码可被多个 App 用户扫描绑定（**家庭共享**）。
- 码泄露时在控制台重新生成，旧码**立即失效**。
- **设备密钥（Device Secret）不出现在二维码上**。

### 3.2 APP 端解析逻辑

```ts
// 扫码结果 -> 绑定码
function parseBindCode(scanResult: string): string | null {
  const i = scanResult.indexOf('#')
  if (i < 0) return null
  return scanResult.slice(i + 1).toUpperCase() // 支持手动输码，自动转大写
}
```

校验规则：只识别 APP 可达域名（如 `www.ziot.asia/b/`）开头的 URL；手动输码入口同样支持，自动转大写。

### 3.3 绑定接口

```bash
curl -s -X POST {BASE_URL}/api/v1/app/devices/bind \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"code":"BD7K2M9XQ4ABCDEFGH"}'
```

响应：设备信息（字段结构待确认，见缺口 #5）。绑定成功后设备进入「我的设备」列表。

---

## 4. 设备列表与状态

### 4.1 我的设备列表

```bash
curl -s {BASE_URL}/api/v1/app/devices -H "Authorization: Bearer $ACCESS_TOKEN"
```

返回内容（文档描述级别）：
- 设备基础信息
- **在线状态** `online` / `offline`
- **最近上报的属性快照**（具体字段名待确认）

### 4.2 设备影子（属性全集）

```bash
curl -s {BASE_URL}/api/v1/app/devices/{deviceId}/shadow -H "Authorization: Bearer $ACCESS_TOKEN"
```

- `reported` = 设备当前上报的**属性全集**，APP 控制面板以此渲染 UI。
- 首选数据源：列表页用设备列表（自带快照，一次请求）；设备详情页用 shadow（全量、最新）。

### 4.3 轮询建议

- 详情页轮询周期建议 3–5s，页面隐藏（`onHide`）时停止；列表页下拉刷新 + 进入页面时拉取。
- 属性 `identifier` 由各产品固件定义（如 temperature/humidity/power），APP 需按产品做属性映射表。

---

## 5. 控制设备

### 5.1 同步控制接口（推荐）

单接口两种 `kind`，阻塞到设备应答或超时：

```bash
# ① 服务调用（需要 identifier）
curl -s -X POST {BASE_URL}/api/v1/app/devices/{deviceId}/commands:sync \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"kind":"service","identifier":"reboot","params":{},"timeout_ms":15000}'

# ② 属性设置（不需要 identifier）
curl -s -X POST {BASE_URL}/api/v1/app/devices/{deviceId}/commands:sync \
  -H 'content-type: application/json' \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -d '{"kind":"property_set","params":{"power":true}}'
```

### 5.2 参数说明

| 字段 | 类型 | 说明 |
|---|---|---|
| kind | string | `service`（服务调用）/ `property_set`（属性设置） |
| identifier | string | 服务标识，**kind=service 必填**；property_set 不需要 |
| params | object | 参数，取值由产品固件定义，需与设备侧约定对齐 |
| timeout_ms | number | 建议 **5000–15000**；注意 HTTP 客户端超时要设得比它大 |

### 5.3 命令状态机

```
pending → sent → success / failed / timeout
```

- `commands:sync` 会阻塞到终态（或超时）再返回，APP 端拿到的即最终结果；响应字段结构待确认（缺口 #6）。
- `identifier` 与 `params` 的合法取值由产品固件定义，APP 端需按产品维护控制项配置。

### 5.4 APP 端实现要点

- 控制按钮置 loading，直到接口返回（最长 timeout_ms）；超时给「设备未响应」提示。
- 控制成功后**主动刷新 shadow**，不要直接改本地状态（设备可能拒绝或修正参数）。

---

## 6. 核心 API 汇总表

| # | 功能 | 方法 | 路径 | 认证 |
|---|---|---|---|---|
| 1 | 注册 | POST | `/api/v1/app/auth/register` | — |
| 2 | 登录 | POST | `/api/v1/app/auth/login` | — |
| 3 | 刷新令牌 | POST | `/api/v1/app/auth/refresh` | — |
| 4 | 绑定设备 | POST | `/api/v1/app/devices/bind` | Bearer |
| 5 | 我的设备列表 | GET | `/api/v1/app/devices` | Bearer |
| 6 | 设备影子 | GET | `/api/v1/app/devices/{deviceId}/shadow` | Bearer |
| 7 | 同步控制 | POST | `/api/v1/app/devices/{deviceId}/commands:sync` | Bearer |

---

## 6A. 附录：原文档中与 APP 侧相关的其余信息

以下内容来自《ZIOT Console 接入文档》原文，非 APP 直接调用，但对接入工作有参考价值。

### A1. 原始来源

- 在线地址：`https://ziot.asia/integration-docs`（HTML 文件为浏览器另存页面，可随时在线查看最新版）
- 控制台入口：`https://ziot.asia/`，模块包括：首页概览、产品管理、设备管理、设备控制、OTA 升级、审计日志、用户管理、邀请码、系统设置
- 仓库内文档（需向后端索取）：`docs/app-integration/integration-guide.md`、`docs/api/app-api.md`，另含 `docs/device-integration/mqtt-python-demo.py`、`docs/device-integration/mqtt-c-demo.c`

### A2. 设备侧 MQTT 概要（APP 调试时理解链路用）

APP 的 `commands:sync` 在服务端最终转成 MQTT 下发，理解设备侧 Topic 有助于排查「控制超时」：

| 功能 | 方向 | Topic |
|---|---|---|
| 属性设置下发（对应 kind=property_set） | 设备订阅 | `/sys/{pk}/{dk}/thing/property/set` |
| 服务调用下发（对应 kind=service） | 设备订阅 | `/sys/{pk}/{dk}/thing/service/+/invoke` |
| 服务调用回复（决定命令 success/failed） | 设备发布 | `/sys/{pk}/{dk}/thing/service/{identifier}/reply` |
| 属性上报（更新 shadow reported） | 设备发布 | `/sys/{pk}/{dk}/thing/property/post` |

- Broker：`www.ziot.asia:1883`（明文）/ `:8883`（TLS，Let's Encrypt 证书），EMQX 实现。
- 服务调用回复格式：`{"id":"cmd_xxx","code":0,"data":{"ok":true}}`，`code` 非 0 即命令失败。
- 属性上报会写入设备日志，并同步更新设备影子的 reported。
- 设备凭据三元组：Product Key / Device Key / Device Secret（Secret 仅创建或重置时显示一次，不在二维码上）。

### A3. 控制台侧操作（联调时要找谁/在哪里操作）

原文「调试位置」一节的完整内容，联调排障时按图索骥：

| 要确认的事 | 在控制台哪里看 |
|---|---|
| MQTT 连接状态（设备在不在线） | 设备列表 & 设备详情页 |
| 属性/事件/日志上报记录 | 设备详情页「上报记录」& 日志中心 |
| APP 控制下发结果（命令记录） | 设备详情页或控制台「命令记录」 |
| OTA 进度 | OTA 任务详情页 |
| 设备绑定码查看/重新生成 | 设备列表行「二维码」按钮弹窗（首次查看自动生成） |
| 已绑定该设备的 App 用户（手机号脱敏） | 同上弹窗 |

### A4. Demo 凭据（可用于联调自测）

原文提供的 demo 设备参数（用于验证链路是否通的示例）：

```
PRODUCT_KEY=pk_demo  DEVICE_KEY=dk_mqtt_demo  DEVICE_SECRET=DeviceSecret123
Broker: www.ziot.asia:1883 / 8883(TLS)
```

---

## 7. 资料缺口清单（目前的资料够不够？）

**结论：跑通「注册 → 登录 → 绑定 → 控制设备」的 MVP 主流程基本够用；但要写出生产级代码，以下 10 项缺口需要补充。** 优先向后端索取这两份文档即可覆盖大部分缺口：

- `docs/app-integration/integration-guide.md`（令牌管理、二维码解析、轮询实践）
- `docs/api/app-api.md`（App 端 API **字段级**参考，含错误码表）

| # | 缺口 | 影响 | 严重度 |
|---|---|---|---|
| ~~1~~ | ~~生产 Base URL~~ | **已确认：`https://www.ziot.asia`** | ✅ |
| 2 | 登录请求体字段（推测 phone+password） | 登录页开发 | 🔴 高 |
| 3 | 刷新令牌请求体（推测 refresh_token） | 令牌续期 | 🔴 高 |
| 4 | **统一响应包络**（code/msg/data 结构）与**完整错误码表**（只知 401001） | 全局拦截器、错误提示 | 🔴 高 |
| 5 | 设备列表 / 绑定响应的**字段结构**（deviceId 字段名、属性快照格式） | 列表页、绑定页 | 🔴 高 |
| 6 | commands:sync 响应字段与各终态的判定方式 | 控制结果展示 | 🟡 中 |
| 7 | user 对象字段（id/nickname/phone…） | 我的页面 | 🟡 中 |
| 8 | 是否有实时推送通道（WebSocket/MQTT over WSS），还是纯轮询 | 架构决策 | 🟡 中 |
| 9 | 解绑/移除设备接口（文档完全未提） | 设备管理必备功能 | 🟡 中 |
| 10 | 密码规则、设备列表分页、登出/改密接口、限流策略 | 完善体验 | 🟢 低 |

### 建议的确认顺序

1. 先拿 `docs/api/app-api.md` + `docs/app-integration/integration-guide.md`（一次补齐 #2–#7、#9）。
2. ~~确认生产 API 域名~~ ✅ 已确认为 `https://www.ziot.asia`；小程序端发布前配置到微信后台 request 合法域名。
3. 确认是否有推送通道（#8），决定轮询还是长连接架构。

---

## 8. APP 端建议架构（基于现有 uni-app 工程）

```
src/
├── api/                  # 按域拆分的 API 模块
│   ├── request.ts        # uni.request 封装：注入 Bearer、401001 自动刷新+重放（加锁）
│   ├── auth.ts           # register / login / refresh
│   └── device.ts         # bind / list / shadow / commands:sync
├── stores/auth.ts        # 令牌持久化（uni.setStorageSync）
├── utils/qrcode.ts       # 扫码结果解析绑定码（#fragment，自动大写）
├── pages/
│   ├── login/            # 登录 + 注册
│   ├── devices/          # 我的设备（轮询/下拉刷新）
│   ├── device-detail/    # 影子渲染 + 控制面板（控制后刷新 shadow）
│   └── bind-device/      # 扫码（uni.scanCode）/ 手动输码
```

关键实现细节均已在 §2.5、§3.2、§4.3、§5.4 标注。
