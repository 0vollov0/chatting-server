import { Body, Controller, Post, UseInterceptors } from '@nestjs/common';
import { FileService } from './file.service';
import { CreateFileDto } from './dto/create-file.dto';
import { UploadInterceptor } from './interceptors/upload.interceptor';

@Controller()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Post('file')
  @UseInterceptors(UploadInterceptor)
  createFile(@Body() dto: CreateFileDto) {
    return this.fileService.createFile(dto);
  }
}
