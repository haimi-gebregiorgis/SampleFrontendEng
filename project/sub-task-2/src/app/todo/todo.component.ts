import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { BehaviorSubject, combineLatest, map, Observable } from 'rxjs';
import { ITodo } from './models/todo.interface';
import { TodoService } from './services/todo.service'; // make sure this exists

type SortKey = 'title' | 'creationDate';
type SortDirection = 'asc' | 'desc';

interface SortState {
    key: SortKey;
    direction: SortDirection;
}

@Component({
    selector: 'app-todo',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FormsModule],
    templateUrl: './todo.component.html',
    styleUrls: ['./todo.component.scss'],
})
export class TodoComponent implements OnInit {
    // filters form 
    filterForm!: FormGroup;

    get fromCtrl(): FormControl {
        return this.filterForm.get('from') as FormControl;
    }

    get toCtrl(): FormControl {
        return this.filterForm.get('to') as FormControl;
    }

    // core state streams 
    private todosSubject = new BehaviorSubject<ITodo[]>([]);
    todos$ = this.todosSubject.asObservable();

    private filterSubject = new BehaviorSubject<{ from: Date | null; to: Date | null }>({
        from: null,
        to: null,
    });

    private sortSubject = new BehaviorSubject<SortState>({
        key: 'creationDate',
        direction: 'asc',
    });

    displayedTodos$: Observable<ITodo[]> = combineLatest([
        this.todos$,
        this.filterSubject,
        this.sortSubject,
    ]).pipe(
        map(([todos, filter, sort]) => {
            let result = [...todos];

            // filter by date
            if (filter.from || filter.to) {
                result = result.filter((t) => {
                    const d = t.creationDate;
                    const afterFrom = filter.from ? d >= filter.from : true;
                    const beforeTo = filter.to ? d <= filter.to : true;
                    return afterFrom && beforeTo;
                });
            }

            // sort
            result.sort((a, b) => {
                let cmp = 0;
                if (sort.key === 'title') {
                    cmp = a.title.localeCompare(b.title);
                } else {
                    cmp = a.creationDate.getTime() - b.creationDate.getTime();
                }
                return sort.direction === 'asc' ? cmp : -cmp;
            });

            return result;
        })
    );

    // selection & UI state 
    selectedIds = new Set<number>();
    allChecked = false;

    isSidebarOpen = false;
    showMobileFilters = false;

    editingTodo: ITodo | null = null;
    editingDescription = '';

    constructor(private todoService: TodoService, private fb: FormBuilder) {}

    ngOnInit(): void {
        // reactive form for filters
        this.filterForm = this.fb.group({
            from: [''],
            to: [''],
        });

        // load todos from service
        this.todoService.getTodos().subscribe((todos) => {
            // ensure creationDate is Date object
            this.todosSubject.next(
                todos.map((t) => ({ ...t, creationDate: new Date(t.creationDate) }))
            );
        });
    }

    // filters 

    applyFilters(): void {
        const raw = this.filterForm.value;
        const from = raw.from ? new Date(raw.from) : null;
        const to = raw.to ? new Date(raw.to) : null;
        this.filterSubject.next({ from, to });
    }

    resetFilters(): void {
        this.filterForm.reset();
        this.filterSubject.next({ from: null, to: null });
    }

    // sorting 

    setSort(key: SortKey): void {
        const current = this.sortSubject.value;
        const direction: SortDirection =
            current.key === key && current.direction === 'asc' ? 'desc' : 'asc';

        this.sortSubject.next({ key, direction });
    }

    isSortedBy(key: SortKey, dir: SortDirection): boolean {
        const s = this.sortSubject.value;
        return s.key === key && s.direction === dir;
    }

    // selection 

    toggleSelect(todo: ITodo, checked: boolean): void {
        if (checked) {
            this.selectedIds.add(todo.id);
        } else {
            this.selectedIds.delete(todo.id);
        }
        this.syncAllChecked();
    }

    toggleSelectAll(checked: boolean): void {
        const todos = this.todosSubject.value;
        this.selectedIds.clear();
        if (checked) {
            todos.forEach((t) => this.selectedIds.add(t.id));
        }
        this.allChecked = checked;
    }

    isSelected(todo: ITodo): boolean {
        return this.selectedIds.has(todo.id);
    }

    private syncAllChecked(): void {
        const todos = this.todosSubject.value;
        this.allChecked = todos.length > 0 && todos.every((t) => this.selectedIds.has(t.id));
    }

    //  sidebar and description update

    openSidebar(todo: ITodo): void {
        this.editingTodo = todo;
        this.editingDescription = todo.description;
        this.isSidebarOpen = true;
    }

    closeSidebar(): void {
        this.isSidebarOpen = false;
        this.editingTodo = null;
    }

    saveDescription(): void {
        if (!this.editingTodo) return;

        const todos = this.todosSubject.value.map((t) =>
            t.id === this.editingTodo!.id
                ? {
                      ...t,
                      description: this.editingDescription,
                      title: this.editingDescription, // <- also update title if you want
                  }
                : t
        );

        this.todosSubject.next(todos);
        this.closeSidebar();
    }

    //    delete

    deleteTodo(todo: ITodo): void {
        const todos = this.todosSubject.value.filter((t) => t.id !== todo.id);
        this.todosSubject.next(todos);
        this.selectedIds.delete(todo.id);
        this.syncAllChecked();
    }

    //    util

    formatDate(date: Date): string {
        const d = new Date(date);
        const mm = String(d.getMonth() + 1).padStart(2, '0');
        const dd = String(d.getDate()).padStart(2, '0');
        const yyyy = d.getFullYear();
        return `${mm}/${dd}/${yyyy}`;
    }
}
