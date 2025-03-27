import { IsOptional, IsPositive, Min } from '@nestjs/class-validator';

// 分页查询参数 DTO
// 可根据需要添加更多参数，例如排序字段等
// 可根据需要添加更多验证规则，例如最大每页数量等
export class PaginationDto {
  @IsOptional()
  @IsPositive()
  @Min(1)
  page = 1;

  @IsOptional()
  @IsPositive()
  @Min(1)
  limit = 10;
}
