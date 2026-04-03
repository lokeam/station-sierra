'use client';

import Link from 'next/link';
import { ScaleLegend } from './interest-bar';
import type { DeltaSignal, GenreSignal, FilterDefinition } from '@/lib/types';

interface Audience {
  id: string;
  name: string;
  respondent_ids: number[];
  filter_definition: FilterDefinition;
  created_at: string;
}

interface SavedOutput {
  id: string;
  output_type: string;
  title: string;
  rya_score: number | null;
  channel: string | null;
  created_at: string;
}

interface AudienceDetailProps {
  audience: Audience;
  deltas: DeltaSignal[];
  segmentSignals: GenreSignal[];
  savedOutputs: SavedOutput[];
}

function DeltaBars({ delta }: { delta: DeltaSignal }) {
  const segmentWidth = ((6 - delta.segment_avg) / 5) * 100;
  const populationWidth = ((6 - delta.population_avg) / 5) * 100;

  const deltaColor =
    delta.delta > 0.5
      ? 'text-primary font-medium'
      : delta.delta >= 0.1
        ? 'text-primary'
        : delta.delta > -0.1
          ? 'text-muted-foreground'
          : 'text-muted-foreground';

  return (
    <div className="py-3">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium">{delta.genre_name}</span>
        <span className={`text-xs ${deltaColor}`}>
          {delta.delta > 0 ? '+' : ''}{delta.delta.toFixed(1)} {delta.direction}
        </span>
      </div>

      {/* Segment bar */}
      <div className="flex items-center gap-2 mb-1">
        <span className="text-xs text-muted-foreground w-10 shrink-0">THIS</span>
        <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
          <div
            className="h-full bg-primary/70 rounded transition-all duration-300"
            style={{ width: `${segmentWidth}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground w-10 text-right">
          {delta.segment_avg.toFixed(1)}
        </span>
      </div>

      {/* Population bar */}
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground w-10 shrink-0">ALL</span>
        <div className="flex-1 h-5 bg-muted rounded overflow-hidden">
          <div
            className="h-full bg-muted-foreground/30 rounded transition-all duration-300"
            style={{ width: `${populationWidth}%` }}
          />
        </div>
        <span className="text-xs font-mono text-muted-foreground w-10 text-right">
          {delta.population_avg.toFixed(1)}
        </span>
      </div>
    </div>
  );
}

export function AudienceDetail({
  audience,
  deltas,
  segmentSignals,
  savedOutputs,
}: AudienceDetailProps) {
  const filterDef = audience.filter_definition as FilterDefinition;

  return (
    <div className="flex-1 overflow-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
          <Link href="/audiences" className="hover:text-foreground transition-colors">
            Audiences
          </Link>
          <span>/</span>
          <span className="text-foreground">{audience.name}</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold">{audience.name}</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {audience.respondent_ids.length} respondent{audience.respondent_ids.length !== 1 ? 's' : ''}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/concepts?audience=${audience.id}&type=persona`}
              className="px-4 py-2 text-sm font-medium border border-border rounded-lg hover:bg-muted transition-colors"
            >
              Generate Persona
            </Link>
            <Link
              href={`/concepts?audience=${audience.id}&type=concept`}
              className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
            >
              Generate Concept &#10022;
            </Link>
          </div>
        </div>
      </div>

      {/* Genre interests with delta visualization */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Genre Interests <span className="normal-case font-normal">vs. All Respondents</span>
        </h2>

        <div className="border border-border rounded-lg p-5 bg-background">
          <div className="divide-y divide-border">
            {deltas.map((delta) => (
              <DeltaBars key={delta.genre_slug} delta={delta} />
            ))}
          </div>

          <div className="mt-4">
            <ScaleLegend />
          </div>
        </div>
      </section>

      {/* Segment definition */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Segment Definition
        </h2>

        <div className="border border-border rounded-lg p-5 bg-background">
          <p className="text-sm mb-2">
            <span className="text-muted-foreground">Respondents:</span>{' '}
            {audience.respondent_ids.map((id) => `#${id}`).join(', ')}
          </p>
          {filterDef.filters.length > 0 && (
            <p className="text-sm">
              <span className="text-muted-foreground">Filter:</span>{' '}
              {filterDef.filters.map((f, i) => {
                const name = segmentSignals.find((s) => s.genre_slug === f.genre_slug)?.genre_name ?? f.genre_slug;
                return (
                  <span key={f.genre_slug}>
                    {i > 0 && ' + '}
                    {name} &le; {f.max_level}
                  </span>
                );
              })}
            </p>
          )}
        </div>
      </section>

      {/* Saved outputs for this audience */}
      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
          Saved Outputs for This Audience
        </h2>

        {savedOutputs.length === 0 ? (
          <div className="border border-border border-dashed rounded-lg p-5 text-center">
            <p className="text-sm text-muted-foreground">
              No saved concepts yet &mdash; Generate above &uarr;
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {savedOutputs.map((output) => (
              <Link
                key={output.id}
                href={`/concepts/${output.id}`}
                className="flex items-center justify-between border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      output.output_type === 'campaign_concept'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {output.output_type === 'campaign_concept' ? 'Campaign' : 'Persona'}
                  </span>
                  <span className="text-sm font-medium">{output.title}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {output.rya_score != null && (
                    <span>RYA {output.rya_score}</span>
                  )}
                  {output.channel && (
                    <span>{output.channel}</span>
                  )}
                  <span>&rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
