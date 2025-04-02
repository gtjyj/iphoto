import { IFile } from 'src/types/IFile';

export interface FileAccessInterface {
  getFile(key: string): Promise<IFile>;

  deleteFile(key: string): Promise<boolean>;

  saveFile(key: string, body: Buffer): Promise<boolean>;
}
