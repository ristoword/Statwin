import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { LiveService } from './live.service';

@ApiTags('live')
@Controller({ path: 'live', version: '1' })
export class LiveController {
  constructor(private readonly live: LiveService) {}

  @Get()
  @ApiOperation({
    summary: 'Upcoming/live matches with official watch destinations only',
    description:
      'Returns legal official listings (league sites and publicly listed licensed broadcasters). Never unofficial streams.',
  })
  list(@Query('competition') competition?: string, @Query('country') country?: string) {
    return this.live.list({ competition, country });
  }

  @Get('matches/:id')
  @ApiOperation({ summary: 'Official watch listings for one match' })
  async one(@Param('id') id: string) {
    return this.live.forMatch(id);
  }
}
