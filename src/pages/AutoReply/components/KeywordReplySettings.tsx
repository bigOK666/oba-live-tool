import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function KeywordReplySettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>关键词回复设置</CardTitle>
        <CardDescription>配置关键词触发的自动回复</CardDescription>
      </CardHeader>
      <CardContent>{/* 关键词回复设置内容 */}</CardContent>
    </Card>
  )
}
