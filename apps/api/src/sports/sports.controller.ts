import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SportsService } from './sports.service';

@ApiTags('sports')
@Controller({ path: 'sports', version: '1' })
export class SportsController {
  constructor(private readonly sports: SportsService) {}

  @Get()
  list() {
    return this.sports.list();
  }
}
