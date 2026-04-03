'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { GeneratePanel } from './generate-panel';
import type { GenreSignal } from '@/lib/types';

interface AudienceOption {
  id: string;
  name: string;
  respondent_count: number;
  top_signals: GenreSignal[];
}

interface SavedOutputRow {
  id: string;
  output_type: string;
  audience_id: string;
  title: string;
  rya_score: number | null;
  channel: string | null;
  content: Record<string, unknown>;
  created_at: string;
  audience_name: string;
}

interface ConceptsListProps {
  savedOutputs: SavedOutputRow[];
  audiences: AudienceOption[];
  initialAudienceId?: string;
  initialType?: 'concept' | 'persona';
}

function RYABadge({ score }: { score: number }) {
  const color =
    score <= 3
      ? 'bg-green-500/10 text-green-600 dark:text-green-400'
      : score <= 6
        ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
        : 'bg-red-500/10 text-red-600 dark:text-red-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-5 rounded overflow-hidden flex items-center ${color}`}>
        <div className="flex h-2 w-16 bg-muted rounded-full overflow-hidden mx-1.5">
          <div
            className={`h-full rounded-full ${
              score <= 3 ? 'bg-green-500' : score <= 6 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${(score / 10) * 100}%` }}
          />
        </div>
      </div>
      <span className="text-xs font-mono font-medium">{score}</span>
    </div>
  );
}

export function ConceptsList({
  savedOutputs,
  audiences,
  initialAudienceId,
  initialType,
}: ConceptsListProps) {
  const [panelOpen, setPanelOpen] = useState(
    !!(initialAudienceId || initialType)
  );
  const [filter, setFilter] = useState<'all' | 'campaign_concept' | 'persona'>('all');

  const filtered =
    filter === 'all'
      ? savedOutputs
      : savedOutputs.filter((o) => o.output_type === filter);

  const handleClose = useCallback(() => setPanelOpen(false), []);
  const handleSaved = useCallback(() => {}, []);

  function getExcerpt(row: SavedOutputRow): string {
    const content = row.content;
    if (row.output_type === 'campaign_concept') {
      return truncate((content.concept as string) ?? '', 100);
    }
    return truncate((content.who_they_are as string) ?? '', 100);
  }

  return (
    <div className="flex flex-1 overflow-hidden">
      {/* Main content */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h1 className="text-xl font-semibold">Concepts</h1>
          <button
            onClick={() => setPanelOpen((prev) => !prev)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-opacity ${
              panelOpen
                ? 'border border-border text-muted-foreground hover:bg-muted'
                : 'bg-primary text-primary-foreground hover:opacity-90'
            }`}
          >
            {panelOpen ? 'Close Panel' : '+ Generate \u2726'}
          </button>
        </div>

        {savedOutputs.length > 0 && (
          <div className="flex items-center gap-3 mb-5">
            <span className="text-sm text-muted-foreground">
              {savedOutputs.length} saved output{savedOutputs.length !== 1 ? 's' : ''}
            </span>
            <select
              value={filter}
              onChange={(e) =>
                setFilter(e.target.value as 'all' | 'campaign_concept' | 'persona')
              }
              className="text-xs border border-border rounded px-2 py-1 bg-background text-foreground"
            >
              <option value="all">All types</option>
              <option value="campaign_concept">Campaigns</option>
              <option value="persona">Personas</option>
            </select>
          </div>
        )}

        {/* Card grid or empty state */}
        {filtered.length === 0 && savedOutputs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-4xl mb-4 text-muted-foreground">&#10022;</div>
            <h2 className="text-lg font-semibold mb-2">No concepts yet.</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Select an audience and enter a brief to generate your first concept.
            </p>
            <button
              onClick={() => setPanelOpen(true)}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              + Generate First Concept
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground py-8 text-center">
            No {filter === 'campaign_concept' ? 'campaigns' : 'personas'} found.
          </p>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filtered.map((row) => (
              <Link
                key={row.id}
                href={`/concepts/${row.id}`}
                className="border border-border rounded-lg p-5 hover:border-primary/30 transition-colors bg-background"
              >
                {/* Type badge */}
                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      row.output_type === 'campaign_concept'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {row.output_type === 'campaign_concept' ? 'Campaign' : 'Persona'}
                  </span>
                  {row.rya_score != null && <RYABadge score={row.rya_score} />}
                </div>

                {/* Title */}
                <h3 className="text-sm font-semibold mb-1">{row.title}</h3>

                {/* Audience */}
                <p className="text-xs text-muted-foreground mb-2">
                  Audience: {row.audience_name}
                </p>

                {/* Excerpt */}
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                  &ldquo;{getExcerpt(row)}&rdquo;
                </p>

                {/* Footer */}
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  {row.channel && <span>{row.channel}</span>}
                  <span>{formatRelativeTime(row.created_at)}</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Generate panel */}
      {panelOpen && (
        <GeneratePanel
          audiences={audiences}
          initialAudienceId={initialAudienceId}
          initialType={initialType}
          onClose={handleClose}
          onSaved={handleSaved}
        />
      )}
    </div>
  );
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '...';
}

function formatRelativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 30) return `${diffDay}d ago`;

  return new Date(dateStr).toLocaleDateString();
}
