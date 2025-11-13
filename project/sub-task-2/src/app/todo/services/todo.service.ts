import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, map, Observable } from 'rxjs';
import { ITodo } from '../models/todo.interface';
import { TodoBaseService } from './todo-base.service'; // adjust path if needed

@Injectable({
    providedIn: 'root',
})
export class TodoService extends TodoBaseService {
    private readonly apiUrl = 'https://jsonplaceholder.typicode.com/todos?_limit=20';

    private readonly todosSubject = new BehaviorSubject<ITodo[]>([]);
    readonly todos$ = this.todosSubject.asObservable();

    constructor(private http: HttpClient) {
        super();
    }

      getTodos(): Observable<ITodo[]> {
    const start = new Date(2024, 0, 1); // 1/1/2024
    const end = new Date(2024, 6, 1);   // 7/1/2024

    return this.http.get<any[]>(this.apiUrl).pipe(
        map((items) =>
            items.map(
                (item) =>
                    ({
                        id: item.id,
                        title: item.title,
                        completed: item.completed,
                        description: item.title,
                        creationDate: this.randomDate(start, end),
                    } as ITodo)
            )
        )
    );
  }

    /** Public API to fetch from backend and populate store */
    loadTodos(): Observable<ITodo[]> {
        const start = new Date(2024, 0, 1); // Jan 1, 2024
        const end = new Date(2024, 6, 1); // Jul 1, 2024

        return this.http.get<any[]>(this.apiUrl).pipe(
            map((items) =>
                items.map(
                    (item) =>
                        ({
                            id: item.id,
                            title: item.title,
                            completed: item.completed,
                            description: item.title,
                            creationDate: this.randomDate(start, end),
                        } as ITodo)
                )
            ),
            map((todos) => {
                this.setTodos(todos);
                return todos;
            })
        );
    }

    // --------- Abstract methods implementation ---------

    override setTodos(todos: ITodo[]): void {
        this.todosSubject.next([...todos]);
    }

    override addTodo(todo: ITodo): void {
        const current = this.todosSubject.value;
        this.todosSubject.next([...current, todo]);
    }

    override deleteTodo(id: number): void {
        const current = this.todosSubject.value;
        this.todosSubject.next(current.filter((t) => t.id !== id));
    }

    override updateTodo(todo: ITodo): void {
        const current = this.todosSubject.value;
        this.todosSubject.next(current.map((t) => (t.id === todo.id ? { ...t, ...todo } : t)));
    }

    // --------- Helpers ---------

   private  randomDate(start: Date, end: Date): Date {
        const startMs = start.getTime();
        const endMs = end.getTime();
        const randomMs = startMs + Math.random() * (endMs - startMs);
        return new Date(randomMs);
    }
}
