import { Title } from '@/components/common/Title'
import PrintSettings from '@/components/print/PrintSettings'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import AIReplySettings from './components/AIReplySettings'
import BlockListSettings from './components/BlockListSettings'
import EventReplySettings from './components/EventReplySettings'
import GeneralSettings from './components/GeneralSettings'
import KeywordReplySettings from './components/KeywordReplySettings'

export default function AutoReplySettings() {
  return (
    <div className="container py-8 space-y-4">
      <Title title="自动回复设置" description="配置自动回复的规则和行为" />

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">常规设置</TabsTrigger>
          <TabsTrigger value="keyword">关键词回复</TabsTrigger>
          <TabsTrigger value="ai">AI回复</TabsTrigger>
          <TabsTrigger value="event">事件回复</TabsTrigger>
          <TabsTrigger value="blocklist">黑名单</TabsTrigger>
          <TabsTrigger value="print">打印设置</TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <GeneralSettings />
        </TabsContent>

        <TabsContent value="keyword">
          <KeywordReplySettings />
        </TabsContent>

        <TabsContent value="ai">
          <AIReplySettings />
        </TabsContent>

        <TabsContent value="event">
          <EventReplySettings />
        </TabsContent>

        <TabsContent value="blocklist">
          <BlockListSettings />
        </TabsContent>

        <TabsContent value="print">
          <PrintSettings />
        </TabsContent>
      </Tabs>
    </div>
  )
}
