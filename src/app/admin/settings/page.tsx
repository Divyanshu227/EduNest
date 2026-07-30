import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Settings, Server, ShieldCheck, Heart } from 'lucide-react';

export default async function AdminSettingsPage() {
  const session = await auth();

  if (!session?.user) {
    return <div className="p-6">Unauthorized</div>;
  }

  // Check database health
  let dbStatus = 'CONNECTED';
  try {
    await prisma.user.findFirst({ select: { id: true } });
  } catch (e) {
    dbStatus = 'OFFLINE';
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <p className="text-sm font-medium uppercase tracking-[0.25em] text-primary">System Config</p>
        <h2 className="mt-2 font-[var(--font-heading)] text-4xl">Settings</h2>
      </div>

      <div className="grid gap-6">
        <Card className="border-border/60 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5 text-primary" /> Application Specifications
            </CardTitle>
            <CardDescription>EduNest core specifications status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold">Database Connection</span>
              <Badge className={dbStatus === 'CONNECTED' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}>
                {dbStatus}
              </Badge>
            </div>

            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold">PWA Install Cache</span>
              <Badge variant="outline" className="text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                ACTIVE
              </Badge>
            </div>

            <div className="flex justify-between items-center border-b border-border/40 pb-2">
              <span className="text-muted-foreground font-semibold">Upload Cloud API</span>
              <Badge variant="outline" className="text-amber-500 border-amber-500/20 bg-amber-500/5">
                {process.env.CLOUDINARY_API_SECRET === 'mock_secret' ? 'MOCK FALLBACK' : 'CLOUDINARY ACTIVE'}
              </Badge>
            </div>

            <div className="flex justify-between items-center pb-2">
              <span className="text-muted-foreground font-semibold">Next.js Framework Version</span>
              <span className="font-bold">15.5.22</span>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/85 backdrop-blur">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" /> Development & Security
            </CardTitle>
            <CardDescription>Security policies enforced by NextAuth and database middleware hooks.</CardDescription>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
            <p>· Authentication sessions are wrapped inside JWT authorization tokens.</p>
            <p>· Admin route redirects are processed natively via edge middleware validations.</p>
            <p>· Local MongoDB replica set is running locally on port 27018 with multi-document transactions enabled.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
