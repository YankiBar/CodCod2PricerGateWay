import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosResponse } from 'axios';
import * as FormData from 'form-data';
import { ReadStream } from 'fs';


@Injectable()
export class PricerService {
  private readonly logger = new Logger(PricerService.name);
  private readonly baseURL: string;
  private readonly username: string;
  private readonly password: string;

  constructor(private readonly httpService: HttpService) {
    this.baseURL = process.env.PRICER_API_URL;
    this.username = process.env.PRICER_USERNAME;
    this.password = process.env.PRICER_PASSWORD;
  }

  async fetchItems(start: number, limit: number, projection: string): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/api/public/core/v1/items`;
    return this.httpService.get(url, {
      params: {
        start,
        limit,
        projection,
      },
    }).toPromise();
  }

  async updateItemImage(itemId: string, pageIndex: number, resize: number, image: Buffer): Promise<AxiosResponse<any>> {
    const url = `${this.baseURL}/api/public/core/v1/items/${itemId}/page/${pageIndex}`;
    const formData = new FormData();
    formData.append('imageFile', image, 'image.png');

    const headers = {
      ...formData.getHeaders(),
      'Authorization': `Basic ${Buffer.from(`${this.username}:${this.password}`).toString('base64')}`,
    };

    return this.httpService.post(url, formData, {
      headers,
      params: {
        resize,
      },
    }).toPromise();
  }
}