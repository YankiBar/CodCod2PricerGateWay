import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import AsciiArt from 'ascii-art';

async function displayImageAsAscii(imageBuffer: Buffer) {
  try {
    const artwork = await AsciiArt.image({
      data: imageBuffer,
      width: 40, // Adjust the width as needed
    });
    console.log(artwork);
  } catch (error) {
    console.error('Failed to display image as ASCII:', error);
  }
}

function addHoursToUtcTime(originalTime: string, hoursToAdd: number): string {
  const date = new Date(originalTime);
  date.setUTCHours(date.getUTCHours() + hoursToAdd);
  return date.toISOString(); // Convert the Date object back to an ISO string
}

@Injectable()
export class GatewayService {
  private readonly logger = new Logger(GatewayService.name);
  private readonly storeId = process.env.STORE_ID;
  private readonly projection = 'S';

  constructor(
    private readonly codcodService: CodcodService,
    private readonly pricerService: PricerService,
  ) {}

  @Cron(CronExpression.EVERY_MINUTE)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();
    const updatedTime = addHoursToUtcTime(lastUpdateTime, 3);

    console.log(`Processing updates since ${updatedTime}`);

    try {
      // Fetch updated items from Codcod
      const codcodItems = await this.codcodService.getUpdatedItems(
        lastUpdateTime,
        this.storeId,
      );
      const codcodPromos = await this.codcodService.getUpdatedPromos(
        lastUpdateTime,
        this.storeId,
      );
      console.log(codcodItems);
      if (Array.isArray(codcodItems) && codcodItems.length > 0) {
        for (const item in codcodItems) {
          this.logger.log(`Processing itemId: ${codcodItems[item].itemId}`);
          // Fetch item image from Codcod
          const image = await this.codcodService.fetchItemImage(
            codcodItems[item].barcode,
            '768X920',
            this.storeId,
          );
          this.logger.log(`Image size: ${image.length} bytes`);
          this.logger.log('Displaying image as ASCII...');
          await displayImageAsAscii(image);  

          if (!image) {
            this.logger.warn(
              `No image found for itemId: ${codcodItems[item].itemId}`,
            );
            continue;
          }
        }
      }
      // // Fetch all labels from Pricer
      // const allLabels = await this.pricerService.getAllLabelsInStore(this.storeId);

      // // Filter items that exist in both Codcod and Pricer
      // const pricerItemIds = allLabels.map(item => item.links.itemId);
      // const filteredItemIds = codcodItems.filter((id: any) => pricerItemIds.includes(id));

      // Process the filtered items
      // await this.processItems(filteredItemIds);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processItems(itemIds: string[]): Promise<void> {
    for (const itemId of itemIds) {
      try {
        // Fetch item image from Codcod
        const image = await this.codcodService.fetchImage(
          itemId,
          'defaultSize',
          this.storeId,
        );
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
