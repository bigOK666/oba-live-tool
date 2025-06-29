import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function EventReplySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>事件回复设置</CardTitle>
        <CardDescription>配置事件触发的自动回复</CardDescription>
      </CardHeader>
      <CardContent>{/* 事件回复设置内容 */}</CardContent>
    </Card>
  )
}
