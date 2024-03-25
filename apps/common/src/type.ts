import { ApiProperty } from '@nestjs/swagger';

export type BufferType = 'file' | 'image';

export class Pagination {
  @ApiProperty({ example: 1 })
  totalDocs: number;

  @ApiProperty({ example: 15 })
  limit: number;

  @ApiProperty({ example: 1 })
  totalPages: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 1 })
  pagingCounter: number;

  @ApiProperty({ example: false })
  hasPrevPage: boolean;

  @ApiProperty({ example: true })
  hasNextPage: boolean;

  @ApiProperty({ example: null })
  prevPage: number | null;

  @ApiProperty({ example: 2 })
  nextPage: number | null;
}
