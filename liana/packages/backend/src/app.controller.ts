import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  health() {
    return {
      service: 'liana-backend',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
