import type { AttentionSummaryGroup } from "./attentionViewModel";

interface AttentionSummaryCardsProps {
  groups: AttentionSummaryGroup[];
  onSelectCard?: (groupId: string) => void;
}

export function AttentionSummaryCards({ groups, onSelectCard }: AttentionSummaryCardsProps) {
  return (
    <div className="attention-summary-groups">
      {groups.map((group) => (
        <section className="attention-summary-group" key={group.id}>
          <h3>{group.label}</h3>
          <div className="attention-summary-grid">
            {group.cards.map((card) => (
              <button
                className="attention-summary-card"
                key={card.id}
                onClick={() => {
                  if (card.targetGroupId) {
                    onSelectCard?.(card.targetGroupId);
                  }
                }}
                type="button"
              >
                <strong>{card.value}</strong>
                <small>{card.label}</small>
                {card.helperLabel ? <span>{card.helperLabel}</span> : null}
              </button>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
