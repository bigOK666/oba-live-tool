import type { ElementHandle, Page } from 'playwright'
import * as constants from '#/constants'
import { createLogger } from '#/logger'
import { contextManager } from '#/managers/BrowserContextManager'
import { sleep } from '#/utils'
import { abortable } from '#/utils/decorators'
import { BuyinLiveControlElementFinder } from './finders/BuyinLiveControlElementFinder'
import { EOSLiveControlElementFinder } from './finders/EOSLiveControlElementFinder'
import { KuaishouLiveControlElementFinder } from './finders/KuaishouLiveControlElementFinder'
import { RedbookLiveControlElementFinder } from './finders/RedbookLiveControlElementFinder'
import { TaobaoLiveControlElementFinder } from './finders/TaobaoLiveControlElementFinder'
import { WxChannelLiveControlElementFinder } from './finders/WxChannelLiveControlElementFinder'
import type { LiveControlElementFinder } from './LiveControlElementFinder'
import { getPopUpStrategy, type PopUpStrategy } from './PopUpStrategy'

function getLiveControlElementFinder(
  platform: LiveControlPlatform,
  page: Page,
): LiveControlElementFinder {
  switch (platform) {
    case 'eos':
      return new EOSLiveControlElementFinder(page)
    case 'redbook':
      return new RedbookLiveControlElementFinder(page)
    case 'wxchannel':
      return new WxChannelLiveControlElementFinder(page)
    case 'kuaishou':
      return new KuaishouLiveControlElementFinder(page)
    case 'taobao':
      return new TaobaoLiveControlElementFinder(page)
    case 'buyin':
    case 'douyin':
      return new BuyinLiveControlElementFinder(page)
  }
}

function getCloseOverlays(platform: LiveControlPlatform) {
  switch (platform) {
    case 'wxchannel':
      return [constants.wxchannel.selectors.overlays.CLOSE_BUTTON]
    case 'kuaishou':
      return [
        constants.kuaishou.selectors.overlays.SWITCH_TO_GROUP_BUYING,
        constants.kuaishou.selectors.overlays.LIVE_ON,
      ]
    case 'douyin':
    case 'buyin':
      return [
        constants.douyin.selectors.overlays.AFK_CLOSE_BUTTON,
        constants.douyin.selectors.overlays.LIVE_OVER_CLOSE_BUTTON,
      ]
    default:
      return []
  }
}

export class LiveController {
  protected elementFinder: LiveControlElementFinder
  protected popUpStrategy: PopUpStrategy
  protected closeOverlaysSelectors: string[]

  constructor(
    protected page: Page,
    protected logger = createLogger('LiveController'),
    public abortSignal?: AbortSignal,
  ) {
    const platform = contextManager.getCurrentContext().platform
    if (!platform) {
      throw new Error('平台不存在')
    }
    this.elementFinder = getLiveControlElementFinder(platform, page)
    this.popUpStrategy = getPopUpStrategy(platform)
    this.closeOverlaysSelectors = getCloseOverlays(platform)
  }

  @abortable
  public async sendMessage(message: string, pinTop?: boolean) {
    await this.recoveryLive()
    const textarea = await this.elementFinder.getCommentTextarea()
    if (!textarea) {
      throw new Error('找不到评论框')
    }

    await textarea.fill(message)

    let successPinTop = false
    if (pinTop) {
      successPinTop = await this.clickPinTopButton()
    }

    await this.clickSubmitCommentButton()
    this.logger.success(
      `发送${successPinTop ? '「置顶」' : ''}消息: ${message}`,
    )
  }

  @abortable
  public async popUp(id: number) {
    await this.recoveryLive()
    const button = await this.getPopUpButtonById(id)

    await this.popUpStrategy(button, this.page, () =>
      this.getPopUpButtonById(id),
    )
    this.logger.success(`商品 ${id} 讲解成功`)
  }

  public async recoveryLive() {
    for (const selector of this.closeOverlaysSelectors) {
      const closeButton = await this.page.$(selector)
      if (closeButton) {
        await closeButton.dispatchEvent('click')
      }
    }
  }

  protected async getPopUpButtonById(id: number) {
    const goodsItem = await this.findGoodsItemById(id)
    const button =
      await this.elementFinder.getPopUpButtonFromGoodsItem(goodsItem)
    return button
  }

  @abortable
  private async findGoodsItemById(
    id: number,
    prevScrollTop = Number.NaN,
  ): Promise<ElementHandle<SVGElement | HTMLElement>> {
    const { element, found } = await this.getCurrentGoodsItem(id)
    if (found) {
      return element
    }
    // 往上滚到头或往下滚到头，触发列表加载
    await element.scrollIntoViewIfNeeded()

    const scrollContainer =
      await this.elementFinder.getGoodsItemsScrollContainer()
    if (!scrollContainer) {
      throw new Error('找不到滚动容器？')
    }

    // 等待 1 秒，等新的商品加载完
    await sleep(1000)
    const currentScrollTop = await scrollContainer.evaluate(el => el.scrollTop)
    // 没法滚了，说明加载完了还找不到东西
    if (
      !Number.isNaN(prevScrollTop) &&
      prevScrollTop - 10 <= currentScrollTop &&
      currentScrollTop <= prevScrollTop + 10
    ) {
      this.logger.debug(
        `prevScrollTop: ${prevScrollTop}, currentScrollTop: ${currentScrollTop}`,
      )
      throw new Error('找不到商品，请确认商品 id 是否正确')
    }
    return this.findGoodsItemById(id, currentScrollTop)
  }

  @abortable
  private async getCurrentGoodsItem(id: number) {
    const currentGoodsItems =
      await this.elementFinder.getCurrentGoodsItemsList()

    // 先尝试从当前的列表找到匹配的元素
    try {
      // 并发执行，效率比顺序遍历快了10倍以上
      const element = await Promise.any(
        currentGoodsItems.map(async goodsItem => {
          const itemId = await this.elementFinder.getIdFromGoodsItem(goodsItem)
          if (itemId !== id) {
            throw new Error('未匹配')
          }
          return goodsItem
        }),
      )
      return {
        element,
        found: true,
      }
    } catch {}

    const firstGoodsItem = currentGoodsItems[0]
    const lastGoodsItem = currentGoodsItems[currentGoodsItems.length - 1]
    if (!firstGoodsItem || !lastGoodsItem) {
      throw new Error('没有上架任何商品')
    }

    const firstIdValue =
      await this.elementFinder.getIdFromGoodsItem(firstGoodsItem)
    const lastIdValue =
      await this.elementFinder.getIdFromGoodsItem(lastGoodsItem)

    const isReversed = firstIdValue > lastIdValue

    // 需要往上滚
    if (
      (!isReversed && id < firstIdValue) ||
      (isReversed && id > firstIdValue)
    ) {
      this.logger.warn(
        `商品 ${id} 不在当前商品的范围 [${firstIdValue} ~ ${lastIdValue}]，继续查找中...`,
      )

      return {
        element: currentGoodsItems[0],
      }
    }

    // 需要往下滚
    this.logger.warn(
      `商品 ${id} 不在当前商品的范围 [${firstIdValue} ~ ${lastIdValue}]，继续查找中...`,
    )
    return {
      element: currentGoodsItems[currentGoodsItems.length - 1],
    }
  }

  private async clickPinTopButton() {
    const pinTopLabel = await this.elementFinder.getPinTopLabel()
    if (!pinTopLabel) {
      this.logger.warn('找不到置顶选项，不进行置顶')
      return false
    }
    await pinTopLabel.dispatchEvent('click')
    return true
  }

  private async clickSubmitCommentButton() {
    const submit_btn =
      await this.elementFinder.getClickableSubmitCommentButton()
    if (!submit_btn) {
      throw new Error('无法点击发布按钮')
    }
    await submit_btn.dispatchEvent('click')
  }
}
