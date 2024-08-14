import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { json } from 'stream/consumers';

@Injectable()
export class CodcodService {
  private readonly logger = new Logger(CodcodService.name);
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
    const url = `${this.ContentBaseURL}/getBranchItems`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { storeId },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(Buffer.from(response.data).toString('utf-8'));

      if (responseData?.data?.Items) {
        responseData.data.Items.forEach((item: any, index: number) => {
          console.log(`Branch Item ${index}:`, JSON.stringify(item, null, 2));
        });
        return responseData.data.Items;
      } else {
        this.logger.warn('No branch items were found in the response.');
        return [];
      }
    } catch (error: any) {
      this.logger.error(`Error fetching branch items: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getAllBranchPromos(storeId: string): Promise<any[]> {
    const url = `${this.ContentBaseURL}/getPromos`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { storeId },
          responseType: 'arraybuffer',
        }),
      );
      const responseData = JSON.parse(Buffer.from(response.data).toString('utf-8'));

      if (responseData?.data?.Items) {
        responseData.data.Items.forEach((item: any, index: number) => {
          console.log(`Branch Item ${index}:`, JSON.stringify(item, null, 2));
        });
        return responseData.data.Items;
      } else {
        this.logger.warn('No branch promos were found in the response.');
        return [];
      }
    } catch (error: any) {
      this.logger.error(`Error fetching branch promos: ${error.message}`, error.stack);
      throw error;
    }
  }



  async getUpdatedItems(lastUpdateTime: string, StoreID: string): Promise<any> {
    const url = `${this.ContentBaseURL}/getUpdatedItems`;
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
    StoreID: string,
  ): Promise<any> {
    const url = `${this.ContentBaseURL}/getUpdatedPromos`;
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
    itemid: string,
    size: string,
    StoreID: string,
  ): Promise<any> {
    const url = `${this.MediaBaseURL}/getItemSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { itemid, size, StoreID },
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
    StoreID: string,
  ): Promise<any> {
    const url = `${this.MediaBaseURL}/getPromoSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { promoNum, size, StoreID },
          responseType: 'arraybuffer',
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSign(itemid: string, size: string, StoreID: string): Promise<any> {
    const url = `${this.MediaBaseURL}/getSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { itemid, size, StoreID },
          responseType: 'arraybuffer',
        }),
      );
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  // async fetchImage(
  //   itemid: number,
  //   size: string,
  //   StoreID: number,
  // ): Promise<Buffer> {
  //   let image: Buffer;

  //   if (itemid.startsWith('I')) {
  //     const response = await this.getItemSign(`${'I'}itemid`, size, StoreID);
  //     image = Buffer.from(response.data);
  //   } else if (itemid.startsWith('P')) {
  //     const response = await this.getPromoSign(`${'P'}itemid`, size, StoreID);
  //     image = Buffer.from(response.data);
  //   } else {
  //     const response = await this.getSign(itemid, size, StoreID);
  //     image = Buffer.from(response.data);
  //   }

  //   return image;
  // }

async fetchItemImage(
  itemid: string,
  size: string,
  StoreID: string,
): Promise<Buffer> {
  try {
    const response = await this.getItemSign(itemid, size, StoreID);

    if (!response) {
      this.logger.warn(`No data received for itemId: ${itemid}`);
      throw new Error(`Failed to fetch image data for ${itemid}`);
    } else if (!response.data) {
      this.logger.warn(`There is No response.data received for itemId: ${itemid}`);
      throw new Error(`Failed to fetch response.data for ${itemid}`);
    }

    // The response should already be a Buffer if it's an array buffer
    const imageBuffer = Buffer.from(response.data);
    console.log(JSON.stringify(imageBuffer));

    // Log the buffer length for debugging
    this.logger.log(`Image for item ID ${itemid} received, size: ${imageBuffer.length} bytes`);

    return imageBuffer;
  } catch (error) {
    this.logger.error(`Error fetching image for barcode: ${itemid}`, error.stack);
    throw error;
  }
}

async downloadImageFromService(barcode: string, size: string): Promise<Buffer> {
  try {
    const imageUrl = `${this.MediaBaseURL}/getsign?StoreID=${this.storeId}&itemid=${barcode}&size=${size}`;
    const response = await lastValueFrom(this.httpService.get(imageUrl, {
      responseType: 'arraybuffer',
    }));
    this.logger.log(`Image downloaded for barcode: ${barcode}`);
    return Buffer.from(response.data);
  } catch (error) {
    this.logger.error(`Error downloading image for barcode ${barcode}:`, error.stack);
    throw new Error(`Failed to download image for ${barcode}`);
  }
}
}
  

