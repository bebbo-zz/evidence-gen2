import { ModelInit, MutableModel, PersistentModelConstructor } from "@aws-amplify/datastore";
import { initSchema } from "@aws-amplify/datastore";

import { schema } from "./schema";



type EagerTodoModel = {
  readonly [__modelMeta__]: {
    identifier: OptionallyManagedIdentifier<Todo, 'id'>;
  };
  readonly id: string;
  readonly content?: string | null;
  readonly isDone?: boolean | null;
  readonly owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

type LazyTodoModel = {
  readonly [__modelMeta__]: {
    identifier: OptionallyManagedIdentifier<Todo, 'id'>;
  };
  readonly id: string;
  readonly content?: string | null;
  readonly isDone?: boolean | null;
  readonly owner?: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export declare type TodoModel = LazyLoading extends LazyLoadingDisabled ? EagerTodoModel : LazyTodoModel

export declare const TodoModel: (new (init: ModelInit<TodoModel>) => TodoModel) & {
  copyOf(source: TodoModel, mutator: (draft: MutableModel<TodoModel>) => MutableModel<TodoModel> | void): TodoModel;
}



const { Todo } = initSchema(schema) as {
  Todo: PersistentModelConstructor<TodoModel>;
};

export {
  Todo
};