import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly storeId: string;
  private readonly projection = 'S'; // Adjust as needed

  constructor(
    private readonly codcodService: CodcodService,
    private readonly pricerService: PricerService,
  ) {
    this.storeId = process.env.STORE_ID;
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();

    try {
      // Fetch updated items from Codcod
      const codcodItemsResponse = await this.codcodService.getUpdatedItems(lastUpdateTime, this.storeId);
      const codcodItems = codcodItemsResponse.data.items;

      // Fetch items from Pricer
      let pricerItems = [];
      let start = 0;
      const limit = 500;

      do {
        const response = await this.pricerService.fetchItems(start, limit, this.projection);
        pricerItems = response;
        start += limit;

        // Filter items that exist in both Codcod and Pricer
        const pricerItemIds = pricerItems.map(item => item.itemId);
        const filteredItemIds = codcodItems.filter((id: any) => pricerItemIds.includes(id));

        // Process the filtered items
        await this.processItems(filteredItemIds);

      } while (pricerItems.length === limit); // Continue if there are more items

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processItems(itemIds: string[]): Promise<void> {
    for (const itemId of itemIds) {
      try {
        // Fetch item image from Codcod
        const image = await this.codcodService.fetchImage(itemId, 'defaultSize', this.storeId);
        if (!image) {
          this.logger.warn(`No image found for itemId: ${itemId}`);
          continue;
        }

        // Update item image in Pricer
        await this.pricerService.updateItemImage(itemId, 0, 0, image); // Adjust parameters as needed
        this.logger.log(`Successfully updated image for itemId: ${itemId}`);
      } catch (error) {
        this.logger.error(`Error processing itemId: ${itemId}`, error.stack);
      }
    }
  }
}
