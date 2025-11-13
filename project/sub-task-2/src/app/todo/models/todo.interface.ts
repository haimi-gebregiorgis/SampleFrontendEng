import { ITodoBase } from './todo-base.interface';


export interface ITodo extends ITodoBase {
  description: string;
  creationDate: Date;
}
