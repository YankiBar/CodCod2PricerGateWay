import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { MyLogger } from '../../../logger';

function addHoursToUtcTime(originalTime: string, hoursToAdd: number): string {
  const date = new Date(originalTime);
  date.setUTCHours(date.getUTCHours() + hoursToAdd);
  return date.toISOString();
}

@Injectable()
export class GatewayService {
  private readonly logger = new MyLogger();
  private readonly storeId: string;

  constructor(
    private readonly codcodService: CodcodService,
    private readonly pricerService: PricerService,
    private readonly configService: ConfigService,
  ) {
    this.storeId = this.configService.get<string>('STORE_ID');
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();
    const updatedTime = addHoursToUtcTime(lastUpdateTime, 3);

    this.logger.log(`Processing updates since ${updatedTime}`); 

    try {
      // Fetch updated items from Codcod
      const codcodItems =
        (await this.codcodService.getUpdatedItems(
          lastUpdateTime,
          this.storeId,
        )) || [];
      const codcodPromos =
        (await this.codcodService.getAllBranchPromos(
          // lastUpdateTime,
          this.storeId,
        )) || [];
        this.logger.log('Codcod Items: ' + JSON.stringify(codcodItems));
        this.logger.log('Codcod Promos: ' + JSON.stringify(codcodPromos));

      // Fetch all labels from Pricer
      const allLabels = await this.pricerService.getAllLabelsInStore();
      this.logger.log('All Labels: '+ JSON.stringify(allLabels));
      // if (Array.isArray(allLabels) || allLabels.length > 0) {
      //   for (const item of allLabels) {
      //     const links = item.links[0];
      //     console.log(`the ItemID of this lebal is: ${links.itemId}`);
      //   }
      // }

      // Filter items that exist in both Codcod and Pricer
      const pricerItemIds = allLabels
        .map((item) => {
          if (item.links && item.links.length > 0) {
            return { itemId: item.links[0].itemId, modelName: item.modelName };
          }
          return null;
        })
        .filter((itemId) => itemId !== null);

      const filteredItemIds = codcodItems
        .filter((item: any) =>
          pricerItemIds.some(
            (pricerItem) => pricerItem.itemId === item.barcode,
          ),
        )
        .map((item) => {
          // Find the matching label based on itemId
          const matchingLabel = pricerItemIds.find(
            (pricerItem) => pricerItem.itemId === item.barcode,
          );

          // Return the object with itemId and modelName
          return matchingLabel
            ? { itemId: item.barcode, modelName: matchingLabel.modelName }
            : null;
        })
        .filter((item) => item !== null);

      const filteredPromoIds = codcodPromos
        .filter((promo: any) =>
          pricerItemIds.some(
            (pricerItem) => pricerItem.itemId === promo.barcode,
          ),
        )
        .map((promo) => {
          // Find the matching label based on itemId
          const matchingLabel = pricerItemIds.find(
            (pricerItem) => pricerItem.itemId === promo.barcode,
          );

          // Return the object with itemId and modelName
          return matchingLabel
            ? { itemId: promo.barcode, modelName: matchingLabel.modelName }
            : null;
        })
        .filter((item) => item !== null);

      // Ensure proper processing
      this.logger.log('Filtered Items: '+ JSON.stringify(filteredItemIds));
      this.logger.log('Filtered Promos: '+ + JSON.stringify(filteredPromoIds));

      // Process the filtered items
      await this.processItems(filteredItemIds);
      await this.processItems(filteredPromoIds);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processItems(
    itemIds: { itemId: string; modelName: string }[],
  ): Promise<void> {
    for (const itemId of itemIds) {
      let size = '768X920';
      let desiredWidth = 768; // Default width
      let desiredHeight = 920; // Default height
      // Set the size to download and the desired size based on the modelName
      if (itemId.modelName === 'SmartTAG HDL Red 1328') {
        desiredWidth = 296;
        desiredHeight = 128;
      } else if (itemId.modelName === 'SmartTAG HD110') {
        desiredWidth = 400;
        desiredHeight = 300;
      } else if (itemId.modelName === 'SmartTAG HD200L Red') {
        desiredWidth = 640;
        desiredHeight = 384;
      } else if (itemId.modelName === 'SmartTAG HD300 Red') {
        desiredWidth = 1304;
        desiredHeight = 984;
      }
      // if (itemId.modelName === 'SmartTAG HDL Red 1328') {
      //   size = '296x128';
      // } else if (itemId.modelName === 'SmartTAG HD110 Red') { // Use === for comparison
      //   size = '400x300';
      // } else if (itemId.modelName === 'SmartTAG HD200L Red') {
      //   size = '640x384';
      // } else if (itemId.modelName === 'SmartTAG HD300 Red') {
      //   size = '1304x984';
      // }
      try {
        // Fetch item image from Codcod
        const image = await this.codcodService.getSign(itemId.itemId, size);
        if (!image) {
          this.logger.warn(`No image found for itemId: ${itemId}`);
          continue;
        }

        const processedImage = await sharp(image)
          .rotate(90) // Rotate image 90 degrees to the right
          .resize(desiredWidth, desiredHeight, {
            fit: 'fill',
          })
          .toBuffer();

        // Update item image in Pricer
        await this.pricerService.updateItemImage(
          itemId.itemId,
          0,
          0,
          processedImage,
        );
        this.logger.log(
          `Successfully updated image for itemId: ${itemId.itemId}`,
        );
      } catch (error) {
        this.logger.error(
          `Error processing itemId: ${itemId.itemId}`,
          error.stack,
        );
      }
    }
  }
}
