export default function SettingsPage() {
  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Configure application preferences and global behavior.
        </p>
      </div>

      <div className="glass-card p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold mb-2">Cross-Contamination Protection</h2>
          <p className="text-sm text-muted-foreground mb-4">
            The platform automatically scans text inputs for short codes and domains belonging to other clients to prevent data mixing. This feature is enforced at both the client and server levels.
          </p>
          <div className="flex items-center gap-3 bg-emerald-500/10 text-emerald-400 p-3 rounded-lg border border-emerald-500/20">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span className="text-sm font-medium">Protection Active</span>
          </div>
        </div>

        <hr className="border-surface-border" />

        <div>
          <h2 className="text-lg font-semibold mb-2">Defanging Rules</h2>
          <p className="text-sm text-muted-foreground mb-4">
            IOCs are automatically defanged when generating draft emails or markdown reports.
          </p>
          <div className="space-y-3 font-mono text-sm">
            <div className="grid grid-cols-2 gap-4 p-3 bg-surface rounded border border-surface-border">
              <div className="text-muted-foreground">IP Address</div>
              <div className="text-amber-300">192.168.1.1 &rarr; 192.168.1[.]1</div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 bg-surface rounded border border-surface-border">
              <div className="text-muted-foreground">URL</div>
              <div className="text-amber-300">https://evil.com &rarr; hxxps[://]evil[.]com</div>
            </div>
            <div className="grid grid-cols-2 gap-4 p-3 bg-surface rounded border border-surface-border">
              <div className="text-muted-foreground">Email</div>
              <div className="text-amber-300">bad@actor.com &rarr; bad[@]actor[.]com</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
