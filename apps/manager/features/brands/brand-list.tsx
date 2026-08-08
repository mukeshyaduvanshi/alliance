"use client";

import * as React from "react";
import Link from "next/link";

import {
  Badge,
  Card,
  CardContent,
  ErrorState,
  LoadingState,
  PageHeader,
} from "@cj/ui";

import { useKamBrands } from "./queries";

export function BrandList() {
  const { data, isLoading, isError, refetch } = useKamBrands();

  const brands = data?.brands ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Brands"
        description="Brands assigned to you as KAM"
      />
      {isError ? (
        <ErrorState
          title="Failed to load brands"
          description="Could not fetch assigned brands."
          onRetry={() => refetch()}
        />
      ) : isLoading ? (
        <LoadingState rows={4} />
      ) : brands.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <p className="text-muted-foreground text-sm">
              No brands assigned to you yet. Ask an admin to assign brands.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/brands/${brand.id}`}
              className="transition-colors"
            >
              <Card className="h-full hover:bg-muted/50">
                <CardContent className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{brand.brandName}</p>
                    <Badge
                      variant={
                        brand.approvalStatus === "APPROVED" ? "default" : "outline"
                      }
                    >
                      {brand.approvalStatus}
                    </Badge>
                  </div>
                  <p className="text-muted-foreground text-xs">
                    {brand.id.slice(0, 8)}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
