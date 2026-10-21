"use client";

import { Button, Card, CardBody, CardHeader } from "@/components/ui";

// Without this, any failed server action (e.g. an upload the file store
// rejects) replaces the whole app with Next's blank "Application error" page.
export default function OrgError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg">
      <CardHeader title="Something went wrong" subtitle="That action couldn't be completed. Nothing else was changed." />
      <CardBody className="space-y-3">
        <p className="text-sm text-slate-600">
          If you were uploading a file, check it is 4 MB or smaller and try again. If it keeps happening, the app's file storage may not be
          connected.
        </p>
        <Button onClick={reset}>Try again</Button>
      </CardBody>
    </Card>
  );
}
