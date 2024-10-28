import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';
import * as sharp from 'sharp';
import { MyLogger } from '../../../logger';
import {
  addHoursToUtcTime,
  getDesiredSize,
  getMatchingLabels,
} from 'src/codcod/helpers/helpers';

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

  @Cron(CronExpression.EVERY_5_MINUTES)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();
    const updatedTime = addHoursToUtcTime(lastUpdateTime, -112);

    this.logger.log(`Processing updates since ${updatedTime}`);

    try {
      // Fetch updated items from Codcod
      const codcodItems =
        (await this.codcodService.getAllBranchItems(
          // updatedTime,
          this.storeId,
        )) || [];
      const codcodPromos =
        (await this.codcodService.getAllBranchPromos(
          // updatedTime,
          this.storeId,
        )) || [];

      // Fetch all labels from Pricer
      const allLabels = await this.pricerService.getAllLabelsInStore();

      const filteredItemIds = getMatchingLabels(
        codcodItems,
        allLabels,
        this.logger,
      );
      const filteredPromoIds = getMatchingLabels(
        codcodPromos,
        allLabels,
        this.logger,
      );

      // Ensure proper processing
      this.logger.log(
        'Filtered Items: ' + JSON.stringify(filteredItemIds, null, 2),
      );
      this.logger.log(
        'Filtered Promos: ' + JSON.stringify(filteredPromoIds, null, 2),
      );

      await Promise.all([
        this.processImages(filteredItemIds),
        this.processImages(filteredPromoIds),
      ]);

      this.logger.log('Processing completed.');
    } catch (error) {
      this.logger.error('Error processing updates:', error.stack);
    }
  }

  async processImages(
    itemIds: { itemId: string; modelName: string }[],
  ): Promise<void> {
    for (const { itemId, modelName } of itemIds) {
      const { desiredWidth, desiredHeight } = getDesiredSize(modelName);
      let size = '768X960';
      let fetchId = itemId; // Start with the original ID for fetching

      // Determine the prefix handling for fetching
      if (itemId.startsWith('I')) {
        fetchId = itemId; // Original ID remains unchanged
      } else if (itemId.startsWith('P')) {
        fetchId = 'P1' + itemId.slice(1); // Remove 'P' and append '1'
      }

      // Log the current operation
      this.logger.log(
        `Fetching image for itemId: ${itemId} using function: getSign`,
      );

      try {
        // Log the fetch ID
        this.logger.log(`Original ID: ${itemId}, Fetch ID: ${fetchId}`);

        // Fetch item image from Codcod
        const image = await this.codcodService.getSign(fetchId, size);
        if (!image) {
          this.logger.warn(`No image found for itemId: ${itemId}`);
          continue;
        }

        this.logger.log(
          `Image fetched for fetchId: ${fetchId}. Processing image...`,
        );

        const processedImage = await sharp(image)
          .rotate(270) // Rotate image 90 degrees to the left
          .resize(desiredWidth, desiredHeight, {
            fit: 'fill',
          })
          .toBuffer();

        // Log before sending to the update method
        this.logger.log(
          `Sending processed image for itemId: ${itemId} to Pricer`,
        );

        // Update item image in Pricer with the original item ID
        await this.pricerService.updateLabelImage(
          itemId, // Use original itemId for updating
          0,
          0,
          processedImage,
        );

        this.logger.log(`Successfully updated image for itemId: ${itemId}`);
      } catch (error) {
        this.logger.error(`Error processing itemId: ${itemId}`, error.stack);
      }
    }
  }
}
