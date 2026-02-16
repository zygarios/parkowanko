import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'computedFunc',
})
export class ComputedFuncPipe implements PipeTransform {
  transform(functionToCompute: (...args: any[]) => any, ...args: any[]): (...args: any[]) => any {
    return functionToCompute(...args);
  }
}
