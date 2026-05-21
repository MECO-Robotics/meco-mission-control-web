import type { PartMappingsSummaryCard } from "./partMappingsViewModel";

interface PartMappingsSummaryProps {
  cards: PartMappingsSummaryCard[];
}

export function PartMappingsSummary({ cards }: PartMappingsSummaryProps) {
  return (
    <div className="part-mappings-summary-grid">
      {cards.map((card) => (
        <article className="part-mappings-summary-card" key={card.id}>
          <strong>{card.value}</strong>
          <small>{card.label}</small>
        </article>
      ))}
    </div>
  );
}
