interface LODOP_Object {
  GET_PRINTER_COUNT(): number
  GET_PRINTER_NAME(index: number): string
  PRINT_INIT(title: string): void
  SET_PRINTER_INDEX(index: number): void
  SET_PRINT_PAGESIZE(
    orientation: number,
    width: number,
    height: number,
    pageName: string,
  ): void
  ADD_PRINT_TEXT(
    top: number,
    left: number,
    width: number,
    height: number,
    content: string,
  ): void
  SET_PRINT_STYLEA(type: number, name: string, value: number | string): void
  ADD_PRINT_LINE(
    top1: number,
    left1: number,
    top2: number,
    left2: number,
    width: number,
    height: number,
  ): void
  PRINT(): void
}

declare interface Window {
  CLODOP: {
    GET_LODOP(): LODOP_Object
  }
  LODOP: LODOP_Object
}
