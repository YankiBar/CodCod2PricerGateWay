import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CodcodService } from 'src/codcod/codcod.service';
import { PricerService } from 'src/pricer/pricer.service';
import { ConfigService } from '@nestjs/config';
import { MyLogger } from '../../../logger';
import {
  addHoursToUtcTime,
  getDesiredSize,
  getMatchingLabels,
  countryCodeMap,
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

  @Cron(CronExpression.EVERY_10_MINUTES)
  async processUpdates(): Promise<void> {
    const lastUpdateTime = new Date().toISOString();
    const updatedTime = addHoursToUtcTime(lastUpdateTime, 2);

    this.logger.log(`Processing updates since ${updatedTime}`);

    try {
      const codcodItems =
        (await this.codcodService.getUpdatedItems(
          lastUpdateTime,
          this.storeId,
        )) || [];
      const codcodPromos =
        (await this.codcodService.getUpdatedPromos(
          lastUpdateTime,
          this.storeId,
        )) || [];
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
      const size = getDesiredSize(modelName);
      let fetchId = itemId.startsWith('P') ? 'P1' + itemId.slice(1) : itemId;

      try {
        const { OriginalCountry1, OriginalCountry2 } =
          await this.pricerService.fetchOriginalCountry(itemId);
        const countryCodes = [
          countryCodeMap[OriginalCountry1] || null,
          countryCodeMap[OriginalCountry2] || null,
        ].filter(Boolean);

        if (countryCodes.length > 0) {
          for (const [index, countryCode] of countryCodes.entries()) {
            this.logger.log(
              `Fetching image for itemId: ${itemId} with country code: ${countryCode}`,
            );

            const countryImage = await this.codcodService.getSign(
              fetchId,
              size,
              countryCode,
            );
            if (!countryImage) {
              this.logger.warn(
                `No image found for itemId: ${itemId} with country code: ${countryCode}`,
              );
              continue;
            }

            await this.pricerService.updateLabelImage(
              itemId,
              index,
              0,
              countryImage,
            );
            this.logger.log(
              `Successfully updated image for itemId: ${itemId}, pageIndex: ${index}`,
            );
          }
        } else {
          // If no country-specific images, fetch and process the default image
          this.logger.log(`Fetching default image for itemId: ${itemId}`);
          const defaultImage = await this.codcodService.getSign(fetchId, size);
          if (!defaultImage) {
            this.logger.warn(`No default image found for itemId: ${itemId}`);
            continue;
          }

          await this.pricerService.updateLabelImage(itemId, 0, 0, defaultImage);
        }
      } catch (error) {
        this.logger.error(`Error processing itemId: ${itemId}`, error.stack);
      }
    }
  }
}
