import {
  cloneElement,
  Fragment,
  isValidElement,
  type CSSProperties,
  type ReactNode,
} from "react";
import { KanbanColumnScrollArea } from "./KanbanColumnScrollArea";
import { KanbanProjectGroup } from "./KanbanProjectGroup";
import { KanbanSwimlane } from "./KanbanSwimlane";

import {
  useKanbanDrag,
  type KanbanItemDragProps,
} from "@/features/workspace/views/kanban/useKanbanDrag";

export interface KanbanColumnDefinition<TState extends string> {
  state: TState;
  header: ReactNode;
  count: number;
}

interface KanbanColumnsProps<TState extends string, TItem> {
  boardClassName: string;
  canDragItem?: (item: TItem, sourceState: TState) => boolean;
  canDropItem?: (item: TItem, targetState: TState, sourceState: TState) => boolean;
  canDropState?: (targetState: TState) => boolean;
  columnBodyClassName: string;
  columnClassName: string;
  columnEmptyClassName: string;
  columnHeaderClassName: string;
  columnCountClassName: string;
  columns: readonly KanbanColumnDefinition<TState>[];
  emptyLabel: string;
  getItemDragLabel?: (item: TItem) => string;
  getItemId?: (item: TItem) => string;
  itemsByState: Record<TState, readonly TItem[]>;
  renderItem: (item: TItem, state: TState, dragProps?: KanbanItemDragProps) => ReactNode;
  onColumnBodyClick?: (state: TState) => void;
  onItemDrop?: (item: TItem, targetState: TState, sourceState: TState) => void | Promise<void>;
  swimlaneGroups?: readonly {
    id: string;
    label: string;
    lanes: readonly {
      id: string;
      header: ReactNode;
      itemsByState: Record<TState, readonly TItem[]>;
    }[];
  }[];
  style?: CSSProperties;
}

export function KanbanColumns<TState extends string, TItem>({
  boardClassName,
  canDragItem,
  canDropItem,
  canDropState,
  columnBodyClassName,
  columnClassName,
  columnEmptyClassName,
  columnHeaderClassName,
  columnCountClassName,
  columns,
  emptyLabel,
  getItemDragLabel,
  getItemId,
  itemsByState,
  renderItem,
  onColumnBodyClick,
  onItemDrop,
  style,
  swimlaneGroups,
}: KanbanColumnsProps<TState, TItem>) {
  const drag = useKanbanDrag({
    canDropItem,
    canDropState,
    columns,
    getItemDragLabel,
    getItemId,
    itemsByState,
    onItemDrop,
  });

  const renderColumn = (
    column: KanbanColumnDefinition<TState>,
    items: readonly TItem[],
    showHeader: boolean,
  ) => {
    const columnDropProps = drag.getColumnDropProps(column.state);

    return (
      <section
        className={`${columnClassName} kanban-status-column`}
        data-kanban-drop-column={drag.dragEnabled ? column.state : undefined}
        key={column.state}
        onClick={onColumnBodyClick ? () => onColumnBodyClick(column.state) : undefined}
        onClickCapture={onColumnBodyClick ? drag.handleSuppressedClick : undefined}
      >
        {showHeader ? <div
          className={columnHeaderClassName}
          onKeyDown={
            onColumnBodyClick
              ? (milestone) => {
                  if (milestone.key !== "Enter" && milestone.key !== " ") return;
                  milestone.preventDefault();
                  onColumnBodyClick(column.state);
                }
              : undefined
          }
          role={onColumnBodyClick ? "button" : undefined}
          tabIndex={onColumnBodyClick ? 0 : undefined}
        >
          {column.header}
          <span className={columnCountClassName}>{column.count}</span>
        </div> : swimlaneGroups ? (
          <span className={`${columnCountClassName} kanban-swimlane-cell-count`}>{items.length}</span>
        ) : null}
        {(!swimlaneGroups || !showHeader) ? <KanbanColumnScrollArea
          className={`${columnBodyClassName}${
            drag.hoveredDropState === column.state ? " is-kanban-drop-target" : ""
          }`}
          dropProps={columnDropProps}
          label={column.state}
        >
          {items.length > 0 ? (
            items.map((item, index) => {
              const itemId = getItemId?.(item);
              if (!drag.dragEnabled || !itemId) {
                const renderedItem = renderItem(item, column.state);
                const itemKey = itemId ?? `${column.state}:${index}`;
                return isValidElement(renderedItem)
                  ? cloneElement(renderedItem, { key: itemKey })
                  : <Fragment key={itemKey}>{renderedItem}</Fragment>;
              }

              const itemDragEnabled = canDragItem
                ? canDragItem(item, column.state)
                : true;
              const dragProps = drag.getItemDragProps(item, column.state, itemDragEnabled);
              const renderedItem = renderItem(item, column.state, dragProps);

              if (
                dragProps &&
                isValidElement<KanbanItemDragProps>(renderedItem) &&
                renderedItem.props["data-kanban-item-id"] === itemId
              ) {
                return cloneElement(renderedItem, { key: itemId });
              }

              return (
                <div key={itemId} {...dragProps}>
                  {renderedItem}
                </div>
              );
            })
          ) : (
            <p className={columnEmptyClassName}>{emptyLabel}</p>
          )}
        </KanbanColumnScrollArea> : null}
      </section>
    );
  };

  return (
    <div className={`${boardClassName}${swimlaneGroups ? " has-swimlanes" : ""}`} style={style}>
      {swimlaneGroups ? (
        <div className="kanban-swimlane-columns kanban-swimlane-statuses">
          {columns.map((column) => renderColumn(column, [], true))}
        </div>
      ) : columns.map((column) => renderColumn(column, itemsByState[column.state], true))}
      {swimlaneGroups?.map((group) => (
        <KanbanProjectGroup key={group.id} label={group.label}>
          {group.lanes.map((lane) => (
            <KanbanSwimlane header={lane.header} key={lane.id}>
              <div className="kanban-swimlane-columns">
                {columns.map((column) => renderColumn(column, lane.itemsByState[column.state], false))}
              </div>
            </KanbanSwimlane>
          ))}
        </KanbanProjectGroup>
      ))}
    </div>
  );
}
