import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'drain'
})
export class DrainPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    return null;
  }

}
