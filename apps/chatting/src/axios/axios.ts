import { HttpStatus } from '@nestjs/common';
import { UploadedChatFile } from 'apps/common/src/schemas/chat.schema';
import axios from 'axios';

type UploadFileDto = {
  roomId: string;
  buffer: Buffer;
  originalname: string;
};

export class Axios {
  private static instance: Axios | null = null;
  private FILE_SERVER_HOST: string;
  private constructor() {
    this.FILE_SERVER_HOST = process.env.FILE_SERVER_HOST;
  }

  public static getInstance(): Axios {
    if (!Axios.instance) {
      Axios.instance = new Axios();
    }
    return Axios.instance;
  }

  uploadFile(dto: UploadFileDto) {
    return new Promise<UploadedChatFile>((resolve, reject) => {
      axios
        .post<UploadedChatFile>(`${process.env.FILE_SERVER_HOST}/file`, dto)
        .then(({ status, data }) => {
          if (status === HttpStatus.CREATED) {
            resolve(data);
          } else reject(new Error(''));
        })
        .catch(reject);
    });
  }

  uploadImage() {}
}
