import { Global, Module } from '@nestjs/common';
import { StudentHelpService } from './student-help.service';

@Global()
@Module({
  providers: [StudentHelpService],
  exports: [StudentHelpService],
})
export class StudentHelpModule {}
