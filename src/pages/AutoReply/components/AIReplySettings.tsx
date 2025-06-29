import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function AIReplySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>AI回复设置</CardTitle>
        <CardDescription>配置AI自动回复</CardDescription>
      </CardHeader>
      <CardContent>{/* AI回复设置内容 */}</CardContent>
    </Card>
  )
}
