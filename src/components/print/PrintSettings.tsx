import { PlusIcon, RefreshCwIcon, Trash2Icon } from 'lucide-react'
import React, { useCallback, useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { type PrintRule, usePrintSettings } from '@/hooks/usePrintSettings'
import { type PrinterInfo, printService } from '@/services/PrintService'

export default function PrintSettings() {
  const {
    enabled,
    rules,
    limitRule,
    options,
    setEnabled,
    addRule,
    updateRule,
    removeRule,
    updateLimitRule,
    updateOptions,
  } = usePrintSettings()

  const [loading, setLoading] = useState(false)
  const [testStatus, setTestStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)
  const [printers, setPrinters] = useState<PrinterInfo[]>([])
  const [printCount, setPrintCount] = useState(0)

  // 生成唯一ID
  const id = useId()
  const printEnabledId = `print-enabled-${id}`
  const showNicknameId = `show-nickname-${id}`
  const showTimeId = `show-time-${id}`
  const showUserIdId = `show-userid-${id}`
  const showOrderNumberId = `show-order-number-${id}`

  // 使用useCallback包装loadPrinters函数
  const loadPrinters = useCallback(async () => {
    try {
      await printService.init()
      const printerList = printService.getPrinters()
      setPrinters(printerList)
      setPrintCount(printService.getPrintCount())
    } catch (e) {
      console.error('加载打印机列表失败', e)
    }
  }, [])

  useEffect(() => {
    loadPrinters()

    // 定期更新打印计数
    const interval = setInterval(() => {
      setPrintCount(printService.getPrintCount())
    }, 5000)

    return () => clearInterval(interval)
  }, [loadPrinters]) // 添加loadPrinters作为依赖项

  const handleTestPrint = async () => {
    setLoading(true)
    try {
      await printService.init()
      const success = printService.printComment(
        {
          msg_type: 'comment',
          msg_id: `test-${Date.now()}`,
          nick_name: '测试用户',
          content: '这是一条测试评论 #打印 内容',
          time: new Date().toLocaleTimeString(),
        },
        options,
      )

      setTestStatus({
        success,
        message: success ? '打印测试成功' : '打印测试失败，请检查打印机连接',
      })

      // 更新打印计数
      setPrintCount(printService.getPrintCount())
    } catch (e) {
      setTestStatus({
        success: false,
        message:
          '打印测试失败: ' + (e instanceof Error ? e.message : String(e)),
      })
    } finally {
      setLoading(false)
    }
  }

  const handleResetPrintCount = () => {
    printService.resetPrintCount()
    setPrintCount(0)
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>评论打印设置</CardTitle>
            <CardDescription>设置触发打印的评论规则和打印配置</CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Label htmlFor={printEnabledId}>启用自动打印</Label>
            <Switch
              id={printEnabledId}
              checked={enabled}
              onCheckedChange={setEnabled}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        <Tabs defaultValue="rules">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="rules">触发规则</TabsTrigger>
            <TabsTrigger value="limits">打印限制</TabsTrigger>
            <TabsTrigger value="options">打印选项</TabsTrigger>
            <TabsTrigger value="printer">打印机</TabsTrigger>
          </TabsList>

          <TabsContent value="rules" className="space-y-4">
            <div className="space-y-4">
              {rules.map((rule, index) => (
                <div
                  key={`rule-${index}-${rule.pattern}`}
                  className="flex items-center gap-2 p-3 rounded-md border"
                >
                  <div className="flex-1 grid grid-cols-2 gap-2">
                    <div>
                      <Label>规则类型</Label>
                      <Select
                        value={rule.type}
                        onValueChange={value =>
                          updateRule(index, {
                            type: value as PrintRule['type'],
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="exact-match">完全匹配</SelectItem>
                          <SelectItem value="contains">包含</SelectItem>
                          <SelectItem value="regex">正则表达式</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>匹配内容</Label>
                      <Input
                        value={rule.pattern}
                        onChange={e =>
                          updateRule(index, { pattern: e.target.value })
                        }
                        placeholder={rule.type === 'regex' ? '/模式/' : '#打印'}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={rule.enabled}
                      onCheckedChange={checked =>
                        updateRule(index, { enabled: checked })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRule(index)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                addRule({ type: 'contains', pattern: '', enabled: true })
              }
              className="flex items-center gap-1"
            >
              <PlusIcon className="h-4 w-4" />
              添加规则
            </Button>
          </TabsContent>

          <TabsContent value="limits" className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-md border">
              <div>
                <Label>限制打印数量</Label>
                <div className="text-sm text-muted-foreground mt-1">
                  只打印前N条匹配的评论，之后不再打印
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="w-24">
                  <Input
                    type="number"
                    min="1"
                    value={limitRule.count}
                    onChange={e =>
                      updateLimitRule({
                        count: Number.parseInt(e.target.value) || 1,
                      })
                    }
                    disabled={!limitRule.enabled}
                  />
                </div>
                <Switch
                  checked={limitRule.enabled}
                  onCheckedChange={checked =>
                    updateLimitRule({ enabled: checked })
                  }
                />
              </div>
            </div>

            <div className="p-3 rounded-md border">
              <div className="flex items-center justify-between">
                <div>
                  <Label>当前打印计数</Label>
                  <div className="text-sm text-muted-foreground mt-1">
                    已打印 {printCount} 条评论
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={handleResetPrintCount}
                  className="flex items-center gap-1"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  重置计数
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="options" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={showNicknameId}
                  checked={options.showNickname}
                  onCheckedChange={checked =>
                    updateOptions({ showNickname: !!checked })
                  }
                />
                <Label htmlFor={showNicknameId}>显示用户昵称</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={showTimeId}
                  checked={options.showTime}
                  onCheckedChange={checked =>
                    updateOptions({ showTime: !!checked })
                  }
                />
                <Label htmlFor={showTimeId}>显示评论时间</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={showUserIdId}
                  checked={options.showUserId}
                  onCheckedChange={checked =>
                    updateOptions({ showUserId: !!checked })
                  }
                />
                <Label htmlFor={showUserIdId}>显示用户ID</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id={showOrderNumberId}
                  checked={options.showOrderNumber}
                  onCheckedChange={checked =>
                    updateOptions({ showOrderNumber: !!checked })
                  }
                />
                <Label htmlFor={showOrderNumberId}>显示序号</Label>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="printer" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>选择打印机</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadPrinters}
                  className="flex items-center gap-1"
                >
                  <RefreshCwIcon className="h-4 w-4" />
                  刷新列表
                </Button>
              </div>

              <Select
                value={options.printerId?.toString() || 'default'}
                onValueChange={value =>
                  updateOptions({
                    printerId:
                      value === 'default' ? undefined : Number.parseInt(value),
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择打印机" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">默认打印机</SelectItem>
                  {printers
                    .filter(
                      printer => printer.name && printer.name.trim() !== '',
                    )
                    .map(printer => (
                      <SelectItem
                        key={`printer-${printer.id || Math.random()}`}
                        value={printer.id.toString()}
                      >
                        {printer.name || '未命名打印机'}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {printers.length === 0 && (
                <p className="text-sm text-amber-600">
                  未检测到打印机，请确保CLodop服务已启动并且打印机已连接
                </p>
              )}

              <div className="text-sm text-muted-foreground mt-2">
                提示：如果打印机列表为空，请确保已安装并启动CLodop打印服务
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <Separator />

        <div className="flex items-center justify-between">
          <Button
            onClick={handleTestPrint}
            variant="outline"
            disabled={loading}
          >
            {loading ? '测试中...' : '测试打印'}
          </Button>

          {testStatus && (
            <span
              className={`text-sm ${testStatus.success ? 'text-green-600' : 'text-red-600'}`}
            >
              {testStatus.message}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
