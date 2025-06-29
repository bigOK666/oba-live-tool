import { createLogger } from '@/lib/logger'

// 声明CLodop全局变量
declare global {
  interface Window {
    CLODOP: {
      GET_LODOP(): unknown
    }
    LODOP: unknown
  }
}

export interface PrinterInfo {
  name: string
  id: number
}

export interface PrintOptions {
  showNickname: boolean
  showTime: boolean
  showUserId: boolean
  showOrderNumber: boolean
  printerId?: number // 选择的打印机ID
}

export class PrintService {
  private static instance: PrintService
  private isReady = false
  private logger = createLogger('打印服务')
  private printCount = 0
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
    try {
      await this.loadCLodop()
      this.isReady = true
      this.logger.success('打印服务初始化成功')
    } catch (error) {
      this.isReady = false
      this.logger.error('打印服务初始化失败', error)
    }
    return this.isReady
  }

  private async loadCLodop() {
    return new Promise<void>((resolve, reject) => {
      if (window.CLODOP) {
        resolve()
        return
      }

      const head = document.head
      const script = document.createElement('script')
      script.src = 'http://localhost:8000/CLodopfuncs.js' // 本地CLodop服务地址
      script.type = 'text/javascript'

      script.onload = () => {
        if (window.CLODOP) {
          resolve()
        } else {
          reject(
            new Error('未能加载CLODOP对象，请检查是否安装了C-Lodop打印控件'),
          )
        }
      }

      script.onerror = () => {
        reject(new Error('加载C-Lodop脚本失败，请检查网络连接和脚本地址'))
      }

      head.appendChild(script)
    })
  }

  /**
   * 获取可用打印机列表
   */
  getPrinters(): PrinterInfo[] {
    if (!this.isReady || !window.CLODOP) {
      this.logger.error('打印服务未准备好，无法获取打印机列表')
      return []
    }

    try {
      const LODOP = window.CLODOP.GET_LODOP()
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
    if (!this.isReady || !window.CLODOP) {
      this.logger.error('打印服务未准备好')
      return false
    }

    // 记录已打印的评论ID，避免重复打印
    if (this.printedCommentIds.has(comment.msg_id)) {
      return false
    }

    this.printedCommentIds.add(comment.msg_id)
    this.printCount++

    try {
      const LODOP = window.CLODOP.GET_LODOP()

      if (!LODOP) {
        this.logger.error('未能获取LODOP对象，请检查CLodop是否正确安装运行')
        return false
      }

      LODOP.PRINT_INIT('直播评论打印')

      // 设置打印机
      if (options.printerId !== undefined) {
        LODOP.SET_PRINTER_INDEX(options.printerId)
      }

      LODOP.SET_PRINT_PAGESIZE(3, 800, 30, '') // 设置为热敏纸模式

      // 添加标题
      LODOP.ADD_PRINT_TEXT(10, 10, 260, 30, '直播间评论')
      LODOP.SET_PRINT_STYLEA(0, 'FontSize', 12)
      LODOP.SET_PRINT_STYLEA(0, 'Bold', 1)
      LODOP.SET_PRINT_STYLEA(0, 'Alignment', 2) // 居中

      let currentY = 40

      // 添加序号
      if (options.showOrderNumber) {
        LODOP.ADD_PRINT_TEXT(currentY, 10, 260, 20, `序号：${this.printCount}`)
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
          `用户ID：${comment.user_id}`,
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
    this.printCount = 0
    this.printedCommentIds.clear()
    this.logger.info('打印计数已重置')
    return true
  }

  // 获取当前打印计数
  getPrintCount() {
    return this.printCount
  }
}

export const printService = PrintService.getInstance()
