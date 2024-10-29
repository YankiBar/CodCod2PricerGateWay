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

private countryCodeMap = {
  ישראל: 'IL',
  איטליה: 'IT',
  אנגליה: 'EN',
  בריטניה: 'GB',
  גרמניה: 'DE',
  דנמרק: 'DK',
  דרום אפריקה: 'ZA',
  הולנד: 'NL',
  טורקיה: 'TR',
  ליטא: 'LT',
  ניו זילנד: 'NZ',
  סין: 'CN',
  ספרד: 'ES',
  צרפת: 'FR',
  שוויץ: 'CH',
  ארגנטינה: 'AR',
  ארצות הברית: 'US',
  הודו: 'IN',
  הונגריה: 'HU',
  הרפובליקה הדומיניקנית: 'DO',
  חוף השנהב: 'CI',
  יוון: 'GR',
  ירדן: 'JO',
  מולדובה: 'MD',
  סרי לנקה: 'LK',
  פולין: 'PL',
  פרו: 'PE',
  צ׳ילה: 'CL',
  קוסטה ריקה: 'CR',
  קנדה: 'CA',
  קניה: 'KE'
};

async processAndUpdateImage(
  image: Buffer,
  itemId: string,
  pageIndex: number,
  desiredWidth: number,
  desiredHeight: number
): Promise < void> {
  try {
    const processedImage = await sharp(image)
      .rotate(270)
      .resize(desiredWidth, desiredHeight, {
        fit: 'fill',
      })
      .toBuffer();

    await this.pricerService.updateLabelImage(
      itemId,
      pageIndex,
      0,
      processedImage,
    );

    this.logger.log(`Successfully updated image for itemId: ${itemId}, pageIndex: ${pageIndex}`);
  } catch(error) {
    this.logger.error(`Error processing and updating image for itemId: ${itemId}, pageIndex: ${pageIndex}`, error.stack);
    throw error;
  }
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

  async processImages(itemIds: { itemId: string; modelName: string }[]): Promise<void> {
    for (const { itemId, modelName } of itemIds) {
      const { desiredWidth, desiredHeight } = getDesiredSize(modelName);
      let size = '768X960';
      let fetchId = itemId;

      const { OriginalCountry1, OriginalCountry2 } = await this.pricerService.fetchOriginalCountry(itemId);
      const country1Code = this.countryCodeMap[OriginalCountry1] || null;
      const country2Code = this.countryCodeMap[OriginalCountry2] || null;

      if (itemId.startsWith('I')) {
        fetchId = itemId;
      } else if (itemId.startsWith('P')) {
        fetchId = 'P1' + itemId.slice(1);
      }

        try {
      const countryCodes = [country1Code, country2Code].filter(Boolean);

      if (countryCodes.length > 0) {
        for (const [index, countryCode] of countryCodes.entries()) {
          this.logger.log(`Fetching image for itemId: ${itemId} with country code: ${countryCode}`);

          const countryImage = await this.codcodService.getSign(fetchId, size, countryCode);
          if (!countryImage) {
            this.logger.warn(`No image found for itemId: ${itemId} with country code: ${countryCode}`);
            continue;
          }

          await this.processAndUpdateImage(countryImage, itemId, index, desiredWidth, desiredHeight);
        }
      } else {
        // Always fetch and process the default image if no country-specific images
        this.logger.log(`Fetching default image for itemId: ${itemId}`);
        const defaultImage = await this.codcodService.getSign(fetchId, size);
        if (!defaultImage) {
          this.logger.warn(`No default image found for itemId: ${itemId}`);
          continue;
        }

        await this.processAndUpdateImage(defaultImage, itemId, 0, desiredWidth, desiredHeight);
      }

    } catch (error) {
      this.logger.error(`Error processing itemId: ${itemId}`, error.stack);
    }
  }
}
}
