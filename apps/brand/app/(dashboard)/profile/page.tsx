"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Badge } from "@cj/ui";
import { Button } from "@cj/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@cj/ui";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@cj/ui";
import { Input } from "@cj/ui";
import { LoadingState } from "@cj/ui";
import { PageHeader } from "@cj/ui";
import { toast } from "sonner";

import { useBrandProfile, useUpdateBrandProfile } from "@/features/queries";

const profileSchema = z.object({
  brandName: z.string().min(2, "Brand name is required"),
  contactPersonName: z.string().min(2, "Contact person is required"),
  phone: z.string().min(5, "Valid phone required"),
  businessProfile: z.object({
    legalName: z.string().min(2, "Legal name is required"),
    addressLine1: z.string().min(3, "Address is required"),
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    pincode: z.string().min(3, "Pincode is required"),
  }),
});

type ProfileValues = z.infer<typeof profileSchema>;

export default function BrandProfilePage() {
  const { data: profile, isLoading } = useBrandProfile();
  const update = useUpdateBrandProfile();

  const form = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema),
  });

  React.useEffect(() => {
    if (profile) {
      form.reset({
        brandName: profile.brandName ?? "",
        contactPersonName: profile.contactPersonName ?? "",
        phone: profile.phone ?? "",
        businessProfile: {
          legalName: profile.businessProfile?.legalName ?? "",
          addressLine1: profile.businessProfile?.addressLine1 ?? "",
          city: profile.businessProfile?.city ?? "",
          state: profile.businessProfile?.state ?? "",
          pincode: profile.businessProfile?.pincode ?? "",
        },
      });
    }
  }, [profile, form]);

  const onSubmit = (values: ProfileValues) => {
    update.mutate(values, {
      onSuccess: () => toast.success("Profile updated"),
      onError: (e) => toast.error(e.message ?? "Failed to update profile"),
    });
  };

  if (isLoading || !profile) return <LoadingState rows={4} />;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Business Profile"
        description="Update your business and contact details"
      />

      <div className="flex items-center gap-2">
        <Badge variant="secondary">{profile.approvalStatus}</Badge>
        {profile.isActive && <Badge variant="outline">Active</Badge>}
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPersonName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>Email</FormLabel>
                <Input value={profile.email} disabled />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Business Details</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="businessProfile.legalName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Legal Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel>PAN Number</FormLabel>
                <Input
                  value={profile.businessProfile?.panNumber ?? ""}
                  disabled
                />
              </div>
              <FormField
                control={form.control}
                name="businessProfile.addressLine1"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-3 gap-3">
                <FormField
                  control={form.control}
                  name="businessProfile.city"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>City</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessProfile.state"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>State</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="businessProfile.pincode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pincode</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          <Button type="submit" disabled={update.isPending}>
            {update.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </form>
      </Form>
    </div>
  );
}
