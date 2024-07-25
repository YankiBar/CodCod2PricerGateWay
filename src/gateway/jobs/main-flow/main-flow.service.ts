import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);

  constructor(
    private readonly codcodService: CodcodService,
    private readonly pricerService: PricerService,
    private readonly configService: ConfigService,
  ) {}

  @Cron('0 * * * * *') // Every minute
  async handleCron() {
    this.logger.debug('Called every minute');
    
    // Implement logic to fetch updated items and promos from Codcod and update Pricer
    const storeId = this.configService.get<string>('STORE_ID');
    const lastUpdateTime = new Date().toISOString();

    try {
      const updatedItemsResponse = await this.codcodService.getUpdatedItems(storeId, lastUpdateTime).toPromise();
      const updatedItems = updatedItemsResponse.data.items;

      for (const itemId of updatedItems) {
        const imageResponse = await this.codcodService.getItemSign(itemId, '158x480', storeId).toPromise();
        const imageBuffer = Buffer.from(imageResponse.data, 'binary');
        await this.pricerService.updateItemImage(itemId, 0, 0, imageBuffer).toPromise();
      }

      this.logger.log(`Successfully updated ${updatedItems.length} items.`);
    } catch (error) {
      this.logger.error('Error updating items:', error);
    }
  }
}
