import { Controller, Get, Type } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SportDeskService } from './sport-desk.service';

export function createSportDeskController(slug: string, path = slug): Type<unknown> {
  @ApiTags(slug)
  @Controller({ path, version: '1' })
  class GeneratedSportDeskController {
    constructor(private readonly desk: SportDeskService) {}

    @Get()
    overview() {
      return this.desk.overview(slug);
    }

    @Get('competitions')
    competitions() {
      return this.desk.competitions(slug);
    }

    @Get('events')
    events() {
      return this.desk.events(slug);
    }
  }

  Object.defineProperty(GeneratedSportDeskController, 'name', {
    value: `${slug.replace(/[^a-zA-Z0-9]+/g, '')}DeskController`,
  });

  return GeneratedSportDeskController;
}
