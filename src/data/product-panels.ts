/**
 * 产品面板注册表（硬编码方案，接入文档 §6.6）
 * 按 product_key/product_id 索引；identifier 对齐固件物模型。
 * 兜底：DEFAULT_PANEL（未知产品不白屏）。
 */
import type { ControlItem, ProductPanel } from '@/types'

/** 保留服务名：不下发到设备，由 App 本地拉取云端影子（查询状态用） */
export const REFRESH_SHADOW_SERVICE = 'refresh_shadow'

/** 所有设备控制面板统一追加的通用默认指令（服务 identifier 需固件物模型支持） */
export const COMMON_CONTROLS: ControlItem[] = [
  { id: 'c_common_power_on', type: 'action', service: 'power_on', label: '开机', desc: '下发开机服务指令' },
  { id: 'c_common_power_off', type: 'action', service: 'power_off', label: '关机', desc: '下发关机服务指令', confirm: '确认关闭该设备？' },
  { id: 'c_common_sync', type: 'action', service: REFRESH_SHADOW_SERVICE, label: '同步设备状态', desc: '从云端拉取设备最新上报状态' },
]

export const PRODUCT_PANELS: Record<string, ProductPanel> = {
  pk_sensor_th01: {
    productKey: 'pk_sensor_th01',
    productName: '智能温湿度计',
    category: 'sensor',
    icon: 'thermometer',
    mainStats: [
      { prop: 'temperature', label: '室内温度', unit: '°C' },
      { prop: 'humidity', label: '相对湿度', unit: '%' },
    ],
    controls: [
      {
        id: 'c_temp_unit',
        type: 'enum',
        prop: 'temp_unit',
        label: '温度单位',
        options: [
          { value: 'C', label: '摄氏度 °C' },
          { value: 'F', label: '华氏度 °F' },
        ],
      },
      { id: 'c_comfort_mode', type: 'switch', prop: 'comfort_prompt', label: '舒适度超限提醒' },
      { id: 'c_report_freq', type: 'slider', prop: 'report_interval', label: '上报频率 (秒)', unit: 's', min: 10, max: 300, step: 10 },
      {
        id: 'c_calibrate',
        type: 'action',
        service: 'calibrate_sensor',
        label: '传感器重新校准',
        confirm: '确定要向温湿度计下发自动基准校准指令吗？',
      },
    ],
  },
  pk_light_rgb02: {
    productKey: 'pk_light_rgb02',
    productName: '智能吸顶灯',
    category: 'light',
    icon: 'lightbulb',
    mainStats: [
      { prop: 'power', label: '开关状态' },
      { prop: 'brightness', label: '当前亮度', unit: '%' },
    ],
    controls: [
      { id: 'c_power', type: 'switch', prop: 'power', label: '总开关' },
      { id: 'c_brightness', type: 'slider', prop: 'brightness', label: '亮度调节', unit: '%', min: 1, max: 100, step: 1 },
      { id: 'c_color_temp', type: 'slider', prop: 'color_temp', label: '色温调节', unit: 'K', min: 2700, max: 6500, step: 100 },
      {
        id: 'c_light_mode',
        type: 'enum',
        prop: 'mode',
        label: '情景模式',
        options: [
          { value: 'reading', label: '阅读' },
          { value: 'movie', label: '观影' },
          { value: 'night', label: '夜灯' },
          { value: 'party', label: '炫彩' },
        ],
      },
      {
        id: 'c_reboot',
        type: 'action',
        service: 'device_reboot',
        label: '远程重启设备',
        confirm: '确认重启该吸顶灯？这会导致短暂离线后重新连接。',
      },
    ],
  },
  pk_socket_pwr01: {
    productKey: 'pk_socket_pwr01',
    productName: '智能计量插座',
    category: 'socket',
    icon: 'plug',
    mainStats: [
      { prop: 'switch_main', label: '插孔电源' },
      { prop: 'power_w', label: '实时功率', unit: 'W' },
    ],
    controls: [
      { id: 'c_socket_switch', type: 'switch', prop: 'switch_main', label: '插座通电开关' },
      { id: 'c_led_indicator', type: 'switch', prop: 'led_indicator', label: '机身指示灯常亮' },
      { id: 'c_overload_protect', type: 'slider', prop: 'max_power_limit', label: '过载断电阈值', unit: 'W', min: 500, max: 2500, step: 100 },
      {
        id: 'c_clear_energy',
        type: 'action',
        service: 'reset_energy_meter',
        label: '重置用电计量统计',
        confirm: '确定要清空本月的电量统计数据并重新累计吗？',
      },
    ],
  },
  pk_ac_inv03: {
    productKey: 'pk_ac_inv03',
    productName: '变频智能空调',
    category: 'ac',
    icon: 'wind',
    mainStats: [
      { prop: 'power', label: '空调电源' },
      { prop: 'target_temp', label: '设定温度', unit: '°C' },
    ],
    controls: [
      { id: 'c_ac_power', type: 'switch', prop: 'power', label: '空调电源' },
      { id: 'c_target_temp', type: 'slider', prop: 'target_temp', label: '目标温度', unit: '°C', min: 16, max: 30, step: 1 },
      {
        id: 'c_ac_mode',
        type: 'enum',
        prop: 'mode',
        label: '运行模式',
        options: [
          { value: 'cool', label: '制冷' },
          { value: 'heat', label: '制热' },
          { value: 'dry', label: '除湿' },
          { value: 'fan', label: '送风' },
        ],
      },
      {
        id: 'c_wind_speed',
        type: 'enum',
        prop: 'wind_speed',
        label: '风速档位',
        options: [
          { value: 1, label: '微风' },
          { value: 2, label: '中风' },
          { value: 3, label: '强劲' },
          { value: 'auto', label: '自动' },
        ],
      },
    ],
  },
  pk_curtain_m01: {
    productKey: 'pk_curtain_m01',
    productName: '智能窗帘电机',
    category: 'curtain',
    icon: 'curtain',
    mainStats: [
      { prop: 'position', label: '开合比例', unit: '%' },
      { prop: 'status', label: '电机状态' },
    ],
    controls: [
      { id: 'c_curtain_pos', type: 'slider', prop: 'position', label: '开合百分比', unit: '%', min: 0, max: 100, step: 5 },
      {
        id: 'c_quick_pos',
        type: 'enum',
        prop: 'quick_action',
        label: '快捷控制',
        options: [
          { value: 'open', label: '全开' },
          { value: 'stop', label: '暂停' },
          { value: 'close', label: '全关' },
        ],
      },
      { id: 'c_invert_dir', type: 'switch', prop: 'reverse_direction', label: '电机转向反转' },
    ],
  },
}

/** 未知产品兜底面板：只读 + 通用重启动作，不白屏 */
export const DEFAULT_PANEL: ProductPanel = {
  productKey: 'default',
  productName: '未知设备',
  category: 'other',
  icon: 'cpu',
  mainStats: [{ prop: 'online_status', label: '工作状态' }],
  controls: [
    {
      id: 'c_generic_reboot',
      type: 'action',
      service: 'device_reboot',
      label: '重启设备',
      confirm: '确认向该设备下发硬件重启指令？',
    },
  ],
}

export function getPanel(productIdOrKey: string): ProductPanel {
  return PRODUCT_PANELS[productIdOrKey] || DEFAULT_PANEL
}
