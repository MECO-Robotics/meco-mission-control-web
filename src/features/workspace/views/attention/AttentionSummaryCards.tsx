import type { AttentionSummaryCard } from "./attentionViewModel";

interface AttentionSummaryCardsProps {
  cards: AttentionSummaryCard[];
}

export function AttentionSummaryCards({ cards }: AttentionSummaryCardsProps) {
  return (
    <div className="attention-summary-grid">
      {cards.map((card) => (
        <article className="attention-summary-card" key={card.id}>
          <strong>{card.value}</strong>
          <small>{card.label}</small>
        </article>
      ))}
    </div>
  );
}
