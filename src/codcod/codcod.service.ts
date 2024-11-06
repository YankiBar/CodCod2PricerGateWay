import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { MyLogger } from 'src/logger';

@Injectable()
export class CodcodService {
  private readonly logger = new MyLogger();
  private readonly ContentBaseURL: string;
  private readonly MediaBaseURL: string;
  private readonly storeId: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ContentBaseURL = this.configService.get<string>('CODCOD_CONTENT_URL');
    this.MediaBaseURL = this.configService.get<string>('CODCOD_MEDIA_URL');
    this.storeId = this.configService.get<string>('STORE_ID');
  }

  async getAllBranchItems(storeId: string): Promise<any[]> {
    const url = `${this.ContentBaseURL}/getBranchItemsA`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { storeId },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(
        Buffer.from(response.data).toString('utf-8'),
      );

    if (responseData?.data?.Items) {
      // Iterate over the Items array if you need to log or process individual items
      responseData.data.Items.forEach((item: any, index: number) => {
        this.logger.log(`Branch Item ${index}: ${JSON.stringify(item, null, 2)}`);
      });
        return responseData.data;
      } else {
        this.logger.warn('No branch items were found in the response.');
        return [];
      }
    } catch (error: any) {
      this.logger.error(
        `Error fetching branch items: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getAllBranchPromos(storeId: string): Promise<any[]> {
    const url = `${this.ContentBaseURL}/getPromosA`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { storeId },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(
        Buffer.from(response.data).toString('utf-8'),
      );

      if (responseData?.data) {
        // responseData.data.Items.forEach((item: any, index: number) => {
        //   console.log(`Branch Item ${index}:`, JSON.stringify(item, null, 2));
        // });
        return responseData.data;
      } else {
        this.logger.warn('No branch promos were found in the response.');
        return [];
      }
    } catch (error: any) {
      this.logger.error(
        `Error fetching branch promos: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUpdatedItems(lastUpdateTime: string, StoreID: string): Promise<any> {
    const url = `${this.ContentBaseURL}/getUpdatedItemsA`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { dt: lastUpdateTime, StoreID },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(
        Buffer.from(response.data).toString('utf-8'),
      );
      if (responseData?.data?.Items) {
        responseData.data.Items.forEach((item: any, index: number) => {
          this.logger.log(`Item ${index}:  ` + JSON.stringify(item, null, 2));
        });
        return responseData.data.Items;
      } else {
        this.logger.warn('No Items were found in the response.');
        return [];
      }
    } catch (error: any) {
      this.logger.error(
        `Error fetching updated Items: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getUpdatedPromos(
    lastUpdateTime: string,
    StoreID: string,
  ): Promise<any> {
    const url = `${this.ContentBaseURL}/getUpdatedPromosA`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { dt: lastUpdateTime, StoreID },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(
        Buffer.from(response.data).toString('utf-8'),
      );
      // Log each item in the Items array
      if (responseData?.data?.Items) {
        responseData.data.Items.forEach((item: any, index: number) => {
          this.logger.log(`Item ${index}: ` + JSON.stringify(item, null, 2));
        });
        return responseData.data;
      } else {
        this.logger.warn('No Promos were found in the response.');
      }
    } catch (error: any) {
      this.logger.error(
        `Error fetching Updated Promos: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async getItemSign(itemid: string, size: string): Promise<Buffer> {
    const url = `${this.MediaBaseURL}/getItemsign?itemid=${itemid}&StoreID=${this.storeId}&size=${size}`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
        }),
      );
      this.logger.log(`Sign fetched for item with barcode: ${itemid}`);
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Error fetching sign for barcode ${itemid}:`,
        error.stack,
      );
      throw new Error(`Failed to fetch sign for ${itemid}`);
    }
  }

  async getPromoSign(promoNum: string, size: string): Promise<Buffer> {
    const url = `${this.MediaBaseURL}/getPromoSignA?StoreID=${this.storeId}&promonum=${promoNum}&size=${size}&`;
    this.logger.log(`Attempting to fetch promo sign from: ${url}`);
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
        }),
      );
      this.logger.log(`Sign fetched for promo with barcode: ${promoNum}`);
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Error fetching promo sign for promonum ${promoNum}: ${error.message}`,
        error.stack,
      );
      throw new Error(`Failed to fetch sign for ${promoNum}`);
    }
  }

  async getSign(
    itemid: string,
    size: string,
    country?: string,
  ): Promise<Buffer> {
    const url = `${this.MediaBaseURL}/getsignA?StoreID=${this.storeId}&itemid=${itemid}&size=${size}${country ? `&country=${country}` : ''}`;
    this.logger.log(`Attempting to fetch sign from: ${url}`);

    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          responseType: 'arraybuffer',
        }),
      );
      this.logger.log(`Sign fetched for dinamic label with barcode: ${itemid}`);
      return Buffer.from(response.data);
    } catch (error) {
      this.logger.error(
        `Error fetching sign for barcode ${itemid}:`,
        error.stack,
      );
      throw new Error(`Failed to fetch sign for ${itemid}`);
    }
  }
}
