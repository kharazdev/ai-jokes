// app/dashboard/orchestrator/page.tsx
'use client';

import { JobRunnerCard } from '@/components/ui/JobRunnerCard';

export default function OrchestratorPage() {
    const secretKey = process.env.ORCHESTRATOR_SECRET_KEY || ".jbq>#RVi=L6BvG(JSKnc)b?#&*6e-@%;\$s[q#>gmp2I=C!0"



    return (
        <div className="container mx-auto p-8">
            <h1 className="text-3xl font-bold mb-4">Orchestrator Control Panel</h1>
            <p className="text-gray-700 mb-8">
                Use this panel to manually trigger backend autonomous jobs. Please provide the secret key to authorize the requests.
            </p>

            {/* Job Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <JobRunnerCard
                    title="Daily Autonomous Job"
                    description="Runs the standard daily job. It uses pre-cached trends to select topics for all active characters and generates jokes in a batch process. Ideal for routine, daily content generation."
                    apiPath="/api/orchestrator/run-daily-job"
                    secretKey={secretKey}
                />
                <JobRunnerCard
                    title="Smart Autonomous Job"
                    description="Runs the advanced, context-aware job. It fetches characters from a specific category and uses a single, powerful AI call to dynamically research topics and generate persona-driven jokes. Best for high-quality, targeted content."
                    apiPath="/api/orchestrator/run-smart-job"
                    secretKey={secretKey}
                />
            </div>
        </div>
    );
}