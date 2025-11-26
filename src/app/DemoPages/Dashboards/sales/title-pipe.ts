import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'title'
})
export class TitlePipe implements PipeTransform {

  transform(value: string | null | undefined): string {
    if (!value) return '';

    // Convert the input to a string, handle case where it's not already a string
    const strValue = String(value);

    // 1. Convert the whole string to lowercase to ensure consistency
    // 2. Use a regex to find the start of each word (\w is word character, \S is non-whitespace)
    // 3. Replace the first letter of each word with its uppercase version
    return strValue.toLowerCase().split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
