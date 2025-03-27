export class ResponseDto<T> {
  code: number;
  msg: string;
  data: T;
}
