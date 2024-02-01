import { Controller, Get } from '@nestjs/common';
import { FileService } from './file.service';

@Controller()
export class FileController {
  constructor(private readonly fileService: FileService) {}

  @Get()
  getHello(): string {
    return this.fileService.getHello();
  }
}
