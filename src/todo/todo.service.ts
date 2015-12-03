import * as uuid from 'uuid';
import * as Promise from 'bluebird';
import * as model from './todo.model';
import * as persistence from './todo.persistence';
import * as persistenceLs from './todo.persistence-ls';

import { Todo } from './todo.interface';

const defaultTodos: Todo[] = [
    {id: uuid.v4(), description: 'Explore todo example', done: true},
    {id: uuid.v4(), description: 'Sing in to persist todos to backend', done: false},
    {id: uuid.v4(), description: 'Check sources on Github', done: false}
];

let isAuthenticated = false;

export function init(isAuth) {
    isAuthenticated = isAuth;
    if (isAuthenticated) {
        persistence.findAll()
            .then(_sortTodosByCreatedAt)
            .then(model.setTodos);
    } else {
        let todosLs = persistenceLs.getTodos();
        model.setTodos(todosLs.length ? todosLs : defaultTodos);
    }
}

export function createTodo(description: string) {
    let todo: Todo = {
        id: uuid.v4(),
        description: description,
        done: false
    };

    if (isAuthenticated) {
        persistence.create(todo)
            .then(persistence.findAll)
            .then(_sortTodosByCreatedAt)
            .then(model.setTodos);
    } else {
        model.addTodo(todo);
        persistenceLs.setTodos(model.getTodos());
    }
}

export function toggleTodo(id: string) {
    let todo = model.getTodo(id);
    todo.done = !todo.done;

    if (isAuthenticated) {
        persistence.update(todo)
            .then(persistence.findAll)
            .then(_sortTodosByCreatedAt)
            .then(model.setTodos);
    } else {
        model.replaceTodo(todo);
        persistenceLs.setTodos(model.getTodos());
    }
}

export function editTodo(id: string, description: string) {
    let todo = model.getTodo(id);
    todo.description = description;

    if (isAuthenticated) {
        persistence.update(todo)
            .then(persistence.findAll)
            .then(_sortTodosByCreatedAt)
            .then(model.setTodos);
    } else {
        model.replaceTodo(todo);
        persistenceLs.setTodos(model.getTodos());
    }
}

export function removeTodo(id: string) {
    if (isAuthenticated) {
        persistence.remove(id)
            .then(persistence.findAll)
            .then(_sortTodosByCreatedAt)
            .then(model.setTodos);
    } else {
        model.removeTodo(id);
        persistenceLs.setTodos(model.getTodos());
    }
}

export function removeDoneTodos() {
    let todos = model.getTodos();
    if (isAuthenticated) {
        let promises = [];
        _.forEach(todos, t => t.done ? promises.push(persistence.remove(t.id)) : undefined);
        Promise.all(promises)
            .then(persistence.findAll)
            .then(_sortTodosByCreatedAt)
            .then(model.setTodos);
    } else {
        _.forEach(todos, t => t.done ? model.removeTodo(t.id) : undefined);
        persistenceLs.setTodos(model.getTodos());
    }
}


function _sortTodosByCreatedAt(todos) {
    return todos.sort((a, b) => {
        if (a.createdAt > b.createdAt) {
            return 1;
        }
        if (a.createdAt < b.createdAt) {
            return -1;
        }
        return 0;
    });
}