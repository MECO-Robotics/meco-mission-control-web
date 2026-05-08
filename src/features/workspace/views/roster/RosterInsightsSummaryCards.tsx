interface RosterInsightsSummaryCard {
  id: string;
  label: string;
  value: string;
}

export function RosterInsightsSummaryCards({ cards }: { cards: RosterInsightsSummaryCard[] }) {
  return (
    <div className="mc-roster-summary-grid">
      {cards.map((card) => (
        <article className="mc-roster-summary-card" key={card.id}>
          <small>{card.label}</small>
          <strong>{card.value}</strong>
        </article>
      ))}
    </div>
  );
}
