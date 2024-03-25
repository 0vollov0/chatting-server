import { Injectable } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, Max, Min } from 'class-validator';
import { PipelineStage } from 'mongoose';

export class FindPaginationDto {
  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  @Min(1)
  @Type(() => Number)
  page: number;

  @ApiProperty({ type: Number, required: true })
  @IsNumber()
  @Min(1)
  @Max(20)
  @Type(() => Number)
  limit: number;
}

@Injectable()
export class DatabasesService {
  pagination({ limit, page }: FindPaginationDto): PipelineStage[] {
    return [
      {
        $group: {
          _id: null,
          docs: { $push: '$$ROOT' },
        },
      },
      {
        $project: {
          _id: 0,
          docs: { $slice: ['$docs', (page - 1) * limit, limit] },
          totalDocs: { $size: '$docs' },
          totalPages: {
            $sum: [
              {
                $toInt: {
                  $floor: {
                    $divide: [{ $subtract: [{ $size: '$docs' }, 1] }, limit],
                  },
                },
              },
              1,
            ],
          },
          page: { $toInt: page },
          limit: { $toInt: limit },
          pagingCounter: { $toInt: (page - 1) * limit + 1 },
        },
      },
      {
        $addFields: {
          prevPage: {
            $cond: {
              if: { $gt: ['$page', 1] },
              then: page - 1,
              else: null,
            },
          },
          nextPage: {
            $cond: {
              if: { $lt: ['$page', '$totalPages'] },
              then: page + 1,
              else: null,
            },
          },
        },
      },
      {
        $addFields: {
          hasPrevPage: {
            $cond: {
              if: { $eq: ['$prevPage', null] },
              then: false,
              else: true,
            },
          },
          hasNextPage: {
            $cond: {
              if: { $eq: ['$nextPage', null] },
              then: false,
              else: true,
            },
          },
        },
      },
    ];
  }
}
