import type { CSSProperties, ReactNode } from "react";

export interface KanbanColumnDefinition<TState extends string> {
  state: TState;
  header: ReactNode;
  count: number;
}

interface KanbanColumnsProps<TState extends string, TItem> {
  boardClassName: string;
  columnBodyClassName: string;
  columnClassName: string;
  columnEmptyClassName: string;
  columnHeaderClassName: string;
  columnCountClassName: string;
  columns: readonly KanbanColumnDefinition<TState>[];
  emptyLabel: string;
  itemsByState: Record<TState, readonly TItem[]>;
  renderItem: (item: TItem, state: TState) => ReactNode;
  onColumnBodyClick?: (state: TState) => void;
  style?: CSSProperties;
}

export function KanbanColumns<TState extends string, TItem>({
  boardClassName,
  columnBodyClassName,
  columnClassName,
  columnEmptyClassName,
  columnHeaderClassName,
  columnCountClassName,
  columns,
  emptyLabel,
  itemsByState,
  renderItem,
  onColumnBodyClick,
  style,
}: KanbanColumnsProps<TState, TItem>) {
  return (
    <div className={boardClassName} style={style}>
      {columns.map((column) => {
        const items = itemsByState[column.state];

        return (
          <section
            className={columnClassName}
            key={column.state}
            onClick={onColumnBodyClick ? () => onColumnBodyClick(column.state) : undefined}
            onKeyDown={
              onColumnBodyClick
                ? (milestone) => {
                    if (milestone.key !== "Enter" && milestone.key !== " ") {
                      return;
                    }

                    milestone.preventDefault();
                    onColumnBodyClick(column.state);
                  }
                : undefined
            }
            role={onColumnBodyClick ? "button" : undefined}
            tabIndex={onColumnBodyClick ? 0 : undefined}
          >
            <div className={columnHeaderClassName}>
              {column.header}
              <span className={columnCountClassName}>{column.count}</span>
            </div>
            <div className={columnBodyClassName}>
              {items.length > 0 ? (
                items.map((item) => renderItem(item, column.state))
              ) : (
                <p className={columnEmptyClassName}>{emptyLabel}</p>
              )}
            </div>
          </section>
        );
      })}
    </div>
  );
}

