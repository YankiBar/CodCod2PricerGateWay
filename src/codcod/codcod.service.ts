import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class CodcodService {
  private readonly logger = new Logger(CodcodService.name);
  private readonly ContentBaseURL: string;
  private readonly MediaBaseURL: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.ContentBaseURL = this.configService.get<string>('CODCOD_CONTENT_URL');
    this.MediaBaseURL = this.configService.get<string>('CODCOD_MEDIA_URL');
  }

  async getUpdatedItems(lastUpdateTime: string, storeId: string): Promise<any> {
    const url = `${this.ContentBaseURL}/getUpdatedItems`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { dt: lastUpdateTime, storeId },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(
        Buffer.from(response.data).toString('utf-8'),
      );
      if (responseData?.data?.Items) {
        responseData.data.Items.forEach((item: any, index: number) => {
          console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
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
    storeId: string,
  ): Promise<any> {
    const url = `${this.ContentBaseURL}/getUpdatedPromos`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { dt: lastUpdateTime, storeId },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(
        Buffer.from(response.data).toString('utf-8'),
      );
      // Log each item in the Items array
      if (responseData?.data?.Items) {
        responseData.data.Items.forEach((item: any, index: number) => {
          console.log(`Item ${index}:`, JSON.stringify(item, null, 2));
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

  async getItemSign(
    itemId: string,
    size: string,
    storeId: string,
  ): Promise<any> {
    const url = `${this.MediaBaseURL}/getItemSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { itemId, size, storeId },
          responseType: 'arraybuffer',
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPromoSign(
    promoNum: string,
    size: string,
    storeId: string,
  ): Promise<any> {
    const url = `${this.MediaBaseURL}/getPromoSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { promoNum, size, storeId },
          responseType: 'arraybuffer',
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSign(itemId: string, size: string, storeId: string): Promise<any> {
    const url = `${this.MediaBaseURL}/getSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { itemId, size, storeId },
          responseType: 'arraybuffer',
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  async fetchImage(
    itemId: string,
    size: string,
    storeId: string,
  ): Promise<Buffer> {
    let image: Buffer;

    if (itemId.startsWith('I')) {
      const response = await this.getItemSign(`${'I'}itemId`, size, storeId);
      image = Buffer.from(response.data);
    } else if (itemId.startsWith('P')) {
      const response = await this.getPromoSign(`${'P'}itemId`, size, storeId);
      image = Buffer.from(response.data);
    } else {
      const response = await this.getSign(itemId, size, storeId);
      image = Buffer.from(response.data);
    }

    return image;
  }

  async fetchItemImage(
    itemId: string,
    size: string,
    storeId: string,
  ): Promise<Buffer> {
    let image: Buffer;

    const response = await this.getItemSign(itemId, size, storeId);
    image = Buffer.from(response.data);

    return image;
  }
}
