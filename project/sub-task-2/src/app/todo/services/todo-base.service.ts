// import { ITodo } from '../models/todo.interface';

// export abstract class TodoBaseService {
    
//     abstract setTodos(todos: ITodo[]): void;

//     abstract addTodo(todo: ITodo): void;

//     abstract deleteTodo(id: number): void;

//     abstract updateTodo(todo: ITodo): void;

// }
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { ITodo } from '../models/todo.interface';
import { ITodoBase } from '../models/todo-base.interface';

@Injectable({ providedIn: 'root' })
export class TodoService {
    private readonly apiUrl = 'https://jsonplaceholder.typicode.com/todos?_limit=20';

    constructor(private http: HttpClient) {}

    getTodos(): Observable<ITodo[]> {
        const start = new Date(2024, 0, 1); // 1/1/2024
        const end = new Date(2024, 6, 1); // 7/1/2024

        return this.http.get<ITodoBase[]>(this.apiUrl).pipe(
            map((items) =>
                items.map((item) => ({
                    ...item,
                    description: item.title,
                    creationDate: this.randomDate(start, end),
                }))
            )
        );
    }

    private randomDate(start: Date, end: Date): Date {
        const diff = end.getTime() - start.getTime();
        const random = start.getTime() + Math.random() * diff;
        return new Date(random);
    }
}


