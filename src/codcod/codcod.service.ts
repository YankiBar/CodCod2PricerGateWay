import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';


@Injectable()
export class CodcodService {

  private readonly logger = new Logger(CodcodService.name);
  private readonly baseURL: string;

  constructor(private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.baseURL = this.configService.get<string>('CODCOD_API_URL');
    // this.username = this.configService.get<string>('CODCOD_API_USERNAME');
    // this.password = this.configService.get<string>('CODCOD_API_PASSWORD');
  }

  async getUpdatedItems(lastUpdateTime: string, storeId: string): Promise<any> {
    const url = `${this.baseURL}/getUpdatedItems`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { dt: lastUpdateTime, storeId },
          responseType: 'arraybuffer',
        })
      )
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }


  async getUpdatedPromos(lastUpdateTime: string, storeId: string): Promise<any> {
    const url = `${this.baseURL}/getUpdatedPromos`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { dt: lastUpdateTime, storeId },
          responseType: 'arraybuffer',
        })
      )
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }


  async getItemSign(itemId: string, size: string, storeId: string): Promise<any> {
    const url = `${this.baseURL}/getItemSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { itemId, size, storeId },
          responseType: 'arraybuffer',
        })
      )
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getPromoSign(promoNum: string, size: string, storeId: string): Promise<any> {
    const url = `${this.baseURL}/getPromoSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { promoNum, size, storeId },
          responseType: 'arraybuffer',
        })
      )
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }
  

  async getSign(itemId: string, size: string, storeId: string): Promise<any> {
    const url = `${this.baseURL}/getSign`;
    try {
      const response = await firstValueFrom(
        this.httpService.get(url, {
          params: { itemId, size, storeId },
          responseType: 'arraybuffer',
        })
      )
      return response.data;
    } catch (error: any) {
      this.logger.error(`Error fetching sign: ${error.message}`, error.stack);
      throw error;
    }
  }


  async fetchImage(itemId: string, size: string, storeId: string): Promise<Buffer> {
    let image: Buffer;

    if (itemId.startsWith('I')) {
      const response = await this.getItemSign(itemId, size, storeId);
      image = Buffer.from(response.data);
    } else if (itemId.startsWith('P')) {
      const response = await this.getPromoSign(itemId, size, storeId);
      image = Buffer.from(response.data);
    } else {
      const response = await this.getSign(itemId, size, storeId);
      image = Buffer.from(response.data);
    }

    return image;
  }
}
