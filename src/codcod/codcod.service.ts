import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { Observable } from 'rxjs';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';

@Injectable()
export class CodcodService {
  private readonly logger = new Logger(CodcodService.name);
  private readonly baseURL: string;

  constructor(private readonly httpService: HttpService) {
    this.baseURL = process.env.CODCOD_API_URL;
  }

  async getUpdatedItems(lastUpdateTime: string, storeId: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/getUpdatedItems`;
    return this.httpService.get(url, {
      params: {
        dt: lastUpdateTime,
        storeId,
      },
    }).toPromise();
  }

  async getUpdatedPromos(lastUpdateTime: string, storeId: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/getUpdatedPromos`;
    return this.httpService.get(url, {
      params: {
        dt: lastUpdateTime,
        storeId,
      },
    }).toPromise();
  }

  async getBranchItems(storeId: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/getBranchItems`;
    return this.httpService.get(url, {
      params: { storeId },
    }).toPromise();
  }

  async getItemSign(itemId: string, size: string, storeId: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/getItemSign`;
    return this.httpService.get(url, {
      params: {
        itemId,
        size,
        storeId,
      },
      responseType: 'arraybuffer',
    }).toPromise();
  }

  async getPromoSign(promoNum: string, size: string, storeId: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/getPromoSign`;
    return this.httpService.get(url, {
      params: {
        promoNum,
        size,
        storeId,
      },
      responseType: 'arraybuffer',
    }).toPromise();
  }

  async getSign(itemId: string, size: string, storeId: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/getSign`;
    return this.httpService.get(url, {
      params: {
        itemId,
        size,
        storeId,
      },
      responseType: 'arraybuffer',
    }).toPromise();
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
      const checkResponse = await this.getSign(itemId, size, storeId);
      image = Buffer.from(checkResponse.data);
    }

    return image;
  }
}
