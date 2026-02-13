"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Home() {
  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <h1 className="text-3xl font-bold">Same Data Writer</h1>
      <p className="text-muted-foreground">
        Push and manage data in your DynamoDB table.
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Write Data</CardTitle>
            <CardDescription>
              Push new JSON data into the table.
            </CardDescription>
            <Link href="/write">
              <Button className="mt-2 w-full">Go to Write</Button>
            </Link>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Read / Update / Delete</CardTitle>
            <CardDescription>
              Look up, edit, or remove items by ID.
            </CardDescription>
            <Link href="/read">
              <Button variant="secondary" className="mt-2 w-full">
                Go to Read
              </Button>
            </Link>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upload Files</CardTitle>
            <CardDescription>
              Upload images, videos, audio, documents.
            </CardDescription>
            <Link href="/upload">
              <Button variant="secondary" className="mt-2 w-full">
                Go to Upload
              </Button>
            </Link>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
