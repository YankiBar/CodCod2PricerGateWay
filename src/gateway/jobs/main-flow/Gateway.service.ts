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
} from 'src/codcod/helpers/helpers';

@Injectable()
export class GatewayService {
  private readonly logger = new MyLogger();
  private readonly storeId: string;

  // Moved country code map inside the class and marked as a private property
  private countryCodeMap = {
    ישראל: 'IL',
    איטליה: 'IT',
    אנגליה: 'EN',
    בריטניה: 'GB',
    גרמניה: 'DE',
    דנמרק: 'DK',
    'דרום אפריקה': 'ZA',
    הולנד: 'NL',
    טורקיה: 'TR',
    ליטא: 'LT',
    'ניו זילנד': 'NZ',
    סין: 'CN',
    ספרד: 'ES',
    צרפת: 'FR',
    שוויץ: 'CH',
    ארגנטינה: 'AR',
    'ארצות הברית': 'US',
    הודו: 'IN',
    הונגריה: 'HU',
    'הרפובליקה הדומיניקנית': 'DO',
    'חוף השנהב': 'CI',
    יוון: 'GR',
    ירדן: 'JO',
    מולדובה: 'MD',
    'סרי לנקה': 'LK',
    פולין: 'PL',
    פרו: 'PE',
    'צ׳ילה': 'CL',
    'קוסטה ריקה': 'CR',
    קנדה: 'CA',
    קניה: 'KE',
  };

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
    const updatedTime = addHoursToUtcTime(lastUpdateTime, -112);

    this.logger.log(`Processing updates since ${updatedTime}`);

    try {
      const codcodItems =
        (await this.codcodService.getAllBranchItems(this.storeId)) || [];
      const codcodPromos =
        (await this.codcodService.getAllBranchPromos(this.storeId)) || [];
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
          this.countryCodeMap[OriginalCountry1] || null,
          this.countryCodeMap[OriginalCountry2] || null,
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
