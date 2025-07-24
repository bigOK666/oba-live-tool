import { createLogger } from '@/lib/logger'

export interface PrinterInfo {
  name: string
  id: number
}

// 定义纸张类型枚举
export enum PaperSizeType {
  CUSTOM = 0, // 自定义尺寸
  THERMAL = 3, // 热敏纸 (默认)
  A4 = 9, // A4纸
  A5 = 11, // A5纸
  B5 = 13, // B5纸
  LETTER = 1, // 信纸
  LEGAL = 5, // 法律专用纸
}

// 定义纸张尺寸接口
export interface PaperSize {
  width: number
  height: number
}

export interface PrintOptions {
  showNickname: boolean
  showTime: boolean
  showUserId: boolean
  showOrderNumber: boolean
  printerId?: number // 选择的打印机ID
  paperSizeType: PaperSizeType // 纸张类型
  customPaperSize?: PaperSize // 自定义纸张尺寸
}

export class PrintService {
  private static instance: PrintService
  private isReady = false
  private logger = createLogger('打印服务')
  private _printCount = 0
  private printedCommentIds = new Set<string>()

  constructor() {
    this.init()
  }

  static getInstance() {
    if (!PrintService.instance) {
      PrintService.instance = new PrintService()
    }
    return PrintService.instance
  }

  async init() {
    this.logger.info('[打印服务] 开始初始化打印服务...')
    try {
      await this.loadCLodop()

      const maxRetries = 40
      let retries = 0

      const lodopReady = await new Promise((resolve, reject) => {
        const timer = setInterval(() => {
          const lodop = (window as any).getCLodop?.()
          if (lodop && lodop.VERSION) {
            clearInterval(timer)
            resolve(true)
          } else {
            retries++
            if (retries > maxRetries) {
              clearInterval(timer)
              reject(new Error('等待 CLODOP 对象超时（超过 8 秒）'))
            }
          }
        }, 200)
      })

      this.isReady = true
      this.logger.success('[打印服务] 打印服务初始化成功')
    } catch (error) {
      this.isReady = false
      this.logger.error('[打印服务] 打印服务初始化失败', error)
    }
  }

  private async loadCLodop(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      if (window.getCLodop) {
        this.logger.info('getCLodop 已存在，跳过脚本加载')
        resolve()
        return
      }

      const script = document.createElement('script')
      script.src = 'http://localhost:8000/CLodopfuncs.js'
      script.type = 'text/javascript'

      script.onload = () => {
        this.logger.info('CLodopfuncs.js 加载成功')
        if (window.getCLodop) {
          resolve()
        } else {
          reject(new Error('CLodopfuncs.js 加载成功但未定义 getCLodop 函数'))
        }
      }

      script.onerror = err => {
        this.logger.error('CLodopfuncs.js 加载失败，请检查服务是否启动')
        reject(
          new Error(
            '无法加载 CLODOP 脚本（http://localhost:8000/CLodopfuncs.js）',
          ),
        )
      }

      document.head.appendChild(script)
    })
  }

  /**
   * 获取可用打印机列表
   */
  getPrinters(): PrinterInfo[] {
    if (!this.isReady || !window.getCLodop) {
      this.logger.error('打印服务未准备好，无法获取打印机列表')
      return []
    }

    try {
      const LODOP = window.getCLodop()
      if (!LODOP) {
        this.logger.error('未能获取LODOP对象')
        return []
      }

      const printerCount = LODOP.GET_PRINTER_COUNT()
      const printers: PrinterInfo[] = []

      for (let i = 0; i < printerCount; i++) {
        const name = LODOP.GET_PRINTER_NAME(i)
        printers.push({ name, id: i })
      }

      return printers
    } catch (error) {
      this.logger.error('获取打印机列表失败:', error)
      return []
    }
  }

  /**
   * 打印评论信息
   */
  printComment(comment: DouyinLiveMessage, options: PrintOptions): boolean {
    if (!this.isReady || !window.getCLodop) {
      this.logger.error('打印服务未准备好')
      return false
    }

    // 记录已打印的评论ID，避免重复打印
    if (this.printedCommentIds.has(comment.msg_id)) {
      return false
    }

    this.printedCommentIds.add(comment.msg_id)
    this._printCount++

    try {
      const LODOP = window.getCLodop()

      if (!LODOP) {
        this.logger.error('未能获取LODOP对象，请检查CLodop是否正确安装运行')
        return false
      }

      LODOP.PRINT_INIT('直播评论打印')

      // 设置打印机
      if (options.printerId !== undefined) {
        LODOP.SET_PRINTER_INDEX(options.printerId)
      }

      // 设置纸张类型和尺寸
      if (
        options.paperSizeType === PaperSizeType.CUSTOM &&
        options.customPaperSize
      ) {
        // 自定义纸张尺寸
        LODOP.SET_PRINT_PAGESIZE(
          0, // 自定义纸张
          options.customPaperSize.width,
          options.customPaperSize.height,
          '',
        )
      } else {
        // 使用预定义纸张类型
        const paperWidth =
          options.paperSizeType === PaperSizeType.THERMAL ? 800 : 0
        const paperHeight =
          options.paperSizeType === PaperSizeType.THERMAL ? 30 : 0
        LODOP.SET_PRINT_PAGESIZE(
          options.paperSizeType,
          paperWidth,
          paperHeight,
          '',
        )
      }

      // 添加标题
      LODOP.ADD_PRINT_TEXT(10, 10, 260, 30, '直播间评论')
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 12)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
      LODOP.SET_PRINT_STYLEA(0, 'Alignment', 2) // 居中

      let currentY = 40

      // 添加序号
      if (options.showOrderNumber) {
        LODOP.ADD_PRINT_TEXT(currentY, 10, 260, 20, `序号：${this._printCount}`)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 10)
        currentY += 20
      }

      // 添加用户名
      if (options.showNickname) {
        LODOP.ADD_PRINT_TEXT(
          currentY,
          10,
          260,
          20,
          `用户：${comment.nick_name}`,
        )
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 10)
        currentY += 20
      }

      // 添加用户ID
      if (options.showUserId && 'user_id' in comment) {
        LODOP.ADD_PRINT_TEXT(
          currentY,
          10,
          260,
          20,
          `用户ID：${(comment as any).user_id}`,
        )
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 10)
        currentY += 20
      }

      // 添加评论内容
      if (comment.msg_type === 'comment') {
        LODOP.ADD_PRINT_TEXT(currentY, 10, 260, 60, `评论：${comment.content}`)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 10)
        currentY += 60
      }

      // 添加时间
      if (options.showTime) {
        LODOP.ADD_PRINT_TEXT(currentY, 10, 260, 20, `时间：${comment.time}`)
        LODOP.SET_PRINT_STYLEA(0, 'FontSize', 8)
        currentY += 20
      }

      // 添加底部分隔线
      LODOP.ADD_PRINT_LINE(currentY, 10, currentY, 270, 0, 1)
      currentY += 10

      // 执行打印
      LODOP.PRINT()
      this.logger.success(`打印成功：${comment.nick_name} 的评论`)
      return true
    } catch (error) {
      this.logger.error('打印过程中出现错误:', error)
      return false
    }
  }

  // 重置打印计数和记录
  resetPrintCount() {
    this._printCount = 0
    this.printedCommentIds.clear()
    this.logger.info('打印计数已重置')
    return true
  }

  // 获取当前打印计数
  getPrintCount(): number {
    return this._printCount
  }
}

export const printService = PrintService.getInstance()
