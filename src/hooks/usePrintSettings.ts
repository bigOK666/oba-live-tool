import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { type PaperSize, PaperSizeType } from '@/services/PrintService'

export interface PrinterInfo {
  name: string
  id: number
}

export interface PrintRule {
  type: 'exact-match' | 'contains' | 'regex'
  pattern: string
  enabled: boolean
}

export interface PrintLimitRule {
  type: 'limit-count'
  count: number
  enabled: boolean
}

export interface PrintOptions {
  showNickname: boolean
  showTime: boolean
  showUserId: boolean
  showOrderNumber: boolean
  printerId?: number
  paperSizeType: PaperSizeType
  customPaperSize?: PaperSize
  // 字体大小设置
  usernameFontSize?: number
  orderNumberFontSize?: number
  commentFontSize?: number
}

interface PrintSettingsState {
  enabled: boolean
  rules: PrintRule[]
  limitRule: PrintLimitRule
  options: PrintOptions

  // 操作方法
  setEnabled: (enabled: boolean) => void
  addRule: (rule: PrintRule) => void
  updateRule: (index: number, rule: Partial<PrintRule>) => void
  removeRule: (index: number) => void
  updateLimitRule: (rule: Partial<PrintLimitRule>) => void
  updateOptions: (options: Partial<PrintOptions>) => void
}

export const usePrintSettings = create<PrintSettingsState>()(
  persist(
    set => ({
      enabled: false,
      rules: [
        {
          type: 'contains',
          pattern: '#打印',
          enabled: true,
        },
      ],
      limitRule: {
        type: 'limit-count',
        count: 50,
        enabled: false,
      },
      options: {
        showNickname: true,
        showTime: false,
        showUserId: false,
        showOrderNumber: true,
        printerId: undefined,
        paperSizeType: PaperSizeType.THERMAL,
        customPaperSize: { width: 800, height: 30 },
      },

      setEnabled: enabled => set({ enabled }),

      addRule: rule =>
        set(state => ({
          rules: [...state.rules, rule],
        })),

      updateRule: (index, rule) =>
        set(state => ({
          rules: state.rules.map((r, i) =>
            i === index ? { ...r, ...rule } : r,
          ),
        })),

      removeRule: index =>
        set(state => ({
          rules: state.rules.filter((_, i) => i !== index),
        })),

      updateLimitRule: rule =>
        set(state => ({
          limitRule: { ...state.limitRule, ...rule },
        })),

      updateOptions: options =>
        set(state => ({
          options: { ...state.options, ...options },
        })),
    }),
    {
      name: 'print-settings',
    },
  ),
)
