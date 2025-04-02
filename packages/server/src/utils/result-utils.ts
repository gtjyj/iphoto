import { ResponseDto } from '../modules/photo/dto/response.dto';

export class ResultUtils {
  /**
   * 创建一个成功响应对象
   * @param data 响应数据
   * @param msg 响应消息，默认为 '成功'
   * @returns 成功响应对象
   */
  static success<T>(data?: T, msg = '成功'): ResponseDto<T> {
    return {
      code: 0,
      msg,
      data,
    };
  }

  /**
   * 创建一个失败响应对象
   * @param msg 响应消息，默认为 '失败'
   * @param code 响应状态码，默认为 500
   * @returns 失败响应对象
   */
  static fail<T = null>(msg = '失败', code = 1000): ResponseDto<T> {
    return {
      code,
      msg,
      data: null as T,
    };
  }
}
