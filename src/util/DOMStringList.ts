export function createDOMStringList(items: string[]): DOMStringList {
  return Object.setPrototypeOf(
    {
      length: items.length,
      item(index: number): string | null {
        if (index !== undefined) {
          return items[index] ?? null;
        } else {
          throw new TypeError(
            "Failed to execute 'item' on 'DOMStringList': 1 argument required, but only 0 present."
          );
        }
      },
      contains(string: string): boolean {
        if (string !== undefined) {
          return items.includes(string);
        } else {
          throw new TypeError(
            "Failed to execute 'contains' on 'DOMStringList': 1 argument required, but only 0 present."
          );
        }
      }
    },
    DOMStringList.prototype
  );
}
