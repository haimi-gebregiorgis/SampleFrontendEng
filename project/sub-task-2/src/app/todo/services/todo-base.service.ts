import { ITodo } from '../models/todo.interface';

export abstract class TodoBaseService {
    
    abstract setTodos(todos: ITodo[]): void;

    abstract addTodo(todo: ITodo): void;

    abstract deleteTodo(id: number): void;

    abstract updateTodo(todo: ITodo): void;

}

