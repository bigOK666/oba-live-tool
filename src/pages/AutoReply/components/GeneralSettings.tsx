import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function GeneralSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>常规设置</CardTitle>
        <CardDescription>配置自动回复的基本设置</CardDescription>
      </CardHeader>
      <CardContent>{/* 常规设置内容 */}</CardContent>
    </Card>
  )
}
