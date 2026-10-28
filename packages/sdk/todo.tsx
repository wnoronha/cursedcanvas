import { useState, type CSSProperties, type JSX } from "react";
import { useHostTheme } from "./hooks";
import { CanvasChevron, Card, CardBody, CardHeader } from "./ui";
import { mergeStyle } from "./style";

export type TodoStatus = "pending" | "in_progress" | "completed" | "cancelled";

export interface TodoItem {
  readonly id: string;
  readonly content: string;
  readonly status: TodoStatus;
}

export type TodoListProps = {
  todos: readonly TodoItem[];
  dimmedTodoIds?: ReadonlySet<string>;
  onTodoClick?: (todo: TodoItem) => void;
  style?: CSSProperties;
};

const statusGlyph: Record<TodoStatus, string> = {
  pending: "○",
  in_progress: "◐",
  completed: "●",
  cancelled: "◌",
};

export function TodoList({
  todos,
  dimmedTodoIds,
  onTodoClick,
  style,
}: TodoListProps): JSX.Element | null {
  const theme = useHostTheme();
  if (todos.length === 0) return null;
  return (
    <div style={mergeStyle({ display: "flex", flexDirection: "column" }, style)}>
      {todos.map((todo) => {
        const dimmed = dimmedTodoIds?.has(todo.id);
        return (
          <button
            key={todo.id}
            type="button"
            onClick={() => onTodoClick?.(todo)}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: 8,
              padding: "6px 4px",
              border: "none",
              background: "transparent",
              textAlign: "left",
              cursor: onTodoClick ? "pointer" : "default",
              opacity: dimmed ? 0.45 : 1,
              color: theme.text.primary,
              fontSize: 13,
              lineHeight: "18px",
            }}
          >
            <span style={{ color: theme.text.tertiary, width: 14 }}>
              {statusGlyph[todo.status]}
            </span>
            <span
              style={{
                textDecoration:
                  todo.status === "cancelled" || todo.status === "completed"
                    ? "line-through"
                    : undefined,
                color:
                  todo.status === "completed" || todo.status === "cancelled"
                    ? theme.text.tertiary
                    : theme.text.primary,
              }}
            >
              {todo.content}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type TodoListCardProps = {
  todos: readonly TodoItem[];
  dimmedTodoIds?: ReadonlySet<string>;
  defaultExpanded?: boolean;
  onTodoClick?: (todo: TodoItem) => void;
  style?: CSSProperties;
};

export function TodoListCard({
  todos,
  dimmedTodoIds,
  defaultExpanded = false,
  onTodoClick,
  style,
}: TodoListCardProps): JSX.Element | null {
  const [open, setOpen] = useState(defaultExpanded);
  if (todos.length === 0) return null;
  const done = todos.filter((t) => t.status === "completed").length;
  return (
    <Card style={style}>
      <CardHeader
        trailing={
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {done} of {todos.length} Done
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => {
                e.stopPropagation();
                setOpen((v) => !v);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setOpen((v) => !v);
                }
              }}
            >
              <CanvasChevron expanded={open} />
            </span>
          </span>
        }
      >
        Todos
      </CardHeader>
      {open ? (
        <CardBody style={{ padding: "4px 8px" }}>
          <TodoList todos={todos} dimmedTodoIds={dimmedTodoIds} onTodoClick={onTodoClick} />
        </CardBody>
      ) : null}
    </Card>
  );
}
