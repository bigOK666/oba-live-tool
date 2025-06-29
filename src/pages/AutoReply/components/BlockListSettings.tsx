import React from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

export default function BlockListSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>黑名单设置</CardTitle>
        <CardDescription>配置不进行自动回复的用户</CardDescription>
      </CardHeader>
      <CardContent>{/* 黑名单设置内容 */}</CardContent>
    </Card>
  )
}
