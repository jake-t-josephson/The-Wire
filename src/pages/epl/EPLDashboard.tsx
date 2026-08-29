export default function EPLDashboard() {
  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-8">
      <div className="mb-6">
        <p className="label-caps text-muted mb-1">League</p>
        <h1 className="text-2xl font-semibold text-bone">Premier League</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Fixtures column */}
        <div className="lg:col-span-2 space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="label-caps text-muted mb-4">This Gameweek</h2>
            <p className="text-sm text-subtle">Fixtures coming soon — connect api-sports.io to populate.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="label-caps text-muted mb-4">News &amp; Transfers</h2>
            <p className="text-sm text-subtle">News feed coming soon.</p>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="label-caps text-muted mb-4">Standings</h2>
            <p className="text-sm text-subtle">Table coming soon.</p>
          </div>
          <div className="rounded-lg border border-border bg-surface p-5">
            <h2 className="label-caps text-muted mb-4">Top Scorers</h2>
            <p className="text-sm text-subtle">Scorers coming soon.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
